import { Database, AlertCircle, ChevronRight, Menu, Sun, Moon } from 'lucide-react';
import { APP_TABS, AppTab } from '@/shared/constants/app-tabs';
import { useDatabase } from '@/shared/hooks/useDatabase';

export interface AppNavbarProps {
  activeTab: AppTab;
  onToggleMobileMenu?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function AppNavbar({
  activeTab,
  onToggleMobileMenu,
  isDarkMode,
  onToggleDarkMode,
}: AppNavbarProps) {
  const { isReady, error, retry } = useDatabase();
  const currentTab = APP_TABS.find((t) => t.id === activeTab);

  return (
    <header className="h-16 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-[#11141D]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-gray-400 font-medium hidden sm:inline shrink-0">English Assistant</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 hidden sm:inline shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {currentTab?.label ?? 'Inicio'}
          </span>
        </div>
      </div>

      {/* Right: Actions, System & Database Status */}
      <div className="flex items-center gap-3 shrink-0">
        {error ? (
          <button
            onClick={retry}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 transition-colors cursor-pointer"
            title={`Error: ${error.message}. Haz clic para reintentar.`}
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
            <span>Reintentar Conexión</span>
          </button>
        ) : !isReady ? (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
            <Database className="w-3.5 h-3.5 mr-1.5 text-amber-500 animate-pulse" />
            <span>Conectando DB...</span>
          </div>
        ) : null}

        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
}
