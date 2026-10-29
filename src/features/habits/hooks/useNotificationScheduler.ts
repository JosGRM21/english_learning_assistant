import { useEffect, useRef, useCallback } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { useNotificationSettingsStore } from '@/features/settings/store/notificationSettingsStore';
import { NotificationRuleEngine } from '@/core/habits/NotificationRuleEngine';
import { notificationService } from '@/infrastructure/notifications/NotificationService';
import { RuleEngineContext } from '@/core/types/notifications';
import { getLocalDateString } from '@/shared/utils/date';

const ruleEngine = new NotificationRuleEngine({
  cooldownMinutes: 75,
  srsBatchIntervalHours: 4,
});

export function useNotificationScheduler() {
  const { isReady, cardRepo, notificationRepo, writingRepo } = useDatabase();
  const streak = useHabitsStore((s) => s.streak);
  const {
    settings,
    loadSettings,
    checkPermission,
  } = useNotificationSettingsStore();

  const isEvaluatingRef = useRef(false);

  // 1. Initial load
  useEffect(() => {
    if (!isReady || !notificationRepo) return;

    let isMounted = true;

    async function initializeScheduler() {
      try {
        await checkPermission();
        if (isMounted) {
          await loadSettings(notificationRepo!);
        }
      } catch (err) {
        console.warn('[useNotificationScheduler] Init error:', err);
      }
    }

    initializeScheduler();

    return () => {
      isMounted = false;
    };
  }, [isReady, notificationRepo, loadSettings, checkPermission]);

  // Deduplication lock to prevent burst triggers while an async log write is in flight
  const inFlightTypesRef = useRef<Set<string>>(new Set());

  // 2. Periodic evaluation tick
  const evaluateScheduleTick = useCallback(async () => {
    if (!isReady || !notificationRepo || !cardRepo || isEvaluatingRef.current) return;
    if (!settings.enabled) return;

    isEvaluatingRef.current = true;
    try {
      const now = new Date();
      // Use local date formatted string for daily idempotency and activity matching
      const todayStr = getLocalDateString(now);

      // Check if user completed study today
      const isCompletedToday = streak.lastActivityDate === todayStr;

      // Activity-specific completion checks with high-performance indexed queries
      const isSrsCompletedToday = await cardRepo.hasReviewToday('user_local', todayStr);
      const isWritingCompletedToday = writingRepo ? await writingRepo.hasSubmissionToday('user_local', todayStr) : false;

      // Check due cards count with lightweight count query
      const dueCardsCount = await cardRepo.getDueCardsCount('user_local');

      // Query logs today
      const todayLogs = await notificationRepo.getLogsToday('user_local', todayStr);
      const sentTodayTypes = todayLogs.map((l) => l.type);

      // Include any currently in-flight types to strictly avoid double-firing
      for (const inFlightType of inFlightTypesRef.current) {
        if (!sentTodayTypes.includes(inFlightType as any)) {
          sentTodayTypes.push(inFlightType as any);
        }
      }

      const lastLog = await notificationRepo.getLastLog('user_local');
      const lastNotificationAt = lastLog ? new Date(lastLog.sentAt) : null;
      const lastNotificationType = lastLog ? lastLog.type : null;

      // Build type-specific timestamp map
      const lastNotificationsByType: Partial<Record<any, Date>> = {};
      for (const log of todayLogs) {
        if (!lastNotificationsByType[log.type]) {
          lastNotificationsByType[log.type] = new Date(log.sentAt);
        }
      }

      const effectivePracticeTime = settings.manualTime || '20:00';
      const effectiveSrsTime = settings.srs?.manualTime || '19:00';
      const effectiveWritingTime = settings.writing?.manualTime || '21:00';

      const context: RuleEngineContext = {
        currentTime: now,
        settings,
        effectivePracticeTime,
        effectiveSrsTime,
        effectiveWritingTime,
        isCompletedToday,
        isSrsCompletedToday,
        isWritingCompletedToday,
        currentStreak: streak.currentStreak,
        availableFreezes: streak.availableFreezes,
        dueCardsCount,
        lastNotificationAt,
        lastNotificationType,
        lastNotificationsByType,
        sentTodayTypes,
      };

      const decision = ruleEngine.evaluate(context);

      if (decision.shouldNotify && decision.type && decision.title && decision.body) {
        // Double-check in-flight mutex for this specific type
        if (inFlightTypesRef.current.has(decision.type)) {
          return;
        }

        // Lock in-flight
        inFlightTypesRef.current.add(decision.type);

        try {
          const delivered = await notificationService.notify({
            title: decision.title,
            body: decision.body,
            extra: { notificationType: decision.type },
          });

          if (delivered) {
            await notificationRepo.recordLog({
              userId: 'user_local',
              type: decision.type,
              title: decision.title,
              body: decision.body,
            });
          }
        } finally {
          // Release lock after persistent log has been stored or notification failed
          setTimeout(() => {
            inFlightTypesRef.current.delete(decision.type!);
          }, 2000);
        }
      }
    } catch (err) {
      console.warn('[useNotificationScheduler] Tick error:', err);
    } finally {
      isEvaluatingRef.current = false;
    }
  }, [isReady, notificationRepo, cardRepo, settings, streak]);

  // Run periodic ticker aligned with minute boundaries (with fallback interval)
  useEffect(() => {
    if (!isReady) return;

    let timer: NodeJS.Timeout | null = null;
    let interval: NodeJS.Timeout | null = null;

    // Run first tick after 2 seconds
    const initialTimer = setTimeout(() => {
      evaluateScheduleTick();

      // Align next checks with the start of the next minute
      const msUntilNextMinute = 60000 - (Date.now() % 60000) + 500;
      timer = setTimeout(() => {
        evaluateScheduleTick();
        interval = setInterval(() => {
          evaluateScheduleTick();
        }, 60000);
      }, msUntilNextMinute);
    }, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [isReady, evaluateScheduleTick]);

  // Trigger immediate evaluation whenever manual times or toggle settings change
  const lastSettingsTriggerRef = useRef<string>('');
  useEffect(() => {
    if (!isReady) return;
    const key = `${settings.enabled}-${settings.manualTime}-${settings.srs?.enabled}-${settings.srs?.manualTime}-${settings.writing?.enabled}-${settings.writing?.manualTime}-${settings.streakSaverEnabled}-${settings.srsBatchEnabled}`;
    if (lastSettingsTriggerRef.current && lastSettingsTriggerRef.current !== key) {
      evaluateScheduleTick();
    }
    lastSettingsTriggerRef.current = key;
  }, [
    isReady,
    settings.enabled,
    settings.manualTime,
    settings.srs?.enabled,
    settings.srs?.manualTime,
    settings.writing?.enabled,
    settings.writing?.manualTime,
    settings.streakSaverEnabled,
    settings.srsBatchEnabled,
    evaluateScheduleTick,
  ]);

  return {
    evaluateNow: evaluateScheduleTick,
  };
}
