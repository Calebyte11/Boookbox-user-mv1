import { create } from "zustand";

interface NavState {
  activeNav: string | null;
  setActiveNav: (nav: string) => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeNav: null,
  setActiveNav: (nav) => set({ activeNav: nav }),
}));
