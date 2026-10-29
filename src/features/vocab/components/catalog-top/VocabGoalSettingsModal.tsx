import { useState, useEffect } from 'react';
import { Target, X, Check, Sparkles, ShieldCheck, Layers } from 'lucide-react';
import { Button } from '@heroui/react';
import { FrequencyBand } from '@/core/types/vocab';

export interface VocabGoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: FrequencyBand;
  initialDailyQuota?: number;
  initialIncludePhrasal?: boolean;
  onSaveSettings: (settings: {
    activeGoal: FrequencyBand;
    dailyNewCardsTarget: number;
    includePhrasalVerbs?: boolean;
  }) => Promise<void>;
  isSaving?: boolean;
}

const GOAL_OPTIONS: Array<{
  id: FrequencyBand;
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    id: 'TOP_500',
    title: 'Top 500 Esencial',
    subtitle: 'Nivel A1-A2 (Fundamentos y Phrasal Verbs clave)',
    badge: 'A1-A2',
  },
  {
    id: 'TOP_1000',
    title: 'Top 1000 Consolidación',
    subtitle: 'Nivel A2-B1 (Autonomía y conversación cotidiana)',
    badge: 'A2-B1',
  },
  {
    id: 'TOP_3000',
    title: 'Top 3000 Fluidez',
    subtitle: 'Nivel B1-B2 (Lectura comprensiva y fluidez activa)',
    badge: 'B1-B2',
  },
  {
    id: 'TOP_5000',
    title: 'Top 5000 Avanzado',
    subtitle: 'Nivel B2-C1 (Precisión académica y profesional)',
    badge: 'B2-C1',
  },
];

export function VocabGoalSettingsModal({
  isOpen,
  onClose,
  initialGoal = 'TOP_500',
  initialDailyQuota = 10,
  initialIncludePhrasal = true,
  onSaveSettings,
  isSaving = false,
}: VocabGoalSettingsModalProps) {
  const [selectedGoal, setSelectedGoal] = useState<FrequencyBand>(initialGoal);
  const [selectedQuota, setSelectedQuota] = useState<number>(initialDailyQuota);
  const [includePhrasal, setIncludePhrasal] = useState<boolean>(initialIncludePhrasal);

  useEffect(() => {
    if (isOpen) {
      setSelectedGoal(initialGoal);
      setSelectedQuota(initialDailyQuota);
      setIncludePhrasal(initialIncludePhrasal);
    }
  }, [isOpen, initialGoal, initialDailyQuota, initialIncludePhrasal]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await onSaveSettings({
      activeGoal: selectedGoal,
      dailyNewCardsTarget: selectedQuota,
      includePhrasalVerbs: includePhrasal,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/[0.08] shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Meta de Aprendizaje y Ritmo Diario
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Selecciona tu paquete de frecuencia objetivo y cuántas palabras nuevas deseas introducir automáticamente en cada sesión de Repaso SRS.
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

        <div className="space-y-3 pt-1">
          {/* Track Goal Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Ruta / Nivel Objetivo:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = selectedGoal === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedGoal(opt.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#181D2D]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {opt.title}
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.subtitle}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {opt.badge}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Daily Quota Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Ritmo diario de palabras nuevas:
              </label>
              <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {selectedQuota} nuevas / día
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedQuota(num)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                    selectedQuota === num
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  +{num} {num === 10 && <span className="block text-[9px] font-normal opacity-90">Ideal</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Phrasal Verbs Inclusion Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#161B29] border border-slate-200/80 dark:border-white/[0.06] transition-all">
            <div className="space-y-0.5 pr-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Incluir Verbos Frasales del Nivel</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">Ratio 80/20</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                Dosifica automáticamente 1 o 2 verbos frasales esenciales por sesión dentro de tu cuota diaria.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={includePhrasal}
              onClick={() => setIncludePhrasal(!includePhrasal)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includePhrasal ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  includePhrasal ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Educational Just-In-Time notice */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161B29] border border-slate-200/80 dark:border-white/[0.06] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Entrega Continua Just-In-Time (JIT)</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Las palabras de tu meta se incorporan automáticamente cada día en tu mazo de Repaso SRS según tu ritmo, sin necesidad de activaciones manuales en bloque.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protección Anti-Sobrecarga activa (umbral de 35 repasos pendientes)</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            onPress={onClose}
            isDisabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSave}
            isDisabled={isSaving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
