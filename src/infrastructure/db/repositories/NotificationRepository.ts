import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { INotificationRepository } from '../../../core/repositories/INotificationRepository';
import {
  NotificationLog,
  NotificationSettings,
  NotificationType,
  ScheduleMode,
} from '../../../core/types/notifications';

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private mapRowToSettings(row: {
    user_id: string;
    enabled: number;
    schedule_mode: 'AUTO' | 'MANUAL';
    manual_time: string;
    detected_time: string | null;
    srs_enabled?: number;
    srs_schedule_mode?: 'AUTO' | 'MANUAL';
    srs_manual_time?: string;
    srs_detected_time?: string | null;
    writing_enabled?: number;
    writing_schedule_mode?: 'AUTO' | 'MANUAL';
    writing_manual_time?: string;
    writing_detected_time?: string | null;
    streak_saver_enabled: number;
    srs_batch_enabled: number;
    srs_batch_threshold: number;
    quiet_hours_start: string;
    quiet_hours_end: string;
    minimize_to_tray: number;
    updated_at: string;
  }): NotificationSettings {
    return {
      userId: row.user_id,
      enabled: Boolean(row.enabled),
      scheduleMode: row.schedule_mode as ScheduleMode,
      manualTime: row.manual_time,
      detectedTime: row.detected_time,
      srs: {
        enabled: row.srs_enabled !== undefined ? Boolean(row.srs_enabled) : true,
        scheduleMode: (row.srs_schedule_mode as ScheduleMode) || 'AUTO',
        manualTime: row.srs_manual_time || '19:00',
        detectedTime: row.srs_detected_time || '19:00',
      },
      writing: {
        enabled: row.writing_enabled !== undefined ? Boolean(row.writing_enabled) : true,
        scheduleMode: (row.writing_schedule_mode as ScheduleMode) || 'AUTO',
        manualTime: row.writing_manual_time || '21:00',
        detectedTime: row.writing_detected_time || '21:00',
      },
      streakSaverEnabled: Boolean(row.streak_saver_enabled),
      srsBatchEnabled: Boolean(row.srs_batch_enabled),
      srsBatchThreshold: row.srs_batch_threshold,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      minimizeToTray: Boolean(row.minimize_to_tray),
      updatedAt: row.updated_at,
    };
  }

  async getSettings(userId = 'user_local'): Promise<NotificationSettings> {
    const row = await this.db
      .selectFrom('notification_settings')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (row) {
      return this.mapRowToSettings(row);
    }

    // Default fallback row
    const defaultSettings: NotificationSettings = {
      userId,
      enabled: true,
      scheduleMode: 'AUTO',
      manualTime: '20:00',
      detectedTime: '19:30',
      srs: {
        enabled: true,
        scheduleMode: 'AUTO',
        manualTime: '19:00',
        detectedTime: '19:00',
      },
      writing: {
        enabled: true,
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

    await this.db
      .insertInto('notification_settings')
      .values({
        user_id: userId,
        enabled: 1,
        schedule_mode: 'AUTO',
        manual_time: '20:00',
        detected_time: '19:30',
        srs_enabled: 1,
        srs_schedule_mode: 'AUTO',
        srs_manual_time: '19:00',
        srs_detected_time: '19:00',
        writing_enabled: 1,
        writing_schedule_mode: 'AUTO',
        writing_manual_time: '21:00',
        writing_detected_time: '21:00',
        streak_saver_enabled: 1,
        srs_batch_enabled: 1,
        srs_batch_threshold: 10,
        quiet_hours_start: '23:30',
        quiet_hours_end: '08:00',
        minimize_to_tray: 1,
        updated_at: defaultSettings.updatedAt,
      })
      .execute();

    return defaultSettings;
  }

  async updateSettings(
    settings: Partial<NotificationSettings>,
    userId = 'user_local',
  ): Promise<NotificationSettings> {
    // Ensure row exists
    await this.getSettings(userId);

    const updateValues: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (settings.enabled !== undefined) updateValues.enabled = settings.enabled ? 1 : 0;
    if (settings.scheduleMode !== undefined) updateValues.schedule_mode = settings.scheduleMode;
    if (settings.manualTime !== undefined) updateValues.manual_time = settings.manualTime;
    if (settings.detectedTime !== undefined) updateValues.detected_time = settings.detectedTime;

    if (settings.srs) {
      if (settings.srs.enabled !== undefined) updateValues.srs_enabled = settings.srs.enabled ? 1 : 0;
      if (settings.srs.scheduleMode !== undefined) updateValues.srs_schedule_mode = settings.srs.scheduleMode;
      if (settings.srs.manualTime !== undefined) updateValues.srs_manual_time = settings.srs.manualTime;
      if (settings.srs.detectedTime !== undefined) updateValues.srs_detected_time = settings.srs.detectedTime;
    }

    if (settings.writing) {
      if (settings.writing.enabled !== undefined) updateValues.writing_enabled = settings.writing.enabled ? 1 : 0;
      if (settings.writing.scheduleMode !== undefined) updateValues.writing_schedule_mode = settings.writing.scheduleMode;
      if (settings.writing.manualTime !== undefined) updateValues.writing_manual_time = settings.writing.manualTime;
      if (settings.writing.detectedTime !== undefined) updateValues.writing_detected_time = settings.writing.detectedTime;
    }

    if (settings.streakSaverEnabled !== undefined)
      updateValues.streak_saver_enabled = settings.streakSaverEnabled ? 1 : 0;
    if (settings.srsBatchEnabled !== undefined)
      updateValues.srs_batch_enabled = settings.srsBatchEnabled ? 1 : 0;
    if (settings.srsBatchThreshold !== undefined)
      updateValues.srs_batch_threshold = settings.srsBatchThreshold;
    if (settings.quietHoursStart !== undefined)
      updateValues.quiet_hours_start = settings.quietHoursStart;
    if (settings.quietHoursEnd !== undefined)
      updateValues.quiet_hours_end = settings.quietHoursEnd;
    if (settings.minimizeToTray !== undefined)
      updateValues.minimize_to_tray = settings.minimizeToTray ? 1 : 0;

    await this.db
      .updateTable('notification_settings')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updateValues as any)
      .where('user_id', '=', userId)
      .execute();

    return this.getSettings(userId);
  }

  async recordLog(log: Omit<NotificationLog, 'id' | 'sentAt'>): Promise<NotificationLog> {
    const id = `notif_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sentAt = new Date().toISOString();

    await this.db
      .insertInto('notification_logs')
      .values({
        id,
        user_id: log.userId,
        notification_type: log.type,
        title: log.title,
        body: log.body,
        sent_at: sentAt,
      })
      .execute();

    return {
      id,
      userId: log.userId,
      type: log.type,
      title: log.title,
      body: log.body,
      sentAt,
    };
  }

  async getLogsToday(userId = 'user_local', todayDateStr?: string): Promise<NotificationLog[]> {
    const datePrefix = todayDateStr ?? new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const rows = await this.db
      .selectFrom('notification_logs')
      .selectAll()
      .where('user_id', '=', userId)
      .where('sent_at', 'like', `${datePrefix}%`)
      .orderBy('sent_at', 'desc')
      .execute();

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.notification_type as NotificationType,
      title: r.title,
      body: r.body,
      sentAt: r.sent_at,
    }));
  }

  async getLastLog(userId = 'user_local'): Promise<NotificationLog | null> {
    const row = await this.db
      .selectFrom('notification_logs')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('sent_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      type: row.notification_type as NotificationType,
      title: row.title,
      body: row.body,
      sentAt: row.sent_at,
    };
  }

  async getLastLogByType(
    type: NotificationType,
    userId = 'user_local',
  ): Promise<NotificationLog | null> {
    const row = await this.db
      .selectFrom('notification_logs')
      .selectAll()
      .where('user_id', '=', userId)
      .where('notification_type', '=', type)
      .orderBy('sent_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      type: row.notification_type as NotificationType,
      title: row.title,
      body: row.body,
      sentAt: row.sent_at,
    };
  }

  async deleteLogsForTypeToday(
    type: NotificationType,
    todayDateStr?: string,
    userId = 'user_local',
  ): Promise<void> {
    const datePrefix = todayDateStr ?? new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await this.db
      .deleteFrom('notification_logs')
      .where('user_id', '=', userId)
      .where('notification_type', '=', type)
      .where('sent_at', 'like', `${datePrefix}%`)
      .execute();
  }
}
