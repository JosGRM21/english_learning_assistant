import React, { createContext, useMemo, useState, useCallback } from 'react';
import { IAiGateway } from '@/infrastructure/ai/IAiGateway';
import { GeminiAiGateway } from '@/infrastructure/ai/GeminiAiGateway';
import {
  QuotaMatrixOrchestrator,
  GeminiModelId,
  GEMINI_MODEL_HIERARCHY,
  ApiKeyEntry,
} from '@/core/ai/QuotaMatrixOrchestrator';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
  VocabEnrichmentResponse,
} from '@/infrastructure/ai/schemas';

export const STORAGE_KEYS_KEY = 'ela_ai_api_keys';
export const STORAGE_DEFAULT_MODEL_KEY = 'ela_default_ai_model';
export { STORAGE_QUOTA_STATES_KEY, STORAGE_REQUEST_LOGS_KEY } from '@/core/ai/QuotaMatrixOrchestrator';

export interface AiContextValue {
  aiGateway: IAiGateway;
  orchestrator: QuotaMatrixOrchestrator;
  defaultModel: GeminiModelId;
  setDefaultModel: (model: GeminiModelId) => void;
}

export const AiContext = createContext<AiContextValue | null>(null);

function loadInitialKeys(): ApiKeyEntry[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS_KEY) : null;
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

function loadInitialModel(): GeminiModelId {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_DEFAULT_MODEL_KEY) : null;
    if (raw && GEMINI_MODEL_HIERARCHY.includes(raw as GeminiModelId)) {
      return raw as GeminiModelId;
    }
  } catch {
    // ignore
  }
  return 'gemini-3.8-flash';
}

class DelegatingAiGateway implements IAiGateway {
  private readonly geminiGateway: GeminiAiGateway;

  constructor(private readonly orchestrator: QuotaMatrixOrchestrator) {
    this.geminiGateway = new GeminiAiGateway(orchestrator);
  }

  private hasActiveKeys(): boolean {
    return this.orchestrator.getApiKeys().some((k) => k.isActive && k.secretKey.trim().length > 0);
  }

  private assertActiveKey(): void {
    if (!this.hasActiveKeys()) {
      throw new Error(
        'No hay ninguna API Key de Google Gemini configurada o activa. Por favor ve a la pestaña "Modelos de IA" para agregar tu clave.'
      );
    }
  }

  async evaluateSocraticPhase1(userText: string, _cefrTarget?: string): Promise<SocraticFeedbackResponse> {
    this.assertActiveKey();
    return await this.geminiGateway.evaluateSocraticPhase1(userText);
  }

  async evaluateFinalPhase2(
    draft1: string,
    draft2: string,
    cefrTarget?: string,
  ): Promise<WritingEvaluationResponse> {
    this.assertActiveKey();
    return await this.geminiGateway.evaluateFinalPhase2(draft1, draft2, cefrTarget);
  }

  async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    this.assertActiveKey();
    return await this.geminiGateway.lookupVocabWord(word);
  }
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [defaultModel, setDefaultModelState] = useState<GeminiModelId>(loadInitialModel);

  const orchestrator = useMemo(
    () => new QuotaMatrixOrchestrator(loadInitialKeys(), loadInitialModel()),
    [],
  );
  const aiGateway = useMemo(() => new DelegatingAiGateway(orchestrator), [orchestrator]);

  const setDefaultModel = useCallback(
    (model: GeminiModelId) => {
      setDefaultModelState(model);
      orchestrator.setDefaultModel(model);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_DEFAULT_MODEL_KEY, model);
        }
      } catch {
        // ignore
      }
    },
    [orchestrator],
  );

  const value = useMemo<AiContextValue>(
    () => ({
      aiGateway,
      orchestrator,
      defaultModel,
      setDefaultModel,
    }),
    [aiGateway, orchestrator, defaultModel, setDefaultModel],
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

