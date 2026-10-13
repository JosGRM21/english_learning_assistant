export type QuestType =
  | 'VOCAB_SRS'
  | 'WRITING_SUBMISSION';

export interface DailyQuest {
  id: string;
  userId: string;
  questDate: string; // YYYY-MM-DD
  questType: QuestType;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  completedAt?: string;
  xpReward: number;
}

export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // YYYY-MM-DD
  availableFreezes: number;
  updatedAt: string;
}

export interface StreakUpdateResult {
  streak: UserStreak;
  streakIncremented: boolean;
  freezeConsumed: boolean;
  streakReset: boolean;
  message: string;
}
