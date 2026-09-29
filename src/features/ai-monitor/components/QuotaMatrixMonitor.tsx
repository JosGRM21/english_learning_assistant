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
} from 'lucide-react';
import { Chip } from '@heroui/react';
import { GeminiModelId } from '@/core/ai/QuotaMatrixOrchestrator';
import { useQuotaMatrix } from '../hooks/useQuotaMatrix';
import { AddApiKeyModal } from './AddApiKeyModal';

export function QuotaMatrixMonitor() {
  const {
    keySummaries,
    activeKeysCount,
    defaultModel,
    setDefaultModel,
    addApiKey,
    removeApiKey,
    toggleApiKey,
    setPrimaryApiKey,
    timeUntilReset,
    models,
    formatCountdown,
  } = useQuotaMatrix();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopyKey = (keyId: string, maskedKey: string) => {
    navigator.clipboard?.writeText(maskedKey);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const modelDescriptions: Record<
    GeminiModelId,
    { title: string; subtitle: string; icon: typeof Sparkles }
  > = {
    'gemini-3.8-flash': {
      title: 'Gemini 3.8 Flash',
      subtitle: 'Recomendado • Razonamiento avanzado & Taller Socrático',
      icon: Sparkles,
    },
    'gemini-3.7-flash': {
      title: 'Gemini 3.7 Flash',
      subtitle: 'Balance óptimo velocidad / precisión contextual',
      icon: Zap,
    },
    'gemini-3.6-flash': {
      title: 'Gemini 3.6 Flash',
      subtitle: 'Inferencia veloz & Drills de alta reactividad',
      icon: Zap,
    },
    'gemini-3.5-flash': {
      title: 'Gemini 3.5 Flash',
      subtitle: 'Ultra ligero, bajo consumo & failover seguro',
      icon: Cpu,
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card - Responsive & Fluid without overflow */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Left: Icon, Title and Details */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Cpu className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Modelos de IA & Cuotas por API Key
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {activeKeysCount} {activeKeysCount === 1 ? 'Clave Activa' : 'Claves Activas'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Límite de <strong>80 peticiones por API Key</strong> utilizables indistintamente entre los 4
                modelos Gemini (3.5, 3.6, 3.7 y 3.8). Failover automático y reseteo diario sincronizado.
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
            El modelo seleccionado será la primera opción en cada petición. Si se satura temporalmente, el
            orquestador degradará suavemente al siguiente disponible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {models.map((m) => {
            const isSelected = defaultModel === m;
            const meta = modelDescriptions[m];
            const Icon = meta.icon;

            return (
              <button
                key={m}
                type="button"
                onClick={() => setDefaultModel(m)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-[#181D2A]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {meta.title}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                        Por Defecto
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    {meta.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>Acceso: 80 RPD / Key</span>
                  <span>5 RPM</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotas Per API Key Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            <span>Listado de API Keys & Cuotas Disponibles</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cada clave acumula hasta 80 peticiones al día compartidas entre los modelos Gemini.
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
              Para utilizar las funciones de IA (Taller Socrático, análisis léxico y retroalimentación inteligente), agrega tu clave gratuita de Google AI Studio.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {keySummaries.map((summary) => {
              const { apiKey, totalRequestsToday, dailyLimit, remainingRequests, rpdStatus, hasRpmCooldown } =
                summary;
              const percentage = Math.min(100, Math.round((totalRequestsToday / dailyLimit) * 100));
              const isExhausted = rpdStatus === 'EXHAUSTED_UNTIL_MIDNIGHT_PT' || totalRequestsToday >= dailyLimit;

              return (
                <div
                  key={apiKey.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    !apiKey.isActive
                      ? 'opacity-60 bg-gray-50/80 dark:bg-[#11141C] border-gray-200 dark:border-gray-800'
                      : 'bg-white dark:bg-[#131722] border-gray-200/80 dark:border-gray-800/80 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Key Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-gray-900 dark:text-white">
                            {apiKey.label}
                          </h4>
                          {apiKey.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Principal
                            </span>
                          )}
                          {!apiKey.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              Pausada
                            </span>
                          )}
                        </div>

                        {/* Masked Key Display with Copy */}
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                          <span>{apiKey.maskedKey}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(apiKey.id, apiKey.maskedKey)}
                            className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                            title="Copiar clave enmascarada"
                          >
                            {copiedKeyId === apiKey.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Toggle Active Switch */}
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={apiKey.isActive}
                            onChange={() => toggleApiKey(apiKey.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Quota Progress Bar (Limit: 80) */}
                    <div className="space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 mb-4">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Cuota Diaria Usada:
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
                            {totalRequestsToday}
                          </span>
                          <span className="text-gray-400 text-xs">/ {dailyLimit} peticiones</span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
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

                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-0.5">
                        <span>Restantes: <strong>{remainingRequests}</strong></span>
                        <div>
                          {isExhausted ? (
                            <span className="text-rose-500 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Agotada (00:00 PT)
                            </span>
                          ) : hasRpmCooldown ? (
                            <span className="text-amber-500 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Enfriamiento RPM
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Disponible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Supported Models Badges */}
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                        Modelos Habilitados (3.5, 3.6, 3.7, 3.8):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {models.map((m) => {
                          const used = summary.modelBreakdown[m] ?? 0;
                          return (
                            <Chip
                              key={m}
                              size="sm"
                              className="bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-700 dark:text-gray-300 font-mono"
                            >
                              <Chip.Label>
                                {m.replace('gemini-', '')} ({used})
                              </Chip.Label>
                            </Chip>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      {!apiKey.isPrimary && apiKey.isActive && (
                        <button
                          type="button"
                          onClick={() => setPrimaryApiKey(apiKey.id)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Establecer como Principal
                        </button>
                      )}
                    </div>

                    {keySummaries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeApiKey(apiKey.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar API Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
