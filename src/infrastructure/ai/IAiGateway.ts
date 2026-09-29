import { SocraticFeedbackResponse, WritingEvaluationResponse } from './schemas';

export interface IAiGateway {
  evaluateSocraticPhase1(userText: string, cefrTarget?: string): Promise<SocraticFeedbackResponse>;
  evaluateFinalPhase2(draft1: string, draft2: string, cefrTarget?: string): Promise<WritingEvaluationResponse>;
}
