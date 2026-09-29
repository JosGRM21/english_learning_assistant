import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { APP_TABS, AppTab, NAV_GROUPS } from '@/shared/constants/app-tabs';
import { useHabitsStore } from '@/features/habits/store/habitsStore';

export interface AppSidebarProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AppSidebar({
  activeTab,
  onNavigateTab,
  isCollapsed,
  onToggleCollapse,
  isDarkMode,
  onToggleDarkMode,
}: AppSidebarProps) {
  const streak = useHabitsStore((s) => s.streak);

  const tabsMap = new Map(APP_TABS.map((t) => [t.id, t]));

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-[#11141D]/95 backdrop-blur-md transition-all duration-300 z-40 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-800/80 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-indigo-500/25 shrink-0">
              ELA
            </div>
            <div className="truncate">
              <h1 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight tracking-tight">
                English Assistant
              </h1>
              <p className="text-[10px] text-gray-400 font-medium truncate">
                FSRS v5 • Fonología & IA
              </p>
            </div>
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed ? (
              <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {group.name}
              </h2>
            ) : (
              <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-800 mx-auto my-2" />
            )}

            <div className="space-y-1">
              {group.tabs.map((tabId) => {
                const tab = tabsMap.get(tabId);
                if (!tab) return null;
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigateTab(tab.id)}
                    title={isCollapsed ? tab.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : tab.activeColorClass
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Strip */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
        {/* Streak Pill */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500 text-white shadow-xs">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 leading-none">
                  Racha Activa
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                  {streak.currentStreak} días
                </div>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 font-mono">
              Freeze: {streak.availableFreezes}
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-2 rounded-2xl bg-amber-500/10 text-amber-500 font-mono text-xs font-bold"
            title={`Racha activa: ${streak.currentStreak} días`}
          >
            <Flame className="w-4 h-4" />
          </div>
        )}

        {/* Action controls row */}
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Listo & Local</span>
            </div>
          )}

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
