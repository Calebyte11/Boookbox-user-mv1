/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Post {
  _id: string;
  title: string;
  subtitle?: string;
  message?: string;
  tags?: string[];
  reactions?: number;
  comments?: number;
  shares?: number;
  type: string;
  data?: {
    // The resource can represent different shapes depending on post.type
    resource?: {
      _id: string;
      // Fields used for restaurant-offer / menu items
      menuId?: string;
      name?: string;
      description?: string;
      images?: string[];
      price?: number;
      category?: string;
      isAvailable?: boolean;
      customizations?: Array<{ name: string }>;
      // Restaurant reference for menu items
      restaurant?: {
        _id: string;
        name?: string;
        profileImage?: string;
        restaurantId?: string;
        badges?:string[];
        paymentCurrency?:string;
      };

      // Fields used for gifting/booking posts
      bookedByUser?: {
        _id: string;
        fullName: string;
        profileImage: string;
        badges?: string[];
      };
      bookingType?: string;
      bookedAtRestaurant?: {
        _id: string;
        name: string;
        profileImage: string;
        badges?: string[];
        paymentCurrency: string;
      };
      numberOfBookings?: number;
      reason?: string;
      slotsTaken?: number;
      customImage?: string;
    };
    source?: string;
  };
  postedBy: {
    id: {
      _id: string;
      // some accounts (restaurants/organizations) may have a plain `name`
      name?: string;
      // normal user full name
      fullName?: string;
      profileImage?: string;
      badges?: string[];
      // optional metadata for organizations
      accountType?: string;
      organizationName?: string;
    };
    role: string;
  };
  visibility?: string;
  images?: string[];
  postedAt: string;
  updatedAt: string;
  reaction?: any;
  comment?: any[];
  actions?: string[]; // For visitors: ["sign-up", "sign-in"], for authenticated users: undefined
  [key: string]: any;
}

export interface PostComment {
  _id: string;
  post: string;
  text: string;
  commenter: {
    id: {
      _id: string;
      fullName: string;
      profileImage: string;
    };
    role: string;
  };
  commentedAt: string;
  updatedAt: string;
  __v: number;
}

export interface CommentsResponse {
  success: boolean;
  page: number;
  pages: number;
  total: number;
  data: PostComment[];
}

export interface FeedResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  data: Post[];
}
