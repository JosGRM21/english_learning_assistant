import { useMemo, useState } from 'react';
import { DiffCalculator, DiffSegment } from '@/infrastructure/ai/DiffCalculator';
import {
  GitCompare,
  PlusCircle,
  MinusCircle,
  Copy,
  Check,
  Columns,
  Layers,
  FileCheck,
} from 'lucide-react';

export interface DiffVisualizerProps {
  original: string;
  updated: string;
  originalLabel?: string;
  updatedLabel?: string;
}

type DiffViewMode = 'INLINE' | 'SPLIT' | 'CLEAN';

export function DiffVisualizer({
  original,
  updated,
  originalLabel = 'Borrador 1 (Inicial)',
  updatedLabel = 'Borrador 2 (Corregido)',
}: DiffVisualizerProps) {
  const [viewMode, setViewMode] = useState<DiffViewMode>('INLINE');
  const [copied, setCopied] = useState(false);

  const diffCalc = useMemo(() => new DiffCalculator(), []);

  const segments: DiffSegment[] = useMemo(() => {
    return diffCalc.computeWordDiff(original, updated);
  }, [diffCalc, original, updated]);

  const summary = useMemo(() => {
    return diffCalc.summarizeChanges(original, updated);
  }, [diffCalc, original, updated]);

  const handleCopyClean = () => {
    navigator.clipboard.writeText(updated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Metrics Bar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">
              Comparativa Diferencial a Nivel de Palabra
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Evolución directa entre Borrador 1 y Borrador 2
            </span>
          </div>
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#131722] p-1 rounded-xl border border-gray-200/80 dark:border-gray-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('INLINE')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'INLINE'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Integrado</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('SPLIT')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'SPLIT'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Lado a Lado</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('CLEAN')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'CLEAN'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Texto Limpio</span>
          </button>
        </div>

        {/* Diff Metrics */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
            <PlusCircle className="w-3.5 h-3.5" />
            +{summary.wordsAdded} palabras
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono font-semibold">
            <MinusCircle className="w-3.5 h-3.5" />
            -{summary.wordsRemoved} eliminadas
          </span>
        </div>
      </div>

      {/* Mode 1: Inline Diff */}
      {viewMode === 'INLINE' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 pb-2 border-b border-gray-100 dark:border-gray-800/80">
            <span className="uppercase font-bold tracking-wider">
              Transformación Textual
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="line-through">tachado</span> = omitido
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="underline font-semibold">verde</span> = perfeccionado
              </span>
            </span>
          </div>

          <p className="text-base leading-relaxed font-sans text-gray-800 dark:text-gray-100">
            {segments.map((seg, idx) => {
              if (seg.added) {
                return (
                  <mark
                    key={idx}
                    className="bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 font-semibold px-1.5 py-0.5 rounded mx-0.5 no-underline border-b-2 border-emerald-500 shadow-2xs"
                  >
                    {seg.value}
                  </mark>
                );
              }
              if (seg.removed) {
                return (
                  <del
                    key={idx}
                    className="bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 line-through px-1.5 py-0.5 rounded mx-0.5 opacity-80"
                  >
                    {seg.value}
                  </del>
                );
              }
              return <span key={idx}>{seg.value}</span>;
            })}
          </p>
        </div>
      )}

      {/* Mode 2: Split View */}
      {viewMode === 'SPLIT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/90 dark:border-gray-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              {originalLabel}
            </span>
            <p className="text-sm font-sans text-gray-700 dark:text-gray-300 italic leading-relaxed">
              "{original}"
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/90 dark:border-gray-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              {updatedLabel}
            </span>
            <p className="text-sm font-sans text-gray-900 dark:text-white font-medium leading-relaxed">
              "{updated}"
            </p>
          </div>
        </div>
      )}

      {/* Mode 3: Clean Version with Copy Action */}
      {viewMode === 'CLEAN' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Versión Final Pulida Lista para Uso
            </span>
            <button
              type="button"
              onClick={handleCopyClean}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar al portapapeles</span>
                </>
              )}
            </button>
          </div>
          <p className="text-base font-sans text-gray-900 dark:text-white leading-relaxed font-medium">
            "{updated}"
          </p>
        </div>
      )}
    </div>
  );
}
