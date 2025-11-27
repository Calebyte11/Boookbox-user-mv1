import {create} from "zustand";

interface UIState {
  isHeaderSearchOpen: boolean;
  openHeaderSearch: () => void;
  closeHeaderSearch: () => void;
  // isLoading: boolean;
  // setLoading: (loading: boolean) => void;
  // showToast: boolean;
  // toggleToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isHeaderSearchOpen: false,
  openHeaderSearch: () => set({ isHeaderSearchOpen: true }),
  closeHeaderSearch: () => set({ isHeaderSearchOpen: false }),
  // isLoading: false,
  // setLoading: (loading) => set({ isLoading: loading }),
  // showToast: false,
  // toggleToast: () => set((state) => ({ showToast: !state.showToast })),
}));

// export default useUIStore; // Ensure this is uncommented if it's the main export
