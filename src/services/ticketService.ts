/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

// Types
export interface Ticket {
  ticketId: string;
  ticketName?: string;
  bookingId: string;
  bookedByName?: string;
  validityDate:
    | string
    | {
        start: string;
        stop: string;
      };
  restaurantId: string;
  image?: string;
  status: "unused" | "used" | "expired" | "refunded" | "cancelled";
  barcode?: string;
  qrCode?: {
    qrCodeDataURL?: string;
    qrCodeSVG?: string;
  };
}

export interface TicketsResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalTickets: number;
  data: Ticket[];
}

export interface TicketResponse {
  success: boolean;
  data: Ticket;
}

export interface TicketMessage {
  messageId: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface TicketMessagesResponse {
  success: boolean;
  messages: TicketMessage[];
}

export interface PostMessageData {
  message: string;
}

export interface PostMessageResponse {
  success: boolean;
  message: string;
  data: TicketMessage;
}

export interface TicketReaction {
  reactionId: string;
  ticketId: string;
  userId: string;
  reaction: "like" | "love" | "wow" | "sad" | "angry";
  createdAt: string;
}

export interface PostReactionData {
  reaction: "like" | "love" | "wow" | "sad" | "angry";
}

export interface PostReactionResponse {
  success: boolean;
  message: string;
  data: TicketReaction;
}

export interface TicketEngagement {
  ticketId: string;
  reactions: Array<{
    type: string;
    count: number;
    hasUserReacted?: boolean; // Track if current user has reacted with this reaction
  }>;
  commentsCount: number;
  userReaction?: string; // Current user's reaction if any
  messages?: Array<{
    messageId?: string;
    content?: string;
    text?: string;
    message?: string;
    user?: {
      _id?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImage?: string;
    };
    author?: string;
    createdAt?: string;
  }>;
  createdAt?: string;
}

export interface TicketEngagementsResponse {
  success: boolean;
  bookingId: string;
  engagements: TicketEngagement[];
  reactionSummary?: {
    [key: string]: number; // e.g., { like: 3, love: 1, wow: 0, sad: 0, angry: 0 }
  };
  claimedByUser?: {
    _id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    accountType?: string;
    city?: string;
    badges?: any[];
  };
}

const apiClient = new ApiClient();

export const ticketService = {
  // Get all tickets (paginated)
  getAllTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);

      const endpoint = `${API_ENDPOINTS.TICKETS.GET_ALL}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await apiClient
        .get<any>(endpoint)
        .then((res) => res.data);
      return response;
    } catch (error: any) {
      console.error("Failed to fetch tickets:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch tickets"
      );
    }
  },

  // Get specific ticket details
  getTicketById: async (ticketId: string): Promise<any> => {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.TICKETS.VIEW(ticketId)
      );
      return (
        response || {
          success: false,
          data: {} as Ticket,
        }
      );
    } catch (error: any) {
      console.error("Failed to fetch ticket details:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch ticket details"
      );
    }
  },

  // Get messages for a booking's tickets
  getTicketMessages: async (bookingId: string): Promise<any> => {
    try {
      const response = await apiClient
        .get<any>(API_ENDPOINTS.TICKETS.MESSAGES_BY_BOOKING(bookingId))
        .then((res) => res.data);
      return response;
    } catch (error: any) {
      console.error("Failed to fetch ticket messages:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch ticket messages"
      );
    }
  },
  // Post a message to a ticket
  postTicketMessage: async (
    ticketId: string,
    messageData: PostMessageData
  ): Promise<any> => {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.TICKETS.POST_MESSAGE(ticketId),
        messageData
      );
      console.log("ticket-response", response);
      return (
        response || {
          success: false,
          message: "Failed to post message",
          data: {} as TicketMessage,
        }
      );
    } catch (error: any) {
      console.error("Failed to post ticket message:", error);
      throw new Error(
        error.response?.data?.message || "Failed to post ticket message"
      );
    }
  },
  // Post a reaction to a ticket
  postTicketReaction: async (
    ticketId: string,
    reactionData: PostReactionData
  ): Promise<any> => {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.TICKETS.POST_REACTION(ticketId),
        reactionData
      );
      return (
        response || {
          success: false,
          message: "Failed to post reaction",
          data: {} as TicketReaction,
        }
      );
    } catch (error: any) {
      console.error("Failed to post ticket reaction:", error);
      throw new Error(
        error.response?.data?.message || "Failed to post ticket reaction"
      );
    }
  },

  // Get engagement statistics for all tickets under a booking
  getTicketEngagements: async (bookingId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.TICKETS.GET_ENGAGEMENTS(bookingId)
      );
      return response
    } catch (error: any) {
      console.error("Failed to fetch ticket engagements:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch ticket engagements"
      );
    }
  },
  // notify redemption service
  notifyRedemption: async (params: { ticketId: string; date: string }) => {
    const response = await apiClient.post(
      API_ENDPOINTS.TICKETS.NOTIFY_REDEMPTION,
      params
    );
    return response ;
  }
};
