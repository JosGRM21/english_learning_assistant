import dayjs from 'dayjs';
import {
  UserStreak,
  StreakUpdateResult,
} from '../types/habits';

export class HabitsManager {
  /**
   * Evaluates streak progression, handling same-day actions, daily increments,
   * streak freeze protections, and resets.
   */
  public updateStreak(
    currentStreakState: UserStreak,
    todayStr: string = dayjs().format('YYYY-MM-DD'),
  ): StreakUpdateResult {
    const lastDateStr = currentStreakState.lastActivityDate;

    // 1. Same-day activity: streak already logged today
    if (lastDateStr === todayStr) {
      return {
        streak: currentStreakState,
        streakIncremented: false,
        freezeConsumed: false,
        streakReset: false,
        message: '¡Actividad de hoy ya registrada! Mantienes tu racha.',
      };
    }

    // 2. First activity ever
    if (!lastDateStr) {
      const updated: UserStreak = {
        ...currentStreakState,
        currentStreak: 1,
        longestStreak: Math.max(1, currentStreakState.longestStreak),
        lastActivityDate: todayStr,
        updatedAt: new Date().toISOString(),
      };
      return {
        streak: updated,
        streakIncremented: true,
        freezeConsumed: false,
        streakReset: false,
        message: '¡Has iniciado tu racha! Día 1 completado.',
      };
    }

    const today = dayjs(todayStr);
    const last = dayjs(lastDateStr);
    const diffDays = today.diff(last, 'day');

    // 3. Consecutive day: +1 streak!
    if (diffDays === 1) {
      const nextStreak = currentStreakState.currentStreak + 1;
      const updated: UserStreak = {
        ...currentStreakState,
        currentStreak: nextStreak,
        longestStreak: Math.max(nextStreak, currentStreakState.longestStreak),
        lastActivityDate: todayStr,
        updatedAt: new Date().toISOString(),
      };
      return {
        streak: updated,
        streakIncremented: true,
        freezeConsumed: false,
        streakReset: false,
        message: `¡Racha aumentada a ${nextStreak} días!`,
      };
    }

    // 4. Inactivity (> 1 day): check if enough freezes are available for missed days
    if (diffDays > 1) {
      const missedDays = diffDays - 1;
      if (currentStreakState.availableFreezes >= missedDays) {
        // Freezes protect the streak!
        const nextStreak = currentStreakState.currentStreak + 1;
        const updated: UserStreak = {
          ...currentStreakState,
          availableFreezes: currentStreakState.availableFreezes - missedDays,
          currentStreak: nextStreak,
          longestStreak: Math.max(nextStreak, currentStreakState.longestStreak),
          lastActivityDate: todayStr,
          updatedAt: new Date().toISOString(),
        };
        return {
          streak: updated,
          streakIncremented: true,
          freezeConsumed: true,
          streakReset: false,
          message:
            missedDays === 1
              ? '¡Un Streak Freeze salvó tu racha de reiniciarse!'
              : `¡${missedDays} Streak Freezes salvaron tu racha de reiniciarse!`,
        };
      } else {
        // Not enough freezes available: reset streak to 1
        const updated: UserStreak = {
          ...currentStreakState,
          currentStreak: 1,
          lastActivityDate: todayStr,
          updatedAt: new Date().toISOString(),
        };
        return {
          streak: updated,
          streakIncremented: false,
          freezeConsumed: false,
          streakReset: true,
          message: 'Racha reiniciada debido a inactividad.',
        };
      }
    }

    return {
      streak: currentStreakState,
      streakIncremented: false,
      freezeConsumed: false,
      streakReset: false,
      message: 'Sin cambios en la racha.',
    };
  }

  /**
   * Refills streak freezes if conditions are met (e.g. 7 consecutive days).
   */
  public grantStreakFreeze(currentStreakState: UserStreak, maxFreezes = 2): UserStreak {
    if (currentStreakState.availableFreezes >= maxFreezes) {
      return currentStreakState;
    }

    return {
      ...currentStreakState,
      availableFreezes: currentStreakState.availableFreezes + 1,
      updatedAt: new Date().toISOString(),
    };
  }
}
