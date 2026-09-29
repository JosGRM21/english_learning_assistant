import { useState, useEffect, ReactNode } from 'react';
import { AppTab } from '@/shared/constants/app-tabs';
import { AppSidebar } from '@/shared/ui/AppSidebar';
import { AppNavbar } from '@/shared/ui/AppNavbar';

export interface AppLayoutProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
  children: ReactNode;
}

export function AppLayout({ activeTab, onNavigateTab, children }: AppLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ela_theme_dark');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ela_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('ela_theme_dark', String(isDarkMode));
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ela_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0B0D13] text-gray-900 dark:text-gray-100 flex transition-colors duration-300 font-sans">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <AppSidebar
          activeTab={activeTab}
          onNavigateTab={onNavigateTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="w-64 h-full bg-white dark:bg-[#11141D]" onClick={(e) => e.stopPropagation()}>
            <AppSidebar
              activeTab={activeTab}
              onNavigateTab={(tab) => {
                onNavigateTab(tab);
                setIsMobileMenuOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileMenuOpen(false)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppNavbar
          activeTab={activeTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
