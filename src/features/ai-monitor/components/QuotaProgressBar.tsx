import React from 'react';

export interface QuotaProgressBarProps {
  used: number;
  total: number;
  isExhausted?: boolean;
  hasRpmCooldown?: boolean;
}

export const QuotaProgressBar: React.FC<QuotaProgressBarProps> = ({
  used,
  total,
  isExhausted = false,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((used / (total || 1)) * 100)));

  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800/80 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ease-out rounded-full ${
          isExhausted
            ? 'bg-rose-500'
            : percentage > 80
              ? 'bg-amber-500'
              : 'bg-emerald-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
