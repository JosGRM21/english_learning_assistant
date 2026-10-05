import React from 'react';
import { Clock } from 'lucide-react';

interface ResetCountdownPillProps {
  countdownText: string;
}

export const ResetCountdownPill: React.FC<ResetCountdownPillProps> = ({ countdownText }) => {
  return (
    <div
      className="px-3.5 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center gap-2.5 text-xs shadow-xs"
      title="Los límites de cuotas de la API de Google se reinician automáticamente a las 00:00 Pacific Time"
    >
      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 block leading-none">
          Reinicio de cuotas
        </span>
        <span className="text-xs font-mono font-bold text-gray-900 dark:text-white leading-tight">
          {countdownText}
        </span>
      </div>
    </div>
  );
};
