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
  onRestoreBackup?: (restoredData: Record<string, unknown>) => void;
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

  const calibrationReport = useMemo(() => {
    return calibrator.calibrate(reviewLogs, 0.9);
  }, [calibrator, reviewLogs]);

  const handleExport = useCallback(() => {
    const backup = backupManager.createBackup({
      userId,
      cards,
      reviews: reviewLogs as unknown as Record<string, unknown>[],
      errors,
      streak,
      quests,
    });

    const json = backupManager.serialize(backup);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ela_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [backupManager, userId, cards, reviewLogs, errors, streak, quests]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      setImportStatus(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const restored = backupManager.deserialize(content);

          setImportStatus(
            `Copia de seguridad válida restaurada con éxito: ${restored.cardsCount} tarjetas, ${restored.reviewsCount} repasos históricos.`,
          );

          if (onRestoreBackup) {
            onRestoreBackup(restored.payload);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setImportError(`Error al procesar el archivo de respaldo: ${msg}`);
        }
      };
      reader.readAsText(file);
    },
    [backupManager, onRestoreBackup],
  );

  return {
    calibrationReport,
    importStatus,
    importError,
    handleExport,
    handleFileChange,
  };
}
