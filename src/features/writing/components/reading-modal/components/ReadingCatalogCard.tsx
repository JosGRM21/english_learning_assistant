import { Clock, ChevronRight, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, Chip } from '@heroui/react';
import { ReadingItem } from '@/data/reading-to-write-catalog';

export interface ReadingCatalogCardProps {
  reading: ReadingItem;
  isSelected: boolean;
  onSelectReading: () => void;
}

export function ReadingCatalogCard({
  reading,
  isSelected,
  onSelectReading,
}: ReadingCatalogCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelectReading}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectReading();
        }
      }}
      className={`text-left w-full border rounded-2xl transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
          : 'border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#181D2A] hover:border-indigo-300 dark:hover:border-indigo-700/80 shadow-2xs'
      }`}
    >
      <CardHeader className="p-3.5 sm:p-4 pb-1.5 flex flex-col items-start gap-1.5">
        <div className="flex items-center justify-between w-full gap-2">
          <Chip
            size="sm"
            variant="soft"
            className="text-[10px] font-bold uppercase tracking-wide h-5 px-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
          >
            {reading.categoryLabelEs}
          </Chip>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {reading.cefrLevel}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              {reading.readingTimeMin} min
            </span>
          </div>
        </div>

        <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug line-clamp-1 group-hover:text-indigo-600">
          {reading.title}
        </h4>
      </CardHeader>

      <CardContent className="px-3.5 sm:px-4 py-1">
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {reading.readingSummaryEs}
        </p>
      </CardContent>

      <CardFooter className="p-3.5 sm:p-4 pt-2 flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-800/60 text-gray-400">
        <span className="flex items-center gap-1 text-[11px]">
          <FileText className="w-3 h-3 text-gray-400" />
          {reading.wordCount} palabras
        </span>

        <span
          className={`flex items-center gap-0.5 text-xs font-semibold transition-colors ${
            isSelected
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-300'
          }`}
        >
          <span>{isSelected ? 'Lectura seleccionada' : 'Explorar y misiones'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </CardFooter>
    </Card>
  );
}
