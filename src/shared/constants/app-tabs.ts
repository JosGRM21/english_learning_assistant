import {
  LayoutDashboard,
  BookmarkCheck,
  Sparkles,
  Ear,
  Zap,
  PenTool,
  BookOpen,
  BarChart2,
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
  | 'dashboard'
  | 'vocab'
  | 'srs'
  | 'minimal_pairs'
  | 'writing'
  | 'drills'
  | 'reader'
  | 'weaknesses'
  | 'quota_matrix'
  | 'settings';

export interface NavGroup {
  name: string;
  tabs: AppTab[];
}

export const APP_TABS: TabDefinition[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Resumen de racha, misiones diarias y progreso general',
  },
  {
    id: 'vocab',
    label: 'Vocabulario',
    icon: BookmarkCheck,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Catálogo de palabras aprendidas, filtros CEFR y nuevo léxico',
  },
  {
    id: 'srs',
    label: 'SRS & Fonología',
    icon: Sparkles,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Repaso espaciado inteligente con FSRS v5 y fonética aplicada',
  },
  {
    id: 'reader',
    label: 'Graded Reader (i+1)',
    icon: BookOpen,
    activeColorClass: 'text-blue-600 dark:text-blue-400',
    description: 'Lectura comprensiva graduada con anotación de noticing',
  },
  {
    id: 'writing',
    label: 'Taller Socrático',
    icon: PenTool,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Estudio de escritura en 3 fases con retroalimentación IA',
  },
  {
    id: 'drills',
    label: 'Speed Drills',
    icon: Zap,
    activeColorClass: 'text-amber-500',
    description: 'Automatización y velocidad de respuesta bajo presión',
  },
  {
    id: 'minimal_pairs',
    label: 'Pares Mínimos',
    icon: Ear,
    activeColorClass: 'text-purple-600 dark:text-purple-400',
    description: 'Gimnasio fonético para discriminación auditiva',
  },
  {
    id: 'weaknesses',
    label: 'Debilidades',
    icon: BarChart2,
    activeColorClass: 'text-rose-600 dark:text-rose-400',
    description: 'Diagnóstico 3D y mapa de calor de errores recurrentes',
  },
  {
    id: 'quota_matrix',
    label: 'Modelos de IA',
    icon: Cpu,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Gestión de API Keys (80 reqs/key) y selección de modelo por defecto',
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
    tabs: ['dashboard', 'vocab', 'srs', 'reader'],
  },
  {
    name: 'Entrenamiento & Práctica',
    tabs: ['writing', 'drills', 'minimal_pairs', 'weaknesses'],
  },
  {
    name: 'Sistema & Configuración',
    tabs: ['quota_matrix', 'settings'],
  },
];
