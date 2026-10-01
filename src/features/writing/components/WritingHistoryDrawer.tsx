import { useState, useMemo } from 'react';
import {
  History,
  ArrowRight,
  Calendar,
  FileText,
  Trash2,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { WritingSubmissionEntity } from '@/core/repositories/IWritingRepository';

export interface WritingHistoryDrawerProps {
  submissions: WritingSubmissionEntity[];
  isLoading: boolean;
  onSelectSubmission: (item: WritingSubmissionEntity) => void;
  onDeleteSubmission?: (id: string) => void;
  onNewWriting: () => void;
}

export function WritingHistoryDrawer({
  submissions,
  isLoading,
  onSelectSubmission,
  onDeleteSubmission,
  onNewWriting,
}: WritingHistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState<string>('ALL');

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        sub.userText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.draft2Text && sub.draft2Text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCefr =
        selectedCefr === 'ALL' ||
        sub.evaluation?.estimated_cefr === selectedCefr;

      return matchSearch && matchCefr;
    });
  }, [submissions, searchQuery, selectedCefr]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-12 border border-gray-200/90 dark:border-gray-800 text-center space-y-3">
        <div className="inline-block animate-spin text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-gray-500">Cargando historial de redacciones...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-12 border border-gray-200/90 dark:border-gray-800 text-center space-y-4 shadow-xs">
        <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 inline-block border border-indigo-100 dark:border-indigo-900/40">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Sin redacciones previas
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
            Completa tu primer borrador en el Taller de Redacción. Cada sesión guardará tus dos borradores, las pistas de mejora y la comparativa de cambios.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewWriting}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Iniciar Nueva Redacción
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-5 sm:p-6 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-base">
            <History className="w-5 h-5 text-indigo-500" />
            <span>Historial de Redacciones Realizadas ({submissions.length})</span>
          </div>

          <button
            type="button"
            onClick={onNewWriting}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer self-start sm:self-auto"
          >
            + Nueva Redacción
          </button>
        </div>

        {/* Search and CEFR Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fragmento de texto..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Nivel:</span>
            </span>
            {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  selectedCefr === lvl
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Submissions */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200/90 dark:border-gray-800 text-center text-xs text-gray-500">
          No se encontraron redacciones que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubmissions.map((sub) => {
            const formattedDate = new Date(sub.submittedAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sub.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                        <FileText className="w-3.5 h-3.5" />
                        {sub.wordCount} pal.
                      </span>
                    </div>

                    {sub.evaluation ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold font-mono">
                        CEFR {sub.evaluation.estimated_cefr}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                        Borrador
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 text-xs text-gray-700 dark:text-gray-300 line-clamp-3 italic font-sans leading-relaxed">
                    "{sub.userText}"
                  </div>

                  {sub.evaluation && (
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                      <div className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-900/30">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold tracking-wider">Gramática</span>
                        <span className="font-bold">{sub.evaluation.scores.grammar}/10</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100/60 dark:border-emerald-900/30">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold tracking-wider">Vocabulario</span>
                        <span className="font-bold">{sub.evaluation.scores.vocabulary}/10</span>
                      </div>
                      <div className="p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-100/60 dark:border-purple-900/30">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold tracking-wider">Coherencia</span>
                        <span className="font-bold">{sub.evaluation.scores.coherence}/10</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  {onDeleteSubmission && (
                    <button
                      type="button"
                      onClick={() => onDeleteSubmission(sub.id)}
                      className="text-gray-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectSubmission(sub)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ml-auto shadow-2xs"
                  >
                    <span>Ver Evaluación & Diff</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
