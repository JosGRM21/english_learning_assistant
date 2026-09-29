import { MinimalPairItem, MinimalPairChallenge, MinimalPairResult, PhonemicContrastType } from '../types/phonology';

export const MINIMAL_PAIRS_CATALOG: MinimalPairItem[] = [
  // --- VOWEL CONTRASTS ---
  {
    id: 'mp_v_01',
    wordA: 'sheep',
    wordB: 'ship',
    ipaA: 'ʃiːp',
    ipaB: 'ʃɪp',
    phonemicContrast: '/iː/ vs /ɪ/',
    contrastType: 'VOWEL',
    l1PitfallEs: 'En español solo existe una "i" tensa. En inglés, /ɪ/ es laxa, breve y con la lengua más relajada.',
    cefrLevel: 'A1',
  },
  {
    id: 'mp_v_02',
    wordA: 'leave',
    wordB: 'live',
    ipaA: 'liːv',
    ipaB: 'lɪv',
    phonemicContrast: '/iː/ vs /ɪ/',
    contrastType: 'VOWEL',
    l1PitfallEs: 'Confundir "irse/dejar" (leave /liːv/) con "vivir" (live /lɪv/).',
    cefrLevel: 'A1',
  },
  {
    id: 'mp_v_03',
    wordA: 'seat',
    wordB: 'sit',
    ipaA: 'siːt',
    ipaB: 'sɪt',
    phonemicContrast: '/iː/ vs /ɪ/',
    contrastType: 'VOWEL',
    l1PitfallEs: 'Diferencia entre el sustantivo "asiento" (/siːt/) y el verbo "sentarse" (/sɪt/).',
    cefrLevel: 'A1',
  },
  {
    id: 'mp_v_04',
    wordA: 'reach',
    wordB: 'rich',
    ipaA: 'riːtʃ',
    ipaB: 'rɪtʃ',
    phonemicContrast: '/iː/ vs /ɪ/',
    contrastType: 'VOWEL',
    l1PitfallEs: 'Diferencia entre "alcanzar" (/riːtʃ/) y "rico" (/rɪtʃ/).',
    cefrLevel: 'A2',
  },
  {
    id: 'mp_v_05',
    wordA: 'cat',
    wordB: 'cut',
    ipaA: 'kæt',
    ipaB: 'kʌt',
    phonemicContrast: '/æ/ vs /ʌ/',
    contrastType: 'VOWEL',
    l1PitfallEs: '/æ/ requiere abrir la mandíbula ampliamente ("gato"), mientras que /ʌ/ es neutra y central ("cortar").',
    cefrLevel: 'A2',
  },
  {
    id: 'mp_v_06',
    wordA: 'pull',
    wordB: 'pool',
    ipaA: 'pʊl',
    ipaB: 'puːl',
    phonemicContrast: '/ʊ/ vs /uː/',
    contrastType: 'VOWEL',
    l1PitfallEs: '/ʊ/ es laxa y corta ("tirar/jalar"), /uː/ es tensa y alargada con labios redondeados ("piscina").',
    cefrLevel: 'B1',
  },
  {
    id: 'mp_v_07',
    wordA: 'bed',
    wordB: 'bad',
    ipaA: 'bɛd',
    ipaB: 'bæd',
    phonemicContrast: '/e/ vs /æ/',
    contrastType: 'VOWEL',
    l1PitfallEs: 'Diferencia entre "cama" (/bɛd/) y "malo" (/bæd/ con mandíbula descendida).',
    cefrLevel: 'A2',
  },

  // --- CONSONANT CONTRASTS ---
  {
    id: 'mp_c_01',
    wordA: 'berry',
    wordB: 'very',
    ipaA: 'ˈbɛri',
    ipaB: 'ˈvɛri',
    phonemicContrast: '/b/ vs /v/',
    contrastType: 'CONSONANT',
    l1PitfallEs: 'El español no distingue entre /b/ oclusiva bilabial y /v/ fricativa labiodental (dientes superiores contra labio inferior).',
    cefrLevel: 'A1',
  },
  {
    id: 'mp_c_02',
    wordA: 'boat',
    wordB: 'vote',
    ipaA: 'boʊt',
    ipaB: 'voʊt',
    phonemicContrast: '/b/ vs /v/',
    contrastType: 'CONSONANT',
    l1PitfallEs: 'Diferencia crítica entre "barco" (/boʊt/) y "voto/votar" (/voʊt/).',
    cefrLevel: 'A1',
  },
  {
    id: 'mp_c_03',
    wordA: 'sue',
    wordB: 'zoo',
    ipaA: 'suː',
    ipaB: 'zuː',
    phonemicContrast: '/s/ vs /z/',
    contrastType: 'CONSONANT',
    l1PitfallEs: 'El español carece del fonema sonoro /z/ (las cuerdas vocales deben vibrar con zumbido).',
    cefrLevel: 'A2',
  },
  {
    id: 'mp_c_04',
    wordA: 'price',
    wordB: 'prize',
    ipaA: 'praɪs',
    ipaB: 'praɪz',
    phonemicContrast: '/s/ vs /z/',
    contrastType: 'CONSONANT',
    l1PitfallEs: 'Diferencia entre "precio" (/praɪs/) y "premio" (/praɪz/).',
    cefrLevel: 'A2',
  },
  {
    id: 'mp_c_05',
    wordA: 'think',
    wordB: 'sink',
    ipaA: 'θɪŋk',
    ipaB: 'sɪŋk',
    phonemicContrast: '/θ/ vs /s/',
    contrastType: 'CONSONANT',
    l1PitfallEs: '/θ/ es fricativa interdental (lengua entre los dientes, como la "z" en España).',
    cefrLevel: 'A2',
  },
  {
    id: 'mp_c_06',
    wordA: 'share',
    wordB: 'chair',
    ipaA: 'ʃɛr',
    ipaB: 'tʃɛr',
    phonemicContrast: '/ʃ/ vs /tʃ/',
    contrastType: 'CONSONANT',
    l1PitfallEs: 'Frecuente sustitución de /ʃ/ (fricativa continua "sh") por /tʃ/ (africada "ch").',
    cefrLevel: 'A2',
  },
  {
    id: 'mp_c_07',
    wordA: 'day',
    wordB: 'they',
    ipaA: 'deɪ',
    ipaB: 'ðeɪ',
    phonemicContrast: '/d/ vs /ð/',
    contrastType: 'CONSONANT',
    l1PitfallEs: '/d/ es oclusiva alveolar ("día"), mientras que /ð/ es fricativa dental sonora ("ellos").',
    cefrLevel: 'A1',
  },
];

export class MinimalPairsTrainer {
  private readonly catalog: MinimalPairItem[];

  constructor(customCatalog?: MinimalPairItem[]) {
    this.catalog = customCatalog ?? MINIMAL_PAIRS_CATALOG;
  }

  public getCatalog(): MinimalPairItem[] {
    return [...this.catalog];
  }

  /**
   * Generates a rapid discrimination challenge with a 2.0-second response window.
   */
  public createChallenge(filters?: {
    contrastType?: PhonemicContrastType;
    pairId?: string;
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

    return {
      id: `mp_chal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pair,
      targetOption,
      targetWord,
      targetIpa,
      timeLimitSec: 2.0,
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
    };
  }
}
