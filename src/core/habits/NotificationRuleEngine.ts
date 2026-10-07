import {
  NotificationCategory,
  NotificationType,
  RuleEngineContext,
  RuleEngineDecision,
} from '../types/notifications';

export class NotificationRuleEngine {
  private readonly defaultCooldownMinutes: number;
  public readonly srsBatchIntervalHours: number;
  private readonly graceWindowMinutes: number;

  constructor(options?: {
    cooldownMinutes?: number;
    srsBatchIntervalHours?: number;
    graceWindowMinutes?: number;
  }) {
    this.defaultCooldownMinutes = options?.cooldownMinutes ?? 75;
    this.srsBatchIntervalHours = options?.srsBatchIntervalHours ?? 4;
    this.graceWindowMinutes = options?.graceWindowMinutes ?? 45;
  }

  /**
   * Maps a NotificationType to its logical functional category.
   */
  public getNotificationCategory(type: NotificationType): NotificationCategory {
    switch (type) {
      case 'PRACTICE_REMINDER':
      case 'PRACTICE_REMINDER_SRS':
      case 'PRACTICE_REMINDER_WRITING':
        return 'PRACTICE';
      case 'STREAK_SAVER_1':
      case 'STREAK_SAVER_2':
        return 'STREAK';
      case 'SRS_BATCH':
        return 'BATCH';
      case 'TEST':
        return 'SYSTEM';
    }
  }

  /**
   * Evaluates the full context against business rules to decide if a notification should be fired.
   */
  public evaluate(context: RuleEngineContext): RuleEngineDecision {
    const { settings, currentTime } = context;

    // 1. Master toggle check
    if (!settings.enabled) {
      return { shouldNotify: false, reason: 'Notificaciones desactivadas en configuración' };
    }

    // 2. Quiet hours check
    if (this.isWithinQuietHours(currentTime, settings.quietHoursStart, settings.quietHoursEnd)) {
      return { shouldNotify: false, reason: 'Horario de silencio activo (Quiet Hours)' };
    }

    // Helper: Verify cooldown for a specific candidate type
    const isCoolingDown = (candidateType: NotificationType): boolean => {
      // Channel/Type-specific cooldown check
      const typeTimestamp = context.lastNotificationsByType?.[candidateType];
      if (typeTimestamp) {
        const elapsedMinutes = (currentTime.getTime() - typeTimestamp.getTime()) / (1000 * 60);
        if (elapsedMinutes < this.defaultCooldownMinutes) {
          return true;
        }
      }

      // Check last notification if of the same category or general throttling
      if (context.lastNotificationAt && context.lastNotificationType) {
        // SYSTEM tests never block practice or streak notifications
        if (context.lastNotificationType === 'TEST') {
          return false;
        }

        const candidateCat = this.getNotificationCategory(candidateType);
        const lastCat = this.getNotificationCategory(context.lastNotificationType);

        // Same category cooldown
        if (candidateCat === lastCat) {
          const elapsedMs = currentTime.getTime() - context.lastNotificationAt.getTime();
          const elapsedMinutes = elapsedMs / (1000 * 60);
          if (elapsedMinutes < this.defaultCooldownMinutes) {
            return true;
          }
        } else {
          // Cross-category burst protection (prevent 2 popups in less than 5 minutes)
          const elapsedMs = currentTime.getTime() - context.lastNotificationAt.getTime();
          const elapsedMinutes = elapsedMs / (1000 * 60);
          if (elapsedMinutes < 5) {
            return true;
          }
        }
      } else if (context.lastNotificationAt && !context.lastNotificationType) {
        // Fallback for legacy contexts without type: standard cooldown
        const elapsedMs = currentTime.getTime() - context.lastNotificationAt.getTime();
        const elapsedMinutes = elapsedMs / (1000 * 60);
        if (elapsedMinutes < this.defaultCooldownMinutes) {
          return true;
        }
      }

      return false;
    };

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const effectiveTime = context.effectivePracticeTime || '19:30';
    const [practiceH, practiceM] = effectiveTime.split(':').map(Number);
    const practiceMinutes = (practiceH ?? 19) * 60 + (practiceM ?? 30);

    const parseMinutes = (timeStr?: string, defaultH = 19, defaultM = 0) => {
      if (!timeStr) return defaultH * 60 + defaultM;
      const [h, m] = timeStr.split(':').map(Number);
      return (h ?? defaultH) * 60 + (m ?? defaultM);
    };

    const srsTimeStr =
      context.effectiveSrsTime ||
      (settings.srs?.scheduleMode === 'AUTO'
        ? settings.srs?.detectedTime || '19:00'
        : settings.srs?.manualTime || '19:00');
    const srsMinutes = parseMinutes(srsTimeStr, 19, 0);

    const writingTimeStr =
      context.effectiveWritingTime ||
      (settings.writing?.scheduleMode === 'AUTO'
        ? settings.writing?.detectedTime || '21:00'
        : settings.writing?.manualTime || '21:00');
    const writingMinutes = parseMinutes(writingTimeStr, 21, 0);

    // 4. Activity-Specific Practice Reminders
    // 4a. SRS Card Review Reminder
    if (
      settings.srs?.enabled &&
      !(context.isSrsCompletedToday ?? false) &&
      !context.sentTodayTypes.includes('PRACTICE_REMINDER_SRS')
    ) {
      if (
        currentMinutes >= srsMinutes &&
        currentMinutes <= srsMinutes + this.graceWindowMinutes
      ) {
        if (isCoolingDown('PRACTICE_REMINDER_SRS')) {
          return {
            shouldNotify: false,
            reason: 'Enfriamiento activo para repaso de tarjetas SRS',
          };
        }
        return {
          shouldNotify: true,
          type: 'PRACTICE_REMINDER_SRS',
          title: '🧠 ¡Hora de tu repaso de tarjetas SRS!',
          body: 'Dedica unos minutos al repaso espaciado con FSRS para consolidar tu vocabulario en la memoria a largo plazo.',
          reason: 'Hora programada para repaso de tarjetas SRS alcanzada',
        };
      }
    }

    // 4b. Writing Studio Reminder
    if (
      settings.writing?.enabled &&
      !(context.isWritingCompletedToday ?? false) &&
      !context.sentTodayTypes.includes('PRACTICE_REMINDER_WRITING')
    ) {
      if (
        currentMinutes >= writingMinutes &&
        currentMinutes <= writingMinutes + this.graceWindowMinutes
      ) {
        if (isCoolingDown('PRACTICE_REMINDER_WRITING')) {
          return {
            shouldNotify: false,
            reason: 'Enfriamiento activo para taller de redacción',
          };
        }
        return {
          shouldNotify: true,
          type: 'PRACTICE_REMINDER_WRITING',
          title: '✍️ Taller de Redacción Socrática',
          body: 'Es tu momento para escribir en inglés. Desarrolla tus ideas y recibe pistas interactivas de IA.',
          reason: 'Hora programada para el taller de redacción alcanzada',
        };
      }
    }

    // 4c. General Practice Reminder (Fallback when specific activity toggles are not configured)
    if (
      !settings.srs?.enabled &&
      !settings.writing?.enabled &&
      !context.isCompletedToday &&
      !context.sentTodayTypes.includes('PRACTICE_REMINDER')
    ) {
      if (
        currentMinutes >= practiceMinutes &&
        currentMinutes <= practiceMinutes + this.graceWindowMinutes
      ) {
        if (isCoolingDown('PRACTICE_REMINDER')) {
          return {
            shouldNotify: false,
            reason: 'Enfriamiento activo para recordatorio de práctica general',
          };
        }
        const isLateNightHabit = practiceMinutes >= 22 * 60 + 30; // 22:30 or later
        return {
          shouldNotify: true,
          type: 'PRACTICE_REMINDER',
          title: isLateNightHabit
            ? '🌙 Tu sesión nocturna de inglés'
            : '📚 ¡Hora de practicar inglés!',
          body: isLateNightHabit
            ? 'Es tu hora habitual de práctica. ¡Completa tu repaso antes de que termine el día!'
            : 'Dedica unos minutos a consolidar tu vocabulario y mantener tu ritmo de aprendizaje.',
          reason: 'Hora habitual de práctica alcanzada',
        };
      }
    }

    // 5. Pre-Midnight Streak Saver Reminders
    if (settings.streakSaverEnabled && !context.isCompletedToday) {
      // Conflict resolution:
      // Find latest scheduled active practice time
      let latestActivePracticeMinutes = practiceMinutes;
      if (settings.srs?.enabled) {
        latestActivePracticeMinutes = Math.max(latestActivePracticeMinutes, srsMinutes);
      }
      if (settings.writing?.enabled) {
        latestActivePracticeMinutes = Math.max(latestActivePracticeMinutes, writingMinutes);
      }

      // If any active habitual activity is late night (>= 22:00, e.g. 23:00),
      // we NEVER send STREAK_SAVER_1 at 21:30 or 22:30 because it precedes their scheduled time.
      const isLateNightHabit = latestActivePracticeMinutes >= 22 * 60; // 22:00 or later

      // STREAK_SAVER_1: 21:30 to 22:45
      const saver1Start = 21 * 60 + 30; // 21:30
      const saver1End = 22 * 60 + 45;   // 22:45

      if (
        !isLateNightHabit &&
        !context.sentTodayTypes.includes('STREAK_SAVER_1') &&
        currentMinutes >= saver1Start &&
        currentMinutes <= saver1End
      ) {
        if (isCoolingDown('STREAK_SAVER_1')) {
          return {
            shouldNotify: false,
            reason: 'Enfriamiento activo para alerta nocturna 1',
          };
        }
        return {
          shouldNotify: true,
          type: 'STREAK_SAVER_1',
          title: context.currentStreak > 0 ? '🔥 ¡Salva tu racha!' : '🌱 Inicia tu racha de hoy',
          body:
            context.currentStreak > 0
              ? `Tu racha de ${context.currentStreak} ${context.currentStreak === 1 ? 'día' : 'días'} está en juego. Aún tienes tiempo para tu repaso de hoy.`
              : 'Aún tienes tiempo antes de que termine el día para dar tu primer paso en inglés.',
          reason: 'Alerta nocturna 1 de racha en peligro',
        };
      }

      // STREAK_SAVER_2: 23:15 to 23:55 (Last call before midnight)
      const saver2Start = 23 * 60 + 15; // 23:15
      const saver2End = 23 * 60 + 55;   // 23:55

      if (
        !context.sentTodayTypes.includes('STREAK_SAVER_2') &&
        currentMinutes >= saver2Start &&
        currentMinutes <= saver2End
      ) {
        if (isCoolingDown('STREAK_SAVER_2')) {
          return {
            shouldNotify: false,
            reason: 'Enfriamiento activo para alerta nocturna 2',
          };
        }
        let body = `¡No pierdas tu racha de ${context.currentStreak} días! Solo necesitas 3 minutos de repaso.`;
        if (context.availableFreezes > 0 && context.currentStreak > 0) {
          body = `Quedan pocos minutos. Si no practicas hoy, gastarás 1 Streak Freeze para salvar tu racha de ${context.currentStreak} días.`;
        }

        return {
          shouldNotify: true,
          type: 'STREAK_SAVER_2',
          title: '🚨 ¡Última oportunidad antes de medianoche!',
          body,
          reason: 'Alerta nocturna 2 de última oportunidad',
        };
      }
    }

    // 6. Spaced Repetition (SRS) Smart Batch Notification
    // Only triggers if enabled, threshold reached, and not sent recently (4h minimum)
    if (settings.srsBatchEnabled && context.dueCardsCount >= settings.srsBatchThreshold) {
      if (!context.sentTodayTypes.includes('SRS_BATCH')) {
        if (isCoolingDown('SRS_BATCH')) {
          return {
            shouldNotify: false,
            reason: 'Enfriamiento activo para lote de tarjetas SRS',
          };
        }
        return {
          shouldNotify: true,
          type: 'SRS_BATCH',
          title: `🧠 ${context.dueCardsCount} tarjetas listas para repasar`,
          body: 'Un breve repaso de 5 minutos afianzará estas palabras en tu memoria de largo plazo.',
          reason: `Lote de tarjetas SRS alcanzado (${context.dueCardsCount} >= ${settings.srsBatchThreshold})`,
        };
      }
    }

    return {
      shouldNotify: false,
      reason: 'No hay eventos de notificación pendientes en esta ventana',
    };
  }

  /**
   * Checks whether the given date/time falls within quiet hours (e.g. 23:30 to 08:00).
   */
  public isWithinQuietHours(date: Date, startStr: string, endStr: string): boolean {
    const currentM = date.getHours() * 60 + date.getMinutes();
    const [startH, startMin] = startStr.split(':').map(Number);
    const [endH, endMin] = endStr.split(':').map(Number);

    const startM = (startH ?? 23) * 60 + (startMin ?? 30);
    const endM = (endH ?? 8) * 60 + (endMin ?? 0);

    if (startM < endM) {
      // Intra-day window (e.g. 01:00 to 06:00)
      return currentM >= startM && currentM < endM;
    } else {
      // Overnight window across midnight (e.g. 23:30 to 08:00)
      return currentM >= startM || currentM < endM;
    }
  }
}

