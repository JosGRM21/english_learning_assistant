import React, { useState } from 'react';
import { Key, X, Eye, EyeOff, ShieldCheck, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@heroui/react';

export interface AddApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKey: (label: string, secretKey: string, isPrimary: boolean) => void;
}

export function AddApiKeyModal({ isOpen, onClose, onAddKey }: AddApiKeyModalProps) {
  const [label, setLabel] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = secretKey.trim();
    if (!cleanSecret) {
      setErrorMsg('Por favor ingresa una API Key válida de Google Gemini.');
      return;
    }

    if (cleanSecret.length < 10) {
      setErrorMsg('La API Key ingresada parece ser demasiado corta.');
      return;
    }

    onAddKey(label.trim() || 'Gemini API Key', cleanSecret, isPrimary);

    // Reset form
    setLabel('');
    setSecretKey('');
    setIsPrimary(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto custom-scrollbar">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#131722] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Agregar API Key de Google Gemini
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Límites por modelo: 20 RPD (3.8, 3.7, 3.6) y 500 RPD (3.5 Flash Lite) — Hasta 560 peticiones/día por clave.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Label Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Etiqueta o Nombre Descriptivo
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Mi Clave Personal (Google AI Studio)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* API Key Secret Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              API Key Secreta <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="AIzaSy..."
                required
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Obtén tu clave gratuita en{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                aistudio.google.com
              </span>
              . Se almacena localmente de forma segura en tu cliente.
            </p>
          </div>

          {/* Primary Key Checkbox */}
          <label className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Establecer como clave primaria (prioridad 1)
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                Esta clave será intentada en primer lugar antes de activar el failover.
              </span>
            </div>
          </label>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar API Key</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
