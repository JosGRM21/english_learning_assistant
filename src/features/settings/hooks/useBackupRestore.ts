import { useState, useMemo, useCallback } from 'react';
import { BackupManager } from '@/infrastructure/backup/BackupManager';
import { FsrsCalibrator } from '@/core/srs/FsrsCalibrator';
import { ReviewLog } from '@/core/types/srs';

interface UseBackupRestoreParams {
  userId: string;
  cards: Record<string, unknown>[];
  reviewLogs: ReviewLog[];
  errors: Record<string, unknown>[];
  streak: Record<string, unknown> | null;
  quests: Record<string, unknown>[];
  onRestoreBackup?: (restoredData: Record<string, unknown>) => void | Promise<void>;
}

export function useBackupRestore({
  userId,
  cards,
  reviewLogs,
  errors,
  streak,
  quests,
  onRestoreBackup,
}: UseBackupRestoreParams) {
  const backupManager = useMemo(() => new BackupManager(), []);
  const calibrator = useMemo(() => new FsrsCalibrator(), []);

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const calibrationReport = useMemo(() => {
    return calibrator.calibrate(reviewLogs, 0.9);
  }, [calibrator, reviewLogs]);

  const handleExport = useCallback(async () => {
    setExportError(null);
    setExportStatus(null);

    const defaultFilename = `ela_backup_${new Date().toISOString().split('T')[0]}.json`;

    try {
      const backup = backupManager.createBackup({
        userId,
        cards,
        reviews: reviewLogs as unknown as Record<string, unknown>[],
        errors,
        streak,
        quests,
      });

      const json = backupManager.serialize(backup);

      // Si estamos en entorno Tauri (escritorio), invocar la ventana nativa para seleccionar dónde guardar
      if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window || (window as unknown as { isTauri?: boolean }).isTauri)) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const filePath = await save({
            title: 'Guardar copia de seguridad',
            defaultPath: defaultFilename,
            filters: [
              {
                name: 'JSON Backup',
                extensions: ['json'],
              },
            ],
          });

          // Si el usuario canceló la ventana de guardado
          if (!filePath) {
            return;
          }

          const { writeTextFile } = await import('@tauri-apps/plugin-fs');
          await writeTextFile(filePath, json);
          setExportStatus(`Copia de seguridad guardada con éxito en: ${filePath}`);
          return;
        } catch (tauriErr) {
          console.warn('Fallo al exportar vía diálogo nativo Tauri, aplicando fallback de navegador:', tauriErr);
        }
      }

      // Fallback web estándar (Blob + enlace de descarga)
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('Copia de seguridad descargada con éxito.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(`Error al generar o guardar la copia de seguridad: ${msg}`);
    }
  }, [backupManager, userId, cards, reviewLogs, errors, streak, quests]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      setImportStatus(null);
      setIsImporting(true);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const restored = backupManager.deserialize(content);

          if (onRestoreBackup) {
            await onRestoreBackup(restored.payload);
          }

          setImportStatus(
            `Copia de seguridad válida restaurada con éxito: ${restored.cardsCount} tarjetas, ${restored.reviewsCount} repasos históricos.`,
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setImportError(`Error al procesar o restaurar la copia de seguridad: ${msg}`);
        } finally {
          setIsImporting(false);
          // Permite volver a seleccionar el mismo archivo si fuese necesario
          e.target.value = '';
        }
      };

      reader.onerror = () => {
        setImportError('Error al leer el archivo desde el disco.');
        setIsImporting(false);
        e.target.value = '';
      };

      reader.readAsText(file);
    },
    [backupManager, onRestoreBackup],
  );

  return {
    calibrationReport,
    importStatus,
    importError,
    isImporting,
    exportStatus,
    exportError,
    handleExport,
    handleFileChange,
  };
}
