import dayjs from 'dayjs';
import {
  DailyQuest,
  UserStreak,
  QuestType,
  StreakUpdateResult,
} from '../types/habits';

export class HabitsManager {
  /**
   * Generates a balanced set of daily quests for the given user and date.
   */
  public generateDailyQuests(userId: string, dateStr: string = dayjs().format('YYYY-MM-DD')): DailyQuest[] {
    return [
      {
        id: `quest_${userId}_${dateStr}_srs`,
        userId,
        questDate: dateStr,
        questType: 'VOCAB_SRS',
        title: 'Repaso Activo FSRS',
        description: 'Completa al menos 5 repasos espaciados en la sesión de hoy.',
        targetCount: 5,
        currentCount: 0,
        isCompleted: false,
        xpReward: 50,
      },
      {
        id: `quest_${userId}_${dateStr}_phon`,
        userId,
        questDate: dateStr,
        questType: 'PHONETICS_LISTEN',
        title: 'Gimnasio Auditivo',
        description: 'Discrimina 5 pares mínimos con la ventana rápida de 2.0s.',
        targetCount: 5,
        currentCount: 0,
        isCompleted: false,
        xpReward: 40,
      },
      {
        id: `quest_${userId}_${dateStr}_drill`,
        userId,
        questDate: dateStr,
        questType: 'SPEED_DRILL',
        title: 'Proceduralización Rápida',
        description: 'Supera 1 ráfaga cronometrada de colocaciones o preposiciones.',
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
        xpReward: 60,
      },
      {
        id: `quest_${userId}_${dateStr}_write`,
        userId,
        questDate: dateStr,
        questType: 'WRITING_SUBMISSION',
        title: 'Taller Socrático',
        description: 'Escribe y auto-corrige 1 borrador guiado por pistas de IA.',
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
        xpReward: 75,
      },
    ];
  }

  /**
   * Increments progress on matching daily quest and marks completion.
   */
  public updateQuestProgress(
    quests: DailyQuest[],
    questType: QuestType,
    increment = 1,
    now: Date = new Date(),
  ): { quests: DailyQuest[]; newlyCompleted: DailyQuest[] } {
    const newlyCompleted: DailyQuest[] = [];

    const updated = quests.map((q) => {
      if (q.questType !== questType) return q;

      const newCount = q.currentCount + increment;
      const justCompleted = !q.isCompleted && newCount >= q.targetCount;

      const modified: DailyQuest = {
        ...q,
        currentCount: newCount,
        isCompleted: q.isCompleted || newCount >= q.targetCount,
        completedAt: justCompleted ? now.toISOString() : q.completedAt,
      };

      if (justCompleted) {
        newlyCompleted.push(modified);
      }

      return modified;
    });

    return { quests: updated, newlyCompleted };
  }

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
        message: `¡Racha aumentada a ${nextStreak} días consecutivos!`,
      };
    }

    // 4. Inactivity (> 1 day): check if freeze is available
    if (diffDays > 1) {
      if (currentStreakState.availableFreezes > 0) {
        // Freeze protects the streak!
        const updated: UserStreak = {
          ...currentStreakState,
          availableFreezes: currentStreakState.availableFreezes - 1,
          currentStreak: currentStreakState.currentStreak + 1,
          longestStreak: Math.max(currentStreakState.currentStreak + 1, currentStreakState.longestStreak),
          lastActivityDate: todayStr,
          updatedAt: new Date().toISOString(),
        };
        return {
          streak: updated,
          streakIncremented: true,
          freezeConsumed: true,
          streakReset: false,
          message: '¡Un Streak Freeze salvó tu racha de reiniciarse!',
        };
      } else {
        // No freezes available: reset streak to 1
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
}
