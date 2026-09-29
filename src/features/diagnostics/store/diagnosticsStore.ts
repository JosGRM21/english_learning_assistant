import { create } from 'zustand';
import { WeaknessMetric } from '@/core/types/diagnostics';
import { WeaknessEngine } from '@/core/diagnostics/WeaknessEngine';

const defaultEngine = new WeaknessEngine();

const INITIAL_WEAKNESSES: WeaknessMetric[] = [];

export interface DiagnosticsState {
  weaknesses: WeaknessMetric[];
  setWeaknesses: (weaknesses: WeaknessMetric[]) => void;
  resolveWeakness: (metricId: string) => void;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  weaknesses: INITIAL_WEAKNESSES,

  setWeaknesses: (weaknesses) => set({ weaknesses }),

  resolveWeakness: (metricId: string) =>
    set((state) => ({
      weaknesses: state.weaknesses.map((w) => {
        if (w.id === metricId) {
          const newScore = Math.max(0, w.weaknessScore - 2.5);
          return {
            ...w,
            weaknessScore: newScore,
            isCritical: defaultEngine.isCritical(newScore),
          };
        }
        return w;
      }),
    })),
}));
