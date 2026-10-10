import { useRef, useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Plus,
  MoreVertical,
  Volume2,
  Zap,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { PageHeader } from '@/shared/ui/PageHeader';

export interface VocabHeaderProps {
  title?: string;
  description?: string;
  accentPreference: 'US' | 'UK';
  onToggleAccent: () => void;
  onAddWordClick: () => void;
  onOpenGoalsModal: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  hasWords: boolean;
  onOpenClearAllModal: () => void;
}

export function VocabHeader({
  title = 'Banco de Vocabulario y Expresiones',
  description = 'Biblioteca léxica pedagógica con polisemia jerárquica, fonética IPA y verbos frasales independientes.',
  accentPreference,
  onToggleAccent,
  onAddWordClick,
  onOpenGoalsModal,
  isSelectionMode,
  onToggleSelectionMode,
  hasWords,
  onOpenClearAllModal,
}: VocabHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <PageHeader
      title={title}
      description={description}
      icon={BookmarkCheck}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct One-Click IPA Accent Toggle */}
          <button
            type="button"
            onClick={onToggleAccent}
            title={`Acento de pronunciación activo: ${accentPreference === 'US' ? 'Inglés Estadounidense (General American)' : 'Inglés Británico (RP)'}. Clic para alternar.`}
            className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-[#161B28] dark:hover:bg-[#1D2334] border border-gray-200/80 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2 cursor-pointer text-xs font-semibold shadow-2xs group"
          >
            <Volume2 className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span className="text-gray-500 dark:text-gray-400 font-normal">Acento:</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              {accentPreference}
            </span>
          </button>

          {/* Catalog Management Overflow Menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-[#161B28] dark:hover:bg-[#1D2334] border border-gray-200/80 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title="Más opciones del catálogo"
              aria-label="Más opciones del catálogo"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-56 p-1.5 bg-white dark:bg-[#141824] rounded-2xl border border-gray-200/90 dark:border-white/[0.1] shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {/* Activar por Metas */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenGoalsModal();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-indigo-50/80 dark:hover:bg-[#1A1F30] flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
                >
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <div className="text-left">
                    <span className="font-semibold block">Activar por Metas</span>
                    <span className="text-[10px] text-gray-400 block">Top 500, 1000, 3000...</span>
                  </div>
                </button>

                {/* Selección Múltiple */}
                {hasWords && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSelectionMode();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-indigo-50/80 dark:hover:bg-[#1A1F30] flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold">
                      {isSelectionMode ? 'Cancelar selección múltiple' : 'Selección múltiple'}
                    </span>
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-white/[0.06] my-1" />

                {/* Borrar Todo */}
                {hasWords && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenClearAllModal();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="font-semibold">Vaciar banco de vocabulario</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Button: Agregar Palabra */}
          <Button
            onPress={onAddWordClick}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Palabra</span>
          </Button>
        </div>
      }
    />
  );
}
