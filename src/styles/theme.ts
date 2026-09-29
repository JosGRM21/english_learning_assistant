export const THEME_CONFIG = {
  light: {
    background: '#FBFBF9',
    foreground: '#111827',
    primary: '#4F46E5',
    success: '#047857',
    warning: '#B45309',
    danger: '#B91C1C',
  },
  dark: {
    background: '#0B0D13',
    foreground: '#F9FAFB',
    primary: '#6366F1',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  },
} as const;

export type ThemeMode = keyof typeof THEME_CONFIG;
export type ThemeColors = typeof THEME_CONFIG.light;
