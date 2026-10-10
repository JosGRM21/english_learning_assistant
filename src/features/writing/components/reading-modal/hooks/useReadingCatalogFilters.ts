import { useState, useMemo } from 'react';
import {
  READING_TO_WRITE_CATALOG,
  ReadingItem,
  ReadingTopicCategory,
} from '@/data/reading-to-write-catalog';
import { CefrFilter } from '../types';

export function useReadingCatalogFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReadingTopicCategory | 'ALL'>('ALL');
  const [selectedCefr, setSelectedCefr] = useState<CefrFilter>('ALL');
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);

  const filteredReadings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return READING_TO_WRITE_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchCefr = selectedCefr === 'ALL' || item.cefrLevel === selectedCefr;

      if (!matchCat || !matchCefr) return false;

      if (!query) return true;

      const titleMatch = item.title.toLowerCase().includes(query);
      const summaryMatch = item.readingSummaryEs.toLowerCase().includes(query);
      const textMatch = item.readingTextEn.toLowerCase().includes(query);
      const vocabMatch = item.keyVocabulary.some((v) =>
        v.word.toLowerCase().includes(query) || v.translationEs.toLowerCase().includes(query),
      );

      return titleMatch || summaryMatch || textMatch || vocabMatch;
    });
  }, [searchQuery, selectedCategory, selectedCefr]);

  // Selected reading defaults to first filtered reading or currently chosen
  const selectedReading = useMemo<ReadingItem | null>(() => {
    if (filteredReadings.length === 0) return null;
    if (!selectedReadingId) return filteredReadings[0];
    const found = filteredReadings.find((r) => r.id === selectedReadingId);
    return found || filteredReadings[0];
  }, [filteredReadings, selectedReadingId]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedCefr('ALL');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategory !== 'ALL' || selectedCefr !== 'ALL';

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCefr,
    setSelectedCefr,
    selectedReadingId: selectedReading?.id ?? null,
    setSelectedReadingId,
    selectedReading,
    filteredReadings,
    totalCount: READING_TO_WRITE_CATALOG.length,
    filteredCount: filteredReadings.length,
    hasActiveFilters,
    resetFilters,
  };
}
