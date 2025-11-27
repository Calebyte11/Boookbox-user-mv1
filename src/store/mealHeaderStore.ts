import { create } from "zustand";

export interface MealHeaderInfo {
  mealId: string;
  name: string;
  image: string;
  description?: string;
  category?: string;
}

interface MealHeaderStore {
  meal: MealHeaderInfo | null;
  setMeal: (meal: MealHeaderInfo) => void;
  clearMeal: () => void;
}

export const useMealHeaderStore = create<MealHeaderStore>((set) => ({
  meal: null,
  setMeal: (meal) => set({ meal }),
  clearMeal: () => set({ meal: null }),
}));
