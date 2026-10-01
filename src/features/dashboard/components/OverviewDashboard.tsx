import { Layers } from 'lucide-react';
import { DailyQuest, UserStreak } from '@/core/types/habits';
import { WeaknessMetric } from '@/core/types/diagnostics';

export interface OverviewDashboardProps {
  streak?: UserStreak;
  quests?: DailyQuest[];
  weaknesses?: WeaknessMetric[];
  reviewCount?: number;
  onNavigateTab?: (tab: string) => void;
  onStartMicroWorkout?: (weakness: WeaknessMetric) => void;
}

export function OverviewDashboard(_props: OverviewDashboardProps = {}) {
  return (
    <div className="w-full min-h-[65vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#131722]/50 backdrop-blur-xs p-10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 flex items-center justify-center shadow-inner">
          <Layers className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Lienzo vacío
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            No hay elementos para mostrar en este momento. Selecciona una opción del menú lateral para comenzar.
          </p>
        </div>
      </div>
    </div>
  );
}
