import { Home, Sparkles, BookOpen, PenTool, ArrowRight } from 'lucide-react';
import { AppTab } from '@/shared/constants/app-tabs';

interface HomeEmptyViewProps {
  onNavigateTab: (tab: AppTab) => void;
}

export function HomeEmptyView({ onNavigateTab }: HomeEmptyViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[68vh] text-center px-4 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
          <Home className="w-10 h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
        English Learning Assistant
      </h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
        Selecciona una actividad desde la barra lateral o empieza rápidamente con uno de los módulos principales:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
        <button
          onClick={() => onNavigateTab('vocab')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md hover:-translate-y-0.5 transition-all text-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">Vocabulario</span>
          <span className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 group-hover:text-indigo-500">
            Explorar catálogo <ArrowRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('srs')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md hover:-translate-y-0.5 transition-all text-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">SRS & Fonética</span>
          <span className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 group-hover:text-purple-500">
            Repaso diario <ArrowRight className="w-3 h-3" />
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('writing')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md hover:-translate-y-0.5 transition-all text-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <PenTool className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">Taller de Redacción</span>
          <span className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 group-hover:text-blue-500">
            Práctica socrática <ArrowRight className="w-3 h-3" />
          </span>
        </button>
      </div>
    </div>
  );
}
