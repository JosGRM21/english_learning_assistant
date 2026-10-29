import { create } from 'zustand';
import {
  NotificationSettings,
  NotificationLog,
  ActivityScheduleConfig,
  NotificationType,
} from '@/core/types/notifications';
import { INotificationRepository } from '@/core/repositories/INotificationRepository';
import { notificationService } from '@/infrastructure/notifications/NotificationService';
import { getLocalDateString } from '@/shared/utils/date';

export interface NotificationSettingsState {
  settings: NotificationSettings;
  permissionGranted: boolean;
  todayLogs: NotificationLog[];
  isLoading: boolean;

  setSettings: (settings: NotificationSettings) => void;
  setPermissionGranted: (granted: boolean) => void;

  loadSettings: (repo: INotificationRepository) => Promise<void>;
  updateSettings: (repo: INotificationRepository, delta: Partial<NotificationSettings>) => Promise<void>;
  updateActivitySettings: (
    repo: INotificationRepository,
    activity: 'srs' | 'writing',
    delta: Partial<ActivityScheduleConfig>,
  ) => Promise<void>;
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: (repo?: INotificationRepository) => Promise<boolean>;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>((set, get) => ({
  settings: {
    userId: 'user_local',
    enabled: true,
    manualTime: '20:00',
    srs: {
      enabled: true,
      manualTime: '19:00',
    },
    writing: {
      enabled: true,
      manualTime: '21:00',
    },
    streakSaverEnabled: true,
    srsBatchEnabled: true,
    srsBatchThreshold: 10,
    quietHoursStart: '23:30',
    quietHoursEnd: '08:00',
    minimizeToTray: true,
    updatedAt: new Date().toISOString(),
  },

  permissionGranted: false,
  todayLogs: [],
  isLoading: false,

  setSettings: (settings) => set({ settings }),
  setPermissionGranted: (permissionGranted) => set({ permissionGranted }),

  loadSettings: async (repo) => {
    set({ isLoading: true });
    try {
      const todayStr = getLocalDateString();
      const settings = await repo.getSettings();
      const logs = await repo.getLogsToday('user_local', todayStr);
      const granted = await notificationService.checkPermission();

      set({
        settings,
        todayLogs: logs,
        permissionGranted: granted,
        isLoading: false,
      });
    } catch (err) {
      console.error('[NotificationSettingsStore] loadSettings error:', err);
      set({ isLoading: false });
    }
  },

  updateSettings: async (repo, delta) => {
    try {
      const todayStr = getLocalDateString();
      const current = get().settings;
      const updated = await repo.updateSettings(delta);
      if (delta.manualTime && delta.manualTime !== current.manualTime) {
        await repo.deleteLogsForTypeToday('PRACTICE_REMINDER', todayStr);
        const logs = await repo.getLogsToday('user_local', todayStr);
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
      const todayStr = getLocalDateString();
      const current = get().settings;
      const updatedActivity = { ...current[activity], ...delta };
      const updated = await repo.updateSettings({ [activity]: updatedActivity });

      if (delta.manualTime && delta.manualTime !== current[activity]?.manualTime) {
        const notifType: NotificationType =
          activity === 'srs' ? 'PRACTICE_REMINDER_SRS' : 'PRACTICE_REMINDER_WRITING';
        await repo.deleteLogsForTypeToday(notifType, todayStr);
        const logs = await repo.getLogsToday('user_local', todayStr);
        set({ settings: updated, todayLogs: logs });
      } else {
        set({ settings: updated });
      }
    } catch (err) {
      console.error('[NotificationSettingsStore] updateActivitySettings error:', err);
    }
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
        const todayStr = getLocalDateString();
        const logs = await repo.getLogsToday('user_local', todayStr);
        set({ todayLogs: logs });
      }
    }

    return ok;
  },
}));
