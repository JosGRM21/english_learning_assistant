import { create } from 'zustand';
import { UserStreak, DailyQuest, QuestType } from '@/core/types/habits';
import { HabitsManager } from '@/core/habits/HabitsManager';

const defaultHabitsManager = new HabitsManager();

export interface HabitsState {
  streak: UserStreak;
  quests: DailyQuest[];
  habitsManager: HabitsManager;

  setStreak: (streak: UserStreak) => void;
  setQuests: (quests: DailyQuest[]) => void;
  updateQuestProgress: (actionType: QuestType, count?: number) => void;
  updateStreak: (todayDateStr?: string) => void;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habitsManager: defaultHabitsManager,

  streak: {
    id: 'streak_local',
    userId: 'user_local',
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    availableFreezes: 0,
    updatedAt: new Date().toISOString(),
  },

  quests: defaultHabitsManager.generateDailyQuests('user_local'),

  setStreak: (streak) => set({ streak }),

  setQuests: (quests) => set({ quests }),

  updateQuestProgress: (actionType, count = 1) => {
    const { quests, habitsManager } = get();
    const { quests: updatedQuests } = habitsManager.updateQuestProgress(quests, actionType, count);
    set({ quests: updatedQuests });
  },

  updateStreak: (todayDateStr) => {
    const { streak, habitsManager } = get();
    const result = habitsManager.updateStreak(streak, todayDateStr);
    set({ streak: result.streak });
  },
}));
