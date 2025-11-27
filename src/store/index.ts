// import create from "zustand";
// import type { AuthState } from "@/types/auth";

// interface UIState {
//   isLoading: boolean;
//   setLoading: (loading: boolean) => void;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   isAuthenticated: false,
//   user: null,
//   login: (user: AuthState['user']) => set({ isAuthenticated: true, user }),
//   logout: () => set({ isAuthenticated: false, user: null }),
//   loading: false,
//   error: null,
// }));

// export const useUIStore = create<UIState>((set) => ({
//   isLoading: false,
//   setLoading: (loading) => set({ isLoading: loading }),
// }));
