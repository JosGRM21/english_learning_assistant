export type ScheduleMode = 'AUTO' | 'MANUAL';

export type ActivityType = 'SRS' | 'WRITING';

export type NotificationType =
  | 'PRACTICE_REMINDER'
  | 'PRACTICE_REMINDER_SRS'
  | 'PRACTICE_REMINDER_WRITING'
  | 'STREAK_SAVER_1'
  | 'STREAK_SAVER_2'
  | 'SRS_BATCH'
  | 'TEST';

export type HabitConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface HabitAnalysisResult {
  optimalHour: number;
  optimalMinute: number;
  suggestedTime: string; // 'HH:mm'
  confidence: HabitConfidence;
  sessionCount: number;
  hourlyDistribution: number[]; // 24 items, percentages 0-100
}

export interface ActivityScheduleConfig {
  enabled: boolean;
  scheduleMode: ScheduleMode;
  manualTime: string; // 'HH:mm'
  detectedTime: string | null; // 'HH:mm'
}

export interface NotificationSettings {
  userId: string;
  enabled: boolean;
  scheduleMode: ScheduleMode;
  manualTime: string; // 'HH:mm'
  detectedTime: string | null; // 'HH:mm'
  // Per-activity schedules:
  srs: ActivityScheduleConfig;
  writing: ActivityScheduleConfig;
  streakSaverEnabled: boolean;
  srsBatchEnabled: boolean;
  srsBatchThreshold: number;
  quietHoursStart: string; // 'HH:mm'
  quietHoursEnd: string; // 'HH:mm'
  minimizeToTray: boolean;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  sentAt: string;
}

export type NotificationCategory = 'PRACTICE' | 'STREAK' | 'BATCH' | 'SYSTEM';

export interface RuleEngineContext {
  currentTime: Date;
  settings: NotificationSettings;
  effectivePracticeTime: string; // 'HH:mm'
  effectiveSrsTime?: string; // 'HH:mm'
  effectiveWritingTime?: string; // 'HH:mm'
  isCompletedToday: boolean;
  isSrsCompletedToday?: boolean;
  isWritingCompletedToday?: boolean;
  currentStreak: number;
  availableFreezes: number;
  dueCardsCount: number;
  lastNotificationAt: Date | null;
  lastNotificationType: NotificationType | null;
  lastNotificationsByType?: Partial<Record<NotificationType, Date>>;
  sentTodayTypes: NotificationType[];
}

export interface RuleEngineDecision {
  shouldNotify: boolean;
  type?: NotificationType;
  title?: string;
  body?: string;
  reason: string;
}

