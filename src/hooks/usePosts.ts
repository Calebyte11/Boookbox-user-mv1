import { useQuery, useMutation, useQueryClient,keepPreviousData } from "@tanstack/react-query";
import { postService, type FeedResponse } from "@/services/postService";
import useAuthStore from "@/store/authStore";

// Feed
export const useFeed = (page = 1, limit = 10) =>
  useQuery<FeedResponse>({
    queryKey: ["postFeed", page, limit],
    queryFn: () => postService.getFeed(page, limit),
    placeholderData: keepPreviousData,
  });

// Get post by ID (automatically chooses authenticated or public endpoint)
export const usePostById = (pid: string) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ["post", pid, isAuthenticated ? "auth" : "public"],
    queryFn: () => 
      isAuthenticated 
        ? postService.getPostByIdAuth(pid)
        : postService.getPostByIdPublic(pid),
    enabled: !!pid,
  });
};


// Share booking as post
export const useShareBookingAsPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postService.shareBookingAsPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};

// React to post
export const useReactToPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, type }: { pid: string; type: string }) =>
      postService.reactToPost(pid, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};

// Comment on post
export const useCommentOnPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, text }: { pid: string; text: string }) =>
      postService.commentOnPost(pid, text),
    onSuccess: (_, { pid }) => {
      queryClient.invalidateQueries({ queryKey: ["postComments", pid] });
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};

// Share post
export const useSharePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: string) => postService.sharePost(pid),
    onSuccess: (_, pid) => {
      queryClient.invalidateQueries({ queryKey: ["post", pid] });
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};


// Get post engagement
export const usePostEngagement = (pid: string) =>
  useQuery({
    queryKey: ["postEngagement", pid],
    queryFn: () => postService.getPostEngagement(pid),
    enabled: !!pid,
  });

// Get post comments (paginated)
export const usePostComments = (pid: string, page = 1, limit = 10) =>
  useQuery({
    queryKey: ["postComments", pid, page, limit],
    queryFn: () => postService.getPostComments(pid, page, limit),
    enabled: !!pid,
    placeholderData: keepPreviousData,
  });

// Edit comment
export const useEditComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cid, text }: { cid: string; text: string }) =>
      postService.editComment(cid, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};

// Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cid: string) => postService.deleteComment(cid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};

// Edit post
export const useEditPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pid,
      data,
    }: {
      pid: string;
      data: { title?: string; subtitle?: string; message?: string; tags?: string[]; visibility?: string };
    }) => postService.editPost(pid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: string) => postService.deletePost(pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postFeed"] });
    },
  });
};