import { describe, it, expect } from 'vitest';
import { NotificationRuleEngine } from '../NotificationRuleEngine';
import { NotificationSettings, RuleEngineContext } from '../../types/notifications';

describe('NotificationRuleEngine', () => {
  const engine = new NotificationRuleEngine({
    cooldownMinutes: 75,
  });

  const baseSettings: NotificationSettings = {
    userId: 'user_local',
    enabled: true,
    scheduleMode: 'AUTO',
    manualTime: '20:00',
    detectedTime: '14:00',
    srs: {
      enabled: false,
      scheduleMode: 'AUTO',
      manualTime: '14:00',
      detectedTime: '14:00',
    },
    writing: {
      enabled: false,
      scheduleMode: 'AUTO',
      manualTime: '21:00',
      detectedTime: '21:00',
    },
    streakSaverEnabled: true,
    srsBatchEnabled: true,
    srsBatchThreshold: 10,
    quietHoursStart: '23:30',
    quietHoursEnd: '08:00',
    minimizeToTray: true,
    updatedAt: new Date().toISOString(),
  };

  const createMockContext = (overrides?: Partial<RuleEngineContext>): RuleEngineContext => {
    return {
      currentTime: new Date('2026-10-05T14:05:00'),
      settings: baseSettings,
      effectivePracticeTime: '14:00',
      isCompletedToday: false,
      currentStreak: 5,
      availableFreezes: 1,
      dueCardsCount: 3,
      lastNotificationAt: null,
      lastNotificationType: null,
      sentTodayTypes: [],
      ...overrides,
    };
  };

  it('suppresses all notifications when master enabled is false', () => {
    const ctx = createMockContext({
      settings: { ...baseSettings, enabled: false },
    });
    const decision = engine.evaluate(ctx);
    expect(decision.shouldNotify).toBe(false);
    expect(decision.reason).toContain('desactivadas');
  });

  it('suppresses notifications during quiet hours (e.g. 02:00)', () => {
    const ctx = createMockContext({
      currentTime: new Date('2026-10-05T02:30:00'),
    });
    const decision = engine.evaluate(ctx);
    expect(decision.shouldNotify).toBe(false);
    expect(decision.reason).toContain('Quiet Hours');
  });

  it('respects minimum cooldown period between notifications', () => {
    const now = new Date('2026-10-05T14:05:00');
    const recent = new Date(now.getTime() - 30 * 60 * 1000); // 30 mins ago

    const ctx = createMockContext({
      currentTime: now,
      lastNotificationAt: recent,
    });

    const decision = engine.evaluate(ctx);
    expect(decision.shouldNotify).toBe(false);
    expect(decision.reason).toContain('Enfriamiento activo');
  });

  describe('Activity-Specific Reminders (SRS & Writing)', () => {
    it('fires PRACTICE_REMINDER_SRS at scheduled SRS time when SRS is enabled', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T18:05:00'),
        settings: {
          ...baseSettings,
          srs: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '18:00',
            detectedTime: '18:00',
          },
        },
        effectiveSrsTime: '18:00',
        isSrsCompletedToday: false,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('PRACTICE_REMINDER_SRS');
      expect(decision.title).toContain('tarjetas SRS');
    });

    it('suppresses PRACTICE_REMINDER_SRS if SRS was already completed today', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T18:05:00'),
        settings: {
          ...baseSettings,
          srs: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '18:00',
            detectedTime: '18:00',
          },
        },
        effectiveSrsTime: '18:00',
        isSrsCompletedToday: true,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(false);
    });

    it('fires PRACTICE_REMINDER_WRITING at scheduled Writing time when Writing is enabled', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T21:10:00'),
        settings: {
          ...baseSettings,
          writing: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '21:00',
            detectedTime: '21:00',
          },
        },
        effectiveWritingTime: '21:00',
        isWritingCompletedToday: false,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('PRACTICE_REMINDER_WRITING');
      expect(decision.title).toContain('Taller de Redacción');
    });

    it('suppresses PRACTICE_REMINDER_WRITING if Writing was already completed today', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T21:10:00'),
        settings: {
          ...baseSettings,
          writing: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '21:00',
            detectedTime: '21:00',
          },
        },
        effectiveWritingTime: '21:00',
        isWritingCompletedToday: true,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(false);
    });
  });

  describe('Late Night Conflict Resolution with Multi-Activity', () => {
    it('SUPPRESSES STREAK_SAVER_1 at 22:30 when Writing habit is scheduled at 23:00', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T22:30:00'),
        settings: {
          ...baseSettings,
          writing: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '23:00',
            detectedTime: '23:00',
          },
        },
        effectiveWritingTime: '23:00',
        isCompletedToday: false,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(false);
    });

    it('fires STREAK_SAVER_1 at 21:45 when all scheduled activities are earlier in the day', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T21:45:00'),
        settings: {
          ...baseSettings,
          srs: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '14:00',
            detectedTime: '14:00',
          },
        },
        effectiveSrsTime: '14:00',
        isCompletedToday: false,
        sentTodayTypes: ['PRACTICE_REMINDER_SRS'],
        currentStreak: 7,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('STREAK_SAVER_1');
      expect(decision.body).toContain('7 días');
    });

    it('fires STREAK_SAVER_2 close to midnight alerting about streak freeze consumption', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T23:20:00'),
        effectivePracticeTime: '14:00',
        isCompletedToday: false,
        sentTodayTypes: ['PRACTICE_REMINDER', 'STREAK_SAVER_1'],
        currentStreak: 12,
        availableFreezes: 1,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('STREAK_SAVER_2');
      expect(decision.body).toContain('Streak Freeze');
    });
  });

  describe('Spaced Repetition (SRS) Smart Batching', () => {
    it('does NOT trigger notification for single or small card counts', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T10:00:00'),
        dueCardsCount: 4,
        settings: { ...baseSettings, srsBatchThreshold: 10 },
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(false);
    });

    it('triggers SRS_BATCH when threshold is reached and no recent notification was sent', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T10:00:00'),
        dueCardsCount: 12,
        settings: { ...baseSettings, srsBatchThreshold: 10 },
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('SRS_BATCH');
      expect(decision.title).toContain('12 tarjetas listas');
    });
  });

  describe('Channel-Specific Isolation & Anti-Collision Cooldowns', () => {
    it('does NOT suppress practice reminders if a TEST notification was sent recently', () => {
      const now = new Date('2026-10-05T18:05:00');
      const recentTest = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago

      const ctx = createMockContext({
        currentTime: now,
        lastNotificationAt: recentTest,
        lastNotificationType: 'TEST',
        settings: {
          ...baseSettings,
          srs: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '18:00',
            detectedTime: '18:00',
          },
        },
        effectiveSrsTime: '18:00',
        isSrsCompletedToday: false,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('PRACTICE_REMINDER_SRS');
    });

    it('suppresses immediate cross-category bursts within 5 minutes', () => {
      const now = new Date('2026-10-05T18:02:00');
      const recentBatch = new Date(now.getTime() - 2 * 60 * 1000); // 2 min ago

      const ctx = createMockContext({
        currentTime: now,
        lastNotificationAt: recentBatch,
        lastNotificationType: 'SRS_BATCH',
        settings: {
          ...baseSettings,
          srs: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '18:00',
            detectedTime: '18:00',
          },
        },
        effectiveSrsTime: '18:00',
        isSrsCompletedToday: false,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(false);
      expect(decision.reason).toContain('Enfriamiento activo');
    });

    it('allows PRACTICE_REMINDER_SRS inside grace window (e.g. 35 mins after scheduled time)', () => {
      const ctx = createMockContext({
        currentTime: new Date('2026-10-05T18:35:00'), // 35 min after 18:00
        settings: {
          ...baseSettings,
          srs: {
            enabled: true,
            scheduleMode: 'MANUAL',
            manualTime: '18:00',
            detectedTime: '18:00',
          },
        },
        effectiveSrsTime: '18:00',
        isSrsCompletedToday: false,
      });

      const decision = engine.evaluate(ctx);
      expect(decision.shouldNotify).toBe(true);
      expect(decision.type).toBe('PRACTICE_REMINDER_SRS');
    });
  });
});

