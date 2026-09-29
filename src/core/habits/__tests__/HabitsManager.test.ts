import { describe, it, expect } from 'vitest';
import { HabitsManager } from '../HabitsManager';
import { UserStreak } from '../../types/habits';

describe('HabitsManager', () => {
  const habits = new HabitsManager();

  describe('generateDailyQuests', () => {
    it('creates 4 balanced quests for given date with targets and XP rewards', () => {
      const quests = habits.generateDailyQuests('user_test', '2026-09-29');

      expect(quests).toHaveLength(4);
      expect(quests.map((q) => q.questType)).toEqual([
        'VOCAB_SRS',
        'PHONETICS_LISTEN',
        'SPEED_DRILL',
        'WRITING_SUBMISSION',
      ]);
      expect(quests.every((q) => q.targetCount > 0)).toBe(true);
      expect(quests.every((q) => q.xpReward > 0)).toBe(true);
      expect(quests.every((q) => !q.isCompleted)).toBe(true);
    });
  });

  describe('updateQuestProgress', () => {
    it('increments matching quest and signals newly completed', () => {
      const quests = habits.generateDailyQuests('user_test', '2026-09-29');

      // Update VOCAB_SRS by 5 (target is 5)
      const { quests: updated, newlyCompleted } = habits.updateQuestProgress(
        quests,
        'VOCAB_SRS',
        5,
      );

      const srsQuest = updated.find((q) => q.questType === 'VOCAB_SRS');
      expect(srsQuest?.currentCount).toBe(5);
      expect(srsQuest?.isCompleted).toBe(true);
      expect(srsQuest?.completedAt).toBeDefined();

      expect(newlyCompleted).toHaveLength(1);
      expect(newlyCompleted[0].questType).toBe('VOCAB_SRS');
    });
  });

  describe('updateStreak', () => {
    it('starts streak at 1 on first day of activity', () => {
      const initial: UserStreak = {
        id: 'streak_1',
        userId: 'user_1',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        availableFreezes: 1,
        updatedAt: '2026-09-28T10:00:00Z',
      };

      const result = habits.updateStreak(initial, '2026-09-29');

      expect(result.streakIncremented).toBe(true);
      expect(result.streak.currentStreak).toBe(1);
      expect(result.streak.longestStreak).toBe(1);
      expect(result.streak.lastActivityDate).toBe('2026-09-29');
    });

    it('increments streak on consecutive day', () => {
      const yesterdayStreak: UserStreak = {
        id: 'streak_1',
        userId: 'user_1',
        currentStreak: 4,
        longestStreak: 10,
        lastActivityDate: '2026-09-28',
        availableFreezes: 1,
        updatedAt: '2026-09-28T10:00:00Z',
      };

      const result = habits.updateStreak(yesterdayStreak, '2026-09-29');

      expect(result.streakIncremented).toBe(true);
      expect(result.streak.currentStreak).toBe(5);
      expect(result.freezeConsumed).toBe(false);
      expect(result.streakReset).toBe(false);
    });

    it('preserves streak using Streak Freeze when a day is skipped', () => {
      const missedStreak: UserStreak = {
        id: 'streak_1',
        userId: 'user_1',
        currentStreak: 7,
        longestStreak: 12,
        lastActivityDate: '2026-09-25', // 4 days ago
        availableFreezes: 2,
        updatedAt: '2026-09-25T10:00:00Z',
      };

      const result = habits.updateStreak(missedStreak, '2026-09-29');

      expect(result.freezeConsumed).toBe(true);
      expect(result.streakReset).toBe(false);
      expect(result.streak.availableFreezes).toBe(1); // 1 freeze consumed
      expect(result.streak.currentStreak).toBe(8); // streak continued!
    });

    it('resets streak to 1 when a day is skipped and no freeze is available', () => {
      const noFreezeStreak: UserStreak = {
        id: 'streak_1',
        userId: 'user_1',
        currentStreak: 15,
        longestStreak: 15,
        lastActivityDate: '2026-09-26', // 3 days ago
        availableFreezes: 0, // no freeze
        updatedAt: '2026-09-26T10:00:00Z',
      };

      const result = habits.updateStreak(noFreezeStreak, '2026-09-29');

      expect(result.streakReset).toBe(true);
      expect(result.streak.currentStreak).toBe(1);
      expect(result.streak.longestStreak).toBe(15); // preserves all-time high
    });

    it('does not increment if already active today', () => {
      const todayStreak: UserStreak = {
        id: 'streak_1',
        userId: 'user_1',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: '2026-09-29',
        availableFreezes: 1,
        updatedAt: '2026-09-29T10:00:00Z',
      };

      const result = habits.updateStreak(todayStreak, '2026-09-29');

      expect(result.streakIncremented).toBe(false);
      expect(result.streak.currentStreak).toBe(5);
    });
  });
});
