import { ArrowRight } from 'lucide-react';
import { Chip, Button } from '@heroui/react';
import { WritingMission } from '@/data/reading-to-write-catalog';

export interface ReadingMissionCardProps {
  mission: WritingMission;
  onSelect: () => void;
  isRecommended?: boolean;
}

export function ReadingMissionCard({
  mission,
  onSelect,
  isRecommended = false,
}: ReadingMissionCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left ${
        isRecommended
          ? 'border-indigo-300 dark:border-indigo-700/70 bg-indigo-50/30 dark:bg-indigo-950/20 hover:border-indigo-400 shadow-2xs'
          : 'border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#161B26] hover:border-indigo-300 dark:hover:border-indigo-700'
      }`}
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            {mission.titleEs}
          </span>
          <Chip
            size="sm"
            variant="soft"
            className="font-mono text-[10px] font-semibold h-5 px-2 bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
          >
            Meta: {mission.suggestedWordRange.min}–{mission.suggestedWordRange.max} palabras
          </Chip>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
          {mission.instructionsEs}
        </p>

        {mission.suggestedOpening && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            Inicio sugerido: &ldquo;{mission.suggestedOpening}&rdquo;
          </p>
        )}
      </div>

      <div className="shrink-0 self-end sm:self-center">
        <Button
          size="sm"
          variant="primary"
          onPress={onSelect}
          className="h-8 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          aria-label={mission.titleEs}
        >
          <span>Elegir</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
