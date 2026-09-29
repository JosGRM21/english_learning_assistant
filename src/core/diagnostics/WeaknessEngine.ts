import {
  ErrorSeverity,
  UserErrorEvent,
  WeaknessMetric,
  MicroWorkout,
  MicroWorkoutExercise,
  ErrorTaxonomyItem,
} from '../types/diagnostics';

const SEVERITY_WEIGHTS: Record<ErrorSeverity, number> = {
  LOW: 1.0,
  MEDIUM: 1.5,
  HIGH: 2.0,
  CRITICAL: 2.5,
};

// Curated exercise templates for common SLA Spanish L1 pitfalls
const MICRO_WORKOUT_BANKS: Record<string, MicroWorkoutExercise[]> = {
  L1_PREP_DEPEND_ON: [
    {
      id: 'ex_dep_1',
      questionEs: 'Completa la preposición adecuada para el verbo "depend":',
      promptSentence: 'Our holiday plans depend ___ the weather forecast.',
      options: ['of', 'on', 'in', 'at'],
      correctOptionIndex: 1,
      explanationEs: 'En inglés el verbo "depend" rige obligatoriamente la preposición "on", nunca "of".',
      targetFocus: 'depend on',
    },
    {
      id: 'ex_dep_2',
      questionEs: 'Identifica la opción gramaticalmente correcta:',
      promptSentence: 'The project deadline will ___ the client approval.',
      options: ['depend of', 'depend on', 'depends of', 'depending from'],
      correctOptionIndex: 1,
      explanationEs: 'Después del modal "will" se usa la forma base: "depend on".',
      targetFocus: 'will depend on',
    },
    {
      id: 'ex_dep_3',
      questionEs: 'Elige el sinónimo con la misma estructura preposicional:',
      promptSentence: 'You can always ___ my support when needed.',
      options: ['rely of', 'rely on', 'count of', 'depend in'],
      correctOptionIndex: 1,
      explanationEs: '"Rely on" (depender/confiar en) comparte la misma preposición "on".',
      targetFocus: 'rely on',
    },
    {
      id: 'ex_dep_4',
      questionEs: 'Completa la respuesta corta formal:',
      promptSentence: '"Are you going to accept the offer?" — "It ___."',
      options: ['depends on', 'depends of', 'is depending', 'depend'],
      correctOptionIndex: 0,
      explanationEs: 'En tercera persona singular decimos "It depends" o "It depends on...".',
      targetFocus: 'it depends on',
    },
    {
      id: 'ex_dep_5',
      questionEs: 'Corrige la interferencia del español en esta oración:',
      promptSentence: 'Prices depend ___ international market conditions.',
      options: ['of the', 'on the', 'from', 'in the'],
      correctOptionIndex: 1,
      explanationEs: 'Traducción directa de "dependen de": use "depend on the".',
      targetFocus: 'depend on the',
    },
  ],

  L1_SYNTAX_AM_AGREE: [
    {
      id: 'ex_agr_1',
      questionEs: 'Expresa estar de acuerdo en presente afirmativo:',
      promptSentence: 'I completely ___ with your proposal.',
      options: ['am agree', 'agree', 'am agreeing', 'agreed of'],
      correctOptionIndex: 1,
      explanationEs: '"Agree" ya es un verbo por sí mismo en inglés. No se añade "am".',
      targetFocus: 'I agree',
    },
    {
      id: 'ex_agr_2',
      questionEs: 'Elige la forma negativa correcta:',
      promptSentence: 'He ___ with that decision.',
      options: ["isn't agree", "doesn't agree", "don't agree", "not agrees"],
      correctOptionIndex: 1,
      explanationEs: 'Como es un verbo ordinario en 3ª persona singular, la negación es "doesn\'t agree".',
      targetFocus: "doesn't agree",
    },
    {
      id: 'ex_agr_3',
      questionEs: 'Formula la pregunta correctamente:',
      promptSentence: '___ with the new policy?',
      options: ['Are you agree', 'Do you agree', 'Is you agree', 'Do you are agree'],
      correctOptionIndex: 1,
      explanationEs: 'La pregunta en presente simple se construye con el auxiliar "Do": "Do you agree?".',
      targetFocus: 'Do you agree?',
    },
    {
      id: 'ex_agr_4',
      questionEs: 'Completa con la frase de coincidencia total:',
      promptSentence: 'We are in total ___ on this matter.',
      options: ['agree', 'agreement', 'agreeing', 'agreed'],
      correctOptionIndex: 1,
      explanationEs: 'Tras el adjetivo "total" se requiere el sustantivo derivado "agreement".',
      targetFocus: 'in total agreement',
    },
    {
      id: 'ex_agr_5',
      questionEs: 'Identifica la oración natural:',
      promptSentence: 'My colleagues and I ___ with the final budget.',
      options: ['agree', 'are agree', 'have agreed of', 'agreeing'],
      correctOptionIndex: 0,
      explanationEs: 'Sujeto plural (My colleagues and I) + verbo base: "agree".',
      targetFocus: 'agree',
    },
  ],

  LEX_FALSE_FRIEND_ACTUALLY: [
    {
      id: 'ex_act_1',
      questionEs: 'Quieres decir "en estos momentos / en la actualidad":',
      promptSentence: 'I am ___ working on an exciting new software project.',
      options: ['actually', 'currently', 'eventually', 'actual'],
      correctOptionIndex: 1,
      explanationEs: '"Actually" significa "en realidad/de hecho". Para "actualmente" se usa "currently" o "at present".',
      targetFocus: 'currently',
    },
    {
      id: 'ex_act_2',
      questionEs: 'Quieres corregir una suposición equivocada ("en realidad..."):',
      promptSentence: 'People think he is quiet, but he is ___ very outgoing.',
      options: ['actually', 'currently', 'nowadays', 'actual'],
      correctOptionIndex: 0,
      explanationEs: 'Aquí sí es correcto "actually" porque contrasta una creencia con la realidad objetiva.',
      targetFocus: 'actually',
    },
    {
      id: 'ex_act_3',
      questionEs: 'Completa con el adjetivo que significa "real / verdadero":',
      promptSentence: 'The ___ cost was much higher than the estimate.',
      options: ['actual', 'current', 'present', 'nowaday'],
      correctOptionIndex: 0,
      explanationEs: '"Actual cost" significa el costo real/efectivo, no el costo de hoy en día.',
      targetFocus: 'actual cost',
    },
    {
      id: 'ex_act_4',
      questionEs: 'Quieres decir "hoy en día la gente lee menos periódicos":',
      promptSentence: '___, many people consume news on social media.',
      options: ['Actually', 'Nowadays', 'At the actual', 'Actual time'],
      correctOptionIndex: 1,
      explanationEs: '"Nowadays" expresa "en la actualidad / hoy en día".',
      targetFocus: 'Nowadays',
    },
    {
      id: 'ex_act_5',
      questionEs: 'Elige la traducción precisa para "en la actualidad":',
      promptSentence: 'The company is ___ expanding into European markets.',
      options: ['presently', 'actually', 'in actual fact', 'real'],
      correctOptionIndex: 0,
      explanationEs: '"Presently" o "at present" son sinónimos formales de "currently".',
      targetFocus: 'presently',
    },
  ],
};

export class WeaknessEngine {
  /**
   * Computes a normalized Weakness Score (0.0 - 10.0) based on error frequency,
   * recency weighting, and taxonomy severity.
   */
  public computeWeaknessScore(
    occurrencesLast7Days: number,
    totalOccurrences: number,
    severity: ErrorSeverity = 'MEDIUM',
  ): number {
    if (totalOccurrences <= 0) return 0.0;

    const severityWeight = SEVERITY_WEIGHTS[severity] ?? 1.5;
    const olderOccurrences = Math.max(0, totalOccurrences - occurrencesLast7Days);

    // Recent errors within 7 days have 3.5x more weight than older errors
    const rawScore = (occurrencesLast7Days * 1.8 + olderOccurrences * 0.45) * severityWeight;

    // Normalize to 0.0 - 10.0 range
    const clamped = Math.min(10.0, Math.max(0.0, Math.round(rawScore * 10) / 10));
    return clamped;
  }

  /**
   * Determines whether an error profile is a critical chronic weakness.
   */
  public isCritical(weaknessScore: number): boolean {
    return weaknessScore >= 6.0;
  }

  /**
   * Aggregates a list of error events into a WeaknessMetric.
   */
  public aggregateEvents(
    userId: string,
    taxonomy: ErrorTaxonomyItem,
    events: UserErrorEvent[],
    now: Date = new Date(),
  ): WeaknessMetric {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const occurrencesLast7Days = events.filter(
      (e) => new Date(e.committedAt) >= sevenDaysAgo,
    ).length;

    const totalOccurrences = events.length;
    const weaknessScore = this.computeWeaknessScore(
      occurrencesLast7Days,
      totalOccurrences,
      taxonomy.severity,
    );

    const sortedEvents = [...events].sort(
      (a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime(),
    );

    const lastDetectedAt =
      sortedEvents.length > 0 ? sortedEvents[0].committedAt : now.toISOString();

    return {
      id: `wm_${userId}_${taxonomy.code}`,
      userId,
      errorTaxonomyId: taxonomy.id,
      taxonomyCode: taxonomy.code,
      labelEs: taxonomy.labelEs,
      domain: taxonomy.domain,
      occurrencesLast7Days,
      totalOccurrences,
      weaknessScore,
      lastDetectedAt,
      isCritical: this.isCritical(weaknessScore),
    };
  }

  /**
   * Generates a focused 5-exercise Micro-Workout for a given weakness.
   */
  public generateMicroWorkout(metric: WeaknessMetric): MicroWorkout {
    const exercises = MICRO_WORKOUT_BANKS[metric.taxonomyCode] ?? this.generateFallbackExercises(metric);

    return {
      id: `mw_${Date.now()}_${metric.taxonomyCode}`,
      userId: metric.userId,
      weaknessMetricId: metric.id,
      taxonomyCode: metric.taxonomyCode,
      title: `Micro-Workout: ${metric.labelEs}`,
      exercises,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
  }

  private generateFallbackExercises(metric: WeaknessMetric): MicroWorkoutExercise[] {
    return [
      {
        id: `fb_1_${metric.taxonomyCode}`,
        questionEs: `Reflexiona sobre el patrón de error (${metric.labelEs}):`,
        promptSentence: `Select the sentence that avoids the "${metric.labelEs}" error.`,
        options: [
          'Option A with corrected syntax.',
          'Option B with common Spanish literal transfer.',
          'Option C with incorrect tense or preposition.',
          'Option D with incomplete agreement.',
        ],
        correctOptionIndex: 0,
        explanationEs: `Presta especial atención a la estructura en inglés para evitar transferencias directas del español.`,
        targetFocus: metric.labelEs,
      },
      {
        id: `fb_2_${metric.taxonomyCode}`,
        questionEs: 'Completa el espacio con la opción más idiomática:',
        promptSentence: 'Native speakers express this idea using: ___',
        options: ['the natural English collocation', 'a direct translation', 'a false friend', 'an omitted particle'],
        correctOptionIndex: 0,
        explanationEs: 'Los patrones idiomáticos nativos priorizan el uso consolidado.',
        targetFocus: metric.labelEs,
      },
      {
        id: `fb_3_${metric.taxonomyCode}`,
        questionEs: 'Identifica el error en esta oración:',
        promptSentence: 'Which element represents a non-standard transfer from Spanish?',
        options: ['The preposition or verb structure', 'The subject pronoun', 'The punctuation', 'The word order only'],
        correctOptionIndex: 0,
        explanationEs: 'La combinación de verbos y preposiciones es el foco principal.',
        targetFocus: metric.labelEs,
      },
      {
        id: `fb_4_${metric.taxonomyCode}`,
        questionEs: 'Elige la reformulación formal adecuada:',
        promptSentence: 'In professional contexts, always use: ___',
        options: ['standard English structure', 'literal translation from Spanish', 'informal slang', 'ambiguous terminology'],
        correctOptionIndex: 0,
        explanationEs: 'Mantén la claridad y la precisión gramatical.',
        targetFocus: metric.labelEs,
      },
      {
        id: `fb_5_${metric.taxonomyCode}`,
        questionEs: 'Consolidación final de la regla:',
        promptSentence: 'The key takeaway for this language point is: ___',
        options: ['Think in English structure, not word-for-word Spanish', 'Always translate literally', 'Ignore prepositions', 'Use Spanish word order'],
        correctOptionIndex: 0,
        explanationEs: 'La adquisición efectiva de una L2 requiere automatizar los patrones directos en inglés.',
        targetFocus: metric.labelEs,
      },
    ];
  }
}
