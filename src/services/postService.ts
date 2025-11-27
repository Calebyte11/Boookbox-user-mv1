/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

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

const apiClient = new ApiClient();

export const postService = {
  // Fetch feed
  getFeed: async (page = 1, limit = 10): Promise<FeedResponse> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const endpoint = `${API_ENDPOINTS.POSTS.FEED}?${params.toString()}`;
    const response = await apiClient.get<FeedResponse>(endpoint);
    return response.data || { success: false, currentPage: 1, totalPages: 1, totalPosts: 0, data: [] };
  },

  // Get post by ID (authenticated users)
  getPostByIdAuth: async (pid: string): Promise<Post> => {
    const response = await apiClient.get<Post>(API_ENDPOINTS.POSTS.GET_BY_ID(pid));
    if (!response.data) {
      throw new Error('Post not found');
    }
    return response.data;
  },

  // Get post by ID (public/visitors)
  getPostByIdPublic: async (pid: string): Promise<Post> => {
    const response = await apiClient.getPublic<Post>(API_ENDPOINTS.POSTS.GET_BY_ID(pid));
    if (!response.data) {
      throw new Error('Post not found');
    }
    return response.data;
  },

  // Get post by ID (legacy method - now uses public endpoint by default)
  // getPostById: async (pid: string): Promise<Post> => {
  //   const response = await apiClient.getPublic<Post>(API_ENDPOINTS.POSTS.GET_BY_ID(pid));
  //   if (!response.data) {
  //     throw new Error('Post not found');
  //   }
  //   return response.data;
  // },

  // Share booking as post
  shareBookingAsPost: async (data: {
    bookingId: string;
    title?: string;
    subtitle?: string;
    message?: string;
    tags?: string[];
    images?: string[];
    visibility?: string;
  }) => {
    const response = await apiClient.post(API_ENDPOINTS.POSTS.SHARE_BOOKING, data);
    
    return response.data;
  },

  // React to a post
  reactToPost: async (pid: string, type: string) => {
    const response = await apiClient.post(API_ENDPOINTS.POSTS.REACT(pid), { type });
    return response.data;
  },

  // Comment on a post
  commentOnPost: async (pid: string, text: string) => {
    const response = await apiClient.post(API_ENDPOINTS.POSTS.COMMENT(pid), { text });
    return response.data;
  },

  // Share a post
  sharePost: async (pid: string) => {
    const response = await apiClient.patch(API_ENDPOINTS.POSTS.SHARE(pid));
    return response.data;
  },

  // Get post engagement
  getPostEngagement: async (pid: string) => {
    const response = await apiClient.get(API_ENDPOINTS.POSTS.ENGAGEMENT(pid));
    return response.data;
  },

  // Get post comments (paginated)
  getPostComments: async (pid: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const endpoint = `${API_ENDPOINTS.POSTS.COMMENTS(pid)}?${params.toString()}`;
    const response = await apiClient.get<CommentsResponse>(endpoint);
    return response.data;
  },

  // Edit a comment
  editComment: async (cid: string, text: string) => {
    const response = await apiClient.patch(API_ENDPOINTS.POSTS.EDIT_COMMENT(cid), { text });
    return response.data;
  },

  // Delete a comment
  deleteComment: async (cid: string) => {
    const response = await apiClient.delete(API_ENDPOINTS.POSTS.DELETE_COMMENT(cid));
    return response.data;
  },

  // Edit post
  editPost: async (pid: string, data: { title?: string; subtitle?: string; message?: string; tags?: string[]; visibility?: string }) => {
    const response = await apiClient.patch(API_ENDPOINTS.POSTS.EDIT(pid), data);
    return response.data;
  },

  // Delete post
  deletePost: async (pid: string) => {
    const response = await apiClient.delete(API_ENDPOINTS.POSTS.DELETE(pid));
    return response.data;
  },
};