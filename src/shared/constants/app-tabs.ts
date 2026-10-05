import {
  BookmarkCheck,
  Sparkles,
  PenTool,
  Cpu,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface TabDefinition {
  id: AppTab;
  label: string;
  icon: LucideIcon;
  activeColorClass: string;
  description?: string;
}

export type AppTab =
  | 'vocab'
  | 'srs'
  | 'writing'
  | 'quota_matrix'
  | 'settings';

export interface NavGroup {
  name: string;
  tabs: AppTab[];
}

export const APP_TABS: TabDefinition[] = [
  {
    id: 'vocab',
    label: 'Vocabulario',
    icon: BookmarkCheck,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Catálogo de palabras aprendidas, filtros CEFR y nuevo léxico',
  },
  {
    id: 'srs',
    label: 'SRS & Fonética',
    icon: Sparkles,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Repaso espaciado inteligente con tarjetas interactivas y fonética aplicada',
  },
  {
    id: 'writing',
    label: 'Taller de Redacción',
    icon: PenTool,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Práctica guiada de redacción con pistas de mejora y evaluación detallada',
  },
  {
    id: 'quota_matrix',
    label: 'Modelos de IA',
    icon: Cpu,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Gestión de API Keys (hasta 560 peticiones/clave) y selección de modelo principal',
  },
  {
    id: 'settings',
    label: 'Respaldos',
    icon: Settings,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Exportación, importación y mantenimiento de base de datos',
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Aprendizaje',
    tabs: ['vocab', 'srs'],
  },
  {
    name: 'Producción & Práctica',
    tabs: ['writing'],
  },
  {
    name: 'Sistema & Configuración',
    tabs: ['quota_matrix', 'settings'],
  },
];
