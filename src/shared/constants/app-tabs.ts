import {
  Home,
  BookmarkCheck,
  Sparkles,
  PenTool,
  Cpu,
  Settings,
  Info,
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
  | 'home'
  | 'vocab'
  | 'srs'
  | 'writing'
  | 'quota_matrix'
  | 'settings'
  | 'about';

export interface NavGroup {
  name: string;
  tabs: AppTab[];
}

export const APP_TABS: TabDefinition[] = [
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Pantalla de inicio y acceso a las áreas del asistente',
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
    label: 'Configuración',
    icon: Settings,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Horarios de práctica, notificaciones de repaso y respaldos de datos',
  },
  {
    id: 'about',
    label: 'Acerca de',
    icon: Info,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Información del sistema, versión de la aplicación y actualizaciones',
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'General',
    tabs: ['home'],
  },
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
    tabs: ['quota_matrix', 'settings', 'about'],
  },
];

