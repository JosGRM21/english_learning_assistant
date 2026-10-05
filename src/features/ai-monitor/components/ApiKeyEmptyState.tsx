import React from 'react';
import { Key, Plus, ExternalLink } from 'lucide-react';

export interface ApiKeyEmptyStateProps {
  onOpenAddModal: () => void;
}

export const ApiKeyEmptyState: React.FC<ApiKeyEmptyStateProps> = ({ onOpenAddModal }) => {
  return (
    <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 text-center space-y-4 shadow-xs">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
        <Key className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Conecta con Google Gemini
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Agrega tu clave gratuita de Google AI Studio para activar la evaluación de redacción en tres fases, el andamiaje pedagógico y el análisis socrático.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar clave de API</span>
        </button>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 px-4 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 font-medium text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>Obtener clave gratuita</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
