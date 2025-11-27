import { create } from "zustand";

// Global API error store
interface ApiErrorState {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
