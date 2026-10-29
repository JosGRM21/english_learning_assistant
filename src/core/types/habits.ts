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
