/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Sponsor {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  giftingHistory: GiftedMeal[];
}

export interface GiftedMeal {
  mealId: string;
  recipientId: string;
  restaurantId: string;
  dateGifted: Date;
  status: "pending" | "claimed" | "completed";
}

// Booking-related types matching API response
export interface BookingData {
  _id: string;
  bookedById: string;
  bookedByName: string;
  restaurantId: string;
  reason: string;
  image: string;
  status:
    | "paid"
    | "used"
    | "expired"
    | "claimed"
    | "unused"
    | "refunded"
    | "cancelled"
    | "pending";
  bookingId: string;
  bookedFor: {
    type: "public" | "others" | "self";
    data?: any[];
    contact?: any[];
  };
  validityDate:
    | {
        start: string;
        stop: string;
      }
    | string;
  paymentReference: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  numberOfBookings?: number;
  totalAmount?: number;
  currency?: string;
  // New API structure fields
  bookedByUser?: {
    _id: string;
    fullName: string;
    email: string;
    profileImage?: string;
    accountType: string;
    phoneNumber?: string;
  };
  bookedAtRestaurant?: {
    _id: string;
    name: string;
    profileImage?: string;
    restaurantId: string;
    address?: string;
    cuisineType?: string | string[];
    location?: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  slotsTaken?: number;
  bookingType: string;
  booking: any;
  customImage?:string
  bookedAt: Date; // Use string or Date type for date
}

export interface BookingApiResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalBookings: number;
  data: BookingData[];
}

export interface AllBookingsResponse {
  all: BookingData[];
  self: BookingApiResponse;
  others: BookingApiResponse;
  gifted: BookingApiResponse;
}

// New types for reusable components
export interface GiftItem {
  id: string | number;
  description: string;
  image: string;
  status:
    | "active"
    | "inactive"
    | "claimed"
    | "expired"
    | "refunded"
    | "pending";
  statusText: string;
  reason?: string;
  bookedFor?: string;
  bookedBy?: string;
  bookingData?: BookingData; // Use proper typing instead of any
  bookedAt?: Date; // Use string or Date type for date
}

export interface EmptyStateConfig {
  title: string;
  buttonText: string;
  buttonAction: () => void;
  heroImage: string;
}

export interface GiftListConfig {
  link?: string;
  title: string;
  ctaText?: string;
  onCtaClick?: () => void;

  emptyState?: EmptyStateConfig;
}
