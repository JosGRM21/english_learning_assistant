import { useState, useEffect } from 'react';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { useSrsStore } from '@/features/srs/store/srsStore';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { WeaknessMetric } from '@/core/types/diagnostics';

export function useDashboardStats(weaknesses: WeaknessMetric[]) {
  const { streak, quests, completedQuestsCount, totalXpEarned, totalXpPossible } = useHabits();
  const { cardRepo, vocabRepo, isReady } = useDatabase();
  const [dbReviewCount, setDbReviewCount] = useState<number | null>(null);
  const [dbVocabCount, setDbVocabCount] = useState<number | null>(null);

  const storeReviewCount = useSrsStore((s) => s.reviewCount);
  const storeVocabCount = useSrsStore((s) => s.vocabList.length);

  useEffect(() => {
    if (!isReady) return;
    let isMounted = true;
    async function loadStats() {
      try {
        if (cardRepo) {
          const stats = await cardRepo.getDeckStatistics('user_local');
          if (isMounted) setDbReviewCount(stats.totalCount);
        }
        if (vocabRepo) {
          const vocabs = await vocabRepo.getAllVocabs(1000);
          if (isMounted) setDbVocabCount(vocabs.length);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats from DB:', err);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [cardRepo, vocabRepo, isReady]);

  const reviewCount = dbReviewCount ?? storeReviewCount;
  const vocabCount = dbVocabCount ?? storeVocabCount;
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
