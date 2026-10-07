import {
  NotificationLog,
  NotificationSettings,
  NotificationType,
} from '../types/notifications';

export interface INotificationRepository {
  getSettings(userId?: string): Promise<NotificationSettings>;
  updateSettings(settings: Partial<NotificationSettings>, userId?: string): Promise<NotificationSettings>;
  recordLog(log: Omit<NotificationLog, 'id' | 'sentAt'>): Promise<NotificationLog>;
  getLogsToday(userId?: string, todayDateStr?: string): Promise<NotificationLog[]>;
  getLastLog(userId?: string): Promise<NotificationLog | null>;
  getLastLogByType(type: NotificationType, userId?: string): Promise<NotificationLog | null>;
  deleteLogsForTypeToday(type: NotificationType, todayDateStr?: string, userId?: string): Promise<void>;
}
