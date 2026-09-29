export type ErrorDomain = 'GRAMMAR' | 'LEXICON' | 'PHONETICS' | 'PRAGMATICS';
export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ErrorSource = 'SRS' | 'WRITING_EVALUATION' | 'PHONETICS_DRILL';

export interface ErrorTaxonomyItem {
  id: string;
  code: string;
  domain: ErrorDomain;
  severity: ErrorSeverity;
  labelEs: string;
  detailedExplanationEs: string;
}

export interface UserErrorEvent {
  id: string;
  userId: string;
  errorTaxonomyId: string;
  source: ErrorSource;
  sourceReferenceId?: string;
  contextSnippet?: string;
  incorrectToken?: string;
  correctToken?: string;
  committedAt: string; // ISO string
}

export interface WeaknessMetric {
  id: string;
  userId: string;
  errorTaxonomyId: string;
  taxonomyCode: string;
  labelEs: string;
  domain: ErrorDomain;
  occurrencesLast7Days: number;
  totalOccurrences: number;
  weaknessScore: number; // 0.0 to 10.0
  lastDetectedAt: string;
  isCritical: boolean; // weaknessScore >= 6.0
}

export interface MicroWorkoutExercise {
  id: string;
  questionEs: string;
  promptSentence: string;
  options: string[];
  correctOptionIndex: number;
  explanationEs: string;
  targetFocus: string;
}

export interface MicroWorkout {
  id: string;
  userId: string;
  weaknessMetricId: string;
  taxonomyCode: string;
  title: string;
  exercises: MicroWorkoutExercise[];
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}
