import { ChevronLeft, Sparkles } from 'lucide-react';
import { Chip, Button } from '@heroui/react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';
import { ReadingMissionCard } from './ReadingMissionCard';

export interface ReadingDetailInspectorProps {
  reading: ReadingItem;
  onSelectMission: (reading: ReadingItem, mission: WritingMission) => void;
  onBackToList?: () => void;
}

export function ReadingDetailInspector({
  reading,
  onSelectMission,
  onBackToList,
}: ReadingDetailInspectorProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#131722] overflow-hidden">
      {/* Minimalist Top Bar */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#131722]">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBackToList && (
            <Button
              size="sm"
              variant="ghost"
              onPress={onBackToList}
              className="lg:hidden text-xs text-gray-500 h-8 px-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-0.5" />
              Atrás
            </Button>
          )}

          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
              Lectura: {reading.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {reading.categoryLabelEs} · {reading.readingTimeMin} min · {reading.wordCount} palabras
            </p>
          </div>
        </div>

        <Chip
          size="sm"
          variant="soft"
          className="font-mono text-xs font-bold px-2.5 h-6 shrink-0 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
        >
          Nivel {reading.cefrLevel}
        </Chip>
      </div>

      {/* Main Reading Canvas & Mission Selection */}
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 custom-scrollbar space-y-6">
        {/* Pure Reading Content */}
        <div className="font-editorial text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line tracking-normal select-text">
          {reading.readingTextEn}
        </div>

        {/* Missions Selection Action Area */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Selecciona tu misión de redacción
            </span>
            <span className="text-[11px] text-gray-400">
              {reading.writingMissions.length} {reading.writingMissions.length === 1 ? 'misión disponible' : 'misiones disponibles'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {reading.writingMissions.map((mission, mIdx) => (
              <ReadingMissionCard
                key={mIdx}
                mission={mission}
                isRecommended={mIdx === 0}
                onSelect={() => onSelectMission(reading, mission)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
