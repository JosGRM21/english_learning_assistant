import {
  SpeedDrillType,
  DrillPrompt,
  DrillAnswerResult,
  DrillSessionResult,
} from '../types/drills';

export const DRILL_PROMPTS_CATALOG: DrillPrompt[] = [
  // --- COLLOCATION BLITZ ---
  {
    id: 'db_col_01',
    drillType: 'COLLOCATION_BLITZ',
    promptText: 'make vs do',
    sentenceContext: 'I need to ___ an important decision today.',
    options: ['make', 'do', 'have', 'take'],
    correctOptionIndex: 0,
    timeLimitMs: 4000,
    explanationEs: 'En inglés se dice "make a decision", nunca "do a decision".',
  },
  {
    id: 'db_col_02',
    drillType: 'COLLOCATION_BLITZ',
    promptText: 'take vs make',
    sentenceContext: 'Don’t forget to ___ a deep breath before speaking.',
    options: ['take', 'make', 'do', 'give'],
    correctOptionIndex: 0,
    timeLimitMs: 4000,
    explanationEs: 'Colocación natural: "take a deep breath" (tomar aire/respirar profundo).',
  },
  {
    id: 'db_col_03',
    drillType: 'COLLOCATION_BLITZ',
    promptText: 'pay vs give',
    sentenceContext: 'Please ___ close attention to the speaker.',
    options: ['pay', 'give', 'make', 'do'],
    correctOptionIndex: 0,
    timeLimitMs: 4000,
    explanationEs: '"Pay attention" es la colocación fija estándar.',
  },
  {
    id: 'db_col_04',
    drillType: 'COLLOCATION_BLITZ',
    promptText: 'make vs do',
    sentenceContext: 'She usually ___ her best in stressful situations.',
    options: ['does', 'makes', 'takes', 'gives'],
    correctOptionIndex: 0,
    timeLimitMs: 4000,
    explanationEs: 'Decimos "do one\'s best" (hacer el mayor esfuerzo).',
  },
  {
    id: 'db_col_05',
    drillType: 'COLLOCATION_BLITZ',
    promptText: 'take vs have',
    sentenceContext: 'Let’s ___ a quick break for coffee.',
    options: ['take', 'do', 'make', 'give'],
    correctOptionIndex: 0,
    timeLimitMs: 4000,
    explanationEs: '"Take a break" o "have a break" son colocaciones estándar.',
  },
  {
    id: 'db_col_06',
    drillType: 'COLLOCATION_BLITZ',
    promptText: 'tell vs say',
    sentenceContext: 'Always ___ the truth, even when it is hard.',
    options: ['tell', 'say', 'speak', 'talk'],
    correctOptionIndex: 0,
    timeLimitMs: 4000,
    explanationEs: 'Colocación obligatoria: "tell the truth" (nunca "say the truth").',
  },

  // --- PREPOSITION RAPID-FIRE ---
  {
    id: 'db_prep_01',
    drillType: 'PREPOSITION_RAPID_FIRE',
    promptText: 'Preposición para "depend"',
    sentenceContext: 'Our success will depend ___ your consistency.',
    options: ['on', 'of', 'in', 'at'],
    correctOptionIndex: 0,
    timeLimitMs: 3500,
    explanationEs: 'El verbo "depend" rige obligatoriamente "on".',
  },
  {
    id: 'db_prep_02',
    drillType: 'PREPOSITION_RAPID_FIRE',
    promptText: 'Preposición para "interested"',
    sentenceContext: 'She is deeply interested ___ cognitive science.',
    options: ['in', 'on', 'at', 'about'],
    correctOptionIndex: 0,
    timeLimitMs: 3500,
    explanationEs: '"Interested" rige la preposición "in" (interesado en).',
  },
  {
    id: 'db_prep_03',
    drillType: 'PREPOSITION_RAPID_FIRE',
    promptText: 'Preposición para "good at"',
    sentenceContext: 'He is exceptionally good ___ mathematics.',
    options: ['at', 'in', 'on', 'for'],
    correctOptionIndex: 0,
    timeLimitMs: 3500,
    explanationEs: 'Para habilidades y destrezas se usa "good at", no "good in".',
  },
  {
    id: 'db_prep_04',
    drillType: 'PREPOSITION_RAPID_FIRE',
    promptText: 'Preposición para "listen"',
    sentenceContext: 'You should always listen ___ your mentor.',
    options: ['to', 'at', 'for', 'with'],
    correctOptionIndex: 0,
    timeLimitMs: 3500,
    explanationEs: 'El verbo "listen" requiere la preposición "to": "listen to".',
  },
  {
    id: 'db_prep_05',
    drillType: 'PREPOSITION_RAPID_FIRE',
    promptText: 'Preposición para "responsible"',
    sentenceContext: 'Who is responsible ___ this database migration?',
    options: ['for', 'of', 'about', 'to'],
    correctOptionIndex: 0,
    timeLimitMs: 3500,
    explanationEs: 'Se dice "responsible for" (responsable de algo).',
  },
  {
    id: 'db_prep_06',
    drillType: 'PREPOSITION_RAPID_FIRE',
    promptText: 'Preposición para "arrive"',
    sentenceContext: 'We will arrive ___ the airport in 20 minutes.',
    options: ['at', 'to', 'in', 'on'],
    correctOptionIndex: 0,
    timeLimitMs: 3500,
    explanationEs: 'Para puntos o edificios específicos se usa "arrive at", nunca "arrive to".',
  },

  // --- CONNECTED SPEECH EAR ---
  {
    id: 'db_phon_01',
    drillType: 'CONNECTED_SPEECH_EAR',
    promptText: 'Identifica la ligadura C-V',
    sentenceContext: 'In "hold on", the /d/ connects to "on" as: ___',
    options: ['[həʊl·dɑːn]', '[həʊld ɑːn]', '[həʊl ɑːn]', '[həʊlt ɑːn]'],
    correctOptionIndex: 0,
    timeLimitMs: 4500,
    explanationEs: 'Linking CV: la consonante /d/ salta como ataque a la siguiente sílaba.',
  },
  {
    id: 'db_phon_02',
    drillType: 'CONNECTED_SPEECH_EAR',
    promptText: 'Identifica la asimilación coalescente',
    sentenceContext: 'In "did you", the /d/ + /j/ fuse into: ___',
    options: ['/dʒ/ (did-you -> [dɪdʒuː])', '/tʃ/', '/z/', '/d/'],
    correctOptionIndex: 0,
    timeLimitMs: 4500,
    explanationEs: 'Yod coalescence produce la africada sonora /dʒ/.',
  },
  {
    id: 'db_phon_03',
    drillType: 'CONNECTED_SPEECH_EAR',
    promptText: 'Identifica el deslizamiento /j/',
    sentenceContext: 'Between "we" and "agree", speakers naturally insert: ___',
    options: ['a /j/ glide ([we‿ʲagree])', 'a /w/ glide', 'a glottal stop', 'an /r/ glide'],
    correctOptionIndex: 0,
    timeLimitMs: 4500,
    explanationEs: 'Tras la vocal anterior cerrada /iː/ se inserta una transición /j/.',
  },
];

export class SpeedDrillTrainer {
  private readonly catalog: DrillPrompt[];

  constructor(customCatalog?: DrillPrompt[]) {
    this.catalog = customCatalog ?? DRILL_PROMPTS_CATALOG;
  }

  /**
   * Generates a randomized session of prompts filtered by drill type.
   */
  public createSession(type: SpeedDrillType, promptCount = 8): DrillPrompt[] {
    const pool = this.catalog.filter((p) => p.drillType === type);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(promptCount, shuffled.length));
  }

  /**
   * Evaluates a fast response with combo multiplier and speed bonuses.
   */
  public evaluateAnswer(
    prompt: DrillPrompt,
    selectedOptionIndex: number,
    responseTimeMs: number,
    currentCombo: number,
  ): DrillAnswerResult {
    const isWithinTime = responseTimeMs <= prompt.timeLimitMs;
    const isCorrect = selectedOptionIndex === prompt.correctOptionIndex && isWithinTime;

    if (!isCorrect) {
      return {
        promptId: prompt.id,
        selectedOptionIndex,
        isCorrect: false,
        responseTimeMs,
        pointsEarned: 0,
        comboMultiplier: 1,
      };
    }

    // Multiplier scales: combo 0-2 (1x), 3-5 (2x), 6+ (3x)
    const newCombo = currentCombo + 1;
    const comboMultiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;

    // Speed bonus: up to 50 additional points for sub-second answers
    const remainingTime = Math.max(0, prompt.timeLimitMs - responseTimeMs);
    const speedBonus = Math.round((remainingTime / prompt.timeLimitMs) * 50);
    const pointsEarned = (100 + speedBonus) * comboMultiplier;

    return {
      promptId: prompt.id,
      selectedOptionIndex,
      isCorrect: true,
      responseTimeMs,
      pointsEarned,
      comboMultiplier,
    };
  }

  /**
   * Summarizes complete drill session.
   */
  public calculateSummary(
    drillType: SpeedDrillType,
    results: DrillAnswerResult[],
    maxCombo: number,
  ): DrillSessionResult {
    const totalPrompts = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const finalScore = results.reduce((acc, r) => acc + r.pointsEarned, 0);

    const totalTime = results.reduce((acc, r) => acc + r.responseTimeMs, 0);
    const avgResponseTimeMs = totalPrompts > 0 ? Math.round(totalTime / totalPrompts) : 0;

    return {
      id: `drill_sess_${Date.now()}`,
      drillType,
      totalPrompts,
      correctCount,
      avgResponseTimeMs,
      finalScore,
      maxCombo,
      completedAt: new Date().toISOString(),
    };
  }
}
