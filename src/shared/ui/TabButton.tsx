import { TabDefinition, AppTab } from '../constants/app-tabs';

interface TabButtonProps {
  tab: TabDefinition;
  isActive: boolean;
  onClick: (tab: AppTab) => void;
  variant?: 'desktop' | 'mobile';
}

export function TabButton({ tab, isActive, onClick, variant = 'desktop' }: TabButtonProps) {
  const Icon = tab.icon;

  if (variant === 'mobile') {
    return (
      <button
        onClick={() => onClick(tab.id)}
        className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs transition-colors cursor-pointer ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        {tab.label}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
        isActive
          ? `bg-white dark:bg-[#131722] ${tab.activeColorClass} shadow-xs`
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{tab.label}</span>
    </button>
  );
}
