import { useState } from 'react';
import { X, BookOpen, PenLine, Library } from 'lucide-react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';
import {
  ReadingSelectionModalProps,
  ReadingCatalogView,
  CustomReadingTab,
  ModalViewTab,
} from './reading-modal';

export { type ReadingSelectionModalProps } from './reading-modal/types';

export function ReadingSelectionModal({
  isOpen,
  onClose,
  onSelectReadingAndMission,
}: ReadingSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<ModalViewTab>('CATALOG');

  if (!isOpen) return null;

  const handleSelectReadingAndMission = (reading: ReadingItem, mission: WritingMission) => {
    onSelectReadingAndMission(reading, mission);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#131722]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3
                id="reading-modal-title"
                className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate"
              >
                Lectura y Redacción Integrada (Reading-to-Write)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Lee un texto con contexto real antes de escribir para inspirar vocabulario y eliminar el bloqueo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('CATALOG')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'CATALOG'
                    ? 'bg-white dark:bg-[#181D2A] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CUSTOM')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'CUSTOM'
                    ? 'bg-white dark:bg-[#181D2A] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Texto Propio</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-white dark:bg-[#131722]">
          {activeTab === 'CATALOG' ? (
            <ReadingCatalogView onSelectReadingAndMission={handleSelectReadingAndMission} />
          ) : (
            <CustomReadingTab onApplyCustomReading={handleSelectReadingAndMission} />
          )}
        </div>
      </div>
    </div>
  );
}
