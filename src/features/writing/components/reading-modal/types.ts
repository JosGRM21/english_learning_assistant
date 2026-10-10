import { ReadingItem, ReadingTopicCategory, WritingMission } from '@/data/reading-to-write-catalog';

export type ModalViewTab = 'CATALOG' | 'CUSTOM';

export type CefrFilter = 'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface CategoryFilterOption {
  key: ReadingTopicCategory | 'ALL';
  label: string;
}

export const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { key: 'ALL', label: 'Todos los Temas' },
  { key: 'SHORT_STORIES', label: 'Cuentos' },
  { key: 'TECH_INNOVATION', label: 'Tecnología' },
  { key: 'WORKPLACE_DILEMMAS', label: 'Dilemas Laborales' },
  { key: 'HABITS_PSYCHOLOGY', label: 'Hábitos & Mente' },
  { key: 'CULTURE_TRAVEL', label: 'Viajes' },
];

export const CEFR_LEVELS: CefrFilter[] = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1'];

export interface ReadingSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReadingAndMission: (reading: ReadingItem, mission: WritingMission) => void;
}
