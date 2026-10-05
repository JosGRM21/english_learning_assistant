import React from 'react';
import { Activity } from 'lucide-react';
import { GeminiModelId, ApiKeyQuotaSummary } from '@/core/ai/QuotaMatrixOrchestrator';
import { MODEL_METADATA } from './ModelSelectorCard';

export interface ApiKeyModelBreakdownProps {
  models: GeminiModelId[];
  summary: ApiKeyQuotaSummary;
  isExpanded: boolean;
}

export const ApiKeyModelBreakdown: React.FC<ApiKeyModelBreakdownProps> = ({
  models,
  summary,
  isExpanded,
}) => {
  if (!isExpanded) return null;

  return (
    <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/80 animate-in fade-in duration-200">
      <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2.5 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-indigo-500" />
        <span>Uso por modelo</span>
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
          const meta = MODEL_METADATA[m];
          const shortName = meta?.title.replace('Gemini ', '') ?? m;

          return (
            <div
              key={m}
              className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate"
                  title={meta?.title ?? m}
                >
                  {shortName}
                </span>

                {isModelExhausted ? (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                    Agotado
                  </span>
                ) : isModelCooldown ? (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                    Espera
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-mono">
                    {limits.rpmLimit} req/min
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between text-xs font-mono">
                <span className="font-bold text-gray-900 dark:text-white">
                  {used}{' '}
                  <span className="text-[10px] text-gray-400 font-normal">
                    / {limits.dailyLimit} req
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
  );
};
