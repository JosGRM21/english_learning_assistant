import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useSrsStore } from '@/features/srs/store/srsStore';
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
  CORE_VOCAB_DATA,
  CORE_PHRASAL_DATA,
  clearCoreCorpusMemory,
  searchCoreCorpusLocally,
  searchCorePhrasalLocally,
  toDomainCoreVocab,
  toDomainCorePhrase,
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
  collocations?: string[];
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
  frequencyBand: FrequencyBand;
  isActive: boolean;
  isCore: boolean;
}

export function useVocabList() {
  const { vocabRepo, cardRepo, isReady } = useDatabase();

  const [words, setWords] = useState<VocabItem[]>([]);
  const [examplesMap, setExamplesMap] = useState<Record<string, VocabContextExample[]>>({});
  const [coverageStats, setCoverageStats] = useState<CoreCorpusCoverage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState<string>('ALL');
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  const [onlyFalseFriends, setOnlyFalseFriends] = useState(false);
  const [originFilter, setOriginFilter] = useState<'ALL' | 'CORE' | 'VAULT'>('ALL');
  const [frequencyBandFilter, setFrequencyBandFilter] = useState<string>('ALL');
  const [masteryStatusFilter, setMasteryStatusFilter] = useState<string>('ALL');
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<string>('ALL');
  const [accentPreference, setAccentPreference] = useState<'US' | 'UK'>('US');
  const [sortBy, setSortBy] = useState<'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC'>('RECENT');

  const loadVocabData = useCallback(async () => {
    if (!vocabRepo || !isReady) return;
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch all SQLite saved words (seeded core words + active core words + personal vault additions)
      const dbWords = await vocabRepo.getAllVocabs();
      const dbWordsMap = new Map<string, VocabItem>();
      for (const w of dbWords) {
        dbWordsMap.set(w.id, w);
        dbWordsMap.set(w.word.toLowerCase(), w);
      }

      // 2. If SQLite has seeded words, use the SQLite list directly plus any missing corpus lemmas
      let combinedWords: VocabItem[] = [];
      if (dbWords.length > 0) {
        // Collect DB words
        combinedWords = [...dbWords];
        // Append any core words from JSON that might not be in DB yet
        for (const raw of CORE_VOCAB_DATA) {
          if (!dbWordsMap.has(raw.id) && !dbWordsMap.has(raw.word.toLowerCase())) {
            combinedWords.push(toDomainCoreVocab(raw, 'INACTIVE'));
          }
        }
      } else {
        // 3. Fallback if DB was not yet seeded: synthesize complete lexical inventory
        const fullCoreList: VocabItem[] = CORE_VOCAB_DATA.map((raw) => {
          const existingInDb = dbWordsMap.get(raw.id) || dbWordsMap.get(raw.word.toLowerCase());
          if (existingInDb && existingInDb.isCore) {
            return existingInDb;
          }
          return toDomainCoreVocab(raw, 'INACTIVE');
        });
        const vaultWords = dbWords.filter((w) => !w.isCore);
        combinedWords = [...vaultWords, ...fullCoreList];
      }

      // 3. Append core phrasal units so they are first-class items in the catalog
      let activePhraseIds = new Set<string>();
      if (cardRepo) {
        try {
          const activeCards = await cardRepo.getCardsWithDetails('user_local');
          activePhraseIds = new Set(
            activeCards
              .filter((c) => c.card.targetType === 'PHRASE')
              .map((c) => c.card.targetId)
          );
        } catch {
          activePhraseIds = new Set();
        }
      }

      const phraseWords: VocabItem[] = CORE_PHRASAL_DATA.map((rawPhr) =>
        toDomainCorePhrase(rawPhr, activePhraseIds.has(rawPhr.id) ? 'LEARNING' : 'INACTIVE')
      );

      combinedWords = [...combinedWords, ...phraseWords];

      setWords(combinedWords);

      // 4. Pre-fetch context examples for active words in a single batch query
      const activeWordsSlice = combinedWords.filter((w) => w.masteryStatus !== 'INACTIVE').slice(0, 100);
      const activeIds = activeWordsSlice.map((w) => w.id);
      const exMap = await vocabRepo.getContextExamplesForVocabs(activeIds);

      // Seed context examples for active phrases
      for (const rawPhr of CORE_PHRASAL_DATA) {
        if (activePhraseIds.has(rawPhr.id)) {
          exMap[rawPhr.id] = [
            {
              id: `ctx_${rawPhr.id}_1`,
              phraseId: rawPhr.id,
              sentenceEn: rawPhr.example1,
              sentenceEs: rawPhr.example1Es || rawPhr.meaningEs,
              clozeTarget: rawPhr.text,
              cefrLevel: rawPhr.cefrLevel,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }

      setExamplesMap(exMap);

      // 5. Fetch Core Corpus Coverage statistics
      const coverage = await vocabRepo.getCoreCorpusCoverage();
      setCoverageStats(coverage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vocabulario');
    } finally {
      setIsLoading(false);
    }
  }, [vocabRepo, isReady]);

  useEffect(() => {
    loadVocabData();
  }, [loadVocabData]);

  // Activate a word from the Core Corpus or activate an inactive item
  const activateWord = useCallback(
    async (id: string): Promise<VocabItem | null> => {
      if (!vocabRepo) return null;
      try {
        const activated = await vocabRepo.activateVocabItem(id);

        // Update in-memory state
        setWords((prev) =>
          prev.map((w) => (w.id === id || w.word.toLowerCase() === activated.word.toLowerCase() ? activated : w)),
        );

        // Fetch examples if available
        const contexts = await vocabRepo.getContextExamples(activated.id);
        if (contexts.length > 0) {
          setExamplesMap((prev) => ({ ...prev, [activated.id]: contexts }));
        }

        // Synchronize SRS store with agile card
        useSrsStore.getState().addVocabItem(activated, contexts[0] ?? null, `card_${activated.id}`);

        // Refresh coverage stats
        const coverage = await vocabRepo.getCoreCorpusCoverage();
        setCoverageStats(coverage);

        return activated;
      } catch (err) {
        console.error('Error activating word:', err);
        return null;
      }
    },
    [vocabRepo],
  );

  // Batch activate words by criteria (e.g. "Top 500 A1-A2" or "Top 3000")
  const batchActivate = useCallback(
    async (criteria: { cefrLevel?: CefrLevel; frequencyBand?: FrequencyBand; limit?: number }): Promise<number> => {
      if (!vocabRepo) return 0;
      try {
        const activatedItems = await vocabRepo.batchActivateByCriteria(criteria);

        if (activatedItems.length > 0) {
          // Synchronize SRS store with all newly activated items immediately
          useSrsStore.getState().addBatchVocabItems(activatedItems);

          // Update context examples for the activated batch in a single batch query
          const activatedIds = activatedItems.map((item) => item.id);
          const batchContexts = await vocabRepo.getContextExamplesForVocabs(activatedIds);
          setExamplesMap((prev) => ({ ...prev, ...batchContexts }));
        }

        // Reload vocab list and refresh coverage
        await loadVocabData();
        const coverage = await vocabRepo.getCoreCorpusCoverage();
        setCoverageStats(coverage);

        return activatedItems.length;
      } catch (err) {
        console.error('Error batch activating words:', err);
        return 0;
      }
    },
    [vocabRepo, loadVocabData],
  );

  // Activate a Phrasal Verb directly into SRS
  const activatePhrase = useCallback(
    async (phraseId: string): Promise<boolean> => {
      if (!cardRepo) return false;
      try {
        await cardRepo.activatePhraseCard(phraseId);

        const targetPhr = CORE_PHRASAL_DATA.find((p) => p.id === phraseId);
        if (targetPhr) {
          const phraseVocabItem = toDomainCorePhrase(targetPhr, 'LEARNING');
          const contextExample: VocabContextExample = {
            id: `ctx_${targetPhr.id}_1`,
            phraseId: targetPhr.id,
            sentenceEn: targetPhr.example1,
            sentenceEs: targetPhr.example1Es || targetPhr.meaningEs,
            clozeTarget: targetPhr.text,
            cefrLevel: targetPhr.cefrLevel,
            createdAt: new Date().toISOString(),
          };

          // Update in-memory state
          setWords((prev) =>
            prev.map((w) => (w.id === phraseId ? { ...w, masteryStatus: 'LEARNING' } : w))
          );
          setExamplesMap((prev) => ({
            ...prev,
            [phraseId]: [contextExample],
          }));

          // Synchronize SRS store
          useSrsStore.getState().addVocabItem(phraseVocabItem, contextExample, `card_phr_${targetPhr.id}`);
        }
        return true;
      } catch (err) {
        console.error('Error activating phrase:', err);
        return false;
      }
    },
    [cardRepo],
  );

  // Instant local suggestions (< 1ms) for search autocomplete dropdown
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
        collocationsJson: payload.collocations ?? [],
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
      // Add graduated context examples if supplied
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

      // Add any additional context examples
      if (payload.additionalExamples && payload.additionalExamples.length > 0) {
        for (const extra of payload.additionalExamples) {
          if (extra.sentenceEn && extra.sentenceEn.trim()) {
            const example = await vocabRepo.addContextExample({
              vocabId: created.id,
              sentenceEn: extra.sentenceEn.trim(),
              sentenceEs: extra.sentenceEs?.trim() || '',
              clozeTarget: created.word,
              cefrLevel: created.cefrLevel,
            });
            createdExamples.push(example);
          }
        }
      }

      if (createdExamples.length > 0) {
        setExamplesMap((prev) => ({
          ...prev,
          [created.id]: createdExamples,
        }));
      }

      // Add SRS flashcard by default unless explicitly disabled
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

      // Synchronize in-memory SRS store
      useSrsStore.getState().addVocabItem(created, createdExamples[0] ?? null, cardId);

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

  const deleteMultipleWords = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!vocabRepo || ids.length === 0) return false;
      const count = await vocabRepo.deleteVocabs(ids);
      if (count > 0) {
        const idSet = new Set(ids);
        setWords((prev) => prev.filter((w) => !idSet.has(w.id)));
        setExamplesMap((prev) => {
          const next = { ...prev };
          for (const id of ids) {
            delete next[id];
          }
          return next;
        });
        for (const id of ids) {
          useSrsStore.getState().removeVocabItem(id);
        }
        return true;
      }
      return false;
    },
    [vocabRepo],
  );

  const clearAllWords = useCallback(async (): Promise<boolean> => {
    if (!vocabRepo) return false;
    try {
      await vocabRepo.clearAllVocabs();
      // Vaciar también el inventario de palabras del corpus en memoria para que no persistan como INACTIVE
      clearCoreCorpusMemory();
      // Reload vocab state so both DB words and corpus words disappear completely from the UI
      await loadVocabData();
      // Clear all items in SRS store
      useSrsStore.getState().setVocabList([]);
      useSrsStore.getState().setSelectedVocab(null);
      useSrsStore.getState().setCurrentContext(null);
      useSrsStore.getState().setAvailableContexts([]);
      useSrsStore.getState().setSrsCard(null);
      return true;
    } catch (err) {
      console.error('Error clearing all vocabs:', err);
      return false;
    }
  }, [vocabRepo, loadVocabData]);

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
  }, []);

  const sortedFilteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isSearching = q.length > 0;
    const includeDefinitions = q.length >= 3;

    const list = words.filter((w) => {
      // Origin Filter (CORE vs VAULT)
      if (originFilter === 'CORE' && !w.isCore) return false;
      if (originFilter === 'VAULT' && w.isCore) return false;

      // Frequency Band Filter
      if (frequencyBandFilter !== 'ALL' && w.frequencyBand !== frequencyBandFilter) return false;

      // Mastery Status Filter
      if (masteryStatusFilter !== 'ALL' && w.masteryStatus !== masteryStatusFilter) return false;

      // False Friends Filter
      if (onlyFalseFriends && !w.isFalseFriend) return false;

      // CEFR Filter (checks global or senses)
      if (selectedCefr !== 'ALL') {
        const matchesGlobal = w.cefrLevel === selectedCefr;
        const matchesSense = w.sensesJson?.some((s) => s.cefrLevel === selectedCefr);
        if (!matchesGlobal && !matchesSense) return false;
      }

      // Dimension Filter
      if (selectedDimension !== 'ALL' && w.grammaticalDimension !== selectedDimension) return false;

      // Part of Speech Filter (checks primary PoS or any sense's PoS)
      if (selectedPartOfSpeech !== 'ALL') {
        const matchesGlobalPos = w.partOfSpeech === selectedPartOfSpeech;
        const matchesSensePos = w.sensesJson?.some((s) => s.partOfSpeech === selectedPartOfSpeech);
        if (!matchesGlobalPos && !matchesSensePos) return false;
      }

      // Search Query
      if (isSearching) {
        const matchWord = w.word.toLowerCase().includes(q);
        const matchTranslation = w.translationEs.toLowerCase().includes(q);
        const matchIpa = w.ipaGeneralAmerican?.toLowerCase().includes(q) || w.ipaReceivedPronunciation?.toLowerCase().includes(q);
        const matchDef = includeDefinitions ? w.definitionEn.toLowerCase().includes(q) : false;
        const matchSenses = w.sensesJson?.some((s) =>
          s.translationEs.toLowerCase().includes(q) || (includeDefinitions && s.definitionEn.toLowerCase().includes(q))
        );

        if (!matchWord && !matchTranslation && !matchDef && !matchIpa && !matchSenses) {
          return false;
        }
      }

      return true;
    });

    const cefrRank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

    // Search relevance score (lower score = higher priority)
    const getRelevanceScore = (item: VocabItem): number => {
      if (!isSearching) return 0;
      const wordLower = item.word.toLowerCase();
      const transLower = item.translationEs.toLowerCase();

      if (wordLower === q) return 1;
      if (wordLower.startsWith(q)) return 2;
      if (transLower === q || transLower.startsWith(q)) return 3;
      if (wordLower.includes(q)) return 4;
      if (transLower.includes(q)) return 5;
      if (item.ipaGeneralAmerican?.toLowerCase().includes(q)) return 6;
      return 7;
    };

    return list.sort((a, b) => {
      if (isSearching && sortBy === 'RECENT') {
        const scoreDiff = getRelevanceScore(a) - getRelevanceScore(b);
        if (scoreDiff !== 0) return scoreDiff;
      }

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
  }, [
    words,
    originFilter,
    frequencyBandFilter,
    masteryStatusFilter,
    onlyFalseFriends,
    selectedCefr,
    selectedDimension,
    selectedPartOfSpeech,
    searchQuery,
    sortBy,
  ]);

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

  const coreCount = useMemo(
    () => words.filter((w) => w.isCore).length,
    [words],
  );

  const vaultCount = useMemo(
    () => words.filter((w) => !w.isCore).length,
    [words],
  );

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
    words: sortedFilteredWords,
    allWords: words,
    totalCount: words.length,
    coreCount,
    vaultCount,
    filteredCount: sortedFilteredWords.length,
    falseFriendsCount,
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
