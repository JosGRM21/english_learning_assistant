import { useState, useCallback } from 'react';

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'downloaded'
  | 'error';

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);

  const checkForUpdates = useCallback(async (isManual: boolean = false) => {
    try {
      setStatus('checking');
      setErrorMessage(null);

      // Import dinámico para que no falle en entornos no-Tauri (ej. navegador/tests)
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update?.available) {
        setPendingUpdate(update);
        setUpdateInfo({
          version: update.version,
          currentVersion: update.currentVersion,
          body: update.body,
          date: update.date,
        });
        setStatus('available');
        return true;
      } else {
        setPendingUpdate(null);
        setUpdateInfo(null);
        setStatus('up-to-date');
        return false;
      }
    } catch (err: any) {
      console.warn('Error al verificar actualizaciones:', err);
      const msg = err?.message || String(err);
      if (isManual) {
        setErrorMessage(msg);
        setStatus('error');
      } else {
        // En background silencioso al inicio, no incomodar con modal si no hay internet
        setStatus('idle');
      }
      return false;
    }
  }, []);

  const downloadAndInstallUpdate = useCallback(async () => {
    if (!pendingUpdate) return;
    try {
      setStatus('downloading');
      setDownloadProgress(0);

      let downloaded = 0;
      let contentLength = 0;

      await pendingUpdate.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
            }
            break;
          case 'Finished':
            setDownloadProgress(100);
            setStatus('downloaded');
            break;
        }
      });

      setStatus('downloaded');

      // Reiniciar la aplicación para aplicar actualización
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err: any) {
      console.error('Error al descargar o instalar la actualización:', err);
      setErrorMessage(err?.message || 'Fallo durante la descarga de la actualización');
      setStatus('error');
    }
  }, [pendingUpdate]);

  const dismissModal = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    status,
    updateInfo,
    errorMessage,
    downloadProgress,
    checkForUpdates,
    downloadAndInstallUpdate,
    dismissModal,
  };
}
