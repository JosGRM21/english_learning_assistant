import { useMemo } from 'react';
import { DiffCalculator, DiffSegment } from '@/infrastructure/ai/DiffCalculator';
import { GitCompare, PlusCircle, MinusCircle } from 'lucide-react';

interface DiffVisualizerProps {
  original: string;
  updated: string;
  originalLabel?: string;
  updatedLabel?: string;
}

export function DiffVisualizer({
  original,
  updated,
  originalLabel = 'Borrador Inicial (Draft 1)',
  updatedLabel = 'Versión Corregida / Reformulada (Draft 2)',
}: DiffVisualizerProps) {
  const diffCalc = useMemo(() => new DiffCalculator(), []);

  const segments: DiffSegment[] = useMemo(() => {
    return diffCalc.computeWordDiff(original, updated);
  }, [diffCalc, original, updated]);

  const summary = useMemo(() => {
    return diffCalc.summarizeChanges(original, updated);
  }, [diffCalc, original, updated]);

  return (
    <div className="space-y-4">
      {/* Metrics bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Comparativa Diferencial a Nivel de Palabra
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <PlusCircle className="w-3.5 h-3.5" />
            +{summary.wordsAdded} palabras añadidas
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
            <MinusCircle className="w-3.5 h-3.5" />
            -{summary.wordsRemoved} palabras eliminadas
          </span>
        </div>
      </div>

      {/* Inline Diff Render */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-inner">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Transformación Textual Integrada:
        </div>
        <p className="text-base leading-relaxed font-sans text-gray-800 dark:text-gray-200">
          {segments.map((seg, idx) => {
            if (seg.added) {
              return (
                <mark
                  key={idx}
                  className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold px-1 py-0.5 rounded-sm mx-0.5 no-underline border-b-2 border-emerald-500"
                >
                  {seg.value}
                </mark>
              );
            }
            if (seg.removed) {
              return (
                <del
                  key={idx}
                  className="bg-rose-100/80 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 line-through px-1 py-0.5 rounded-sm mx-0.5 opacity-80"
                >
                  {seg.value}
                </del>
              );
            }
            return <span key={idx}>{seg.value}</span>;
          })}
        </p>
      </div>

      {/* Side-by-side comparison panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            {originalLabel}
          </div>
          <div className="text-sm font-sans text-gray-700 dark:text-gray-300 italic">
            "{original}"
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            {updatedLabel}
          </div>
          <div className="text-sm font-sans text-gray-900 dark:text-white font-medium">
            "{updated}"
          </div>
        </div>
      </div>
    </div>
  );
}
