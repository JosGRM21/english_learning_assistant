import { Download, RefreshCw, Sparkles, AlertTriangle, X } from 'lucide-react';
import { UpdateInfo, UpdateStatus } from '@/shared/hooks/useUpdater';

export interface UpdateModalProps {
  isOpen: boolean;
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  downloadProgress: number;
  errorMessage: string | null;
  onConfirmUpdate: () => void;
  onClose: () => void;
}

export function UpdateModal({
  isOpen,
  status,
  updateInfo,
  downloadProgress,
  errorMessage,
  onConfirmUpdate,
  onClose,
}: UpdateModalProps) {
  if (!isOpen) return null;

  const isDownloading = status === 'downloading';
  const isDownloaded = status === 'downloaded';
  const isError = status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#131722] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 relative overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!isDownloading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            {isError ? (
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            ) : isDownloading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            ) : (
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
              {isError
                ? 'Error al actualizar'
                : isDownloading
                  ? 'Descargando actualización...'
                  : isDownloaded
                    ? 'Reiniciando aplicación...'
                    : '¡Nueva versión disponible!'}
            </h3>
            {updateInfo && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Versión v{updateInfo.version}{' '}
                <span className="text-gray-400 font-normal">
                  (actual: v{updateInfo.currentVersion})
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300">
          {isError ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 leading-relaxed">
              {errorMessage || 'Ocurrió un error inesperado al intentar actualizar la aplicación.'}
            </div>
          ) : updateInfo?.body ? (
            <div className="max-h-40 overflow-y-auto p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800 space-y-1 custom-scrollbar-thin">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Notas de la versión
              </span>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                {updateInfo.body}
              </p>
            </div>
          ) : (
            <p className="leading-relaxed">
              Hay una actualización lista con mejoras de rendimiento, correcciones y novedades para
              tu asistente de aprendizaje.
            </p>
          )}

          {/* Progress bar during download */}
          {isDownloading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                <span>Progreso</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{downloadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {!isDownloading && !isDownloaded && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#181D2A] text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Recordar más tarde
            </button>
          )}

          {!isDownloading && !isDownloaded && !isError && (
            <button
              onClick={onConfirmUpdate}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Actualizar ahora</span>
            </button>
          )}

          {isError && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
