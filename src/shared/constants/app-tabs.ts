import {
  // LayoutDashboard, // En desarrollo: temporalmente deshabilitado en UI
  BookmarkCheck,
  Sparkles,
  // Ear, // En desarrollo: temporalmente deshabilitado en UI
  // Zap, // En desarrollo: temporalmente deshabilitado en UI
  PenTool,
  // BookOpen, // En desarrollo: temporalmente deshabilitado en UI
  // BarChart2, // En desarrollo: temporalmente deshabilitado en UI
  Cpu,
  Settings,
  // Compass, // En desarrollo: temporalmente deshabilitado en UI
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
  | 'semantics'
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
  // Funcionalidad en desarrollo: No se muestra temporalmente en el sidebar/UI
  /*
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Resumen de racha, misiones diarias y progreso general',
  },
  */
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
  // Funcionalidad en desarrollo: No se muestra temporalmente en el sidebar/UI
  /*
  {
    id: 'reader',
    label: 'Lectura Graduada',
    icon: BookOpen,
    activeColorClass: 'text-blue-600 dark:text-blue-400',
    description: 'Lectura adaptada por nivel con análisis de vocabulario y audio',
  },
  {
    id: 'semantics',
    label: 'Semántica & Expresión',
    icon: Compass,
    activeColorClass: 'text-purple-600 dark:text-purple-400',
    description: 'Verbos de movimiento en inglés y desambiguación de significados',
  },
  */
  {
    id: 'writing',
    label: 'Taller de Redacción',
    icon: PenTool,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Práctica guiada de redacción con pistas de mejora y evaluación detallada',
  },
  // Funcionalidad en desarrollo: No se muestra temporalmente en el sidebar/UI
  /*
  {
    id: 'drills',
    label: 'Entrenamiento Rápido',
    icon: Zap,
    activeColorClass: 'text-amber-500',
    description: 'Automatización y agilidad de respuesta verbal en inglés',
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
  */
  {
    id: 'quota_matrix',
    label: 'Modelos de IA',
    icon: Cpu,
    activeColorClass: 'text-indigo-600 dark:text-indigo-400',
    description: 'Gestión de API Keys (80 peticiones por clave) y selección de modelo principal',
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
    tabs: [
      // Funcionalidad en desarrollo: No se muestra temporalmente en el sidebar/UI
      // 'dashboard',
      'vocab',
      'srs',
      // Funcionalidad en desarrollo: No se muestra temporalmente en el sidebar/UI
      // 'reader',
    ],
  },
  // Funcionalidad en desarrollo: Fonología & Semántica temporalmente deshabilitada en la UI
  /*
  {
    name: 'Fonología & Semántica',
    tabs: [
      // 'semantics',
      // 'minimal_pairs',
    ],
  },
  */
  {
    name: 'Producción & Práctica',
    tabs: [
      'writing',
      // Funcionalidad en desarrollo: No se muestra temporalmente en el sidebar/UI
      // 'drills',
      // 'weaknesses',
    ],
  },
  {
    name: 'Sistema & Configuración',
    tabs: ['quota_matrix', 'settings'],
  },
];
