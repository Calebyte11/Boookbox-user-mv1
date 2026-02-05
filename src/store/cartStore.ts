import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItemChoices {
  [key: string]: string[] | undefined;
  // Keep backward compatibility with existing required fields
  foodChoice?: string[];
  toppingChoice?: string[];
  proteinChoice?: string[];
}

export interface CartItem {
  id: string; // Unique ID for the cart item (e.g., mealId + hash of choices + instructions)
  mealId: string;
  restaurantId: string;
  restaurantName?: string; // Optional: if you want to display restaurant name in cart
  mealName: string;
  mealImage?: string; // Optional: if you want to display meal image in cart
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  currency?: string; // Optional: currency for the item
  choices: CartItemChoices;
  userInstruction?: string;
  appliedPricingTier?: 'unit' | 'dozen' | 'carton'; // Track which pricing tier was applied
  baseUnitPrice?: number; // Base price per unit (before bulk pricing)
  pricingTierData?: {
    dozen?: { quantity: number; price: number };
    carton?: { quantity: number; price: number };
  }; // Pricing tier info for recalculation
}

export interface CartState {
  items: CartItem[];
  currentRestaurantId: string | null; // Track current restaurant
  addItem: (
    itemData: Omit<CartItem, "id" | "totalPrice">,
    replaceCart?: boolean
  ) => void;
  addItemWithRestaurantCheck: (
    itemData: Omit<CartItem, "id" | "totalPrice">
  ) => "added" | "conflict";
  switchRestaurant: (itemData: Omit<CartItem, "id" | "totalPrice">) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  getItemById: (itemId: string) => CartItem | undefined;
  getCurrentRestaurantId: () => string | null;
  // Computed properties can be selectors outside the store or methods if simple
}

// Helper function to generate a unique ID for cart items based on content
const generateCartItemId = (
  mealId: string,
  choices: CartItemChoices,
  userInstruction?: string
): string => {
  const choicesString = JSON.stringify(choices);
  const instructionString = userInstruction || "";
  return `${mealId}-${choicesString}-${instructionString}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      currentRestaurantId: null,

      addItem: (itemData, replaceCart = false) =>
        set((state) => {
          // If replaceCart is true or different restaurant, clear existing items
          if (
            replaceCart ||
            (state.currentRestaurantId &&
              state.currentRestaurantId !== itemData.restaurantId)
          ) {
            const newItemId = generateCartItemId(
              itemData.mealId,
              itemData.choices,
              itemData.userInstruction
            );
            return {
              items: [
                {
                  ...itemData,
                  id: newItemId,
                  totalPrice: itemData.quantity * itemData.pricePerUnit,
                },
              ],
              currentRestaurantId: itemData.restaurantId,
            };
          }

          // Normal add item logic for same restaurant
          const newItemId = generateCartItemId(
            itemData.mealId,
            itemData.choices,
            itemData.userInstruction
          );
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === newItemId
          );

          const newItems = [...state.items];

          if (existingItemIndex > -1) {
            // Item already exists, update quantity and total price
            const existingItem = newItems[existingItemIndex];
            const newQuantity = existingItem.quantity + itemData.quantity;
            newItems[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalPrice: newQuantity * existingItem.pricePerUnit,
            };
          } else {
            // Item does not exist, add new item
            newItems.push({
              ...itemData,
              id: newItemId,
              totalPrice: itemData.quantity * itemData.pricePerUnit,
            });
          }

          return {
            items: newItems,
            currentRestaurantId: itemData.restaurantId,
          };
        }),

      addItemWithRestaurantCheck: (itemData) => {
        const state = get();

        // If cart is empty or same restaurant, add normally
        if (
          !state.currentRestaurantId ||
          state.currentRestaurantId === itemData.restaurantId
        ) {
          get().addItem(itemData);
          return "added";
        }

        // Different restaurant detected
        return "conflict";
      },

      switchRestaurant: (itemData) => {
        get().addItem(itemData, true); // Force replace cart
      },
      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          return {
            items: newItems,
            // If no items left, clear restaurant ID
            currentRestaurantId:
              newItems.length > 0 ? state.currentRestaurantId : null,
          };
        }),

      updateItemQuantity: (itemId, newQuantity) =>
        set((state) => {
          if (newQuantity <= 0) {
            // If quantity is 0 or less, remove the item
            const newItems = state.items.filter((item) => item.id !== itemId);
            return {
              items: newItems,
              // If no items left, clear restaurant ID
              currentRestaurantId:
                newItems.length > 0 ? state.currentRestaurantId : null,
            };
          }
          return {
            items: state.items.map((item) => {
              if (item.id === itemId) {
                // Calculate effective price based on bulk pricing tiers if available
                let effectiveUnitPrice = item.pricePerUnit;
                let appliedTier: 'unit' | 'dozen' | 'carton' = 'unit';
                
                if (item.pricingTierData && item.baseUnitPrice) {
                  // Check carton first (largest tier)
                  if (item.pricingTierData.carton && 
                      newQuantity >= item.pricingTierData.carton.quantity && 
                      newQuantity % item.pricingTierData.carton.quantity === 0) {
                    const multiplier = newQuantity / item.pricingTierData.carton.quantity;
                    effectiveUnitPrice = (item.pricingTierData.carton.price * multiplier) / newQuantity;
                    appliedTier = 'carton';
                  }
                  // Check dozen next
                  else if (item.pricingTierData.dozen && 
                      newQuantity >= item.pricingTierData.dozen.quantity && 
                      newQuantity % item.pricingTierData.dozen.quantity === 0) {
                    const multiplier = newQuantity / item.pricingTierData.dozen.quantity;
                    effectiveUnitPrice = (item.pricingTierData.dozen.price * multiplier) / newQuantity;
                    appliedTier = 'dozen';
                  }
                  // Otherwise use base unit price
                  else {
                    effectiveUnitPrice = item.baseUnitPrice;
                    appliedTier = 'unit';
                  }
                }
                
                return {
                  ...item,
                  quantity: newQuantity,
                  pricePerUnit: effectiveUnitPrice,
                  totalPrice: newQuantity * effectiveUnitPrice,
                  appliedPricingTier: appliedTier,
                };
              }
              return item;
            }),
            currentRestaurantId: state.currentRestaurantId,
          };
        }),

      clearCart: () => set({ items: [], currentRestaurantId: null }),

      getItemById: (itemId) => get().items.find((item) => item.id === itemId),

      getCurrentRestaurantId: () => get().currentRestaurantId,
    }),
    {
      name: "cart-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        items: state.items,
        currentRestaurantId: state.currentRestaurantId,
      }),
    }
  )
);

// Selectors (can be defined outside or as part of the store if preferred)
export const selectTotalCartItems = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectTotalCartPrice = (state: CartState) =>
  state.items.reduce((total, item) => total + item.totalPrice, 0);

// Selector that calculates total price considering number of recipients
export const selectTotalCartPriceWithRecipients = (
  cartState: CartState,
  numberOfRecipients: number = 1,
  bookingType?: "yourself" | "others" | "public"
) => {
  const baseTotal = cartState.items.reduce(
    (total, item) => total + item.totalPrice,
    0
  );

  // For multiple recipients or public bookings, multiply by number of recipients
  if (
    numberOfRecipients > 1 &&
    (bookingType === "public" || bookingType === "others")
  ) {
    return baseTotal * numberOfRecipients;
  }

  return baseTotal;
};

export default useCartStore;
