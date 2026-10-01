export type SpeedDrillType =
  | 'CLAUSE_SHIFT'
  | 'THIRD_PERSON_AUTOMATION'
  | 'PREPOSITION_REFLEX'
  | 'AUDITORY_SNAP_HVPT'
  | 'COLLOCATION_BLITZ'
  | 'PREPOSITION_RAPID_FIRE'
  | 'CONNECTED_SPEECH_EAR';

export interface DrillPrompt {
  id: string;
  drillType: SpeedDrillType;
  promptText: string;
  sentenceContext: string;
  options: string[];
  correctOptionIndex: number;
  timeLimitMs: number; // 2000 to 5000 ms
  explanationEs: string;
  audioUrl?: string;
  operatorChange?: string; // e.g. '[NEGATIVE]', '[SHE]', '[HE]'
  cardId?: string; // associated srs_card id if applicable
}

export interface DrillAnswerResult {
  promptId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsEarned: number;
  comboMultiplier: number;
  proceduralPass: boolean;
  reInjectedAtTurn?: number;
}

export interface DrillSessionResult {
  id: string;
  drillType: SpeedDrillType;
  totalPrompts: number;
  correctCount: number;
  proceduralPassCount: number;
  avgResponseTimeMs: number;
  finalScore: number;
  maxCombo: number;
  completedAt: string;
}
