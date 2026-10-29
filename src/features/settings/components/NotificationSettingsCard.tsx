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
  BookOpen,
  PenTool,
  Sliders,
} from 'lucide-react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useNotificationSettingsStore } from '../store/notificationSettingsStore';

export function NotificationSettingsCard() {
  const { notificationRepo } = useDatabase();
  const {
    settings,
    permissionGranted,
    updateSettings,
    updateActivitySettings,
    requestPermission,
    sendTestNotification,
  } = useNotificationSettingsStore();

  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');

  const handleToggle = async (key: keyof typeof settings, value: boolean | number | string) => {
    if (!notificationRepo) return;
    await updateSettings(notificationRepo, { [key]: value });
  };

  const handleActivityToggle = async (activity: 'srs' | 'writing', enabled: boolean) => {
    if (!notificationRepo) return;
    await updateActivitySettings(notificationRepo, activity, { enabled });
  };

  const handleActivityTimeChange = async (activity: 'srs' | 'writing', manualTime: string) => {
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

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto">
      {/* 1. Master Control Card */}
      <div className="bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 border border-indigo-100/60 dark:border-indigo-900/30">
              <Bell className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Notificaciones y Recordatorios
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  Horarios Manuales
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
                Define tus horas fijas de práctica diaria y personaliza cuándo recibir alertas de estudio en Windows.
              </p>
            </div>
          </div>

          {/* Master Switch */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 shrink-0">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:hidden">
              {settings.enabled ? 'Activadas' : 'Pausadas'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              aria-label="Activar o pausar notificaciones"
              onClick={() => handleToggle('enabled', !settings.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                settings.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title={settings.enabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Windows Permission Notice (Only when not granted) */}
        {!permissionGranted && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/20 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:px-6 rounded-b-2xl border-t-amber-100 dark:border-t-amber-900/30">
            <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Se requiere permiso del sistema operativo para mostrar avisos nativos.</span>
            </div>
            <button
              onClick={requestPermission}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Habilitar en Windows
            </button>
          </div>
        )}
      </div>

      {/* Main Settings Sections Container */}
      <div className={`space-y-5 transition-opacity duration-200 ${settings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none select-none'}`}>
        {/* 2. Practice Schedules Card */}
        <div className="bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Horarios de Estudio
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avisos diarios programados a la hora exacta que elijas.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/80 border-t border-gray-100 dark:border-gray-800/80">
            {/* 2A. SRS Card Review */}
            <div className="py-4 first:pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-100/50 dark:border-indigo-900/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Repaso de Tarjetas (FSRS Vocabulario)
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Recordatorio para sesiones de tarjetas y consolidación de vocabulario activo.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pl-9 sm:pl-0">
                <input
                  type="time"
                  disabled={!settings.srs?.enabled}
                  value={settings.srs?.manualTime || '19:00'}
                  onChange={(e) => handleActivityTimeChange('srs', e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 transition-all cursor-pointer dark:[color-scheme:dark]"
                  title="Hora programada para repaso SRS"
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.srs?.enabled}
                  aria-label="Activar recordatorio de repaso de tarjetas"
                  onClick={() => handleActivityToggle('srs', !settings.srs?.enabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.srs?.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      settings.srs?.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2B. Writing Studio */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-100/50 dark:border-indigo-900/30">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Taller de Redacción Socrática
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Recordatorio para redactar textos y recibir pistas interactivas de IA.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pl-9 sm:pl-0">
                <input
                  type="time"
                  disabled={!settings.writing?.enabled}
                  value={settings.writing?.manualTime || '21:00'}
                  onChange={(e) => handleActivityTimeChange('writing', e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 transition-all cursor-pointer dark:[color-scheme:dark]"
                  title="Hora programada para taller de redacción"
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.writing?.enabled}
                  aria-label="Activar recordatorio de taller de redacción"
                  onClick={() => handleActivityToggle('writing', !settings.writing?.enabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.writing?.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      settings.writing?.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2C. Fallback General Practice (If both specific activities are disabled) */}
            {!settings.srs?.enabled && !settings.writing?.enabled && (
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/40 dark:bg-amber-950/20 -mx-5 sm:-mx-6 px-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-100/50 dark:border-amber-900/30">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">
                      Recordatorio General Diario
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Hora fija de aviso general (activo porque ambas actividades específicas están apagadas).
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pl-9 sm:pl-0">
                  <input
                    type="time"
                    value={settings.manualTime || '20:00'}
                    onChange={(e) => handleToggle('manualTime', e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:[color-scheme:dark]"
                    title="Hora programada para aviso general"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Alerts Preferences & Quiet Hours Card */}
        <div className="bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Preferencias de Alertas & Silencio
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reglas para evitar interrupciones y proteger tu progreso.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/80 border-t border-gray-100 dark:border-gray-800/80">
            {/* 3A. Streak Saver */}
            <div className="py-4 first:pt-3 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-100/50 dark:border-indigo-900/30">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Rescate de Racha Nocturno
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
                    Te avisa antes de que termine el día si aún no has practicado para proteger tu racha.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.streakSaverEnabled}
                aria-label="Activar rescate de racha nocturno"
                onClick={() => handleToggle('streakSaverEnabled', !settings.streakSaverEnabled)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.streakSaverEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    settings.streakSaverEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 3B. SRS Batch */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-100/50 dark:border-indigo-900/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Aviso de Lote de Tarjetas SRS
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
                    Evita avisos individuales notificando solo cuando se acumula un lote de tarjetas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {settings.srsBatchEnabled && (
                  <select
                    value={settings.srsBatchThreshold}
                    onChange={(e) => handleToggle('srsBatchThreshold', Number(e.target.value))}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                    title="Umbral de tarjetas pendientes"
                  >
                    <option value={5}>5 tarjetas</option>
                    <option value={10}>10 tarjetas</option>
                    <option value={15}>15 tarjetas</option>
                    <option value={20}>20 tarjetas</option>
                  </select>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.srsBatchEnabled}
                  aria-label="Activar aviso de lote de tarjetas SRS"
                  onClick={() => handleToggle('srsBatchEnabled', !settings.srsBatchEnabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.srsBatchEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      settings.srsBatchEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 3C. Quiet Hours */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-100/50 dark:border-indigo-900/30">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Horas de Silencio (No Molestar)
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Pausa los avisos en el intervalo de descanso establecido.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pl-9 sm:pl-0">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">De</span>
                <input
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => handleToggle('quietHoursStart', e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:[color-scheme:dark]"
                  title="Inicio de horas de silencio"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">a</span>
                <input
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => handleToggle('quietHoursEnd', e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:[color-scheme:dark]"
                  title="Fin de horas de silencio"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Desktop Diagnostics / Test Notification */}
        <div className="bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              Comprobar Notificaciones de Escritorio
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Verifica el sonido y banner de notificación nativo en Windows Action Center.
            </p>
          </div>

          <button
            onClick={handleTestNotification}
            disabled={testStatus === 'sending'}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
              testStatus === 'success'
                ? 'bg-emerald-600 text-white shadow-xs'
                : testStatus === 'failed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {testStatus === 'sending' ? (
              <RotateCw className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : testStatus === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
            ) : testStatus === 'failed' ? (
              <AlertTriangle className="w-3.5 h-3.5 mr-2" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-2 fill-current" />
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
    </div>
  );
}
