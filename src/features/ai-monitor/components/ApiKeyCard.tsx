import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GeminiModelId, ApiKeyQuotaSummary } from '@/core/ai/QuotaMatrixOrchestrator';
import { QuotaProgressBar } from './QuotaProgressBar';
import { ApiKeyModelBreakdown } from './ApiKeyModelBreakdown';

export interface ApiKeyCardProps {
  summary: ApiKeyQuotaSummary;
  models: GeminiModelId[];
  canToggle: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  onTest: (secretKey: string) => void;
  isTesting: boolean;
  testResult?: { success: boolean; message: string } | null;
  onDismissTestResult: () => void;
}

export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  summary,
  models,
  canToggle,
  canDelete,
  onToggle,
  onDelete,
  onSetPrimary,
  onTest,
  isTesting,
  testResult,
  onDismissTestResult,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { apiKey, totalRequestsToday, dailyLimit, remainingRequests, rpdStatus, hasRpmCooldown } =
    summary;
  const isExhausted = rpdStatus === 'EXHAUSTED_UNTIL_MIDNIGHT_PT' || totalRequestsToday >= dailyLimit;

  const handleCopy = () => {
    navigator.clipboard?.writeText(apiKey.maskedKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={`w-full p-5 rounded-2xl border transition-all ${
        !apiKey.isActive
          ? 'opacity-65 bg-gray-50/70 dark:bg-[#11141C] border-gray-200/80 dark:border-gray-800'
          : 'bg-white dark:bg-[#131722] border-gray-200/80 dark:border-gray-800/80 shadow-xs hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Key Info */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-[240px]">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                {apiKey.label}
              </h4>
              {apiKey.isPrimary && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                  Principal
                </span>
              )}
              {apiKey.isActive ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                  Activa
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200/80 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  Pausada
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
              <span>{apiKey.maskedKey}</span>

              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer p-0.5 rounded transition-colors"
                title="Copiar clave enmascarada"
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onTest(apiKey.secretKey)}
                disabled={isTesting}
                className="font-sans px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Verificar conexión con Google Gemini"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Verificar conexión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Quota Progress & Status */}
        <div className="flex-1 max-w-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalRequestsToday} de {dailyLimit}
              </span>
              <span className="text-gray-500 dark:text-gray-400">usadas hoy</span>
            </div>

            <div>
              {isExhausted ? (
                <span className="text-rose-500 text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cuota agotada
                </span>
              ) : hasRpmCooldown ? (
                <span className="text-amber-500 text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Enfriamiento temporal
                </span>
              ) : !apiKey.isActive ? (
                <span className="text-gray-400 text-xs font-semibold">Pausada</span>
              ) : (
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Operativa
                </span>
              )}
            </div>
          </div>

          <QuotaProgressBar
            used={totalRequestsToday}
            total={dailyLimit}
            isExhausted={isExhausted}
            hasRpmCooldown={hasRpmCooldown}
          />

          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>
              Restantes:{' '}
              <strong className="text-gray-700 dark:text-gray-300 font-mono">
                {remainingRequests}
              </strong>
            </span>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              <span>{isExpanded ? 'Ocultar desglose' : 'Ver desglose por modelo'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
          {!apiKey.isPrimary && apiKey.isActive && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Hacer principal
            </button>
          )}

          {canToggle && (
            <button
              type="button"
              onClick={onToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                apiKey.isActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
              role="switch"
              aria-checked={apiKey.isActive}
              title={apiKey.isActive ? 'Pausar clave' : 'Activar clave'}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  apiKey.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Eliminar clave"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Model Breakdown Collapsible */}
      <ApiKeyModelBreakdown
        models={models}
        summary={summary}
        isExpanded={isExpanded}
      />

      {/* Inline Test Result Banner */}
      {testResult && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {testResult.success ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="truncate">{testResult.message}</span>
          </div>

          <button
            type="button"
            onClick={onDismissTestResult}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};
