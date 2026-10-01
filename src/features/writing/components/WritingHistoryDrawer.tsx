import {
  History,
  ArrowRight,
  Calendar,
  FileText,
  Trash2,
  Sparkles,
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
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-12 border border-gray-200 dark:border-gray-800 text-center">
        <div className="inline-block animate-spin text-indigo-600 dark:text-indigo-400 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm text-gray-500">Cargando historial de redacciones...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-12 border border-gray-200 dark:border-gray-800 text-center space-y-4">
        <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 inline-block">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Sin redacciones previas
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
            Completa tu primer borrador en el Taller Socrático. Cada sesión guardará tus dos borradores, las pistas de IA y la comparativa diferencial.
          </p>
        </div>
        <button
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
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-base">
          <History className="w-5 h-5 text-indigo-500" />
          <span>Historial de Redacciones Realizadas ({submissions.length})</span>
        </div>
        <button
          onClick={onNewWriting}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          + Nueva Redacción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submissions.map((sub) => {
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
              className="p-5 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between shadow-xs space-y-4 group"
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

                <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic font-sans">
                  "{sub.userText}"
                </div>

                {sub.evaluation && (
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                      <span className="block text-[9px] text-gray-400 uppercase">Gram</span>
                      <span className="font-bold">{sub.evaluation.scores.grammar}/10</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                      <span className="block text-[9px] text-gray-400 uppercase">Vocab</span>
                      <span className="font-bold">{sub.evaluation.scores.vocabulary}/10</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                      <span className="block text-[9px] text-gray-400 uppercase">Coher</span>
                      <span className="font-bold">{sub.evaluation.scores.coherence}/10</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                {onDeleteSubmission && (
                  <button
                    onClick={() => onDeleteSubmission(sub.id)}
                    className="text-gray-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onSelectSubmission(sub)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                >
                  <span>Ver Evaluación & Diff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
