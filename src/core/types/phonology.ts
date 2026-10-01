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

export type SpeakerAccent = 'GA' | 'RP';
export type SpeakerGender = 'MALE' | 'FEMALE';

export interface SpeakerProfile {
  id: string;
  name: string;
  accent: SpeakerAccent;
  gender: SpeakerGender;
  label: string;
  pitch: number;
  rate: number;
}

export interface FormantAcousticData {
  f1: number; // Formant 1 in Hz (mandibular opening / height)
  f2: number; // Formant 2 in Hz (tongue frontness / backness)
  durationMs: number;
  intensityDb?: number;
  spanishAttractor?: {
    phoneme: string;
    f1: number;
    f2: number;
    warning: string;
  };
}

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
  formantDataA?: FormantAcousticData;
  formantDataB?: FormantAcousticData;
}

export interface MinimalPairChallenge {
  id: string;
  pair: MinimalPairItem;
  targetOption: 'A' | 'B';
  targetWord: string;
  targetIpa: string;
  timeLimitSec: number; // 2.0 s
  speaker: SpeakerProfile;
}

export interface MinimalPairResult {
  challengeId: string;
  pairId: string;
  targetWord: string;
  selectedWord: string;
  isCorrect: boolean;
  responseTimeMs: number;
  speaker: SpeakerProfile;
}
