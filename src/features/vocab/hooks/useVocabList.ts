import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useSrsStore } from '@/features/srs/store/srsStore';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  GrammaticalDimension,
  PartOfSpeech,
} from '@/core/types/vocab';

export interface NewVocabPayload {
  word: string;
  translationEs: string;
  definitionEn: string;
  cefrLevel: CefrLevel;
  partOfSpeech: PartOfSpeech;
  grammaticalDimension: GrammaticalDimension;
  ipaGeneralAmerican?: string;
  ipaReceivedPronunciation?: string;
  subcategory?: string;
  isFalseFriend: boolean;
  falseFriendNote?: string;
  exampleSentenceEn?: string;
  exampleSentenceEs?: string;
  createSrsCard?: boolean;
}

export function useVocabList() {
  const { vocabRepo, cardRepo, isReady } = useDatabase();

  const [words, setWords] = useState<VocabItem[]>([]);
  const [examplesMap, setExamplesMap] = useState<Record<string, VocabContextExample[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState<string>('ALL');
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC'>('RECENT');

  const loadVocabData = useCallback(async () => {
    if (!vocabRepo || !isReady) return;
    try {
      setIsLoading(true);
      setError(null);
      const allWords = await vocabRepo.getAllVocabs(500);
      setWords(allWords);

      // Pre-fetch contexts for words
      const exMap: Record<string, VocabContextExample[]> = {};
      for (const w of allWords.slice(0, 50)) {
        const contexts = await vocabRepo.getContextExamples(w.id);
        if (contexts.length > 0) {
          exMap[w.id] = contexts;
        }
      }
      setExamplesMap(exMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vocabulario');
    } finally {
      setIsLoading(false);
    }
  }, [vocabRepo, isReady]);

  useEffect(() => {
    loadVocabData();
  }, [loadVocabData]);

  const addWord = useCallback(
    async (payload: NewVocabPayload): Promise<VocabItem | null> => {
      if (!vocabRepo) {
        throw new Error('Repositorio de vocabulario no inicializado');
      }

      const created = await vocabRepo.createVocab({
        word: payload.word,
        translationEs: payload.translationEs,
        definitionEn: payload.definitionEn,
        cefrLevel: payload.cefrLevel,
        partOfSpeech: payload.partOfSpeech,
        grammaticalDimension: payload.grammaticalDimension,
        ipaGeneralAmerican: payload.ipaGeneralAmerican ?? '',
        ipaReceivedPronunciation: payload.ipaReceivedPronunciation,
        subcategory: payload.subcategory,
        isFalseFriend: payload.isFalseFriend,
        falseFriendNote: payload.falseFriendNote,
        morphologicalFamilyJson: [],
      });

      let createdExample: VocabContextExample | null = null;
      // Add context example if supplied
      if (payload.exampleSentenceEn && payload.exampleSentenceEn.trim()) {
        const example = await vocabRepo.addContextExample({
          vocabId: created.id,
          sentenceEn: payload.exampleSentenceEn.trim(),
          sentenceEs: payload.exampleSentenceEs?.trim() || '',
          clozeTarget: created.word,
          cefrLevel: created.cefrLevel,
        });
        createdExample = example;

        setExamplesMap((prev) => ({
          ...prev,
          [created.id]: [example],
        }));
      }

      // Add SRS flashcard by default unless explicitly disabled
      if (payload.createSrsCard !== false && cardRepo) {
        await cardRepo.createCard({
          id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId: 'user_local',
          targetType: 'VOCAB',
          targetId: created.id,
          state: 'NEW',
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          lastReviewedAt: null,
          scheduledFor: new Date().toISOString(),
        });
      }

      // Synchronize in-memory SRS store so that SRS & Fonología reflects the new word immediately without reload
      useSrsStore.getState().addVocabItem(created, createdExample);

      // Update in-memory words list immediately
      setWords((prev) => [created, ...prev]);
      return created;
    },
    [vocabRepo, cardRepo],
  );

  const sortedFilteredWords = useMemo(() => {
    const list = words.filter((w) => {
      // CEFR Filter
      if (selectedCefr !== 'ALL' && w.cefrLevel !== selectedCefr) {
        return false;
      }

      // Dimension Filter
      if (selectedDimension !== 'ALL' && w.grammaticalDimension !== selectedDimension) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWord = w.word.toLowerCase().includes(q);
        const matchTranslation = w.translationEs.toLowerCase().includes(q);
        const matchDef = w.definitionEn.toLowerCase().includes(q);
        const matchIpa = w.ipaGeneralAmerican?.toLowerCase().includes(q);
        if (!matchWord && !matchTranslation && !matchDef && !matchIpa) {
          return false;
        }
      }

      return true;
    });

    const cefrRank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'ALPHA_ASC':
          return a.word.localeCompare(b.word);
        case 'ALPHA_DESC':
          return b.word.localeCompare(a.word);
        case 'CEFR_ASC':
          return (cefrRank[a.cefrLevel] ?? 99) - (cefrRank[b.cefrLevel] ?? 99);
        case 'RECENT':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [words, selectedCefr, selectedDimension, searchQuery, sortBy]);

  const cefrCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: words.length,
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };
    for (const w of words) {
      if (counts[w.cefrLevel] !== undefined) {
        counts[w.cefrLevel]++;
      }
    }
    return counts;
  }, [words]);

  return {
    words: sortedFilteredWords,
    totalCount: words.length,
    filteredCount: sortedFilteredWords.length,
    examplesMap,
    isLoading,
    error,
    searchQuery,
    selectedCefr,
    selectedDimension,
    sortBy,
    cefrCounts,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    setSortBy,
    addWord,
    refresh: loadVocabData,
  };
}
