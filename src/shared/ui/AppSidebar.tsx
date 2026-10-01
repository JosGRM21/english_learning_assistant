import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { APP_TABS, AppTab, NAV_GROUPS } from '@/shared/constants/app-tabs';

export interface AppSidebarProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function AppSidebar({
  activeTab,
  onNavigateTab,
  isCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
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
      <div className="flex-1 overflow-y-auto custom-scrollbar-thin px-3 py-4 space-y-6">
        {NAV_GROUPS.filter((group) => group.tabs.length > 0).map((group, groupIdx) => (
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

      {/* Sidebar Footer Strip (Empty or removed if not needed) */}
    </aside>
  );
}
