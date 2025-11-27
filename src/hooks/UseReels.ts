import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { clipService } from "@/services/ReelService";
import type { Clip, ClipComment, ClipEngagement } from "@/services/ReelService";
import useAuthStore from "@/store/authStore";
// Get all clips (paginated)
export const useGetClips = (page?: number, limit?: number) =>
  useQuery<Clip[]>({
    queryKey: ["clips", page, limit],
    queryFn: () => clipService.getAllClips(page, limit),
    placeholderData: keepPreviousData,
  });

  export const useGetClipDetails = (clipId:string) =>{
    const {isAuthenticated} = useAuthStore()
    return useQuery({
        queryKey: ["clip", clipId, isAuthenticated ? "auth" : "public"],
        queryFn: () => 
          isAuthenticated 
            ? clipService.getClipByIdAuth(clipId)
            : clipService.getClipByIdPublic(clipId),
        enabled: !!clipId,
      });
  }


// Get clip engagements
export const useClipEngagements = (clipId: string) =>
  useQuery<ClipEngagement | null>({
    queryKey: ["clipEngagements", clipId],
    queryFn: () => clipService.getClipEngagements(clipId),
    enabled: !!clipId,
  });

// Get clip comments (paginated)
export const useClipComments = (clipId: string, page?: number, limit?: number) =>
  useQuery<ClipComment[]>({
    queryKey: ["clipComments", clipId, page, limit],
    queryFn: () => clipService.getClipComments(clipId, page, limit),
    enabled: !!clipId,
    placeholderData: keepPreviousData,
  });

// Post a new clip (upload)
export const usePostClip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => clipService.postClip(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });
};

// React to a clip
export const useReactToClip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clipId, reaction }: { clipId: string; reaction: string }) =>
      clipService.reactToClip(clipId, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clipEngagements"] });
    },
  });
};


// Comment on a clip
export const useCommentOnClip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clipId, comment }: { clipId: string; comment: string }) =>
      clipService.commentOnClip(clipId, comment),
    onSuccess: (_, { clipId }) => {
      queryClient.invalidateQueries({ queryKey: ["clipComments", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clipEngagements", clipId] });
    },
  });
};

// Track (add) a view for a clip
export const useAddClipView = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clipId: string) => clipService.addClipView(clipId),
    onSuccess: (_, clipId) => {
      queryClient.invalidateQueries({ queryKey: ["clipEngagements", clipId] });
    },
  });
};

// Edit a comment on a clip
export const useEditComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, newComment }: { commentId: string; newComment: string }) =>
      clipService.editComment(commentId, newComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clipComments"] });
    },
  });
};

// Delete a comment on a clip
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => clipService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clipComments"] });
    },
  });
};

export const useShareClip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cid: string) => clipService.shareClip(cid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });
};