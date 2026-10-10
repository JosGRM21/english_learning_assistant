import { PenTool, History, Sparkles, RotateCcw, Check } from 'lucide-react';
import { Button } from '@heroui/react';

export interface WritingStudioHeaderProps {
  activeTab: 'STUDIO' | 'HISTORY';
  currentStage: number;
  historyCount: number;
  onTabChange: (tab: 'STUDIO' | 'HISTORY') => void;
  onReset?: () => void;
}

const STAGES = [
  { step: 1, label: 'Borrador Inicial', shortLabel: 'Fase 1' },
  { step: 2, label: 'Pistas y Revisión', shortLabel: 'Fase 2' },
  { step: 3, label: 'Evaluación & Diff', shortLabel: 'Fase 3' },
];

export function WritingStudioHeader({
  activeTab,
  currentStage,
  historyCount,
  onTabChange,
  onReset,
}: WritingStudioHeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-[#131722]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4 transition-all">
      {/* Top row: Branding, Mode toggle & Reset action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Taller de Redacción
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              Práctica reflexiva en 3 fases: redacción guiada, auto-corrección con pistas y evaluación comparativa.
            </p>
          </div>
        </div>

        {/* Action Controls: Tab View Switcher & Reset */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="flex items-center p-1 bg-gray-100/90 dark:bg-[#181D2A] rounded-xl border border-gray-200/60 dark:border-gray-800/80">
            <button
              type="button"
              onClick={() => onTabChange('STUDIO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'STUDIO'
                  ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Redactor</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('HISTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'HISTORY'
                  ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-500" />
              <span>Historial</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ml-0.5">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'STUDIO' && currentStage > 1 && onReset && (
            <Button
              size="sm"
              variant="ghost"
              onPress={onReset}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-1 cursor-pointer"
              aria-label="Reiniciar sesión actual y volver al primer borrador"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reiniciar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Streamlined Stepper Progress Indicator (Studio view only) */}
      {activeTab === 'STUDIO' && (
        <nav aria-label="Progreso de redacción" className="pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {STAGES.map((s) => {
              const isCurrent = currentStage === s.step;
              const isPast = currentStage > s.step;

              return (
                <div
                  key={s.step}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                      : isPast
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-50/40 dark:bg-[#181D2A]/40 border-gray-200/50 dark:border-gray-800/50 text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-transform ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 scale-105'
                        : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                      {s.shortLabel}
                    </div>
                    <div
                      className={`text-xs font-semibold truncate ${
                        isCurrent
                          ? 'text-indigo-950 dark:text-indigo-200'
                          : isPast
                            ? 'text-emerald-900 dark:text-emerald-300'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
