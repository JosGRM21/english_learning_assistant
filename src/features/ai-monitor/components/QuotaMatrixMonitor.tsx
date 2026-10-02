import { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Cpu,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Loader2,
  Activity,
} from 'lucide-react';
import { GeminiModelId } from '@/core/ai/QuotaMatrixOrchestrator';
import { useQuotaMatrix } from '../hooks/useQuotaMatrix';
import { AddApiKeyModal } from './AddApiKeyModal';

export function QuotaMatrixMonitor() {
  const {
    keySummaries,
    defaultModel,
    setDefaultModel,
    addApiKey,
    removeApiKey,
    toggleApiKey,
    setPrimaryApiKey,
    testApiKey,
    timeUntilReset,
    models,
    formatCountdown,
    requestLogs,
    clearRequestLogs,
  } = useQuotaMatrix();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleCopyKey = (keyId: string, maskedKey: string) => {
    navigator.clipboard?.writeText(maskedKey);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleTestKey = async (keyId: string, secretKey: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await testApiKey(secretKey);
      setTestResult((prev) => ({ ...prev, [keyId]: res }));
    } catch (err: unknown) {
      setTestResult((prev) => ({
        ...prev,
        [keyId]: {
          success: false,
          message: err instanceof Error ? err.message : 'Error al conectar con la API',
        },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  const modelMeta: Record<
    GeminiModelId,
    { title: string; limitsDesc: string; icon: typeof Sparkles }
  > = {
    'gemini-3.8-flash': {
      title: 'Gemini 3.8 Flash',
      limitsDesc: '5 RPM • 20 RPD',
      icon: Sparkles,
    },
    'gemini-3.7-flash': {
      title: 'Gemini 3.7 Flash',
      limitsDesc: '5 RPM • 20 RPD',
      icon: Zap,
    },
    'gemini-3.6-flash': {
      title: 'Gemini 3.6 Flash',
      limitsDesc: '5 RPM • 20 RPD',
      icon: Zap,
    },
    'gemini-3.5-flash-lite': {
      title: 'Gemini 3.5 Flash Lite',
      limitsDesc: '15 RPM • 500 RPD',
      icon: Cpu,
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Left: Icon, Title and Details */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Cpu className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Modelos de IA & Cuotas por API Key
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Límites por modelo (3.8, 3.7 y 3.6: <strong>20 RPD / 5 RPM</strong>; 3.5 Flash Lite: <strong>500 RPD / 15 RPM</strong>). Capacidad de hasta <strong>560 peticiones/día</strong> por clave. Sin conmutación automática de modelo; el cambio es manual. Reseteo diario sincronizado a las 00:00 PT.
              </p>
            </div>
          </div>

          {/* Right: Countdown Pill & Action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Countdown Badge */}
            <div className="px-3.5 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block leading-none">
                  Reseteo (00:00 PT)
                </span>
                <span className="text-xs font-mono font-bold text-gray-900 dark:text-white leading-tight">
                  {formatCountdown(timeUntilReset.ms)}
                </span>
              </div>
            </div>

            {/* Add API Key Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar API Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* Default Model Selector Section */}
      <div className="bg-white dark:bg-[#131722] rounded-2xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Seleccionar Modelo de IA por Defecto</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            El modelo seleccionado será utilizado para todas las peticiones de IA. El cambio de modelo se realiza exclusivamente de forma manual.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {models.map((m) => {
            const isSelected = defaultModel === m;
            const meta = modelMeta[m];
            const Icon = meta.icon;

            return (
              <button
                key={m}
                type="button"
                onClick={() => setDefaultModel(m)}
                className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 min-h-[76px] ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-[#181D2A]'
                }`}
              >
                <span
                  className={`p-2 rounded-xl shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate block">
                    {meta.title}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 block mt-0.5">
                    {meta.limitsDesc}
                  </span>
                  {isSelected && (
                    <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs self-start inline-flex items-center">
                      Por Defecto
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotas Per API Key Horizontal List */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            <span>Listado de API Keys & Cuotas Disponibles</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cada clave acumula hasta 560 peticiones al día distribuidas según los límites de cada modelo Gemini.
          </p>
        </div>

        {keySummaries.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
              No hay API Keys configuradas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Para utilizar las funciones de IA (Taller de Redacción, análisis léxico y retroalimentación inteligente), agrega tu clave gratuita de Google AI Studio.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Primera API Key</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {keySummaries.map((summary) => {
              const { apiKey, totalRequestsToday, dailyLimit, remainingRequests, rpdStatus, hasRpmCooldown } =
                summary;
              const percentage = Math.min(100, Math.round((totalRequestsToday / dailyLimit) * 100));
              const isExhausted = rpdStatus === 'EXHAUSTED_UNTIL_MIDNIGHT_PT' || totalRequestsToday >= dailyLimit;

              return (
                <div
                  key={apiKey.id}
                  className={`w-full p-5 rounded-2xl border transition-all ${
                    !apiKey.isActive
                      ? 'opacity-60 bg-gray-50/80 dark:bg-[#11141C] border-gray-200 dark:border-gray-800'
                      : 'bg-white dark:bg-[#131722] border-gray-200/80 dark:border-gray-800/80 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Key Info */}
                    <div className="flex items-center gap-3.5 min-w-[260px]">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {apiKey.label}
                          </h4>
                          {apiKey.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Principal
                            </span>
                          )}
                          {apiKey.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Activa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              Pausada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                          <span>{apiKey.maskedKey}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(apiKey.id, apiKey.maskedKey)}
                            className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer p-0.5"
                            title="Copiar clave enmascarada"
                          >
                            {copiedKeyId === apiKey.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTestKey(apiKey.id, apiKey.secretKey)}
                            disabled={testingKeyId === apiKey.id}
                            className="font-sans px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Probar llamada a Google Gemini con esta clave"
                          >
                            {testingKeyId === apiKey.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                                <span>Probando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>Probar Clave</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Quota Progress & Status */}
                    <div className="flex-1 max-w-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Cuota Total Diaria:</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {totalRequestsToday} / {dailyLimit}
                          </span>
                          <span className="text-[11px] text-gray-400 font-normal">peticiones</span>
                        </div>

                        <div>
                          {isExhausted ? (
                            <span className="text-rose-500 text-xs font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Agotada (00:00 PT)
                            </span>
                          ) : hasRpmCooldown ? (
                            <span className="text-amber-500 text-xs font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Enfriamiento RPM
                            </span>
                          ) : !apiKey.isActive ? (
                            <span className="text-gray-400 text-xs font-semibold">Pausada</span>
                          ) : (
                            <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Disponible
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isExhausted
                              ? 'bg-rose-500'
                              : percentage > 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center justify-between">
                        <span>Restantes: <strong className="text-gray-700 dark:text-gray-300">{remainingRequests}</strong></span>
                        <span>{percentage}% utilizado</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                      {!apiKey.isPrimary && apiKey.isActive && (
                        <button
                          type="button"
                          onClick={() => setPrimaryApiKey(apiKey.id)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Hacer Principal
                        </button>
                      )}

                      {/* Toggle Active Switch */}
                      <button
                        type="button"
                        onClick={() => toggleApiKey(apiKey.id)}
                        disabled={keySummaries.length <= 1}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          keySummaries.length <= 1
                            ? 'cursor-not-allowed bg-indigo-600 opacity-90'
                            : apiKey.isActive
                              ? 'bg-indigo-600'
                              : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={apiKey.isActive}
                        title={
                          keySummaries.length <= 1
                            ? 'Tu única clave permanece activa para permitir el uso de la IA'
                            : apiKey.isActive
                              ? 'Pausar clave'
                              : 'Activar clave'
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            apiKey.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {keySummaries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeApiKey(apiKey.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Eliminar API Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Per-Model Breakdown Grid */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/80">
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Desglose y Límites por Modelo</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {models.map((m) => {
                        const used = summary.modelBreakdown[m] ?? 0;
                        const limits = summary.modelLimits?.[m] ?? {
                          dailyLimit: m === 'gemini-3.5-flash-lite' ? 500 : 20,
                          rpmLimit: m === 'gemini-3.5-flash-lite' ? 15 : 5,
                        };
                        const quotaState = summary.modelQuotas?.[m];
                        const isModelExhausted =
                          quotaState?.rpdStatus === 'EXHAUSTED_UNTIL_MIDNIGHT_PT' || used >= limits.dailyLimit;
                        const isModelCooldown = Boolean(
                          quotaState?.rpmCooldownUntil && new Date() < new Date(quotaState.rpmCooldownUntil),
                        );
                        const meta = modelMeta[m];

                        return (
                          <div
                            key={m}
                            className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between gap-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate"
                                title={meta.title}
                              >
                                {meta.title.replace('Gemini ', '')}
                              </span>
                              {isModelExhausted ? (
                                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                                  Agotado
                                </span>
                              ) : isModelCooldown ? (
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                  Cooldown
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400 font-mono">
                                  {limits.rpmLimit} RPM
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline justify-between text-xs font-mono">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {used}{' '}
                                <span className="text-[10px] text-gray-400 font-normal">
                                  / {limits.dailyLimit} RPD
                                </span>
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {Math.max(0, limits.dailyLimit - used)} rest.
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline Test Result Banner */}
                  {testResult[apiKey.id] && (
                    <div
                      className={`mt-3 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                        testResult[apiKey.id].success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {testResult[apiKey.id].success ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className="truncate">{testResult[apiKey.id].message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setTestResult((prev) => {
                            const next = { ...prev };
                            delete next[apiKey.id];
                            return next;
                          })
                        }
                        className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* API Requests History Section */}
      <div className="bg-white dark:bg-[#131722] rounded-2xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Registro de Peticiones a la API ({requestLogs.length})</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historial persistente de llamadas realizadas a los modelos de Google Gemini. Se conserva al reiniciar la aplicación.
            </p>
          </div>

          {requestLogs.length > 0 && (
            <button
              type="button"
              onClick={clearRequestLogs}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer self-start sm:self-auto"
            >
              Limpiar Registro
            </button>
          )}
        </div>

        {requestLogs.length === 0 ? (
          <div className="p-8 rounded-xl bg-gray-50/50 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
            No se han registrado peticiones a la API aún. Cuando utilices el Taller de Redacción, el enriquecimiento de vocabulario o pruebes tus claves, quedará constancia aquí.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-2">Fecha y Hora</th>
                  <th className="pb-2">Acción / Servicio</th>
                  <th className="pb-2">Modelo</th>
                  <th className="pb-2">API Key</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-sans">
                {requestLogs.slice(0, 50).map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                        <div>{log.action}</div>
                        {log.errorDetails && (
                          <div
                            className="text-[10px] text-rose-500 dark:text-rose-400 line-clamp-1 font-mono mt-0.5"
                            title={log.errorDetails}
                          >
                            {log.errorDetails}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {log.modelId.replace('gemini-', '')}
                      </td>
                      <td className="py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {log.apiKeyLabel}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        {log.status === 'SUCCESS' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            200 OK
                          </span>
                        ) : log.status === 'RATE_LIMITED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            429 Límite
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add API Key Modal */}
      <AddApiKeyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddKey={addApiKey}
      />
    </div>
  );
}
