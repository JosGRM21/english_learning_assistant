import { useState, useEffect } from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppLayout } from './AppLayout';
import { AppRouter } from './AppRouter';
import { AppTab } from '@/shared/constants/app-tabs';
import { useUpdater } from '@/shared/hooks/useUpdater';
import { UpdateModal } from '@/shared/ui/UpdateModal';

export function App() {
  // Inicializado en 'vocab' temporalmente mientras 'dashboard' y otras secciones se encuentran en desarrollo
  const [activeTab, setActiveTab] = useState<AppTab>('vocab');

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
      <AppLayout activeTab={activeTab} onNavigateTab={setActiveTab}>
        <AppRouter activeTab={activeTab} onNavigateTab={setActiveTab} />
      </AppLayout>

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
