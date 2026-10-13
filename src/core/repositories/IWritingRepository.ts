import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
  CorrectionItem,
} from '@/infrastructure/ai/schemas';
import { WritingErrorSrsItem } from '../types/srs';

export interface WritingSubmissionEntity {
  id: string;
  userId: string;
  submissionMode: 'FREE' | 'GUIDED' | 'MICRO_WRITING' | 'READING_TO_WRITE';
  userText: string;
  draft2Text?: string;
  wordCount: number;
  status: 'DRAFT' | 'SOCRATIC_PHASE_1' | 'SOCRATIC_PHASE_2' | 'EVALUATED' | 'ERROR';
  submittedAt: string;
  socraticResult?: SocraticFeedbackResponse | null;
  evaluation?: WritingEvaluationResponse | null;
  targetCefr?: string;
}

export interface CreateSubmissionInput {
  id?: string;
  userId?: string;
  submissionMode?: 'FREE' | 'GUIDED' | 'MICRO_WRITING' | 'READING_TO_WRITE';
  userText: string;
  wordCount: number;
  status?: 'DRAFT' | 'SOCRATIC_PHASE_1' | 'SOCRATIC_PHASE_2' | 'EVALUATED' | 'ERROR';
}

export interface RecordRevisionInput {
  submissionId: string;
  revisionNumber: number;
  draftText: string;
  aiScaffoldLevel?:
    | 'LEVEL_1_ELICITATION'
    | 'LEVEL_2_METALINGUISTIC'
    | 'LEVEL_3_CLOZE'
    | 'LEVEL_4_EXPLICIT_MODEL';
  aiHintsJson?: string | null;
  resolvedErrorsCount?: number;
}

export interface RecordEvaluationInput {
  submissionId: string;
  modelUsed?: 'gemini-3.5-flash-lite' | 'gemini-3.6-flash' | 'gemini-3.7-flash' | 'gemini-3.8-flash';
  evaluation: WritingEvaluationResponse;
}

export interface WritingErrorStat {
  taxonomyCode: string;
  errorType: string;
  count: number;
}

export interface IWritingRepository {
  createSubmission(input: CreateSubmissionInput): Promise<string>;
  recordRevision(input: RecordRevisionInput): Promise<void>;
  recordEvaluation(input: RecordEvaluationInput): Promise<void>;
  updateSubmissionStatus(
    id: string,
    status: 'DRAFT' | 'SOCRATIC_PHASE_1' | 'SOCRATIC_PHASE_2' | 'EVALUATED' | 'ERROR',
  ): Promise<void>;
  getSubmissions(userId?: string, limit?: number): Promise<WritingSubmissionEntity[]>;
  getSubmissionById(id: string): Promise<WritingSubmissionEntity | null>;
  deleteSubmission(id: string): Promise<void>;
  logWritingErrors(
    submissionId: string,
    corrections: CorrectionItem[],
    userId?: string,
    contextText?: string,
  ): Promise<void>;
  getWritingErrorStats(userId?: string, limit?: number): Promise<WritingErrorStat[]>;
  checkRecidivism(userId: string, taxonomyCode: string): Promise<{ isRecidivist: boolean; count: number }>;
  getFossilizedErrors(userId?: string): Promise<WritingErrorSrsItem[]>;
  getAllWritingErrors(userId?: string): Promise<WritingErrorSrsItem[]>;
  updateErrorMastery(id: string, status: 'LEARNING' | 'INTERNALIZED' | 'RECIDIVIST'): Promise<void>;
  getErrorById(id: string): Promise<WritingErrorSrsItem | null>;
}

