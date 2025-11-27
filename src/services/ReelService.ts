/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Clip {
  _id: string;
  title?: string;
  subtitle?: string;
  videoUrl: string;
  public_id?: string;
  tags?: string[];
  thumbnail?: string;
  views?: number;
  comments?: number;
  reactions?: number;
  shares?: number;
  uploader?: {
    id?: {
      _id: string;
      fullName: string;
      profileImage?: string;
      badges?: any[];
    };
    role?: string;
  };
  uploadedAt?: string;
  updatedAt?: string;
  edited?: boolean;
  reaction?: any;
  comment?: any;
  [key: string]: any;
}

export interface ClipComment {
  _id: string;
  clip: string;
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
  edited?: boolean;
  __v: number;
}

export interface ClipEngagement {
  likes: number;
  views: number;
  comments: number;
  [key: string]: any;
}

const apiClient = new ApiClient();

export const clipService = {
  // Get all clips (paginated)
  getAllClips: async (page?: number, limit?: number): Promise<Clip[]> => {
    let endpoint = API_ENDPOINTS.CLIPS.GET_ALL;
    if (page || limit) {
      const params = new URLSearchParams();
      if (page) params.append("page", page.toString());
      if (limit) params.append("limit", limit.toString());
      endpoint += `?${params.toString()}`;
    }
    const response = await apiClient.get<Clip[]>(endpoint);
    // console.log("response.data:", response.data);
    return Array.isArray(response.data) ? response.data : [];
  },

  

  // Get engagements for a clip
  getClipEngagements: async (clipId: string): Promise<ClipEngagement | null> => {
    const response = await apiClient.get<ClipEngagement>(
      API_ENDPOINTS.CLIPS.GET_ENGAGEMENTS(clipId)
    );
    return response.data || null;
  },

  // Get comments for a clip (paginated)
  getClipComments: async (
    clipId: string,
    page?: number,
    limit?: number
  ): Promise<ClipComment[]> => {
    let endpoint = API_ENDPOINTS.CLIPS.GET_COMMENTS(clipId);
    if (page || limit) {
      const params = new URLSearchParams();
      if (page) params.append("page", page.toString());
      if (limit) params.append("limit", limit.toString());
      endpoint += `?${params.toString()}`;
    }
    const response = await apiClient.get<ClipComment[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  
  postClip: async (formData: FormData): Promise<any> => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.CLIPS.POST,
      formData
    );
    return response.data;
  },

  // React to a clip
  reactToClip: async (clipId: string, reaction: string): Promise<any> => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.CLIPS.REACT(clipId),
      { type:reaction }
    );
    return response.data;
  },

  // Comment on a clip
  commentOnClip: async (clipId: string, comment: string): Promise<any> => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.CLIPS.COMMENT(clipId),
      { text:comment }
    );
    return response.data;
  },

  // Track (add) a view for a clip
  addClipView: async (clipId: string): Promise<any> => {
    const response = await apiClient.patch<any>(
      API_ENDPOINTS.CLIPS.VIEW(clipId)
    );
    return response.data;
  },

  // Edit a comment on a clip
  editComment: async (commentId: string, newComment: string): Promise<any> => {
    const response = await apiClient.patch<any>(
      API_ENDPOINTS.CLIPS.EDIT_COMMENT(commentId),
      { comment: newComment }
    );
    return response.data;
  },

  // Share a clip
  shareClip: async (clipId: string): Promise<any> => {
    const response = await apiClient.patch<any>(
      API_ENDPOINTS.CLIPS.SHARE(clipId)
    );
    return response.data;
  },

  // Delete a comment on a clip
  deleteComment: async (commentId: string): Promise<any> => {
    const response = await apiClient.delete<any>(
      API_ENDPOINTS.CLIPS.DELETE_COMMENT(commentId)
    );
    return response.data;
  },

  getClipByIdPublic: async(clipId:string) => {
    const response = await apiClient.getPublic<Clip[]>(API_ENDPOINTS.CLIPS.GET_BY_ID(clipId));
    if (!response.data) {
      throw new Error('Post not found');
    }
    return response.data;
  },

  // Get clip by ID
  getClipByIdAuth: async(clipId:string) => {
    const response = await apiClient.get<Clip[]>(API_ENDPOINTS.CLIPS.GET_BY_ID(clipId));
    if (!response.data) {
      throw new Error('Post not found');
    }
    return response.data;
  }

  
};