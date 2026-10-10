import { CheckSquare, Trash2, X } from 'lucide-react';
import { Button } from '@heroui/react';

export interface VocabSelectionBarProps {
  selectedCount: number;
  isAllPageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onClearSelection: () => void;
  onConfirmBulkDelete: () => void;
}

export function VocabSelectionBar({
  selectedCount,
  isAllPageSelected,
  onToggleSelectAllPage,
  onClearSelection,
  onConfirmBulkDelete,
}: VocabSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-4 z-40 p-3 px-4 rounded-2xl bg-white/95 dark:bg-[#151926]/95 backdrop-blur-md border-2 border-indigo-500 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1.5 font-sans">
          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {selectedCount} {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
        </span>

        <button
          type="button"
          onClick={onToggleSelectAllPage}
          className="text-xs text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold cursor-pointer hidden sm:inline-block transition-colors"
        >
          {isAllPageSelected ? 'Deseleccionar página actual' : 'Seleccionar página actual'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onPress={onClearSelection}
          className="h-8 px-3 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelar</span>
        </Button>
        <Button
          size="sm"
          onPress={onConfirmBulkDelete}
          className="h-8 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar ({selectedCount})</span>
        </Button>
      </div>
    </div>
  );
}
