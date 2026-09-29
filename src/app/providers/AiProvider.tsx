import React, { createContext, useMemo } from 'react';
import { IAiGateway } from '@/infrastructure/ai/IAiGateway';
import { GeminiAiGateway } from '@/infrastructure/ai/GeminiAiGateway';
import { MockAiGateway } from '@/infrastructure/ai/MockAiGateway';
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
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

class DelegatingAiGateway implements IAiGateway {
  private readonly geminiGateway: GeminiAiGateway;
  private readonly mockGateway: MockAiGateway;

  constructor(private readonly orchestrator: QuotaMatrixOrchestrator) {
    this.geminiGateway = new GeminiAiGateway(orchestrator);
    this.mockGateway = new MockAiGateway();
  }

  private hasActiveKeys(): boolean {
    return this.orchestrator.getApiKeys().some((k) => k.isActive && k.secretKey.trim().length > 0);
  }

  async evaluateSocraticPhase1(userText: string, _cefrTarget?: string): Promise<SocraticFeedbackResponse> {
    if (this.hasActiveKeys()) {
      try {
        return await this.geminiGateway.evaluateSocraticPhase1(userText);
      } catch (err) {
        console.warn('Gemini gateway failed, falling back to mock:', err);
      }
    }
    return this.mockGateway.evaluateSocraticPhase1(userText);
  }

  async evaluateFinalPhase2(
    draft1: string,
    draft2: string,
    cefrTarget?: string,
  ): Promise<WritingEvaluationResponse> {
    if (this.hasActiveKeys()) {
      try {
        return await this.geminiGateway.evaluateFinalPhase2(draft1, draft2, cefrTarget);
      } catch (err) {
        console.warn('Gemini gateway failed, falling back to mock:', err);
      }
    }
    return this.mockGateway.evaluateFinalPhase2(draft1, draft2, cefrTarget);
  }

  async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    if (this.hasActiveKeys()) {
      try {
        return await this.geminiGateway.lookupVocabWord(word);
      } catch (err) {
        console.warn('Gemini gateway lookup failed, falling back to mock:', err);
      }
    }
    return this.mockGateway.lookupVocabWord(word);
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

