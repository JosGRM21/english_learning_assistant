export type SpeedDrillType =
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
  timeLimitMs: number; // 3000 to 5000 ms
  explanationEs: string;
}

export interface DrillAnswerResult {
  promptId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsEarned: number;
  comboMultiplier: number;
}

export interface DrillSessionResult {
  id: string;
  drillType: SpeedDrillType;
  totalPrompts: number;
  correctCount: number;
  avgResponseTimeMs: number;
  finalScore: number;
  maxCombo: number;
  completedAt: string;
}
