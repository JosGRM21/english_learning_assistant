import { create } from 'zustand';

export interface DashboardState {
  filterCEFR: string | 'ALL';
  setFilterCEFR: (level: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  filterCEFR: 'ALL',
  setFilterCEFR: (level) => set({ filterCEFR: level }),
}));
