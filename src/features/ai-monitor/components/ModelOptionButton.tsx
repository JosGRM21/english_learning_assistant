import React from 'react';
import { LucideIcon, Check } from 'lucide-react';
import { GeminiModelId } from '@/core/ai/QuotaMatrixOrchestrator';

export interface ModelOptionButtonProps {
  modelId: GeminiModelId;
  title: string;
  roleDescription: string;
  limitsDesc: string;
  icon: LucideIcon;
  isSelected: boolean;
  onSelect: (modelId: GeminiModelId) => void;
}

export const ModelOptionButton: React.FC<ModelOptionButtonProps> = ({
  modelId,
  title,
  roleDescription,
  limitsDesc,
  icon: Icon,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(modelId)}
      className={`group relative p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
          : 'border-gray-200/80 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-[#181D2A]/60 hover:bg-gray-50 dark:hover:bg-[#181D2A]'
      }`}
    >
      <div className="flex items-center gap-2.5 w-full">
        <span
          className={`p-2 rounded-xl transition-colors shrink-0 ${
            isSelected
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
              : 'bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
          {title}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed min-h-[32px] line-clamp-2">
        {roleDescription}
      </p>

      <div className="pt-2 border-t border-gray-100 dark:border-gray-800/70 flex items-center justify-between gap-2 text-[11px] font-mono text-gray-500 dark:text-gray-400 w-full mt-auto">
        <span className="truncate">{limitsDesc}</span>
        {isSelected && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-indigo-600 text-white shadow-xs shrink-0">
            <Check className="w-3 h-3" />
            Activo
          </span>
        )}
      </div>
    </button>
  );
};
