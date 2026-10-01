import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAiGateway } from '@/shared/hooks/useAiGateway';
import {
  GEMINI_MODEL_HIERARCHY,
  ApiKeyEntry,
  ApiKeyQuotaSummary,
  GeminiModelId,
} from '@/core/ai/QuotaMatrixOrchestrator';

const STORAGE_KEYS_KEY = 'ela_ai_api_keys';
const STORAGE_DEFAULT_MODEL_KEY = 'ela_default_ai_model';

export const INITIAL_KEYS: ApiKeyEntry[] = [];

function loadStoredKeys(): ApiKeyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasActive = parsed.some((k) => k.isActive);
        if (!hasActive || parsed.length === 1) {
          parsed[0].isActive = true;
          parsed[0].isPrimary = true;
          try {
            localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function loadStoredDefaultModel(): GeminiModelId {
  try {
    const raw = localStorage.getItem(STORAGE_DEFAULT_MODEL_KEY);
    if (raw && GEMINI_MODEL_HIERARCHY.includes(raw as GeminiModelId)) {
      return raw as GeminiModelId;
    }
  } catch {
    // ignore
  }
  return 'gemini-3.8-flash';
}

export function useQuotaMatrix() {
  const { orchestrator } = useAiGateway();

  const [keys, setKeys] = useState<ApiKeyEntry[]>(() => {
    const loaded = loadStoredKeys();
    orchestrator.setApiKeys(loaded);
    return loaded;
  });
  const [defaultModel, setDefaultModelState] = useState<GeminiModelId>(() => {
    const loaded = loadStoredDefaultModel();
    orchestrator.setDefaultModel(loaded);
    return loaded;
  });
  const [tick, setTick] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState({ ms: 0, isoDate: '' });

  // Sync keys to orchestrator and localStorage
  useEffect(() => {
    orchestrator.setApiKeys(keys);
    orchestrator.setDefaultModel(defaultModel);
    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys));
    } catch {
      // ignore
    }
  }, [orchestrator, keys, defaultModel]);

  // Sync default model
  const setDefaultModel = useCallback(
    (model: GeminiModelId) => {
      setDefaultModelState(model);
      orchestrator.setDefaultModel(model);
      try {
        localStorage.setItem(STORAGE_DEFAULT_MODEL_KEY, model);
      } catch {
        // ignore
      }
    },
    [orchestrator],
  );

  // Periodic PT midnight countdown
  useEffect(() => {
    const updateTime = () => {
      setTimeUntilReset(orchestrator.getTimeUntilMidnightPt());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [orchestrator]);

  const keySummaries = useMemo<ApiKeyQuotaSummary[]>(() => {
    return orchestrator.getAllKeyQuotaSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orchestrator, keys, tick]);

  const formatCountdown = useCallback((ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const addApiKey = useCallback(
    (label: string, secretKey: string, isPrimary = false) => {
      const cleanSecret = secretKey.trim();
      const maskedKey =
        cleanSecret.length > 8
          ? `${cleanSecret.slice(0, 6)}...${cleanSecret.slice(-4)}`
          : 'AIzaSy...key';

      const newKey: ApiKeyEntry = {
        id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: label.trim() || 'Gemini Key',
        secretKey: cleanSecret,
        maskedKey,
        isActive: true,
        isPrimary,
      };

      setKeys((prev) => {
        let updated = isPrimary ? prev.map((k) => ({ ...k, isPrimary: false })) : [...prev];
        // If this is the only key, make it primary automatically
        if (updated.length === 0) {
          newKey.isPrimary = true;
        }
        updated = [...updated, newKey];
        orchestrator.setApiKeys(updated);
        try {
          localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setTick((t) => t + 1);
    },
    [orchestrator],
  );

  const removeApiKey = useCallback(
    (keyId: string) => {
      setKeys((prev) => {
        const filtered = prev.filter((k) => k.id !== keyId);
        if (filtered.length > 0 && !filtered.some((k) => k.isPrimary)) {
          filtered[0].isPrimary = true;
        }
        orchestrator.setApiKeys(filtered);
        try {
          localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(filtered));
        } catch {
          // ignore
        }
        return filtered;
      });
      setTick((t) => t + 1);
    },
    [orchestrator],
  );

  const toggleApiKey = useCallback(
    (keyId: string) => {
      setKeys((prev) => {
        if (prev.length <= 1) {
          return prev.map((k) => (k.id === keyId ? { ...k, isActive: true, isPrimary: true } : k));
        }
        const target = prev.find((k) => k.id === keyId);
        const activeCount = prev.filter((k) => k.isActive).length;
        if (target?.isActive && activeCount <= 1) {
          return prev;
        }
        const updated = prev.map((k) => (k.id === keyId ? { ...k, isActive: !k.isActive } : k));
        orchestrator.setApiKeys(updated);
        try {
          localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setTick((t) => t + 1);
    },
    [orchestrator],
  );

  const testApiKey = useCallback(
    async (secretKey: string): Promise<{ success: boolean; message: string }> => {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: secretKey.trim() });
        const modelToUse = orchestrator.getDefaultModel();
        const res = await ai.models.generateContent({
          model: modelToUse,
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Respond with the single word: "READY"' }],
            },
          ],
        });
        const text = res.text?.trim() ?? 'READY';
        return {
          success: true,
          message: `Conexión exitosa con Google Gemini (${modelToUse}: "${text}")`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          message: msg,
        };
      }
    },
    [orchestrator],
  );

  const setPrimaryApiKey = useCallback(
    (keyId: string) => {
      setKeys((prev) => {
        const updated = prev.map((k) => ({ ...k, isPrimary: k.id === keyId }));
        orchestrator.setApiKeys(updated);
        try {
          localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setTick((t) => t + 1);
    },
    [orchestrator],
  );

  const activeKeysCount = useMemo(() => keys.filter((k) => k.isActive).length, [keys]);

  return {
    orchestrator,
    keys,
    keySummaries,
    activeKeysCount,
    defaultModel,
    setDefaultModel,
    addApiKey,
    removeApiKey,
    toggleApiKey,
    setPrimaryApiKey,
    testApiKey,
    timeUntilReset,
    models: GEMINI_MODEL_HIERARCHY,
    formatCountdown,
  };
}
