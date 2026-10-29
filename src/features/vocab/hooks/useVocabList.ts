import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useSrsStore } from '@/features/srs/store/srsStore';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  FrequencyBand,
  GrammaticalDimension,
  PartOfSpeech,
  VerbTenses,
  VocabSense,
  PhrasalVerbItem,
} from '@/core/types/vocab';
import { CoreCorpusCoverage } from '@/core/repositories/IVocabRepository';
import {
  searchCoreCorpusLocally,
  searchCorePhrasalLocally,
} from '@/data/core-vocab-corpus';

export interface NewVocabPayload {
  word: string;
  translationEs: string;
  definitionEn: string;
  cefrLevel: CefrLevel;
  partOfSpeech: PartOfSpeech;
  grammaticalDimension: GrammaticalDimension;
  ipaGeneralAmerican?: string;
  ipaReceivedPronunciation?: string;
  ipaWeakForm?: string;
  phoneticEdEnding?: '/t/' | '/d/' | '/ɪd/' | null;
  grammarPattern?: string | null;
  countability?: 'COUNTABLE' | 'UNCOUNTABLE' | 'BOTH' | null;
  connotation?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  graduatedExamples?: {
    sentenceBasicEn: string;
    sentenceBasicEs: string;
    clozeTargetBasic?: string;
    sentenceAdvancedEn: string;
    sentenceAdvancedEs: string;
    clozeTargetAdvanced?: string;
  };
  subcategory?: string;
  domainCategory?: string;
  isFalseFriend: boolean;
  falseFriendNote?: string;
  verbTenses?: VerbTenses | null;
  alternateSenses?: VocabSense[] | null;
  senses?: VocabSense[] | null;
  phrasalVerbs?: PhrasalVerbItem[] | null;
  exampleSentenceEn?: string;
  exampleSentenceEs?: string;
  additionalExamples?: { sentenceEn: string; sentenceEs: string }[];
  createSrsCard?: boolean;
}

export interface VocabSuggestion {
  id: string;
  word: string;
  translationEs: string;
  cefrLevel: CefrLevel;
  partOfSpeech: PartOfSpeech;
  frequencyBand?: FrequencyBand | null;
  isActive: boolean;
  isCore: boolean;
}

export function useVocabList(initialPage = 1, pageSize = 12) {
  const { vocabRepo, cardRepo, isReady } = useDatabase();

  const [words, setWords] = useState<VocabItem[]>([]);
  const [examplesMap, setExamplesMap] = useState<Record<string, VocabContextExample[]>>({});
  const [coverageStats, setCoverageStats] = useState<CoreCorpusCoverage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Counts (Server-side directly from SQLite)
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);
  const [coreCount, setCoreCount] = useState(0);
  const [vaultCount, setVaultCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [cefrCounts, setCefrCounts] = useState<Record<string, number>>({
    ALL: 0,
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  });

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const [selectedCefr, setSelectedCefr] = useState<string>('ALL');
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  const [onlyFalseFriends, setOnlyFalseFriends] = useState(false);
  const [originFilter, setOriginFilter] = useState<'ALL' | 'CORE' | 'VAULT'>('ALL');
  const [frequencyBandFilter, setFrequencyBandFilter] = useState<string>('ALL');
  const [masteryStatusFilter, setMasteryStatusFilter] = useState<string>('ALL');
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<string>('ALL');
  const [accentPreference, setAccentPreferenceState] = useState<'US' | 'UK'>(() => {
    try {
      const saved = localStorage.getItem('ela_vocab_accent_preference');
      if (saved === 'US' || saved === 'UK') return saved;
    } catch {
      // ignore
    }
    return 'US';
  });

  const setAccentPreference = useCallback((accent: 'US' | 'UK') => {
    setAccentPreferenceState(accent);
    try {
      localStorage.setItem('ela_vocab_accent_preference', accent);
    } catch {
      // ignore
    }
  }, []);
  const [sortBy, setSortBy] = useState<'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC'>('RECENT');

  // Reset to first page when any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    selectedCefr,
    selectedDimension,
    originFilter,
    frequencyBandFilter,
    masteryStatusFilter,
    selectedPartOfSpeech,
    onlyFalseFriends,
    sortBy,
  ]);

  const loadVocabData = useCallback(async () => {
    if (!vocabRepo || !isReady) return;
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch exactly the current page of words from SQLite with native indexing & filtering
      const pageResult = await vocabRepo.getVocabsPage({
        page: currentPage,
        pageSize,
        search: debouncedSearchQuery,
        cefrLevel: selectedCefr,
        dimension: selectedDimension,
        origin: originFilter,
        frequencyBand: frequencyBandFilter,
        masteryStatus: masteryStatusFilter,
        partOfSpeech: selectedPartOfSpeech,
        onlyFalseFriends,
        sortBy,
      });

      setWords(pageResult.items);
      setTotalCount(pageResult.totalCount);
      setCoreCount(pageResult.coreCount);
      setVaultCount(pageResult.vaultCount);
      setFilteredCount(pageResult.filteredCount);
      setCefrCounts({
        ALL: pageResult.totalCount,
        ...pageResult.cefrCounts,
      });

      // 2. Pre-fetch context examples for only the current page items
      const pageIds = pageResult.items.map((w) => w.id);
      if (pageIds.length > 0) {
        const exMap = await vocabRepo.getContextExamplesForVocabs(pageIds);
        setExamplesMap(exMap);
      } else {
        setExamplesMap({});
      }

      // 3. Fetch aggregated Core Corpus Coverage in single grouped query
      const coverage = await vocabRepo.getCoreCorpusCoverage();
      setCoverageStats(coverage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vocabulario');
    } finally {
      setIsLoading(false);
    }
  }, [
    vocabRepo,
    isReady,
    currentPage,
    pageSize,
    debouncedSearchQuery,
    selectedCefr,
    selectedDimension,
    originFilter,
    frequencyBandFilter,
    masteryStatusFilter,
    selectedPartOfSpeech,
    onlyFalseFriends,
    sortBy,
  ]);

  useEffect(() => {
    loadVocabData();
  }, [loadVocabData]);

  // Activate a Phrasal Verb directly into SRS
  const activatePhrase = useCallback(
    async (phraseId: string): Promise<boolean> => {
      if (!cardRepo) return false;
      try {
        await cardRepo.activatePhraseCard(phraseId);

        if (vocabRepo) {
          await vocabRepo.updateMasteryStatus(phraseId, 'LEARNING');
          const updatedItem = await vocabRepo.getVocabById(phraseId);
          if (updatedItem) {
            setWords((prev) =>
              prev.map((w) => (w.id === phraseId ? updatedItem : w)),
            );
            const contexts = await vocabRepo.getContextExamples(phraseId);
            if (contexts && contexts.length > 0) {
              setExamplesMap((prev) => ({
                ...prev,
                [phraseId]: contexts,
              }));
              useSrsStore.getState().addVocabItem(updatedItem, contexts[0], `card_phr_${phraseId}`);
            }
          }
        } else {
          setWords((prev) =>
            prev.map((w) => (w.id === phraseId ? { ...w, masteryStatus: 'LEARNING' } : w)),
          );
        }

        const coverage = await vocabRepo?.getCoreCorpusCoverage();
        if (coverage) setCoverageStats(coverage);

        return true;
      } catch (err) {
        console.error('Error activating phrase:', err);
        return false;
      }
    },
    [cardRepo, vocabRepo],
  );

  // Activate a word from the Core Corpus or activate an inactive item
  const activateWord = useCallback(
    async (id: string): Promise<VocabItem | null> => {
      if (id.startsWith('phr_')) {
        const ok = await activatePhrase(id);
        if (ok && vocabRepo) {
          return await vocabRepo.getVocabById(id);
        }
        return null;
      }

      if (!vocabRepo) return null;
      try {
        const activated = await vocabRepo.activateVocabItem(id);

        setWords((prev) =>
          prev.map((w) => (w.id === id || w.word.toLowerCase() === activated.word.toLowerCase() ? activated : w)),
        );

        const contexts = await vocabRepo.getContextExamples(activated.id);
        if (contexts.length > 0) {
          setExamplesMap((prev) => ({ ...prev, [activated.id]: contexts }));
        }

        useSrsStore.getState().addVocabItem(activated, contexts[0] ?? null, `card_${activated.id}`);

        const coverage = await vocabRepo.getCoreCorpusCoverage();
        setCoverageStats(coverage);

        return activated;
      } catch (err) {
        console.error('Error activating word:', err);
        return null;
      }
    },
    [vocabRepo, activatePhrase],
  );

  // Batch activate words by criteria (e.g. "Top 500 A1-A2" or "Top 3000")
  const batchActivate = useCallback(
    async (criteria: { cefrLevel?: CefrLevel; frequencyBand?: FrequencyBand; limit?: number }): Promise<number> => {
      if (!vocabRepo) return 0;
      try {
        const activatedItems = await vocabRepo.batchActivateByCriteria(criteria);

        if (activatedItems.length > 0) {
          useSrsStore.getState().addBatchVocabItems(activatedItems);

          const activatedIds = activatedItems.map((item) => item.id);
          const batchContexts = await vocabRepo.getContextExamplesForVocabs(activatedIds);
          setExamplesMap((prev) => ({ ...prev, ...batchContexts }));
        }

        await loadVocabData();
        return activatedItems.length;
      } catch (err) {
        console.error('Error batch activating words:', err);
        return 0;
      }
    },
    [vocabRepo, loadVocabData],
  );

  // Instant suggestions for search autocomplete dropdown
  const getSuggestions = useCallback(
    (query: string, limit = 8): VocabSuggestion[] => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];

      const rawMatches = searchCoreCorpusLocally(q, limit);
      const phrasalMatches = searchCorePhrasalLocally(q, 4);

      const vocabSuggestions: VocabSuggestion[] = rawMatches.map((item) => {
        const existing = words.find((w) => w.id === item.id || w.word.toLowerCase() === item.word.toLowerCase());
        const isActive = existing ? existing.masteryStatus !== 'INACTIVE' : false;
        return {
          id: item.id,
          word: item.word,
          translationEs: item.translationEs,
          cefrLevel: item.cefrLevel,
          partOfSpeech: item.partOfSpeech,
          frequencyBand: item.frequencyBand,
          isActive,
          isCore: true,
        };
      });

      const phrasalSuggestions: VocabSuggestion[] = phrasalMatches.map((item) => {
        const existing = words.find((w) => w.id === item.id || w.word.toLowerCase() === item.text.toLowerCase());
        const isActive = existing ? existing.masteryStatus !== 'INACTIVE' : false;
        return {
          id: item.id,
          word: item.text,
          translationEs: item.meaningEs,
          cefrLevel: item.cefrLevel,
          partOfSpeech: 'VERB',
          frequencyBand: 'TOP_3000',
          isActive,
          isCore: true,
        };
      });

      // Match against currently loaded words if in-memory fixtures are empty
      if (vocabSuggestions.length === 0 && phrasalSuggestions.length === 0) {
        for (const w of words) {
          if (vocabSuggestions.length >= limit) break;
          if (w.word.toLowerCase().startsWith(q) || w.translationEs.toLowerCase().includes(q)) {
            vocabSuggestions.push({
              id: w.id,
              word: w.word,
              translationEs: w.translationEs,
              cefrLevel: w.cefrLevel,
              partOfSpeech: w.partOfSpeech,
              frequencyBand: w.frequencyBand,
              isActive: w.masteryStatus !== 'INACTIVE',
              isCore: w.isCore,
            });
          }
        }
      }

      return [...vocabSuggestions, ...phrasalSuggestions].slice(0, limit);
    },
    [words],
  );

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
        ipaWeakForm: payload.ipaWeakForm,
        phoneticEdEnding: payload.phoneticEdEnding,
        subcategory: payload.subcategory,
        domainCategory: payload.domainCategory,
        isFalseFriend: payload.isFalseFriend,
        falseFriendNote: payload.falseFriendNote,
        verbTensesJson: payload.verbTenses ?? null,
        alternateSensesJson: payload.alternateSenses ?? null,
        sensesJson: payload.senses ?? null,
        phrasalVerbsJson: payload.phrasalVerbs ?? null,
        isCore: false,
        masteryStatus: 'NEW',
      });

      const createdExamples: VocabContextExample[] = [];
      if (payload.graduatedExamples) {
        if (payload.graduatedExamples.sentenceBasicEn) {
          const basicEx = await vocabRepo.addContextExample({
            vocabId: created.id,
            sentenceEn: payload.graduatedExamples.sentenceBasicEn.trim(),
            sentenceEs: payload.graduatedExamples.sentenceBasicEs?.trim() || '',
            clozeTarget: payload.graduatedExamples.clozeTargetBasic || created.word,
            cefrLevel: 'A2',
          });
          createdExamples.push(basicEx);
        }
        if (payload.graduatedExamples.sentenceAdvancedEn) {
          const advEx = await vocabRepo.addContextExample({
            vocabId: created.id,
            sentenceEn: payload.graduatedExamples.sentenceAdvancedEn.trim(),
            sentenceEs: payload.graduatedExamples.sentenceAdvancedEs?.trim() || '',
            clozeTarget: payload.graduatedExamples.clozeTargetAdvanced || created.word,
            cefrLevel: 'B2',
          });
          createdExamples.push(advEx);
        }
      } else if (payload.exampleSentenceEn && payload.exampleSentenceEn.trim()) {
        const example = await vocabRepo.addContextExample({
          vocabId: created.id,
          sentenceEn: payload.exampleSentenceEn.trim(),
          sentenceEs: payload.exampleSentenceEs?.trim() || '',
          clozeTarget: created.word,
          cefrLevel: created.cefrLevel,
        });
        createdExamples.push(example);
      }

      const cardId = `card_${created.id}`;
      if (payload.createSrsCard !== false && cardRepo) {
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

      useSrsStore.getState().addVocabItem(created, createdExamples[0] ?? null, cardId);
      await loadVocabData();
      return created;
    },
    [vocabRepo, cardRepo, loadVocabData],
  );

  const checkDuplicateWord = useCallback(
    async (inputWord: string): Promise<VocabItem[]> => {
      const clean = inputWord.trim().toLowerCase();
      if (!clean || !vocabRepo) return [];
      return vocabRepo.findExistingByWord(clean);
    },
    [vocabRepo],
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
        useSrsStore.getState().removeVocabItem(id);
        await loadVocabData();
      }
      return success;
    },
    [vocabRepo, loadVocabData],
  );

  const deleteMultipleWords = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!vocabRepo || ids.length === 0) return false;
      const count = await vocabRepo.deleteVocabs(ids);
      if (count > 0) {
        for (const id of ids) {
          useSrsStore.getState().removeVocabItem(id);
        }
        await loadVocabData();
        return true;
      }
      return false;
    },
    [vocabRepo, loadVocabData],
  );

  const clearAllWords = useCallback(async (): Promise<boolean> => {
    if (!vocabRepo) return false;
    try {
      await vocabRepo.clearAllVocabs();
      setWords([]);
      setExamplesMap({});
      setTotalCount(0);
      setCoreCount(0);
      setVaultCount(0);
      setFilteredCount(0);

      useSrsStore.getState().setVocabList([]);
      useSrsStore.getState().setSelectedVocab(null);
      useSrsStore.getState().setAvailableContexts([]);
      useSrsStore.getState().setSrsCard(null);
      return true;
    } catch (err) {
      console.error('Error clearing all vocabs:', err);
      return false;
    }
  }, [vocabRepo]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCefr('ALL');
    setSelectedDimension('ALL');
    setOnlyFalseFriends(false);
    setOriginFilter('ALL');
    setFrequencyBandFilter('ALL');
    setMasteryStatusFilter('ALL');
    setSelectedPartOfSpeech('ALL');
    setSortBy('RECENT');
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  const hasActiveFilters = useMemo(
    () =>
      searchQuery.trim().length > 0 ||
      selectedCefr !== 'ALL' ||
      selectedDimension !== 'ALL' ||
      originFilter !== 'ALL' ||
      frequencyBandFilter !== 'ALL' ||
      masteryStatusFilter !== 'ALL' ||
      selectedPartOfSpeech !== 'ALL' ||
      onlyFalseFriends,
    [
      searchQuery,
      selectedCefr,
      selectedDimension,
      originFilter,
      frequencyBandFilter,
      masteryStatusFilter,
      selectedPartOfSpeech,
      onlyFalseFriends,
    ],
  );

  return {
    words,
    allWords: words,
    totalCount,
    coreCount,
    vaultCount,
    filteredCount,
    falseFriendsCount: onlyFalseFriends ? filteredCount : 0,
    hasActiveFilters,
    examplesMap,
    coverageStats,
    isLoading,
    error,
    searchQuery,
    selectedCefr,
    selectedDimension,
    onlyFalseFriends,
    originFilter,
    frequencyBandFilter,
    masteryStatusFilter,
    selectedPartOfSpeech,
    accentPreference,
    sortBy,
    cefrCounts,
    currentPage,
    totalPages,
    setCurrentPage,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    setOnlyFalseFriends,
    setOriginFilter,
    setFrequencyBandFilter,
    setMasteryStatusFilter,
    setSelectedPartOfSpeech,
    setAccentPreference,
    setSortBy,
    resetFilters,
    activateWord,
    activatePhrase,
    batchActivate,
    getSuggestions,
    addWord,
    addMultipleWords,
    checkDuplicateWord,
    updateWord,
    deleteWord,
    deleteMultipleWords,
    clearAllWords,
    refresh: loadVocabData,
  };
}
