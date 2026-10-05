import { HabitAnalysisResult, HabitConfidence } from '../types/notifications';

export class HabitScheduleDetector {
  private readonly halfLifeDays: number;
  private readonly sessionThresholdMs: number;
  private readonly defaultTime: string;

  constructor(options?: {
    halfLifeDays?: number;
    sessionThresholdMinutes?: number;
    defaultTime?: string;
  }) {
    this.halfLifeDays = options?.halfLifeDays ?? 14;
    this.sessionThresholdMs = (options?.sessionThresholdMinutes ?? 30) * 60 * 1000;
    this.defaultTime = options?.defaultTime ?? '19:30';
  }

  /**
   * Analyzes user review & study timestamps to detect their natural practice schedule.
   *
   * @param timestamps List of ISO string timestamps or Date objects when user completed study activities.
   * @param referenceDate Reference date for calculating age decay (default: now).
   */
  public analyzeSchedule(
    timestamps: (string | Date)[],
    referenceDate: Date = new Date(),
  ): HabitAnalysisResult {
    const defaultParts = this.defaultTime.split(':').map(Number);
    const defaultHour = defaultParts[0] ?? 19;
    const defaultMinute = defaultParts[1] ?? 30;

    if (!timestamps || timestamps.length === 0) {
      return {
        optimalHour: defaultHour,
        optimalMinute: defaultMinute,
        suggestedTime: this.defaultTime,
        confidence: 'LOW',
        sessionCount: 0,
        hourlyDistribution: Array(24).fill(0),
      };
    }

    // 1. Parse and sort timestamps chronologically
    const validDates = timestamps
      .map((t) => (t instanceof Date ? t : new Date(t)))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (validDates.length === 0) {
      return {
        optimalHour: defaultHour,
        optimalMinute: defaultMinute,
        suggestedTime: this.defaultTime,
        confidence: 'LOW',
        sessionCount: 0,
        hourlyDistribution: Array(24).fill(0),
      };
    }

    // 2. Cluster events into discrete study sessions (events within 30 min belong to same session)
    const sessions: { startTime: Date; hour: number; minute: number }[] = [];
    let currentSessionStart = validDates[0];

    for (let i = 1; i < validDates.length; i++) {
      const prev = validDates[i - 1];
      const curr = validDates[i];
      if (curr.getTime() - prev.getTime() > this.sessionThresholdMs) {
        sessions.push({
          startTime: currentSessionStart,
          hour: currentSessionStart.getHours(),
          minute: currentSessionStart.getMinutes(),
        });
        currentSessionStart = curr;
      }
    }
    sessions.push({
      startTime: currentSessionStart,
      hour: currentSessionStart.getHours(),
      minute: currentSessionStart.getMinutes(),
    });

    const sessionCount = sessions.length;

    // Cold-start protection
    if (sessionCount < 3) {
      return {
        optimalHour: defaultHour,
        optimalMinute: defaultMinute,
        suggestedTime: this.defaultTime,
        confidence: 'LOW',
        sessionCount,
        hourlyDistribution: this.buildRawDistribution(sessions),
      };
    }

    // 3. Compute exponentially time-decayed weights and circular kernel smoothing
    const rawBins = Array(24).fill(0);
    const minuteSumsByHour = Array(24).fill(0);
    const weightSumsByHour = Array(24).fill(0);
    const refMs = referenceDate.getTime();
    const decayConstant = Math.LN2 / this.halfLifeDays;

    for (const session of sessions) {
      const diffDays = Math.max(0, (refMs - session.startTime.getTime()) / (1000 * 60 * 60 * 24));
      const weight = Math.exp(-decayConstant * diffDays);

      const h = session.hour;
      const prevH = (h - 1 + 24) % 24;
      const nextH = (h + 1) % 24;

      // Triangular circular smoothing: [h-1: 0.25, h: 0.5, h+1: 0.25]
      rawBins[prevH] += 0.25 * weight;
      rawBins[h] += 0.5 * weight;
      rawBins[nextH] += 0.25 * weight;

      minuteSumsByHour[h] += session.minute * weight;
      weightSumsByHour[h] += weight;
    }

    // 4. Find peak hour
    let peakHour = defaultHour;
    let maxWeight = -1;

    for (let h = 0; h < 24; h++) {
      if (rawBins[h] > maxWeight) {
        maxWeight = rawBins[h];
        peakHour = h;
      }
    }

    // 5. Determine optimal minute within peak hour (rounded to nearest 00, 15, 30, 45)
    let peakMinute = 0;
    if (weightSumsByHour[peakHour] > 0) {
      const avgMinute = minuteSumsByHour[peakHour] / weightSumsByHour[peakHour];
      const quarters = [0, 15, 30, 45];
      peakMinute = quarters.reduce((prev, curr) =>
        Math.abs(curr - avgMinute) < Math.abs(prev - avgMinute) ? curr : prev,
      );
    }

    // 6. Normalize distribution to percentages (summing to ~100%)
    const totalWeight = rawBins.reduce((a, b) => a + b, 0);
    const hourlyDistribution = rawBins.map((bin) =>
      totalWeight > 0 ? Number(((bin / totalWeight) * 100).toFixed(1)) : 0,
    );

    // 7. Calculate confidence
    let confidence: HabitConfidence = 'LOW';
    if (sessionCount >= 8) {
      const peakRatio = totalWeight > 0 ? rawBins[peakHour] / totalWeight : 0;
      confidence = peakRatio >= 0.18 ? 'HIGH' : 'MEDIUM';
    } else if (sessionCount >= 3) {
      confidence = 'MEDIUM';
    }

    const formattedHour = peakHour.toString().padStart(2, '0');
    const formattedMinute = peakMinute.toString().padStart(2, '0');
    const suggestedTime = `${formattedHour}:${formattedMinute}`;

    return {
      optimalHour: peakHour,
      optimalMinute: peakMinute,
      suggestedTime,
      confidence,
      sessionCount,
      hourlyDistribution,
    };
  }

  private buildRawDistribution(
    sessions: { startTime: Date; hour: number; minute: number }[],
  ): number[] {
    const counts = Array(24).fill(0);
    for (const s of sessions) {
      counts[s.hour]++;
    }
    const total = sessions.length;
    return counts.map((c) => (total > 0 ? Number(((c / total) * 100).toFixed(1)) : 0));
  }
}
