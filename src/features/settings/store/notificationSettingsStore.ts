import { create } from 'zustand';
import {
  NotificationSettings,
  HabitAnalysisResult,
  NotificationLog,
  ActivityScheduleConfig,
  NotificationType,
} from '@/core/types/notifications';
import { INotificationRepository } from '@/core/repositories/INotificationRepository';
import { HabitScheduleDetector } from '@/core/habits/HabitScheduleDetector';
import { notificationService } from '@/infrastructure/notifications/NotificationService';

const srsDetector = new HabitScheduleDetector({
  halfLifeDays: 14,
  sessionThresholdMinutes: 30,
  defaultTime: '19:00',
});

const writingDetector = new HabitScheduleDetector({
  halfLifeDays: 14,
  sessionThresholdMinutes: 30,
  defaultTime: '21:00',
});

const defaultDetector = new HabitScheduleDetector({
  halfLifeDays: 14,
  sessionThresholdMinutes: 30,
  defaultTime: '19:30',
});

export interface NotificationSettingsState {
  settings: NotificationSettings;
  habitAnalysis: HabitAnalysisResult;
  srsHabitAnalysis: HabitAnalysisResult;
  writingHabitAnalysis: HabitAnalysisResult;
  permissionGranted: boolean;
  todayLogs: NotificationLog[];
  isLoading: boolean;

  setSettings: (settings: NotificationSettings) => void;
  setHabitAnalysis: (analysis: HabitAnalysisResult) => void;
  setPermissionGranted: (granted: boolean) => void;

  loadSettings: (
    repo: INotificationRepository,
    allTimestamps?: (string | Date)[],
    srsTimestamps?: (string | Date)[],
    writingTimestamps?: (string | Date)[],
  ) => Promise<void>;
  updateSettings: (repo: INotificationRepository, delta: Partial<NotificationSettings>) => Promise<void>;
  updateActivitySettings: (
    repo: INotificationRepository,
    activity: 'srs' | 'writing',
    delta: Partial<ActivityScheduleConfig>,
  ) => Promise<void>;
  recalculateHabits: (
    allTimestamps: (string | Date)[],
    srsTimestamps?: (string | Date)[],
    writingTimestamps?: (string | Date)[],
  ) => {
    general: HabitAnalysisResult;
    srs: HabitAnalysisResult;
    writing: HabitAnalysisResult;
  };
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: (repo?: INotificationRepository) => Promise<boolean>;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>((set, get) => ({
  settings: {
    userId: 'user_local',
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
  },

  habitAnalysis: {
    optimalHour: 19,
    optimalMinute: 30,
    suggestedTime: '19:30',
    confidence: 'LOW',
    sessionCount: 0,
    hourlyDistribution: Array(24).fill(0),
  },

  srsHabitAnalysis: {
    optimalHour: 19,
    optimalMinute: 0,
    suggestedTime: '19:00',
    confidence: 'LOW',
    sessionCount: 0,
    hourlyDistribution: Array(24).fill(0),
  },

  writingHabitAnalysis: {
    optimalHour: 21,
    optimalMinute: 0,
    suggestedTime: '21:00',
    confidence: 'LOW',
    sessionCount: 0,
    hourlyDistribution: Array(24).fill(0),
  },

  permissionGranted: false,
  todayLogs: [],
  isLoading: false,

  setSettings: (settings) => set({ settings }),
  setHabitAnalysis: (habitAnalysis) => set({ habitAnalysis }),
  setPermissionGranted: (permissionGranted) => set({ permissionGranted }),

  loadSettings: async (repo, allTimestamps = [], srsTimestamps = [], writingTimestamps = []) => {
    set({ isLoading: true });
    try {
      const settings = await repo.getSettings();
      const logs = await repo.getLogsToday();
      const granted = await notificationService.checkPermission();

      let habit = get().habitAnalysis;
      let srsHabit = get().srsHabitAnalysis;
      let writingHabit = get().writingHabitAnalysis;

      const updates: Partial<NotificationSettings> = {};

      if (allTimestamps.length > 0) {
        habit = defaultDetector.analyzeSchedule(allTimestamps);
        if (habit.suggestedTime !== settings.detectedTime) {
          updates.detectedTime = habit.suggestedTime;
          settings.detectedTime = habit.suggestedTime;
        }
      }

      if (srsTimestamps.length > 0) {
        srsHabit = srsDetector.analyzeSchedule(srsTimestamps);
        if (srsHabit.suggestedTime !== settings.srs.detectedTime) {
          updates.srs = { ...settings.srs, detectedTime: srsHabit.suggestedTime };
          settings.srs.detectedTime = srsHabit.suggestedTime;
        }
      }

      if (writingTimestamps.length > 0) {
        writingHabit = writingDetector.analyzeSchedule(writingTimestamps);
        if (writingHabit.suggestedTime !== settings.writing.detectedTime) {
          updates.writing = { ...settings.writing, detectedTime: writingHabit.suggestedTime };
          settings.writing.detectedTime = writingHabit.suggestedTime;
        }
      }

      if (Object.keys(updates).length > 0) {
        await repo.updateSettings(updates);
      }

      set({
        settings,
        todayLogs: logs,
        permissionGranted: granted,
        habitAnalysis: habit,
        srsHabitAnalysis: srsHabit,
        writingHabitAnalysis: writingHabit,
        isLoading: false,
      });
    } catch (err) {
      console.error('[NotificationSettingsStore] loadSettings error:', err);
      set({ isLoading: false });
    }
  },

  updateSettings: async (repo, delta) => {
    try {
      const current = get().settings;
      const updated = await repo.updateSettings(delta);
      if (delta.manualTime && delta.manualTime !== current.manualTime) {
        await repo.deleteLogsForTypeToday('PRACTICE_REMINDER');
        const logs = await repo.getLogsToday();
        set({ settings: updated, todayLogs: logs });
      } else {
        set({ settings: updated });
      }
    } catch (err) {
      console.error('[NotificationSettingsStore] updateSettings error:', err);
    }
  },

  updateActivitySettings: async (repo, activity, delta) => {
    try {
      const current = get().settings;
      const updatedActivity = { ...current[activity], ...delta };
      const updated = await repo.updateSettings({ [activity]: updatedActivity });

      if (delta.manualTime && delta.manualTime !== current[activity]?.manualTime) {
        const notifType: NotificationType =
          activity === 'srs' ? 'PRACTICE_REMINDER_SRS' : 'PRACTICE_REMINDER_WRITING';
        await repo.deleteLogsForTypeToday(notifType);
        const logs = await repo.getLogsToday();
        set({ settings: updated, todayLogs: logs });
      } else {
        set({ settings: updated });
      }
    } catch (err) {
      console.error('[NotificationSettingsStore] updateActivitySettings error:', err);
    }
  },

  recalculateHabits: (allTimestamps, srsTimestamps = [], writingTimestamps = []) => {
    const general = defaultDetector.analyzeSchedule(allTimestamps);
    const srs = srsDetector.analyzeSchedule(srsTimestamps);
    const writing = writingDetector.analyzeSchedule(writingTimestamps);

    set({
      habitAnalysis: general,
      srsHabitAnalysis: srs,
      writingHabitAnalysis: writing,
    });

    return { general, srs, writing };
  },

  checkPermission: async () => {
    const granted = await notificationService.checkPermission();
    set({ permissionGranted: granted });
    return granted;
  },

  requestPermission: async () => {
    const granted = await notificationService.requestPermission();
    set({ permissionGranted: granted });
    return granted;
  },

  sendTestNotification: async (repo) => {
    const ok = await notificationService.notify({
      title: '🔔 ELA: Notificación de Prueba',
      body: '¡Excelente! Las notificaciones nativas de escritorio están configuradas correctamente.',
    });

    if (ok) {
      set({ permissionGranted: true });
      if (repo) {
        await repo.recordLog({
          userId: 'user_local',
          type: 'TEST',
          title: 'Notificación de Prueba',
          body: 'Notificación de prueba enviada exitosamente.',
        });
        const logs = await repo.getLogsToday();
        set({ todayLogs: logs });
      }
    }

    return ok;
  },
}));
