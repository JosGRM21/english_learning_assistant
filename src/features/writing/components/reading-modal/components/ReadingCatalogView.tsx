import { useState } from 'react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';
import { useReadingCatalogFilters } from '../hooks/useReadingCatalogFilters';
import { ReadingFiltersBar } from './ReadingFiltersBar';
import { ReadingCatalogList } from './ReadingCatalogList';
import { ReadingDetailInspector } from './ReadingDetailInspector';

export interface ReadingCatalogViewProps {
  onSelectReadingAndMission: (reading: ReadingItem, mission: WritingMission) => void;
}

export function ReadingCatalogView({ onSelectReadingAndMission }: ReadingCatalogViewProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCefr,
    setSelectedCefr,
    selectedReadingId,
    setSelectedReadingId,
    selectedReading,
    filteredReadings,
    totalCount,
    filteredCount,
    hasActiveFilters,
    resetFilters,
  } = useReadingCatalogFilters();

  const [mobileView, setMobileView] = useState<'LIST' | 'DETAIL'>('LIST');

  const handleCardSelect = (item: ReadingItem) => {
    setSelectedReadingId(item.id);
    setMobileView('DETAIL');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search and Filters Toolbar */}
      <ReadingFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedCefr={selectedCefr}
        onCefrChange={setSelectedCefr}
        totalCount={totalCount}
        filteredCount={filteredCount}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Main Split Body: Catalog List + Detail Inspector */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Catalog List */}
        <div
          className={`w-full lg:w-[46%] xl:w-[42%] flex flex-col border-r border-gray-200/80 dark:border-gray-800 bg-gray-50/30 dark:bg-black/10 overflow-hidden ${
            mobileView === 'DETAIL' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <ReadingCatalogList
            readings={filteredReadings}
            selectedReadingId={selectedReadingId}
            onSelectReading={handleCardSelect}
            onResetFilters={resetFilters}
          />
        </div>

        {/* Right Column: Reading Detail & Missions Inspector */}
        <div
          className={`w-full lg:w-[54%] xl:w-[58%] flex flex-col overflow-hidden ${
            mobileView === 'LIST' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedReading ? (
            <ReadingDetailInspector
              reading={selectedReading}
              onSelectMission={onSelectReadingAndMission}
              onBackToList={() => setMobileView('LIST')}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400 text-xs">
              Selecciona una lectura del catálogo para ver su contenido y misiones.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
