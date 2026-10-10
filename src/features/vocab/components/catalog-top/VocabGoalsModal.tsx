import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { Button } from '@heroui/react';

export interface VocabGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteBatchActivate: (
    target: 'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000',
    count: number,
  ) => Promise<void>;
  isBatchActivating: boolean;
}

export function VocabGoalsModal({
  isOpen,
  onClose,
  onExecuteBatchActivate,
  isBatchActivating,
}: VocabGoalsModalProps) {
  const [batchTarget, setBatchTarget] = useState<
    'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000'
  >('TOP_500');
  const [batchCount, setBatchCount] = useState<number>(20);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onExecuteBatchActivate(batchTarget, batchCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/[0.08] shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Activar Vocabulario por Metas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Incorpora paquetes de palabras de alta frecuencia del Core Corpus a tu mazo de repaso sin saturar tu cuota diaria.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Paquete / Nivel Objetivo:
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setBatchTarget('TOP_500')}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  batchTarget === 'TOP_500'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#181D2D]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Top 500 Esencial</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Nivel A1-A2 (Fundamentos de comunicación)</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">A1</span>
              </label>

              <label
                onClick={() => setBatchTarget('TOP_1000')}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  batchTarget === 'TOP_1000'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#181D2D]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Top 1000 Consolidación</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Nivel A2-B1 (Conversación cotidiana)</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">A2</span>
              </label>

              <label
                onClick={() => setBatchTarget('TOP_3000')}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  batchTarget === 'TOP_3000'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#181D2D]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Top 3000 Fluidez</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Nivel B1-B2 (Lectura y redacción fluida)</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">B1-B2</span>
              </label>

              <label
                onClick={() => setBatchTarget('TOP_5000')}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  batchTarget === 'TOP_5000'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#181D2D]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Top 5000 Avanzado</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Nivel B2-C1 (Precisión académica y profesional)</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">C1</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Cantidad a activar:
            </label>
            <div className="flex items-center gap-2">
              {[10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBatchCount(num)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    batchCount === num
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  +{num} palabras
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            onPress={onClose}
            isDisabled={isBatchActivating}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleConfirm}
            isDisabled={isBatchActivating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isBatchActivating ? 'Activando...' : `Activar ${batchCount} términos`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
