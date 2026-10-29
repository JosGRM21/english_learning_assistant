import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserStreak } from '@/core/types/habits';
import { HabitsManager } from '@/core/habits/HabitsManager';

const defaultHabitsManager = new HabitsManager();

export interface HabitsState {
  streak: UserStreak;
  habitsManager: HabitsManager;

  setStreak: (streak: UserStreak) => void;
  updateStreak: (todayDateStr?: string) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habitsManager: defaultHabitsManager,

      streak: {
        id: 'streak_local',
        userId: 'user_local',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        availableFreezes: 1,
        updatedAt: new Date().toISOString(),
      },

      setStreak: (streak) => set({ streak }),

      updateStreak: (todayDateStr) => {
        const { streak, habitsManager } = get();
        const result = habitsManager.updateStreak(streak, todayDateStr);
        set({ streak: result.streak });
      },
    }),
    {
      name: 'ela_habits_store',
      partialize: (state) => ({ streak: state.streak }),
    }
  )
);
