import { useHabits } from '@/features/habits/hooks/useHabits';
import { useSrsStore } from '@/features/srs/store/srsStore';
import { WeaknessMetric } from '@/core/types/diagnostics';

export function useDashboardStats(weaknesses: WeaknessMetric[]) {
  const { streak, quests, completedQuestsCount, totalXpEarned, totalXpPossible } = useHabits();
  const reviewCount = useSrsStore((s) => s.reviewCount);
  const vocabCount = useSrsStore((s) => s.vocabList.length);

  const criticalWeaknesses = weaknesses.filter((w) => w.isCritical);

  return {
    streak,
    quests,
    completedQuestsCount,
    totalXpEarned,
    totalXpPossible,
    reviewCount,
    vocabCount,
    criticalWeaknesses,
  };
}
