import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useSrsStore } from '@/features/srs/store/srsStore';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  GrammaticalDimension,
  PartOfSpeech,
  VerbTenses,
  StructuredWordFamily,
  VocabSense,
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
  domainCategory?: string;
  isFalseFriend: boolean;
  falseFriendNote?: string;
  morphologicalFamily?: string[];
  verbTenses?: VerbTenses | null;
  structuredFamily?: StructuredWordFamily | null;
  alternateSenses?: VocabSense[] | null;
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
  const [onlyFalseFriends, setOnlyFalseFriends] = useState(false);
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
        domainCategory: payload.domainCategory,
        isFalseFriend: payload.isFalseFriend,
        falseFriendNote: payload.falseFriendNote,
        morphologicalFamilyJson: payload.morphologicalFamily ?? [],
        verbTensesJson: payload.verbTenses ?? null,
        structuredFamilyJson: payload.structuredFamily ?? null,
        alternateSensesJson: payload.alternateSenses ?? null,
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
      const cardId = `card_${created.id}`;
      if (payload.createSrsCard !== false && cardRepo) {
        // Schedule new card with consolidation cooldown (4 hours) so working-memory priming does not distort long-term FSRS stability
        const cooldownScheduledFor = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        await cardRepo.createCard({
          id: cardId,
          userId: 'user_local',
          targetType: 'VOCAB',
          targetId: created.id,
          state: 'NEW',
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          lastReviewedAt: null,
          scheduledFor: cooldownScheduledFor,
        });
      }

      // Synchronize in-memory SRS store with matching cardId
      useSrsStore.getState().addVocabItem(created, createdExample, cardId);

      // Update in-memory words list immediately
      setWords((prev) => [created, ...prev]);
      return created;
    },
    [vocabRepo, cardRepo],
  );

  const checkDuplicateWord = useCallback(
    (inputWord: string): VocabItem[] => {
      const clean = inputWord.trim().toLowerCase();
      if (!clean) return [];
      return words.filter((w) => w.word.toLowerCase().trim() === clean);
    },
    [words],
  );

  const addMultipleWords = useCallback(
    async (payloads: NewVocabPayload[]): Promise<VocabItem[]> => {
      const results: VocabItem[] = [];
      for (const p of payloads) {
        const item = await addWord(p);
        if (item) results.push(item);
      }
      return results;
    },
    [addWord],
  );

  const updateWord = useCallback(
    async (id: string, updates: Partial<Omit<VocabItem, 'id' | 'createdAt'>>): Promise<VocabItem | null> => {
      if (!vocabRepo) return null;
      const updated = await vocabRepo.updateVocab(id, updates);
      setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
      useSrsStore.getState().updateVocabItem(updated);
      return updated;
    },
    [vocabRepo],
  );

  const deleteWord = useCallback(
    async (id: string): Promise<boolean> => {
      if (!vocabRepo) return false;
      const success = await vocabRepo.deleteVocab(id);
      if (success) {
        setWords((prev) => prev.filter((w) => w.id !== id));
        setExamplesMap((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        useSrsStore.getState().removeVocabItem(id);
      }
      return success;
    },
    [vocabRepo],
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCefr('ALL');
    setSelectedDimension('ALL');
    setOnlyFalseFriends(false);
    setSortBy('RECENT');
  }, []);

  const sortedFilteredWords = useMemo(() => {
    const list = words.filter((w) => {
      // False Friends Filter
      if (onlyFalseFriends && !w.isFalseFriend) {
        return false;
      }

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
  }, [words, onlyFalseFriends, selectedCefr, selectedDimension, searchQuery, sortBy]);

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

  const falseFriendsCount = useMemo(
    () => words.filter((w) => w.isFalseFriend).length,
    [words],
  );

  const hasActiveFilters = useMemo(
    () =>
      searchQuery.trim().length > 0 ||
      selectedCefr !== 'ALL' ||
      selectedDimension !== 'ALL' ||
      onlyFalseFriends,
    [searchQuery, selectedCefr, selectedDimension, onlyFalseFriends],
  );

  return {
    words: sortedFilteredWords,
    allWords: words,
    totalCount: words.length,
    filteredCount: sortedFilteredWords.length,
    falseFriendsCount,
    hasActiveFilters,
    examplesMap,
    isLoading,
    error,
    searchQuery,
    selectedCefr,
    selectedDimension,
    onlyFalseFriends,
    sortBy,
    cefrCounts,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    setOnlyFalseFriends,
    setSortBy,
    resetFilters,
    addWord,
    addMultipleWords,
    checkDuplicateWord,
    updateWord,
    deleteWord,
    refresh: loadVocabData,
  };
}
