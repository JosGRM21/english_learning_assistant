import {
  SpeedDrillType,
  DrillPrompt,
  DrillAnswerResult,
  DrillSessionResult,
} from '../types/drills';

import { DRILL_PROMPTS_CATALOG } from '@/data/drill-prompts-catalog';
export { DRILL_PROMPTS_CATALOG };


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
