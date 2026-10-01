
export interface KbdPillProps {
  /** The key or key combination to display (e.g. 'Space', '1-4', 'R', 'Ctrl + Enter') */
  keyLabel: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Visual emphasis */
  variant?: 'default' | 'subtle' | 'accent' | 'warning';
  /** Optional custom CSS class */
  className?: string;
  /** Tooltip or accessible label */
  title?: string;
}

export function KbdPill({
  keyLabel,
  size = 'sm',
  variant = 'default',
  className = '',
  title,
}: KbdPillProps) {
  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] min-w-[18px] h-4.5',
    sm: 'px-2 py-0.5 text-[11px] min-w-[22px] h-5.5',
    md: 'px-2.5 py-1 text-xs min-w-[26px] h-6.5',
    lg: 'px-3 py-1.5 text-sm min-w-[32px] h-8',
  }[size];

  const variantStyles = {
    default:
      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 shadow-[0_2px_0_0_rgba(156,163,175,0.8)] dark:shadow-[0_2px_0_0_rgba(31,41,55,0.9)] active:shadow-none active:translate-y-[2px]',
    subtle:
      'bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 shadow-[0_1.5px_0_0_rgba(209,213,219,0.7)] dark:shadow-[0_1.5px_0_0_rgba(55,65,81,0.8)]',
    accent:
      'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 shadow-[0_2px_0_0_rgba(129,140,248,0.8)] dark:shadow-[0_2px_0_0_rgba(67,56,202,0.9)]',
    warning:
      'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 shadow-[0_2px_0_0_rgba(245,158,11,0.8)] dark:shadow-[0_2px_0_0_rgba(180,83,9,0.9)]',
  }[variant];

  // If compound key like "Ctrl + Enter", split or display
  return (
    <kbd
      title={title || `Atajo de teclado: ${keyLabel}`}
      className={`inline-flex items-center justify-center font-mono font-bold tracking-tight rounded-md border select-none transition-all duration-75 align-middle ${sizeStyles} ${variantStyles} ${className}`}
    >
      {keyLabel}
    </kbd>
  );
}
