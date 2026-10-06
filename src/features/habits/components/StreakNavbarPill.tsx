import { Flame } from 'lucide-react';
import dayjs from 'dayjs';
import { useHabitsStore } from '../store/habitsStore';

export function StreakNavbarPill() {
  const streak = useHabitsStore((s) => s.streak);
  const todayStr = dayjs().format('YYYY-MM-DD');

  const isStreakActiveToday = Boolean(
    streak.lastActivityDate && streak.lastActivityDate === todayStr && streak.currentStreak > 0,
  );

  const diffDays = streak.lastActivityDate
    ? dayjs(todayStr).diff(dayjs(streak.lastActivityDate), 'day')
    : 0;

  const isBroken = Boolean(streak.lastActivityDate && diffDays > 1 && streak.availableFreezes === 0);
  const displayStreak = isBroken ? 0 : streak.currentStreak;

  const tooltip = isStreakActiveToday
    ? `¡Racha de hoy completada! ${displayStreak} ${displayStreak === 1 ? 'día consecutivo' : 'días consecutivos'} (Récord: ${streak.longestStreak} d)`
    : displayStreak > 0
      ? `Racha en progreso: ${displayStreak} ${displayStreak === 1 ? 'día' : 'días'}. Realiza un repaso o escribe en el taller hoy para mantenerla.`
      : 'Sin racha activa (0 días). Realiza un repaso o escribe en el taller de redacción para activarla.';

  return (
    <div
      data-testid="streak-navbar-pill"
      title={tooltip}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none cursor-default ${
        isStreakActiveToday
          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 shadow-2xs'
          : displayStreak > 0
            ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-800/50 text-orange-700 dark:text-orange-400'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200/80 dark:border-gray-800 text-gray-500 dark:text-gray-400'
      }`}
    >
      <Flame
        className={`w-4 h-4 transition-transform ${
          isStreakActiveToday
            ? 'text-amber-500 fill-amber-500 animate-pulse'
            : displayStreak > 0
              ? 'text-orange-500/80 fill-orange-500/20'
              : 'text-gray-400 dark:text-gray-500'
        }`}
      />
      <span className="font-mono font-bold text-xs">{displayStreak}</span>
      <span className="hidden sm:inline text-[11px] font-medium font-sans">
        {displayStreak === 1 ? 'día' : 'días'}
      </span>
    </div>
  );
}
