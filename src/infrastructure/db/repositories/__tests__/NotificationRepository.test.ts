import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../../core/types/database';
import { createTestDatabase } from '../../database';
import { NotificationRepository } from '../NotificationRepository';

describe('NotificationRepository', () => {
  let db: Kysely<DatabaseSchema>;
  let repo: NotificationRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new NotificationRepository(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('retrieves default notification settings with activity defaults if none exist', async () => {
    const settings = await repo.getSettings('user_local');
    expect(settings.enabled).toBe(true);
    expect(settings.scheduleMode).toBe('AUTO');
    expect(settings.manualTime).toBe('20:00');
    expect(settings.srsBatchThreshold).toBe(10);
    // Activity defaults
    expect(settings.srs.enabled).toBe(true);
    expect(settings.srs.scheduleMode).toBe('AUTO');
    expect(settings.srs.manualTime).toBe('19:00');
    expect(settings.writing.enabled).toBe(true);
    expect(settings.writing.manualTime).toBe('21:00');
  });

  it('updates activity-specific notification settings properly', async () => {
    const updated = await repo.updateSettings(
      {
        srs: {
          enabled: true,
          scheduleMode: 'MANUAL',
          manualTime: '18:30',
          detectedTime: '19:00',
        },
        writing: {
          enabled: false,
          scheduleMode: 'MANUAL',
          manualTime: '22:15',
          detectedTime: '21:00',
        },
        srsBatchThreshold: 15,
      },
      'user_local',
    );

    expect(updated.srs.manualTime).toBe('18:30');
    expect(updated.srs.scheduleMode).toBe('MANUAL');
    expect(updated.writing.enabled).toBe(false);
    expect(updated.writing.manualTime).toBe('22:15');

    // Verify persistence in SQLite
    const reloaded = await repo.getSettings('user_local');
    expect(reloaded.srs.manualTime).toBe('18:30');
    expect(reloaded.writing.enabled).toBe(false);
    expect(reloaded.writing.manualTime).toBe('22:15');
  });

  it('records logs for different activity types and queries them correctly', async () => {
    const srsLog = await repo.recordLog({
      userId: 'user_local',
      type: 'PRACTICE_REMINDER_SRS',
      title: 'SRS Cards',
      body: 'Time to review cards',
    });

    const writingLog = await repo.recordLog({
      userId: 'user_local',
      type: 'PRACTICE_REMINDER_WRITING',
      title: 'Writing Studio',
      body: 'Time to practice writing',
    });

    expect(srsLog.id).toBeDefined();
    expect(srsLog.type).toBe('PRACTICE_REMINDER_SRS');
    expect(writingLog.id).toBeDefined();
    expect(writingLog.type).toBe('PRACTICE_REMINDER_WRITING');

    const lastLog = await repo.getLastLog('user_local');
    expect(lastLog?.id).toBe(writingLog.id);

    const todayLogs = await repo.getLogsToday('user_local');
    expect(todayLogs.length).toBeGreaterThanOrEqual(2);

    const lastSrs = await repo.getLastLogByType('PRACTICE_REMINDER_SRS', 'user_local');
    expect(lastSrs?.title).toBe('SRS Cards');

    const lastWriting = await repo.getLastLogByType('PRACTICE_REMINDER_WRITING', 'user_local');
    expect(lastWriting?.title).toBe('Writing Studio');
  });
});
