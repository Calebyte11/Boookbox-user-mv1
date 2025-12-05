/* eslint-disable @typescript-eslint/no-explicit-any */
// QR Code related types
export interface QRCodeData {
  qrCodeDataURL: string;
  qrCodeSVG?: string;
  generatedAt: string;
  ticketId: string;
}

export interface Ticket {
  id: string | number;
  title: string;
  description: string;
  image: string;
  status?: string;
  statusText?: string;
  price?: number;
  quantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  userId: string;
  date?: string;
  bookedByName?: string;
  // Location properties for distance calculation
  lat?: number;
  lng?: number;
  restaurantAddress?: string;
  slotsTaken?: number;
  numberOfBookings?: number;
  distance?: number; // Added by geolib utilities
}

// API Response types for tickets claimed by authenticated user
export interface TicketData {
  ticketId: string;
  ticketName: string;
  bookingId: string;
  bookedByName: string;
  validityDate: string;
  restaurantId: string;
  image: string;
  status: "used" | "active" | "expired" | "claimed";
}

export interface TicketsApiResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalTickets: number;
  data: TicketData[];
}

// Restaurant information type
export interface RestaurantInfo {
  id: string;
  name: string;
  cuisine?: string;
  address?: string;
  image?: string;
}

// Meal package details type
export interface MealPackage {
  id: string;
  name: string;
  description: string;
  image: string;
  restaurant: RestaurantInfo;
}

// Menu item type for booking details
export interface MenuItem {
  menuId: string;
  quantity: number;
  name: string;
  price: number;
  currency: string;
  _id: string;
  instructions?: string;
  // New API structure with nested menu object
  menu?: {
    _id: string;
    name: string;
    price: number;
    currency: string;
    images?: string[];
    menuId: string;
  };
}

// Validity date structure
export interface ValidityDate {
  start: string;
  stop: string;
}

// Booked for structure
export interface BookedFor {
  type: string;
  data?: any[];
  contact?: Array<{
    name: string;
    email: string;
    phoneNumber: string;
    address?: string;
  }>;
}

// User information structure
export interface BookedByUser {
  _id: string;
  id?: string; // Alternative ID field
  fullName: string;
  email: string;
  profileImage?: string;
  accountType: string;
  phoneNumber?: string;
}

export interface ApiTicketResponse {
  _id: string;
  ticketId: string;
  ticketName: string;
  value: {
    amount: number;
    currency: string;
  };
  booking: {
    _id: string;
    bookedByUser: {
      _id: string;
      fullName: string;
      email: string;
      profileImage: string;
      accountType: string;
      badges: any[];
    };
    bookedForRestaurant: {
    _id: string;
    name: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    profileImage: string;
    restaurantId: string;
  };
    menuItems: {
      menu: {
        _id: string;
        name: string;
        price: number;
        currency: string;
        images: string[];
        menuId: string;
      };
      quantity: number;
      _id: string;
    }[];
    reason: string;
    validityDate: {
      start: string;
      stop: string;
    };
    isRefundableToUser: boolean;
    bookingId: string;
  };
  bookedForBusiness: {
    _id: string;
    name: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    profileImage: string;
    businessId: string;
  };
  claimedByUser?: {
    _id: string;
    fullName: string;
    email: string;
    profileImage: string;
    accountType: string;
    city: string;
    badges: any[];
  };
  status: "used" | "active" | "expired" | "claimed" | "unused";
  message?: string | null;
  reaction?: string | null;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
  reason: string;
  validityDate: {
    start: string;
    stop: string;
  };
  refundable: boolean;
  bookingId: string;
  bookedById: string;
  bookedByName: string;
  bookedByProfileImage: string;
  restaurantId: string;
  image: string;
  menuItems: {
    menu: {
      _id: string;
      name: string;
      price: number;
      currency: string;
      images: string[];
      menuId: string;
    };
    quantity: number;
    _id: string;
  }[];
  customImage?: string;
  claimedById?: string;
  claimedByName?: string;
  claimedByProfileImage?: string;
  claimedByCity?: string;
  barcode?: string;
  qrCode?: {
    qrCodeDataURL?: string;
    qrCodeSVG?: string;
  };
}

// Restaurant information structure
export interface BookedAtRestaurant {
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
}

// Complete booking detail type from API
export interface BookingDetail {
  _id: string;
  bookedById: string;
  bookedByName: string;
  bookingType: string;
  restaurantId: string;
  menuItems: MenuItem[];
  numberOfBookings: number;
  totalAmount: number;
  currency: string;
  reason: string;
  slotsTaken: number;
  isRefundableToUser: boolean;
  image: string;
  status: "paid" | "used" | "expired" | "claimed" | "cancelled";
  paymentReference: string;
  tags: string[];
  bookingId: string;
  createdAt: string;
  updatedAt: string;
  bookedAt?: string;
  bookedFor: BookedFor;
  validityDate: ValidityDate;
  __v: number;
  // New API structure fields
  bookedByUser: BookedByUser;
  bookedAtRestaurant: BookedAtRestaurant;
  redemptionMode?: string;
  includeUtensils?: boolean;
  deliveryFee?: number;
  boookboxFee?: number; // Service fee
  supportsMultipleClaims?: boolean;
  // QR Code data (added when ticket is claimed)
  qrCode?: QRCodeData;
  customImage?: string;
  ticketId?: string; // Legacy field for backward compatibility
}

// API response for booking details
export interface BookingDetailResponse {
  success: boolean;
  data: BookingDetail[];
}

// Legacy ticket detail type (keeping for backward compatibility)
export interface TicketDetail {
  ticketId: string;
  ticketName: string;
  serialNumber?: string;
  bookingId: string;
  bookedByName: string;
  validityDate: string;
  status: "used" | "active" | "expired" | "claimed";
  restaurant?: RestaurantInfo;
  mealPackage?: MealPackage;
  qrCode?: string; // Legacy string format
  qrCodeData?: QRCodeData; // New structured format
  barcode?: string;
}

export interface EmptyTicketConfig {
  title: string;
  buttonText: string;
  buttonAction: () => void;
  heroImage: string;
}

export interface TicketListConfig {
  link?: string;
  title: string;
  ctaText?: string;
  onCtaClick?: () => void;
  emptyState?: EmptyTicketConfig;
}
