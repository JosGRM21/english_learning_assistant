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

import { MICRO_WORKOUT_BANKS } from '@/data/micro-workout-banks';
export { MICRO_WORKOUT_BANKS };


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
