import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItemForReceipt {
  id: string;
  mealId: string;
  mealName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  userInstruction?: string;
}

interface ReceiptDetails {
  transactionId: string | number;
  paymentReference: string;
  paymentDate?: string; // Store the actual payment date
  bookingDetails: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recipientDetails: any;
    deliveryDate: string | null;
    deliveryTime: string | null;
    specialInstructions: string | null;
    totalAmount: number;
    items: CartItemForReceipt[];
    itemCount: number; // Total number of individual items
    totalMeals: number; // Total quantity of all meals
    restaurantName: string | null;
    bookingType?: string;
    numberOfRecipients?: number;
  };
}

interface ReceiptStore {
  receipt: ReceiptDetails | null;
  setReceipt: (receipt: ReceiptDetails) => void;
  clearReceipt: () => void;
}

export const useReceiptStore = create<ReceiptStore>()(
  persist(
    (set) => ({
      receipt: null,
      setReceipt: (receipt) => set({ receipt }),
      clearReceipt: () => set({ receipt: null }),
    }),
    { name: "receipt-store" }
  )
);
