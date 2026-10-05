import React from 'react';
import { Sparkles, Zap, Cpu } from 'lucide-react';
import { GeminiModelId } from '@/core/ai/QuotaMatrixOrchestrator';
import { ModelOptionButton } from './ModelOptionButton';

export interface ModelSelectorCardProps {
  models: GeminiModelId[];
  defaultModel: GeminiModelId;
  onSelectModel: (model: GeminiModelId) => void;
}

export const MODEL_METADATA: Record<
  GeminiModelId,
  {
    title: string;
    roleDescription: string;
    limitsDesc: string;
    icon: typeof Sparkles;
  }
> = {
  'gemini-3.8-flash': {
    title: 'Gemini 3.8 Flash',
    roleDescription: 'Máxima precisión analítica, redacción formal y evaluación de estilo.',
    limitsDesc: '20 req/día · 5 req/min',
    icon: Sparkles,
  },
  'gemini-3.7-flash': {
    title: 'Gemini 3.7 Flash',
    roleDescription: 'Evaluación pedagógica y detección de interferencia lingüística L1.',
    limitsDesc: '20 req/día · 5 req/min',
    icon: Zap,
  },
  'gemini-3.6-flash': {
    title: 'Gemini 3.6 Flash',
    roleDescription: 'Generación adaptativa de micro-ejercicios y drills estructurados.',
    limitsDesc: '20 req/día · 5 req/min',
    icon: Zap,
  },
  'gemini-3.5-flash-lite': {
    title: 'Gemini 3.5 Flash Lite',
    roleDescription: 'Validaciones ultrarrápidas de vocabulario y alto volumen de peticiones.',
    limitsDesc: '500 req/día · 15 req/min',
    icon: Cpu,
  },
};

export const ModelSelectorCard: React.FC<ModelSelectorCardProps> = ({
  models,
  defaultModel,
  onSelectModel,
}) => {
  return (
    <div className="bg-white dark:bg-[#131722] rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Modelo Activo</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Todas las solicitudes de redacción y análisis lingüístico se procesarán con el modelo seleccionado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {models.map((m) => {
          const meta = MODEL_METADATA[m];
          if (!meta) return null;

          return (
            <ModelOptionButton
              key={m}
              modelId={m}
              title={meta.title}
              roleDescription={meta.roleDescription}
              limitsDesc={meta.limitsDesc}
              icon={meta.icon}
              isSelected={defaultModel === m}
              onSelect={onSelectModel}
            />
          );
        })}
      </div>
    </div>
  );
};
