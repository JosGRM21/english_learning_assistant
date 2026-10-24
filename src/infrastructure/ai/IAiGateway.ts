import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
  VocabEnrichmentResponse,
} from './schemas';

export interface SocraticContextualInfo {
  readingContext?: string;
  missionInstructions?: string;
  targetWords?: string[];
}

export interface WritingEvaluationContextualInfo {
  readingContext?: string;
  missionInstructions?: string;
  targetWords?: string[];
}

export interface IAiGateway {
  evaluateSocraticPhase1(
    userText: string,
    cefrTarget?: string,
    contextualInfo?: SocraticContextualInfo,
  ): Promise<SocraticFeedbackResponse>;
  evaluateFinalPhase2(
    draft1: string,
    draft2: string,
    cefrTarget?: string,
    contextualInfo?: WritingEvaluationContextualInfo,
  ): Promise<WritingEvaluationResponse>;
  lookupVocabWord(word: string): Promise<VocabEnrichmentResponse>;
}

