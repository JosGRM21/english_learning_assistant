import React, { createContext, useMemo } from 'react';
import { IAiGateway } from '@/infrastructure/ai/IAiGateway';
import { GeminiAiGateway } from '@/infrastructure/ai/GeminiAiGateway';
import { QuotaMatrixOrchestrator } from '@/core/ai/QuotaMatrixOrchestrator';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
  VocabEnrichmentResponse,
} from '@/infrastructure/ai/schemas';

export interface AiContextValue {
  aiGateway: IAiGateway;
  orchestrator: QuotaMatrixOrchestrator;
}

export const AiContext = createContext<AiContextValue | null>(null);

function loadInitialKeys() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('ela_ai_api_keys') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasActive = parsed.some((k) => k.isActive);
        if (!hasActive || parsed.length === 1) {
          parsed[0].isActive = true;
          parsed[0].isPrimary = true;
          try {
            localStorage.setItem('ela_ai_api_keys', JSON.stringify(parsed));
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
  const orchestrator = useMemo(() => new QuotaMatrixOrchestrator(loadInitialKeys()), []);
  const aiGateway = useMemo(() => new DelegatingAiGateway(orchestrator), [orchestrator]);

  const value = useMemo<AiContextValue>(
    () => ({
      aiGateway,
      orchestrator,
    }),
    [aiGateway, orchestrator],
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

