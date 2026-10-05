import { describe, it, expect } from 'vitest';
import { HabitScheduleDetector } from '../HabitScheduleDetector';

describe('HabitScheduleDetector', () => {
  const detector = new HabitScheduleDetector({
    halfLifeDays: 14,
    sessionThresholdMinutes: 30,
    defaultTime: '19:30',
  });

  it('handles cold-start with no data and returns default time with LOW confidence', () => {
    const result = detector.analyzeSchedule([]);

    expect(result.suggestedTime).toBe('19:30');
    expect(result.confidence).toBe('LOW');
    expect(result.sessionCount).toBe(0);
    expect(result.hourlyDistribution).toHaveLength(24);
  });

  it('handles cold-start with fewer than 3 sessions', () => {
    const now = new Date('2026-10-05T12:00:00Z');
    const timestamps = [
      new Date('2026-10-04T15:00:00Z'),
      new Date('2026-10-05T15:10:00Z'),
    ];

    const result = detector.analyzeSchedule(timestamps, now);

    expect(result.suggestedTime).toBe('19:30');
    expect(result.confidence).toBe('LOW');
    expect(result.sessionCount).toBe(2);
  });

  it('clusters reviews in a 5-minute burst into a single session', () => {
    const now = new Date('2026-10-05T12:00:00Z');
    const burst = Array.from({ length: 15 }, (_, i) =>
      new Date(new Date('2026-10-05T10:00:00Z').getTime() + i * 20000), // every 20s
    );

    const result = detector.analyzeSchedule(burst, now);
    expect(result.sessionCount).toBe(1);
  });

  it('detects consistent afternoon habit (14:00) with HIGH confidence', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const sessions: Date[] = [];

    // 10 distinct days at 14:15
    for (let day = 1; day <= 10; day++) {
      const paddedDay = String(day).padStart(2, '0');
      sessions.push(new Date(`2026-10-${paddedDay}T14:15:00`));
    }

    const result = detector.analyzeSchedule(sessions, now);

    expect(result.optimalHour).toBe(14);
    expect(result.optimalMinute).toBe(15);
    expect(result.suggestedTime).toBe('14:15');
    expect(result.confidence).toBe('HIGH');
    expect(result.sessionCount).toBe(10);
    expect(result.hourlyDistribution[14]).toBeGreaterThan(result.hourlyDistribution[0]);
  });

  it('adapts when learner changes habits from evening (21:00) to morning (08:00)', () => {
    const refDate = new Date('2026-10-30T12:00:00');
    const sessions: Date[] = [];

    // Old routine: 10 sessions 35 to 25 days ago at 21:00
    for (let i = 0; i < 10; i++) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - (35 - i));
      d.setHours(21, 0, 0, 0);
      sessions.push(d);
    }

    // New routine: 10 sessions across the last 10 days at 08:00
    for (let i = 0; i < 10; i++) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - (10 - i));
      d.setHours(8, 0, 0, 0);
      sessions.push(d);
    }


    const result = detector.analyzeSchedule(sessions, refDate);

    // Because of the 14-day exponential decay, recent 08:00 sessions vastly outweigh 21:00 sessions
    expect(result.optimalHour).toBe(8);
    expect(result.suggestedTime).toBe('08:00');
    expect(result.confidence).toBe('HIGH');
  });
});
