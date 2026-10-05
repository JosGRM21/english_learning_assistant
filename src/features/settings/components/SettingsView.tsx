import { useState } from 'react';
import { Bell, Database } from 'lucide-react';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { BackupSettingsModal } from './BackupSettingsModal';

export type SettingsSubTab = 'notifications' | 'backups';

export function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('notifications');

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-gray-200/80 dark:border-gray-800/80 gap-6 px-1">
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          Horarios & Notificaciones
        </button>

        <button
          onClick={() => setActiveSubTab('backups')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'backups'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          Respaldos & Datos
        </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'notifications' && <NotificationSettingsCard />}
      {activeSubTab === 'backups' && <BackupSettingsModal />}
    </div>
  );
}
