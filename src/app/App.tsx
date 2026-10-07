import { useState, useEffect } from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppLayout } from './AppLayout';
import { AppRouter } from './AppRouter';
import { AppTab } from '@/shared/constants/app-tabs';
import { useUpdater } from '@/shared/hooks/useUpdater';
import { UpdateModal } from '@/shared/ui/UpdateModal';

import { useNotificationScheduler } from '@/features/habits/hooks/useNotificationScheduler';

function AppContent({
  activeTab,
  setActiveTab,
}: {
  activeTab: AppTab;
  setActiveTab: (t: AppTab) => void;
}) {
  useNotificationScheduler();

  return (
    <AppLayout activeTab={activeTab} onNavigateTab={setActiveTab}>
      <AppRouter activeTab={activeTab} onNavigateTab={setActiveTab} />
    </AppLayout>
  );
}

export function App() {
  // Inicializado siempre en 'home' (Inicio) al iniciar la app
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // Restablecer a 'home' únicamente cuando la ventana se cierra a la bandeja de tray o se restaura desde la misma
  useEffect(() => {
    let unlistenRestored: (() => void) | undefined;
    let unlistenClosed: (() => void) | undefined;
    let isSubscribed = true;

    async function setupTrayListeners() {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const currentWin = getCurrentWindow();

        const unlisten1 = await currentWin.listen('app-restored', () => {
          if (isSubscribed) {
            setActiveTab('home');
          }
        });

        const unlisten2 = await currentWin.listen('app-closed-to-tray', () => {
          if (isSubscribed) {
            setActiveTab('home');
          }
        });

        unlistenRestored = unlisten1;
        unlistenClosed = unlisten2;
      } catch {
        // En entorno de navegador estándar o tests
      }
    }

    setupTrayListeners();

    return () => {
      isSubscribed = false;
      if (unlistenRestored) unlistenRestored();
      if (unlistenClosed) unlistenClosed();
    };
  }, []);


  const {
    status,
    updateInfo,
    errorMessage,
    downloadProgress,
    checkForUpdates,
    downloadAndInstallUpdate,
    dismissModal,
  } = useUpdater();

  // Comprobar automáticamente actualizaciones al iniciar la aplicación
  useEffect(() => {
    // Pequeño retardo para no competir con la carga inicial de SQLite/Audio
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);


  return (
    <AppProviders>
      <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modal global al iniciar o detectar nueva versión */}
      <UpdateModal
        isOpen={status === 'available' || status === 'downloading' || status === 'downloaded'}
        status={status}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        errorMessage={errorMessage}
        onConfirmUpdate={downloadAndInstallUpdate}
        onClose={dismissModal}
      />
    </AppProviders>
  );
}


export default App;
