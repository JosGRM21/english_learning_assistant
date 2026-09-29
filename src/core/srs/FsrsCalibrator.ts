import { ReviewLog } from '../types/srs';

export interface CalibrationReport {
  totalReviewsEvaluated: number;
  successfulRecalls: number;
  actualRetentionRate: number; // e.g. 0.88 (88%)
  targetRetentionRate: number; // 0.90
  retentionDeficit: number; // actual - target (e.g. -0.02)
  recommendedRequestRetention: number; // adjusted target to compensate
  sampleSizeAdequate: boolean; // >= 30 reviews needed for statistical significance
  recommendationEs: string;
}

export class FsrsCalibrator {
  private readonly minSampleSize = 30;

  /**
   * Analyzes historical review logs to evaluate retention calibration.
   */
  public calibrate(
    logs: ReviewLog[],
    targetRetention = 0.9,
  ): CalibrationReport {
    const totalReviews = logs.length;

    if (totalReviews === 0) {
      return {
        totalReviewsEvaluated: 0,
        successfulRecalls: 0,
        actualRetentionRate: targetRetention,
        targetRetentionRate: targetRetention,
        retentionDeficit: 0.0,
        recommendedRequestRetention: targetRetention,
        sampleSizeAdequate: false,
        recommendationEs:
          'Se necesitan al menos 30 repasos históricos para calibrar con precisión matemática los parámetros DSR.',
      };
    }

    // Ratings 2 (Hard), 3 (Good), 4 (Easy) count as successful recall; rating 1 (Again) is a lapse/failure
    const successfulRecalls = logs.filter((l) => l.rating >= 2).length;
    const actualRetention = Math.round((successfulRecalls / totalReviews) * 1000) / 1000;
    const deficit = Math.round((actualRetention - targetRetention) * 1000) / 1000;

    // Compensate: if actual retention is lower than target, tighten retention request
    let recommended = targetRetention;
    if (totalReviews >= this.minSampleSize) {
      if (deficit < -0.05) {
        // Underperforming: raise target to shorten intervals and review sooner
        recommended = Math.min(0.95, targetRetention + Math.abs(deficit) * 0.5);
      } else if (deficit > 0.05) {
        // Overperforming: can safely relax intervals slightly
        recommended = Math.max(0.85, targetRetention - deficit * 0.4);
      }
    }

    let recommendationEs = 'El modelo matemático FSRS v5 está perfectamente alineado con tu curva de retención real.';
    if (deficit < -0.05) {
      recommendationEs = `La tasa de retención observada (${(actualRetention * 100).toFixed(1)}%) es inferior al 90%. Se recomienda calibrar la retención solicitada a ${(recommended * 100).toFixed(1)}% para acortar intervalos y prevenir olvidos.`;
    } else if (deficit > 0.05) {
      recommendationEs = `¡Excelente consolidación! Tu retención observada (${(actualRetention * 100).toFixed(1)}%) supera el objetivo. Los intervalos pueden espaciarse para optimizar tu tiempo de estudio.`;
    }

    return {
      totalReviewsEvaluated: totalReviews,
      successfulRecalls,
      actualRetentionRate: actualRetention,
      targetRetentionRate: targetRetention,
      retentionDeficit: deficit,
      recommendedRequestRetention: Math.round(recommended * 100) / 100,
      sampleSizeAdequate: totalReviews >= this.minSampleSize,
      recommendationEs,
    };
  }
}
