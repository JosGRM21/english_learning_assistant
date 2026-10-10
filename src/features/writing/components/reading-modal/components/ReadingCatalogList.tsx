import { ReadingItem } from '@/data/reading-to-write-catalog';
import { ReadingCatalogCard } from './ReadingCatalogCard';
import { ReadingEmptyState } from './ReadingEmptyState';

export interface ReadingCatalogListProps {
  readings: ReadingItem[];
  selectedReadingId: string | null;
  onSelectReading: (item: ReadingItem) => void;
  onResetFilters: () => void;
}

export function ReadingCatalogList({
  readings,
  selectedReadingId,
  onSelectReading,
  onResetFilters,
}: ReadingCatalogListProps) {
  if (readings.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <ReadingEmptyState onResetFilters={onResetFilters} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar h-full">
      {readings.map((item) => (
        <ReadingCatalogCard
          key={item.id}
          reading={item}
          isSelected={selectedReadingId === item.id}
          onSelectReading={() => onSelectReading(item)}
        />
      ))}
    </div>
  );
}
