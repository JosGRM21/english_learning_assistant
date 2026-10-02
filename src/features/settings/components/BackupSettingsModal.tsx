import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { ReviewLog } from '@/core/types/srs';
import { useBackupRestore } from '../hooks/useBackupRestore';
import { useSrsStore } from '@/features/srs/store/srsStore';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { useDiagnosticsStore } from '@/features/diagnostics/store/diagnosticsStore';

import { useState, useEffect } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';

export interface BackupSettingsModalProps {
  userId?: string;
  cards?: Record<string, unknown>[];
  reviewLogs?: ReviewLog[];
  errors?: Record<string, unknown>[];
  streak?: Record<string, unknown> | null;
  quests?: Record<string, unknown>[];
  onRestoreBackup?: (restoredData: Record<string, unknown>) => void;
}

export function BackupSettingsModal({
  userId,
  cards,
  reviewLogs,
  errors,
  streak,
  quests,
  onRestoreBackup,
}: BackupSettingsModalProps) {
  const { cardRepo, isReady } = useDatabase();
  const [dbCards, setDbCards] = useState<Record<string, unknown>[] | null>(null);
  const [dbLogs, setDbLogs] = useState<ReviewLog[] | null>(null);

  const storeCard = useSrsStore((s) => s.srsCard);
  const storeLogs = useSrsStore((s) => s.reviewLogs);
  const storeStreak = useHabitsStore((s) => s.streak);
  const storeQuests = useHabitsStore((s) => s.quests);
  const storeWeaknesses = useDiagnosticsStore((s) => s.weaknesses);

  const finalUserId = userId ?? 'user_local';

  useEffect(() => {
    if (!isReady || !cardRepo) return;
    const repo = cardRepo;
    let isMounted = true;
    async function loadData() {
      try {
        const allCards = await repo.getAllCardsWithDetails(finalUserId, 1000);
        const allLogs = await repo.getAllReviewLogs(1000);
        if (isMounted) {
          setDbCards(allCards.map((c) => ({ ...c.card, vocab: c.vocab })));
          setDbLogs(allLogs);
        }
      } catch (err) {
        console.error('Failed to load backup data from SQLite:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [isReady, cardRepo, finalUserId]);

  const finalCards = cards ?? dbCards ?? (storeCard ? [storeCard as unknown as Record<string, unknown>] : []);
  const finalLogs = reviewLogs ?? dbLogs ?? storeLogs;
  const finalErrors = errors ?? (storeWeaknesses as unknown as Record<string, unknown>[]);
  const finalStreak = streak !== undefined ? streak : (storeStreak as unknown as Record<string, unknown>);
  const finalQuests = quests ?? (storeQuests as unknown as Record<string, unknown>[]);

  const {
    calibrationReport,
    importStatus,
    importError,
    handleExport,
    handleFileChange,
  } = useBackupRestore({
    userId: finalUserId,
    cards: finalCards,
    reviewLogs: finalLogs,
    errors: finalErrors,
    streak: finalStreak,
    quests: finalQuests,
    onRestoreBackup,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Resiliencia Local-First, Respaldos & Calibración FSRS
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Exporta o importa el estado integral de tu aprendizaje en JSON y supervisa la calibración
              adaptativa del algoritmo FSRS v5 contra tu retención real.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Backup & Restore */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Respaldos de Datos (Backup & Restore)
            </h3>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Tu base de datos es 100% local y soberana. Puedes descargar una copia de seguridad
            completa para archivarla o sincronizarla entre dispositivos.
          </p>

          <div className="space-y-3 pt-2">
            {/* Export button */}
            <button
              onClick={handleExport}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Copia de Seguridad JSON ({finalCards.length} tarjetas)</span>
            </button>

            {/* Import file input button */}
            <label className="w-full py-3.5 px-4 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-[#181D2A] dark:hover:bg-[#202738] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>Restaurar Copia desde Archivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Feedback messages */}
          {importStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Right Column: FSRS Calibrator Report */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-5 h-5" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Calibrador Adaptativo FSRS v5
            </h3>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Compara tu tasa de retención observada contra el objetivo teórico del 90% para ajustar
            los intervalos de repaso espaciado.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                Repasos Evaluados
              </span>
              <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">
                {calibrationReport.totalReviewsEvaluated}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                Retención Observada
              </span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {(calibrationReport.actualRetentionRate * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                Retención Objetivo (DSR)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {(calibrationReport.targetRetentionRate * 100).toFixed(0)}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                Ajuste Recomendado
              </span>
              <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {(calibrationReport.recommendedRequestRetention * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {calibrationReport.recommendationEs}
          </div>
        </div>
      </div>
    </div>
  );
}
