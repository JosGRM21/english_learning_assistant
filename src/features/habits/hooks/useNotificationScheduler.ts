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

  // 2. Periodic evaluation tick
  const evaluateScheduleTick = useCallback(async () => {
    if (!isReady || !notificationRepo || !cardRepo || isEvaluatingRef.current) return;
    if (!settings.enabled) return;

    isEvaluatingRef.current = true;
    try {
      const now = new Date();
      const todayStr = dayjs(now).format('YYYY-MM-DD');

      // Check if user completed study today
      const isCompletedToday = streak.lastActivityDate === todayStr;

      // Activity-specific completion checks
      const recentReviews = await cardRepo.getAllReviewLogs(50);
      const isSrsCompletedToday = recentReviews.some((r) => r.reviewedAt?.startsWith(todayStr));

      const recentWriting = await writingRepo?.getSubmissions('user_local', 20);
      const isWritingCompletedToday = (recentWriting ?? []).some((w) =>
        w.submittedAt?.startsWith(todayStr),
      );

      // Check due cards count
      const deckStats = await cardRepo.getDeckStatistics('user_local');
      const dueCardsCount = deckStats.dueCount;

      // Query logs today
      const todayLogs = await notificationRepo.getLogsToday('user_local', todayStr);
      const sentTodayTypes = todayLogs.map((l) => l.type);

      const lastLog = await notificationRepo.getLastLog('user_local');
      const lastNotificationAt = lastLog ? new Date(lastLog.sentAt) : null;
      const lastNotificationType = lastLog ? lastLog.type : null;

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
        sentTodayTypes,
      };

      const decision = ruleEngine.evaluate(context);

      if (decision.shouldNotify && decision.type && decision.title && decision.body) {
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
