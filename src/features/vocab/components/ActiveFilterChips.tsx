import { X } from 'lucide-react';
import { GrammaticalDimension, PartOfSpeech, VocabRegister, PART_OF_SPEECH_LABELS_ES, GRAMMATICAL_DIMENSION_LABELS_ES } from '@/core/types/vocab';

export interface ActiveFilterChipsProps {
  searchQuery: string;
  selectedCefr: string;
  selectedDimension: string;
  frequencyBandFilter: string;
  masteryStatusFilter: string;
  onlyFalseFriends: boolean;
  selectedRegister?: string;
  selectedPartOfSpeech?: string;
  originFilter: 'ALL' | 'CORE' | 'VAULT';
  onClearSearch: () => void;
  onClearCefr: () => void;
  onClearDimension: () => void;
  onClearFrequencyBand: () => void;
  onClearMasteryStatus: () => void;
  onClearFalseFriends: () => void;
  onClearRegister?: () => void;
  onClearPartOfSpeech?: () => void;
  onClearOrigin: () => void;
  onResetAll: () => void;
}

const REGISTER_LABELS: Record<VocabRegister, string> = {
  FORMAL: 'Formal',
  INFORMAL: 'Informal',
  NEUTRAL: 'Neutral',
  ACADEMIC: 'Académico',
  SLANG: 'Slang / Coloquial',
};

const FREQUENCY_LABELS: Record<string, string> = {
  TOP_500: 'Top 500 Esencial',
  TOP_1000: 'Top 1000',
  TOP_3000: 'Top 3000',
  TOP_5000: 'Top 5000',
};

const MASTERY_LABELS: Record<string, string> = {
  NEW: 'Por Aprender',
  RECEPTIVE_MASTERY: 'Dominio Receptivo',
  PRODUCTIVE_MASTERY: 'Dominio Productivo',
  INACTIVE: 'Inactivos',
};

export function ActiveFilterChips({
  searchQuery,
  selectedCefr,
  selectedDimension,
  frequencyBandFilter,
  masteryStatusFilter,
  onlyFalseFriends,
  selectedRegister,
  selectedPartOfSpeech,
  originFilter,
  onClearSearch,
  onClearCefr,
  onClearDimension,
  onClearFrequencyBand,
  onClearMasteryStatus,
  onClearFalseFriends,
  onClearRegister,
  onClearPartOfSpeech,
  onClearOrigin,
  onResetAll,
}: ActiveFilterChipsProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (searchQuery.trim()) {
    chips.push({
      key: 'search',
      label: `Búsqueda: "${searchQuery}"`,
      onRemove: onClearSearch,
    });
  }

  if (selectedCefr && selectedCefr !== 'ALL') {
    chips.push({
      key: 'cefr',
      label: `Nivel: ${selectedCefr}`,
      onRemove: onClearCefr,
    });
  }

  if (selectedDimension && selectedDimension !== 'ALL') {
    chips.push({
      key: 'dimension',
      label: `Dimensión: ${GRAMMATICAL_DIMENSION_LABELS_ES[selectedDimension as GrammaticalDimension] ?? selectedDimension}`,
      onRemove: onClearDimension,
    });
  }

  if (frequencyBandFilter && frequencyBandFilter !== 'ALL') {
    chips.push({
      key: 'frequency',
      label: `Banda: ${FREQUENCY_LABELS[frequencyBandFilter] ?? frequencyBandFilter}`,
      onRemove: onClearFrequencyBand,
    });
  }

  if (masteryStatusFilter && masteryStatusFilter !== 'ALL') {
    chips.push({
      key: 'mastery',
      label: `Dominio: ${MASTERY_LABELS[masteryStatusFilter] ?? masteryStatusFilter}`,
      onRemove: onClearMasteryStatus,
    });
  }

  if (onlyFalseFriends) {
    chips.push({
      key: 'ff',
      label: 'Falsos Amigos',
      onRemove: onClearFalseFriends,
    });
  }

  if (selectedRegister && selectedRegister !== 'ALL') {
    chips.push({
      key: 'register',
      label: `Registro: ${REGISTER_LABELS[selectedRegister as VocabRegister] ?? selectedRegister}`,
      onRemove: () => onClearRegister?.(),
    });
  }

  if (selectedPartOfSpeech && selectedPartOfSpeech !== 'ALL') {
    chips.push({
      key: 'pos',
      label: `Categoría: ${PART_OF_SPEECH_LABELS_ES[selectedPartOfSpeech as PartOfSpeech] ?? selectedPartOfSpeech}`,
      onRemove: () => onClearPartOfSpeech?.(),
    });
  }

  if (originFilter !== 'ALL') {
    chips.push({
      key: 'origin',
      label: originFilter === 'CORE' ? 'Solo Corpus Core' : 'Solo Bóveda Personal',
      onRemove: onClearOrigin,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
      <span className="text-gray-400 font-medium text-[11px] mr-1">Filtros activos:</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 font-medium text-[11px]"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="p-0.5 rounded-md hover:bg-indigo-200/60 dark:hover:bg-indigo-800/60 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors"
            title="Quitar filtro"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetAll}
        className="text-[11px] font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 underline ml-1 cursor-pointer transition-colors"
      >
        Limpiar todos
      </button>
    </div>
  );
}
