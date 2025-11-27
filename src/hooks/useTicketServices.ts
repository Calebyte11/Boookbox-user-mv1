/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import type {
  // PostMessageData,
  PostReactionData,
  // TicketsResponse,
  // TicketResponse,
  TicketMessagesResponse,
  PostMessageResponse,
  PostReactionResponse,
  // TicketEngagementsResponse,
} from "@/services/ticketService";
import { ticketService } from "@/services/ticketService";
// Query keys for caching
export const ticketQueryKeys = {
  all: "ticketServices",
  list: (params?: any) => ["ticketServices", "list", params] as const,
  detail: (ticketId: string) => ["ticketServices", "detail", ticketId] as const,
  messages: (bookingId: string) =>
    ["ticketServices", "messages", bookingId] as const,
  engagements: (bookingId: string) =>
    ["ticketServices", "engagements", bookingId] as const,
} as const;

// Hook to fetch all tickets with pagination
export const useTicketsListQuery = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery<any>({
    queryKey: ticketQueryKeys.list(params),
    queryFn: () => ticketService.getAllTickets(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch specific ticket details
export const useTicketDetailsQuery = (ticketId: string, enabled = true) => {
  return useQuery<any>({
    queryKey: ticketQueryKeys.detail(ticketId),
    queryFn: () => ticketService.getTicketById(ticketId),
    enabled: !!ticketId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch ticket messages for a booking
export const useTicketMessagesQuery = (bookingId: string, enabled = true) => {
  return useQuery<TicketMessagesResponse>({
    queryKey: ticketQueryKeys.messages(bookingId),
    queryFn: () => ticketService.getTicketMessages(bookingId),
    enabled: !!bookingId && enabled,
    staleTime: 30 * 1000, // 30 seconds (messages should be fresh)
  });
};

// Hook to fetch ticket engagements for a booking
export const useTicketEngagementsQuery = (
  bookingId: string,
  enabled = true
) => {
  return useQuery<any>({
    queryKey: ticketQueryKeys.engagements(bookingId),
    queryFn: () => ticketService.getTicketEngagements(bookingId),
    enabled: !!bookingId && enabled,
    staleTime: 1 * 60 * 1000, // 2 minutes
  });
};

// Mutation hook to post a message to a ticket
export const usePostTicketMessageMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    PostMessageResponse,
    Error,
    {
      ticketId: string;
      messageData: any;
      bookingId?: string;
    }
  >({
    mutationFn: ({ ticketId, messageData }) =>
      ticketService.postTicketMessage(ticketId, messageData),
    onSuccess: (data, variables) => {
      // Only invalidate engagement and message queries, not ticket details

      if (data && variables.bookingId) {
        queryClient.invalidateQueries({
          queryKey: ticketQueryKeys.messages(variables.bookingId),
        });
        queryClient.invalidateQueries({
          queryKey: ticketQueryKeys.engagements(variables.bookingId),
        });
      }

      toast({
        title: "Message Posted",
        description: "Your message has been posted successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// Mutation hook to post a reaction to a ticket
export const usePostTicketReactionMutation = () => {
  const queryClient = useQueryClient();
  // const { toast } = useToast();

  return useMutation<
    PostReactionResponse,
    Error,
    {
      ticketId: string;
      reactionData: PostReactionData;
      bookingId?: string;
    }
  >({
    mutationFn: ({ ticketId, reactionData }) =>
      ticketService.postTicketReaction(ticketId, reactionData),
    onSuccess: (data, variables) => {
      // Only invalidate engagement queries, not ticket details
      if (data && variables.bookingId) {
        queryClient.invalidateQueries({
          queryKey: ticketQueryKeys.engagements(variables.bookingId),
        });
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// Combined hook for ticket operations (messages, reactions, etc.)
export const useTicketOperations = () => {
  const postMessageMutation = usePostTicketMessageMutation();
  const postReactionMutation = usePostTicketReactionMutation();

  const postMessage = (
    ticketId: string,
    message: string,
    bookingId?: string
  ) => {
    postMessageMutation.mutate({
      ticketId,
      messageData: { message },
      bookingId,
    });
  };

  const postReaction = (
    ticketId: string,
    reaction: PostReactionData["reaction"],
    bookingId?: string
  ) => {
    postReactionMutation.mutate({
      ticketId,
      reactionData: { reaction },
      bookingId,
    });
  };

  return {
    postMessage,
    postReaction,
    isPostingMessage: postMessageMutation.isPending,
    isPostingReaction: postReactionMutation.isPending,
    messageError: postMessageMutation.error,
    reactionError: postReactionMutation.error,
  };
};

// Hook for managing ticket interactions in a single component
export const useTicketInteractions = (ticketId: string, bookingId?: string) => {
  const ticketDetails = useTicketDetailsQuery(ticketId);
  const messages = useTicketMessagesQuery(bookingId || "", !!bookingId);
  const engagements = useTicketEngagementsQuery(bookingId || "", !!bookingId);
  const operations = useTicketOperations();

  const postMessage = (content: string) => {
    operations.postMessage(ticketId, content, bookingId);
  };

  const postReaction = (reaction: PostReactionData["reaction"]) => {
    operations.postReaction(ticketId, reaction, bookingId);
  };

  

  return {
    // Data
    ticket: ticketDetails.data?.data,
    messages: messages.data?.messages || [],
    engagements: engagements.data?.engagements || [],

    // Loading states
    isLoadingTicket: ticketDetails.isLoading,
    isLoadingMessages: messages.isLoading,
    isLoadingEngagements: engagements.isLoading,
    isPostingMessage: operations.isPostingMessage,
    isPostingReaction: operations.isPostingReaction,

    // Error states
    ticketError: ticketDetails.error,
    messagesError: messages.error,
    engagementsError: engagements.error,
    messageError: operations.messageError,
    reactionError: operations.reactionError,

    // Actions
    postMessage,
    postReaction,

    // Refetch functions
    refetchTicket: ticketDetails.refetch,
    refetchMessages: messages.refetch,
    refetchEngagements: engagements.refetch,
  };
};

// Mutation hook to notify redemption
export const useNotifyRedemption = () => {
  const { toast } = useToast();
  return useMutation<any, Error, { ticketId: string; date: string }>({
    mutationFn: (params) => ticketService.notifyRedemption(params),
    onSuccess: (data) => {
      toast({
        title: data?.success ? "Redemption Notified" : "Redemption Failed",
        description: data?.message || (data?.success ? "Redemption has been successfully notified." : "Failed to notify redemption."),
        variant: data?.success ? "success" : "error",
      });
    },
    onError: () => {
      toast({
        title: "Notification Failed",
        description: "This ticket has already been used or is invalid",
        variant: "error",
      });
    },
  });
}


