export interface Sponsor {
  id: string;
  name: string;
  email: string;
  giftingHistory: GiftedMeal[];
}

export interface GiftedMeal {
  mealId: string;
  recipientId: string;
  restaurantId: string;
  dateGifted: Date;
  status: "pending" | "claimed" | "completed";
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  restaurantId: string;
}

export interface RecipientDetails {
  name: string;
  phone: string;
  email: string;
  address: string; // Address field for recipients
  remark?: string; // Optional remark for each recipient
}

export interface OrderFormValues {
  reason: string;
  bookingType: string;
  redemptionMode: string;
  numberOfBookings: string;
  includeUtensils: boolean;
  deliveryType?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientAddress?: string; // Address field for single recipient
  recipientRemark?: string; // Optional remark for single recipient
  numberOfRecipients?: string;
  multipleRecipients?: RecipientDetails[];
  redemptionDate?: Date;
  requestCustomTicketDesign: boolean; // Toggle for requesting custom ticket design
  ticketCustomizationRecipientName?: string;
  ticketCustomizationRecipientPhone?: string; // Changed to optional
  ticketCustomizationRecipientEmail?: string; // Changed to optional
  ticketCustomizationRecipientAddress?: string; // Address field for ticket customization
  ticketCustomizationRecipientRemark?: string; // Optional remark for ticket customization recipient
  publicTags?: string; // Tags for public bookings
  refundable?: boolean; // Toggle for refundable booking
  supportsMultipleClaims?: boolean; // Whether the ticket supports multiple claims
  autoGenerateTicket?: boolean; // Toggle for automatically generating tickets

  // New fields matching backend payload
  menuItems?: Array<{
    menuId: string;
    quantity: number;
    name: string;
    price: number;
    currency: string;
  }>;
  restaurantId?: string; // Required
  customImage?: string; // Optional custom image for the ticket
  // image?: string; // Restaurant image
  totalAmount?: string; // Required for payment
  currency?: string; // Default currency

}

export interface OrderFormProps {
  onSubmit: (data: OrderFormValues) => void;
  restaurantId: string;
}
