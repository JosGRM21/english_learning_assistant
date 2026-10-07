import { useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { useNotificationSettingsStore } from '@/features/settings/store/notificationSettingsStore';
import { NotificationRuleEngine } from '@/core/habits/NotificationRuleEngine';
import { notificationService } from '@/infrastructure/notifications/NotificationService';
import { RuleEngineContext } from '@/core/types/notifications';

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

  // 1. Initial load & habit history extraction
  useEffect(() => {
    if (!isReady || !notificationRepo || !cardRepo) return;

    let isMounted = true;

    async function initializeScheduler() {
      try {
        await checkPermission();

        // Collect timestamps from reviews and writing separately
        const reviewLogs = await cardRepo?.getAllReviewLogs(200);
        const writingSubs = await writingRepo?.getSubmissions('user_local', 100);

        const srsTimestamps: string[] = [];
        const writingTimestamps: string[] = [];

        if (reviewLogs) {
          for (const r of reviewLogs) {
            if (r.reviewedAt) srsTimestamps.push(r.reviewedAt);
          }
        }
        if (writingSubs) {
          for (const w of writingSubs) {
            if (w.submittedAt) writingTimestamps.push(w.submittedAt);
          }
        }

        const allTimestamps = [...srsTimestamps, ...writingTimestamps];

        if (isMounted) {
          await loadSettings(notificationRepo!, allTimestamps, srsTimestamps, writingTimestamps);
        }
      } catch (err) {
        console.warn('[useNotificationScheduler] Init error:', err);
      }
    }

    initializeScheduler();

    return () => {
      isMounted = false;
    };
  }, [isReady, notificationRepo, cardRepo, writingRepo, loadSettings, checkPermission]);

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
      const todayStr = dayjs(now).format('YYYY-MM-DD');

      // Check if user completed study today
      const isCompletedToday = streak.lastActivityDate === todayStr;

      // Activity-specific completion checks with robust local day comparison
      const recentReviews = await cardRepo.getAllReviewLogs(50);
      const isSrsCompletedToday = recentReviews.some((r) => {
        if (!r.reviewedAt) return false;
        return dayjs(r.reviewedAt).format('YYYY-MM-DD') === todayStr;
      });

      const recentWriting = await writingRepo?.getSubmissions('user_local', 20);
      const isWritingCompletedToday = (recentWriting ?? []).some((w) => {
        if (!w.submittedAt) return false;
        return dayjs(w.submittedAt).format('YYYY-MM-DD') === todayStr;
      });

      // Check due cards count
      const deckStats = await cardRepo.getDeckStatistics('user_local');
      const dueCardsCount = deckStats.dueCount;

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

      const effectivePracticeTime =
        settings.scheduleMode === 'AUTO'
          ? (settings.detectedTime || '19:30')
          : (settings.manualTime || '20:00');

      const effectiveSrsTime =
        settings.srs?.scheduleMode === 'AUTO'
          ? (settings.srs?.detectedTime || '19:00')
          : (settings.srs?.manualTime || '19:00');

      const effectiveWritingTime =
        settings.writing?.scheduleMode === 'AUTO'
          ? (settings.writing?.detectedTime || '21:00')
          : (settings.writing?.manualTime || '21:00');

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

  // Run periodic ticker every 30 seconds
  useEffect(() => {
    if (!isReady) return;

    // Run first tick after 3 seconds
    const initialTimer = setTimeout(() => {
      evaluateScheduleTick();
    }, 3000);

    // Then interval every 30 seconds
    const interval = setInterval(() => {
      evaluateScheduleTick();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isReady, evaluateScheduleTick]);

  return {
    evaluateNow: evaluateScheduleTick,
  };
}
