import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { isTauri } from '../db/database';

export class NotificationService {
  /**
   * Checks whether desktop notification permission has been granted by the OS or user.
   */
  public async checkPermission(): Promise<boolean> {
    try {
      if (isTauri()) {
        return await isPermissionGranted();
      }

      // Web Fallback
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission === 'granted';
      }

      return false;
    } catch (err) {
      console.warn('[NotificationService] Error checking permission:', err);
      return false;
    }
  }

  /**
   * Requests OS desktop notification permission.
   */
  public async requestPermission(): Promise<boolean> {
    try {
      if (isTauri()) {
        const permission = await requestPermission();
        return permission === 'granted';
      }

      // Web Fallback
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }

      return false;
    } catch (err) {
      console.warn('[NotificationService] Error requesting permission:', err);
      return false;
    }
  }

  /**
   * Sends a native desktop notification if permissions allow.
   */
  public async notify(options: {
    title: string;
    body: string;
    extra?: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const requested = await this.requestPermission();
        if (!requested) {
          console.warn('[NotificationService] Notification permission was denied.');
          return false;
        }
      }

      if (isTauri()) {
        sendNotification({
          title: options.title,
          body: options.body,
          extra: options.extra,
        });
        return true;
      }

      // Web Fallback
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification(options.title, {
          body: options.body,
          data: options.extra,
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error('[NotificationService] Error sending notification:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
