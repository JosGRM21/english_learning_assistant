import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';

export function useHabits() {
  const { streak, quests, updateQuestProgress, updateStreak, setStreak, setQuests } = useHabitsStore();

  const completedQuestsCount = useMemo(() => {
    return quests.filter((q) => q.isCompleted).length;
  }, [quests]);

  const totalXpEarned = useMemo(() => {
    return quests.filter((q) => q.isCompleted).reduce((acc, q) => acc + q.xpReward, 0);
  }, [quests]);

  const totalXpPossible = useMemo(() => {
    return quests.reduce((acc, q) => acc + q.xpReward, 0);
  }, [quests]);

  return {
    streak,
    quests,
    completedQuestsCount,
    totalXpEarned,
    totalXpPossible,
    updateQuestProgress,
    updateStreak,
    setStreak,
    setQuests,
  };
}
