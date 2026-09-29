export type ConnectedSpeechRuleType =
  | 'LINKING_CV'
  | 'LINKING_VV_J'
  | 'LINKING_VV_W'
  | 'LINKING_R'
  | 'ELISION_T_D'
  | 'ASSIMILATION_COALESCENT'
  | 'WEAK_FORM';

export interface PhoneticBoundary {
  word1: string;
  word2: string;
  boundaryType: ConnectedSpeechRuleType;
  ruleName: string;
  descriptionEs: string;
  ipaTransformed: string;
  span: [number, number]; // [startIndex, endIndex] in original text
}

export interface ConnectedSpeechAnalysis {
  originalSentence: string;
  ipaConnected: string;
  boundaries: PhoneticBoundary[];
}

export type PhonemicContrastType = 'VOWEL' | 'CONSONANT';

export interface MinimalPairItem {
  id: string;
  wordA: string;
  wordB: string;
  ipaA: string;
  ipaB: string;
  phonemicContrast: string; // e.g. '/iː/ vs /ɪ/'
  contrastType: PhonemicContrastType;
  l1PitfallEs: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
}

export interface MinimalPairChallenge {
  id: string;
  pair: MinimalPairItem;
  targetOption: 'A' | 'B';
  targetWord: string;
  targetIpa: string;
  timeLimitSec: number; // 2.0 s
}

export interface MinimalPairResult {
  challengeId: string;
  pairId: string;
  targetWord: string;
  selectedWord: string;
  isCorrect: boolean;
  responseTimeMs: number;
}
