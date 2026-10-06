import { useState } from 'react';
import {
  Bell,
  Clock,
  Sparkles,
  ShieldAlert,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Sliders,
  Layers,
  BookOpen,
  PenTool,
  Calendar,
} from 'lucide-react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useNotificationSettingsStore } from '../store/notificationSettingsStore';
import { ScheduleMode } from '@/core/types/notifications';

export function NotificationSettingsCard() {
  const { notificationRepo, cardRepo, writingRepo } = useDatabase();
  const {
    settings,
    srsHabitAnalysis,
    writingHabitAnalysis,
    permissionGranted,
    updateSettings,
    updateActivitySettings,
    requestPermission,
    sendTestNotification,
    recalculateHabits,
  } = useNotificationSettingsStore();

  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [recalcStatus, setRecalcStatus] = useState(false);

  const handleToggle = async (key: keyof typeof settings, value: boolean | number | string) => {
    if (!notificationRepo) return;
    await updateSettings(notificationRepo, { [key]: value });
  };

  const handleActivityModeChange = async (
    activity: 'srs' | 'writing',
    mode: ScheduleMode,
  ) => {
    if (!notificationRepo) return;
    await updateActivitySettings(notificationRepo, activity, { scheduleMode: mode });
  };

  const handleActivityToggle = async (
    activity: 'srs' | 'writing',
    enabled: boolean,
  ) => {
    if (!notificationRepo) return;
    await updateActivitySettings(notificationRepo, activity, { enabled });
  };

  const handleActivityTimeChange = async (
    activity: 'srs' | 'writing',
    manualTime: string,
  ) => {
    if (!notificationRepo) return;
    await updateActivitySettings(notificationRepo, activity, { manualTime });
  };

  const handleTestNotification = async () => {
    if (!notificationRepo) return;
    setTestStatus('sending');
    const ok = await sendTestNotification(notificationRepo);
    setTestStatus(ok ? 'success' : 'failed');
    setTimeout(() => setTestStatus('idle'), 3500);
  };

  const handleRecalculateAll = async () => {
    if (!cardRepo || !notificationRepo) return;
    setRecalcStatus(true);
    try {
      const reviewLogs = await cardRepo.getAllReviewLogs(200);
      const writingSubs = await writingRepo?.getSubmissions('user_local', 100);

      const srsTimestamps: string[] = [];
      const writingTimestamps: string[] = [];

      if (reviewLogs) {
        for (const r of reviewLogs) {
          if (r.reviewedAt) srsTimestamps.push(r.reviewedAt);
        }
      }
      if (writingSubs) {
        for (const w of writingSubs) {
          if (w.submittedAt) writingTimestamps.push(w.submittedAt);
        }
      }

      const allTimestamps = [...srsTimestamps, ...writingTimestamps];
      const result = recalculateHabits(allTimestamps, srsTimestamps, writingTimestamps);

      const updates: Record<string, unknown> = {};
      if (settings.srs.scheduleMode === 'AUTO') {
        updates.srs = { ...settings.srs, detectedTime: result.srs.suggestedTime };
      }
      if (settings.writing.scheduleMode === 'AUTO') {
        updates.writing = { ...settings.writing, detectedTime: result.writing.suggestedTime };
      }
      if (Object.keys(updates).length > 0) {
        await updateSettings(notificationRepo, updates);
      }
    } finally {
      setTimeout(() => setRecalcStatus(false), 500);
    }
  };

  const getConfidenceBadge = (confidence: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (confidence) {
      case 'HIGH':
        return {
          label: 'Confianza Alta',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200/80 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
        };
      case 'MEDIUM':
        return {
          label: 'Confianza Media',
          bg: 'bg-sky-50 dark:bg-sky-950/40',
          text: 'text-sky-700 dark:text-sky-300',
          border: 'border-sky-200/80 dark:border-sky-800/60',
          dot: 'bg-sky-500',
        };
      case 'LOW':
      default:
        return {
          label: 'Confianza Baja',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200/80 dark:border-amber-800/60',
          dot: 'bg-amber-500',
        };
    }
  };

  const srsBadge = getConfidenceBadge(srsHabitAnalysis.confidence);
  const writingBadge = getConfidenceBadge(writingHabitAnalysis.confidence);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Master Header Card */}
      <div className="relative overflow-hidden bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)] transition-all">
        {/* Subtle ambient background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 border border-indigo-100/70 dark:border-indigo-900/40 shadow-xs">
              <Bell className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Notificaciones y Horarios de Práctica
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                  Multi-Actividad
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                Configura horarios independientes para repaso de tarjetas y taller de redacción, ya sea de forma automática por hábitos o manual.
              </p>

              {/* Action Indicator if Permission is missing */}
              {!permissionGranted && (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={requestPermission}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Activar Permiso en Windows
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Master Toggle */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800/80 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              onClick={() => handleToggle('enabled', !settings.enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                settings.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title={settings.enabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Activity Schedules Section */}
      <div className={`space-y-4 transition-opacity duration-200 ${settings.enabled ? 'opacity-100' : 'opacity-60 pointer-events-none'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                Horarios por Actividad
              </h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Personaliza el momento ideal para estudiar según tu ritmo de aprendizaje.
            </p>
          </div>

          <button
            onClick={handleRecalculateAll}
            disabled={recalcStatus}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#191D28] hover:bg-gray-50 dark:hover:bg-[#202534] text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-2 text-indigo-500 transition-transform ${recalcStatus ? 'animate-spin' : ''}`} />
            Recalcular Hábitos de Actividades
          </button>
        </div>

        {/* Responsive Grid for Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 2A. SRS Cards Review Schedule Card */}
          <div className="bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 border border-indigo-100/60 dark:border-indigo-900/40">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-gray-900 dark:text-white">
                      Repaso de Tarjetas (FSRS & Fonética)
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      Recordatorio para sesiones de tarjetas y consolidación de vocabulario activo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.srs?.enabled}
                  onClick={() => handleActivityToggle('srs', !settings.srs?.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    settings.srs?.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  title={settings.srs?.enabled ? 'Desactivar recordatorio SRS' : 'Activar recordatorio SRS'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      settings.srs?.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Mode Selector Pill */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Modo de programación:
                </span>
                <div className="flex bg-gray-100/90 dark:bg-[#1A1F2C] p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/80">
                  <button
                    onClick={() => handleActivityModeChange('srs', 'AUTO')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      settings.srs?.scheduleMode === 'AUTO'
                        ? 'bg-white dark:bg-[#252B3B] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto (Hábitos)
                  </button>
                  <button
                    onClick={() => handleActivityModeChange('srs', 'MANUAL')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      settings.srs?.scheduleMode === 'MANUAL'
                        ? 'bg-white dark:bg-[#252B3B] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Manual
                  </button>
                </div>
              </div>

              {/* Mode Body (Without Histograms!) */}
              {settings.srs?.scheduleMode === 'AUTO' ? (
                <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-50/60 via-indigo-50/20 to-transparent dark:from-indigo-950/30 dark:via-indigo-950/10 dark:to-transparent border border-indigo-100/80 dark:border-indigo-900/40 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Horario Sugerido para Repaso SRS
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${srsBadge.bg} ${srsBadge.text} ${srsBadge.border} border`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${srsBadge.dot}`} />
                      {srsBadge.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {srsHabitAnalysis.suggestedTime}
                      </span>
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        hrs
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-[#1A1F2C]/90 border border-gray-200/70 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{srsHabitAnalysis.sessionCount} sesiones SRS</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-indigo-100/60 dark:border-indigo-900/30 pt-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Calculado a partir de tus momentos de mayor constancia de repaso.</span>
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl p-4 bg-gray-50/80 dark:bg-[#161B26] border border-gray-200/70 dark:border-gray-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#1F2533] border border-gray-200/70 dark:border-gray-700/60 text-gray-500 dark:text-gray-300 shadow-2xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white block">
                        Hora fija para repaso de tarjetas
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        Aviso diario programado
                      </span>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={settings.srs?.manualTime || '19:00'}
                    onChange={(e) => handleActivityTimeChange('srs', e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1E29] border border-gray-300 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2B. Writing Studio Schedule Card */}
          <div className="bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-violet-50/90 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl shrink-0 border border-violet-100/60 dark:border-violet-900/40">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-gray-900 dark:text-white">
                      Taller de Redacción Socrática
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      Recordatorio para práctica guiada de escritura y auto-corrección con pistas de IA.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.writing?.enabled}
                  onClick={() => handleActivityToggle('writing', !settings.writing?.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    settings.writing?.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  title={settings.writing?.enabled ? 'Desactivar recordatorio redacción' : 'Activar recordatorio redacción'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      settings.writing?.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Mode Selector Pill */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Modo de programación:
                </span>
                <div className="flex bg-gray-100/90 dark:bg-[#1A1F2C] p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/80">
                  <button
                    onClick={() => handleActivityModeChange('writing', 'AUTO')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      settings.writing?.scheduleMode === 'AUTO'
                        ? 'bg-white dark:bg-[#252B3B] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto (Hábitos)
                  </button>
                  <button
                    onClick={() => handleActivityModeChange('writing', 'MANUAL')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      settings.writing?.scheduleMode === 'MANUAL'
                        ? 'bg-white dark:bg-[#252B3B] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Manual
                  </button>
                </div>
              </div>

              {/* Mode Body (Without Histograms!) */}
              {settings.writing?.scheduleMode === 'AUTO' ? (
                <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-50/60 via-violet-50/20 to-transparent dark:from-violet-950/30 dark:via-violet-950/10 dark:to-transparent border border-violet-100/80 dark:border-violet-900/40 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                      Horario Sugerido para Redacción
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${writingBadge.bg} ${writingBadge.text} ${writingBadge.border} border`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${writingBadge.dot}`} />
                      {writingBadge.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {writingHabitAnalysis.suggestedTime}
                      </span>
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        hrs
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-[#1A1F2C]/90 border border-gray-200/70 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-violet-500" />
                      <span>{writingHabitAnalysis.sessionCount} sesiones redacción</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-violet-100/60 dark:border-violet-900/30 pt-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span>Horario óptimo para redactar en un entorno tranquilo y productivo.</span>
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl p-4 bg-gray-50/80 dark:bg-[#161B26] border border-gray-200/70 dark:border-gray-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#1F2533] border border-gray-200/70 dark:border-gray-700/60 text-gray-500 dark:text-gray-300 shadow-2xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white block">
                        Hora fija para taller de redacción
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        Aviso diario programado
                      </span>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={settings.writing?.manualTime || '21:00'}
                    onChange={(e) => handleActivityTimeChange('writing', e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1E29] border border-gray-300 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Smart Rules & Notification Settings */}
      <div className={`bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-6 transition-opacity duration-200 ${settings.enabled ? 'opacity-100' : 'opacity-60 pointer-events-none'}`}>
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40">
              <Layers className="w-4 h-4" />
            </div>
            Alertas Generales y Racha
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Reglas de protección de hábito, consolidación de alertas y periodos de no molestar.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
          {/* Streak Saver Toggle */}
          <div className="py-4.5 first:pt-0 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-50/90 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-100/60 dark:border-amber-900/40">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white block">
                  Rescate de Racha Nocturno (Pre-Medianoche)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                  Te avisa antes de que termine el día si aún no has practicado. Si tu hora habitual ya es tarde (ej. 23:00), se adapta automáticamente para evitar alertas duplicadas.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.streakSaverEnabled}
              onClick={() => handleToggle('streakSaverEnabled', !settings.streakSaverEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                settings.streakSaverEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  settings.streakSaverEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SRS Batch Toggle */}
          <div className="py-4.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-100/60 dark:border-indigo-900/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white block">
                  Aviso de Lote de Tarjetas SRS Disponibles
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                  No envía notificaciones por cada tarjeta individual para evitar fatiga. Solo te avisa cuando se acumula un lote relevante de repaso.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {settings.srsBatchEnabled && (
                <select
                  value={settings.srsBatchThreshold}
                  onChange={(e) => handleToggle('srsBatchThreshold', Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 dark:bg-[#1A1F2C] border border-gray-200/80 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={5}>Umbral: 5 tarjetas</option>
                  <option value={10}>Umbral: 10 tarjetas</option>
                  <option value={15}>Umbral: 15 tarjetas</option>
                  <option value={20}>Umbral: 20 tarjetas</option>
                </select>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={settings.srsBatchEnabled}
                onClick={() => handleToggle('srsBatchEnabled', !settings.srsBatchEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  settings.srsBatchEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    settings.srsBatchEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="pt-4.5">
            <div className="rounded-2xl p-5 bg-gray-50/70 dark:bg-[#161B26] border border-gray-200/70 dark:border-gray-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">
                      Horas de Silencio (No Molestar)
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Ninguna notificación se enviará en este lapso
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  Silencio automático nocturno
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A1F2C] border border-gray-200/60 dark:border-gray-800/80 space-y-1.5 shadow-2xs">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Inicio del silencio
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => handleToggle('quietHoursStart', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50/80 dark:bg-[#222838] border border-gray-200/80 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A1F2C] border border-gray-200/60 dark:border-gray-800/80 space-y-1.5 shadow-2xs">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Fin del silencio
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => handleToggle('quietHoursEnd', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50/80 dark:bg-[#222838] border border-gray-200/80 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Desktop Tray & Test Action */}
      <div className="bg-gradient-to-r from-white via-white to-indigo-50/30 dark:from-[#131722] dark:via-[#131722] dark:to-indigo-950/20 border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Comprobación de Notificaciones de Escritorio
            </h4>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              Windows Action Center
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
            Haz clic para emitir un aviso de prueba con sonido y banner nativo en Windows.
          </p>
        </div>

        <button
          onClick={handleTestNotification}
          disabled={testStatus === 'sending'}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            testStatus === 'success'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-md'
              : testStatus === 'failed'
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 shadow-md'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {testStatus === 'sending' ? (
            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
          ) : testStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          ) : testStatus === 'failed' ? (
            <AlertTriangle className="w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2 fill-current" />
          )}
          <span>
            {testStatus === 'success'
              ? '¡Notificación Enviada!'
              : testStatus === 'failed'
              ? 'Error de Permiso'
              : 'Enviar Notificación de Prueba'}
          </span>
        </button>
      </div>
    </div>
  );
}
