import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface RecipientDetails {
  name: string;
  phone: string;
  email: string;
  message?: string; // Optional message to recipient
}

export interface BookingDetails {
  bookingId?: string;
  bookingType?: "yourself" | "others" | "public";
  numberOfRecipients?: number;
  recipientDetails: RecipientDetails | null;
  deliveryDate: string | null;
  deliveryTime: string | null;
  specialInstructions?: string;
  paymentMethod?: string;
  isGift: boolean;
  restaurantId?: string;
  restaurantName?: string;
  location?: string; // Store the complete booking payload for API call
  bookingPayload?: Record<string, unknown>;
  calculatedTotalAmount?: number; // Store the total amount calculated from OrderForm
}

export interface BookingState extends BookingDetails {
  // Actions
  setRecipientDetails: (details: RecipientDetails) => void;
  setDeliveryDate: (date: string) => void;
  setDeliveryTime: (time: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  setPaymentMethod: (method: string) => void;
  setIsGift: (isGift: boolean) => void;
  setBookingType: (type: "yourself" | "others" | "public") => void;
  setNumberOfRecipients: (count: number) => void;
  clearBookingDetails: () => void;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  setBookingPayload: (payload: Record<string, unknown>) => void;
  clearBookingAndPayload: () => void;
}

const initialState: BookingDetails = {
  recipientDetails: null,
  numberOfRecipients: 1,
  deliveryDate: null,
  deliveryTime: null,
  specialInstructions: "",
  paymentMethod: "",
  isGift: true, // Default to gift since this is BoookBox
  calculatedTotalAmount: undefined,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRecipientDetails: (details: RecipientDetails) =>
        set({ recipientDetails: details }),

      setDeliveryDate: (date: string) => set({ deliveryDate: date }),

      setDeliveryTime: (time: string) => set({ deliveryTime: time }),

      setSpecialInstructions: (instructions: string) =>
        set({ specialInstructions: instructions }),

      setPaymentMethod: (method: string) => set({ paymentMethod: method }),
      setIsGift: (isGift: boolean) => set({ isGift }),
      setBookingType: (type: "yourself" | "others" | "public") =>
        set({ bookingType: type }),

      setNumberOfRecipients: (count: number) =>
        set({ numberOfRecipients: count }),
      updateBookingDetails: (details: Partial<BookingDetails>) =>
        set((state) => ({ ...state, ...details })),
      setBookingPayload: (payload: Record<string, unknown>) => {
        const currentState = get();
        // Simple duplication check - if payload is exactly the same, skip
        if (
          currentState.bookingPayload &&
          JSON.stringify(currentState.bookingPayload) ===
            JSON.stringify(payload)
        ) {
          console.log("Duplicate booking payload detected, skipping...");
          return;
        }

        set({ bookingPayload: payload });
      },

      clearBookingDetails: () => set(initialState),

      clearBookingAndPayload: () =>
        set({ ...initialState, bookingPayload: undefined }),
    }),
    {
      name: "booking-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookingId: state.bookingId,
        bookingType: state.bookingType,
        numberOfRecipients: state.numberOfRecipients,
        recipientDetails: state.recipientDetails,
        deliveryDate: state.deliveryDate,
        deliveryTime: state.deliveryTime,
        specialInstructions: state.specialInstructions,
        paymentMethod: state.paymentMethod,
        isGift: state.isGift,
        bookingPayload: state.bookingPayload,
        calculatedTotalAmount: state.calculatedTotalAmount,
      }),
    }
  )
);

// Selectors
export const selectIsBookingComplete = (state: BookingState) =>
  !!(
    state.recipientDetails?.name &&
    state.recipientDetails?.phone &&
    state.recipientDetails?.email &&
    state.deliveryDate
  );

export default useBookingStore;
