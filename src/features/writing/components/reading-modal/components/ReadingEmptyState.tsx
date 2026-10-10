import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@heroui/react';

export interface ReadingEmptyStateProps {
  onResetFilters: () => void;
}

export function ReadingEmptyState({ onResetFilters }: ReadingEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 min-h-[260px] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
      <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
        <SearchX className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          No se encontraron lecturas
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          Intenta ajustar los filtros de nivel o la búsqueda para ver más textos disponibles.
        </p>
      </div>
      <Button
        size="sm"
        variant="primary"
        onPress={onResetFilters}
        className="mt-2 text-xs font-semibold rounded-xl cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1" />
        Restablecer filtros
      </Button>
    </div>
  );
}
