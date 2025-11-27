/**
 * Represents the uploader of a clip.
 */
export interface ClipUploader {
  id: {
    _id: string;
    fullName: string;
    profileImage?: string;
    badges?: string[];
  };
  role: string;
}

/**
 * Represents a comment on a clip.
 */
export interface ClipComment {
  _id: string;
  text: string;
  commentedAt: string;
  edited?: boolean;
  commenter?: { // Making commenter optional as it might not be present in all contexts
    id: {
      _id: string;
      fullName: string;
      profileImage?: string;
    };
  };
}

/**
 * Represents a single Clip/Reel object from the API.
 */
export interface Clip {
  _id: string;
  title: string;
  subtitle?: string;
  caption?: string;
  videoUrl: string;
  thumbnail?: string; // From transform function, seems optional from API
  public_id: string;
  tags: string[];
  views: number;
  comments: number;
  reactions: number;
  shares: number;
  uploader: ClipUploader;
  uploadedAt: string;
  updatedAt: string;
  edited: boolean;
  reaction: string | null;
}