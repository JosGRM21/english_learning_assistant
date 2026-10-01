import {
  MinimalPairItem,
  MinimalPairChallenge,
  MinimalPairResult,
  PhonemicContrastType,
  SpeakerProfile,
} from '../../../types/phonology';
import { MINIMAL_PAIRS_CATALOG } from '@/data/minimal-pairs-catalog';
export { MINIMAL_PAIRS_CATALOG };

export const DEFAULT_HVPT_SPEAKERS: SpeakerProfile[] = [
  {
    id: 'spk_ga_fem',
    name: 'Sarah',
    accent: 'GA',
    gender: 'FEMALE',
    label: 'General American (Femenina)',
    pitch: 1.15,
    rate: 1.0,
  },
  {
    id: 'spk_ga_male',
    name: 'Michael',
    accent: 'GA',
    gender: 'MALE',
    label: 'General American (Masculina)',
    pitch: 0.9,
    rate: 1.0,
  },
  {
    id: 'spk_rp_fem',
    name: 'Emma',
    accent: 'RP',
    gender: 'FEMALE',
    label: 'Received Pronunciation (Femenina)',
    pitch: 1.1,
    rate: 0.95,
  },
  {
    id: 'spk_rp_male',
    name: 'Arthur',
    accent: 'RP',
    gender: 'MALE',
    label: 'Received Pronunciation (Masculina)',
    pitch: 0.85,
    rate: 0.95,
  },
];

export class MinimalPairsTrainer {
  private readonly catalog: MinimalPairItem[];
  private readonly speakers: SpeakerProfile[];

  constructor(customCatalog?: MinimalPairItem[], customSpeakers?: SpeakerProfile[]) {
    this.catalog = customCatalog ?? MINIMAL_PAIRS_CATALOG;
    this.speakers = customSpeakers ?? DEFAULT_HVPT_SPEAKERS;
  }

  public getCatalog(): MinimalPairItem[] {
    return [...this.catalog];
  }

  public getSpeakers(): SpeakerProfile[] {
    return [...this.speakers];
  }

  /**
   * Generates a rapid discrimination challenge with a multi-speaker HVPT profile and 2.0s window.
   */
  public createChallenge(filters?: {
    contrastType?: PhonemicContrastType;
    pairId?: string;
    speakerId?: string;
  }): MinimalPairChallenge {
    let pool = this.catalog;
    if (filters?.contrastType) {
      pool = pool.filter((p) => p.contrastType === filters.contrastType);
    }
    if (filters?.pairId) {
      pool = pool.filter((p) => p.id === filters.pairId);
    }

    if (pool.length === 0) {
      pool = this.catalog;
    }

    const pair = pool[Math.floor(Math.random() * pool.length)];
    const targetOption: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    const targetWord = targetOption === 'A' ? pair.wordA : pair.wordB;
    const targetIpa = targetOption === 'A' ? pair.ipaA : pair.ipaB;

    // Multi-speaker HVPT selection
    let speaker: SpeakerProfile;
    if (filters?.speakerId) {
      speaker = this.speakers.find((s) => s.id === filters.speakerId) ?? this.speakers[0];
    } else {
      speaker = this.speakers[Math.floor(Math.random() * this.speakers.length)];
    }

    return {
      id: `mp_chal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pair,
      targetOption,
      targetWord,
      targetIpa,
      timeLimitSec: 2.0,
      speaker,
    };
  }

  /**
   * Evaluates user answer with latency tracking.
   */
  public evaluate(
    challenge: MinimalPairChallenge,
    selectedOption: 'A' | 'B',
    responseTimeMs: number,
  ): MinimalPairResult {
    const selectedWord = selectedOption === 'A' ? challenge.pair.wordA : challenge.pair.wordB;
    const isCorrect = selectedOption === challenge.targetOption && responseTimeMs <= challenge.timeLimitSec * 1000;

    return {
      challengeId: challenge.id,
      pairId: challenge.pair.id,
      targetWord: challenge.targetWord,
      selectedWord,
      isCorrect,
      responseTimeMs,
      speaker: challenge.speaker,
    };
  }
}
