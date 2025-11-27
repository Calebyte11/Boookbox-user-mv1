import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share,
  Play,
  VolumeX,
  Volume2,
  Send,
  MoreHorizontal,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Avatar, Skeleton } from "@radix-ui/themes";
import { DropdownMenu } from "radix-ui";
import debounce from "debounce";
import { useUserProfileQuery } from "@/hooks/useUserQueries";
// Import hooks and types from the project
import {
  useGetClipDetails,
  useClipEngagements,
  useReactToClip,
  useAddClipView,
  useClipComments,
  useCommentOnClip,
  useShareClip,
  useEditComment,
  useDeleteComment,
} from "@/hooks/UseReels";
import type { Clip, ClipComment } from "@/services/ReelService";
import useAuthStore from "@/store/authStore";
import BrandLogo from "@/assets/images/pwa-192x192.png";
import Navigation from "@/components/Navigation";

interface ReelData {
  id: string;
  videoUrl: string;
  thumbnail: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    handle: string;
  };
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isFollowing: boolean;
}

// Transform API Clip data to ReelData interface
const transformClipToReel = (clip: Clip): ReelData => ({
  id: clip._id,
  videoUrl: clip.videoUrl,
  thumbnail: clip.thumbnail || "/api/placeholder/400/600",
  user: {
    id: clip.uploader?.id?._id || "unknown",
    name: clip.uploader?.id?.fullName || "Unknown User",
    avatar: clip.uploader?.id?.profileImage || "/api/placeholder/150/150",
    handle: clip.uploader?.id?.fullName
      ? `@${clip.uploader.id.fullName.replace(/\s+/g, "").toLowerCase()}`
      : "@unknown",
  },
  caption: clip.subtitle || clip.title || "",
  likes: clip.reactions || 0,
  comments: clip.comments || 0,
  shares: clip.shares || 0,
  views: clip.views || 0,
  isLiked: clip.reaction !== null && clip.reaction !== undefined, // Use reaction field from API
  isFollowing: false, // Will be determined by user relationship data
});

interface ReelVideoProps {
  reel: ReelData;
  globalMuted: boolean;
  onToggleMute: () => void;
}

const ReelVideoSingle: React.FC<ReelVideoProps> = ({
  reel,
  globalMuted,
  onToggleMute,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  //   const [isFollowing, setIsFollowing] = useState(reel.isFollowing);
  const [likes, setLikes] = useState(reel.likes);
  const [shares, setShares] = useState(reel.shares);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const hasTrackedView = useRef(false);
  const messageDropdownRef = useRef<HTMLDivElement>(null);

  // Get engagement data for this clip
  const { data: engagements } = useClipEngagements(reel.id);

  // Get comments for this clip
  const { data: comments = [], refetch: refetchComments } = useClipComments(
    reel.id,
    1,
    50
  );

  // Get current user data from auth store
  const { isAuthenticated } = useAuthStore();
  const { data: user } = useUserProfileQuery();

  // Mutations for interactions
  const reactToClipMutation = useReactToClip();
  const addViewMutation = useAddClipView();
  const commentMutation = useCommentOnClip();
  const editCommentMutation = useEditComment();
  const deleteCommentMutation = useDeleteComment();
  const shareClipMutation = useShareClip();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Create debounced view tracking function
  const debouncedTrackView = useMemo(
    () =>
      debounce((clipId: string) => {
        if (!hasTrackedView.current) {
          hasTrackedView.current = true;
          addViewMutation.mutate(clipId);
        }
      }, 500), // 500ms debounce
    [addViewMutation]
  );

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      // Apply global muted state
      videoRef.current.muted = globalMuted;

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            // Handle play interruption gracefully
            if (error.name !== "AbortError") {
              console.error("Video play error:", error);
            }
            setIsPlaying(false);
          });
      }
      // Track view when video becomes active (debounced)
      debouncedTrackView(reel.id);
    }
  }, [reel.id, debouncedTrackView, globalMuted]);

  // Update muted state when global muted changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted]);

  // Update likes when engagement data loads
  useEffect(() => {
    if (engagements && typeof engagements.likes === "number") {
      setLikes(engagements.likes);
    }
  }, [engagements]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        messageDropdownRef.current &&
        !messageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMessageDropdown(false);
      }
    };

    if (showMessageDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMessageDropdown]);

  const togglePlay = () => {
    if (videoRef.current) {
      // Check the actual video state instead of just our state
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Ensure audio is properly handled with video
        videoRef.current.muted = globalMuted;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              // Handle play interruption gracefully
              if (error.name !== "AbortError") {
                console.error("Video play error:", error);
              }
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(newLikedState ? likes + 1 : likes - 1);

    // Call API to react to clip
    reactToClipMutation.mutate({
      clipId: reel.id,
      reaction: newLikedState ? "like" : "unlike",
    });
  };

  //   const handleFollow = () => {
  //     setIsFollowing(!isFollowing);
  //   };

  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || isSubmittingComment) return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.error("User must be authenticated to comment");
      return;
    }

    setIsSubmittingComment(true);
    try {
      await commentMutation.mutateAsync({
        clipId: reel.id,
        comment: commentInput.trim(),
      });
      setCommentInput("");
      refetchComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const startEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveEditComment = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    try {
      await editCommentMutation.mutateAsync({
        commentId: editingCommentId,
        newComment: editingCommentText.trim(),
      });
      setEditingCommentId(null);
      setEditingCommentText("");
      // refresh comments
      refetchComments();
    } catch (err) {
      console.error("Failed to edit comment", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      refetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Copy failed", err);
      alert("Failed to copy link");
    }
  };

  const handleShare = async () => {
    try {
      // Optimistically update shares count
      setShares(shares + 1);

      // Track share on backend
      await shareClipMutation.mutateAsync(reel.id);

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: reel.caption || "Check out this reel!",
          text: "Watch this amazing reel on BoookBox",
          url: window.location.href, // Use current URL for single reel view
        });
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      // Revert optimistic update on error
      setShares(shares);
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <>
      <div className="relative w-full h-[90vh] lg:h-screen bg-black">
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <img
              onClick={() => (window.location.href = "/home")}
              src={BrandLogo}
              alt="BoookBox"
              className="h-12 w-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] opacity-50"
            />
            {/* {isAuthenticated && currentUser && (
            <Avatar.Root className="w-9 h-9 rounded-full border border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm">
              <Avatar.Image
                src={currentUser.profileImage || undefined}
                alt={currentUser.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
              <Avatar.Fallback className="w-full h-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-orange-500 to-orange-700">
                {(currentUser.fullName || "B").charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
          )} */}
          </div>
          {/* <button
          type="button"
          onClick={handleClose}
          disabled={authPending}
          className="pointer-events-auto absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label={isAuthenticated ? "Close reel" : "Go to login"}
        >
          <X className="w-4 h-4" />
        </button> */}
        </div>
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover bg-black"
          muted={globalMuted}
          playsInline
          poster={reel.thumbnail}
          onClick={togglePlay}
          onEnded={handleVideoEnd}
          loop // Loop the video in single view
        >
          <source src={reel.videoUrl} type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${reel.thumbnail})` }}
          />
        </video>

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-black bg-opacity-50 rounded-full p-4 text-white"
            >
              <Play size={32} fill="white" />
            </button>
          </div>
        )}

        {/* User info overlay - Bottom left */}
        <div
          className="absolute bottom-0 left-0 right-16 p-4 bg-linear-to-t from-black/60 to-transparent w-full pb-[4.8rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-2">
            <Avatar
              className="w-10 h-10"
              src={reel.user.avatar}
              alt={reel.user.name}
              fallback={reel.user.name.charAt(0).toUpperCase()}
              radius="full"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  {reel.user.name}
                </span>
                {/* {!isFollowing && (
                <button
                  onClick={handleFollow}
                  className="text-white text-sm border border-white px-2 py-1 rounded-md"
                >
                  Follow
                </button>
              )} */}
              </div>
              <span className="text-gray-300 text-xs">{reel.user.handle}</span>
            </div>
          </div>
          <p className="text-white text-sm leading-relaxed mb-2 pr-4">
            {reel.caption}
          </p>

          {/* Message/Comment Field with Dropdown */}
          <div className="relative mb-3" ref={messageDropdownRef}>
            {showMessageDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-600 overflow-hidden z-50 max-h-80">
                {/* Comments List */}
                <div className="max-h-60 overflow-y-auto">
                  {comments.length > 0 ? (
                    <div className="px-3 py-2">
                      {comments.map((comment: ClipComment) => (
                        <div
                          key={comment._id}
                          className="flex gap-2 mb-3 last:mb-0"
                        >
                          <Avatar
                            className="w-6 h-6 shrink-0"
                            src={
                              comment.commenter?.id?.profileImage ||
                              "/api/placeholder/150/150"
                            }
                            alt={comment.commenter?.id?.fullName || "Unknown"}
                            fallback={(comment.commenter?.id?.fullName || "U")
                              .charAt(0)
                              .toUpperCase()}
                            radius="full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-xs font-medium truncate">
                                {comment.commenter?.id?.fullName ||
                                  "Unknown User"}
                              </span>
                              <span className="text-gray-400 text-xs shrink-0">
                                {new Date(
                                  comment.commentedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {comment.edited && (
                                  <span className="ml-1 text-gray-500">
                                    • Edited
                                  </span>
                                )}
                              </span>
                            </div>

                            {editingCommentId === comment._id ? (
                              <div className="w-full">
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) =>
                                    setEditingCommentText(e.target.value)
                                  }
                                  className="w-full bg-transparent text-white text-xs border border-gray-700 rounded p-2"
                                  rows={2}
                                />
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={saveEditComment}
                                    className="px-2 py-1 bg-orange-500 text-white text-xs rounded"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditComment}
                                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start">
                                <p className="text-gray-200 text-xs leading-relaxed break-words">
                                  {comment.text}
                                </p>
                                {/* Comment actions for author or reel owner */}
                                {isAuthenticated &&
                                  user &&
                                  (comment.commenter?.id?._id === user._id ||
                                    reel.user.id === user._id) && (
                                    <div className="ml-2 flex items-center gap-1">
                                      {comment.commenter?.id?._id ===
                                        user._id && (
                                        <button
                                          onClick={() =>
                                            startEditComment(
                                              comment._id,
                                              comment.text
                                            )
                                          }
                                          className="text-xs text-gray-300 hover:text-white"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(comment._id)
                                        }
                                        className="text-xs text-red-500 hover:text-red-400"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-400 text-xs">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="flex items-center border-t border-gray-600">
                  <div className="flex items-center gap-2 px-3">
                    {isAuthenticated && user ? (
                      <Avatar
                        className="w-6 h-6 flex-shrink-0"
                        src={user?.profileImage || "/api/placeholder/150/150"}
                        alt={user?.fullName || "You"}
                        radius="full"
                        fallback={(user?.fullName || "U")
                          .charAt(0)
                          .toUpperCase()}
                      />
                    ) : null}
                  </div>

                  <input
                    type="text"
                    placeholder={
                      isAuthenticated
                        ? "Write a comment..."
                        : "Sign in to comment"
                    }
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit();
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-white px-3 py-3 text-sm placeholder-gray-400"
                    autoFocus
                    disabled={isSubmittingComment || !isAuthenticated}
                  />
                  <div className="flex items-center gap-2 px-3">
                    <button
                      onClick={handleCommentSubmit}
                      disabled={
                        !commentInput.trim() ||
                        isSubmittingComment ||
                        !isAuthenticated
                      }
                      className="text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? (
                        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-white rounded-full" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-gray-300 text-xs">
            Original audio • {reel.user.name}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-xs">
              {reel.views > 1000
                ? `${(reel.views / 1000).toFixed(1)}K`
                : reel.views}
              <Eye size={12} className="inline-block ml-1 mb-0.5 " />
            </span>
          </div>
        </div>

        {/* Action buttons - Right side */}
        <div className="absolute right-3 bottom-[8rem] flex flex-col gap-6 z-20">
          {/* Like button */}
          <div className="flex flex-col items-center">
            <button
              onClick={
                isAuthenticated
                  ? handleLike
                  : () => alert.bind(null, "Please sign in to continue")
              }
              className={`p-2 rounded-full cursor-pointer ${
                isLiked && isAuthenticated ? "text-red-500" : "text-white"
              }`}
            >
              <Heart
                size={28}
                fill={isLiked ? "currentColor" : "none"}
                className="drop-shadow-lg"
              />
            </button>
            <span className="text-white text-xs font-medium mt-1">
              {likes > 1000 ? `${(likes / 1000).toFixed(1)}K` : likes}
            </span>
          </div>

          {/* Comment button */}
          <div className="flex flex-col items-center">
            <button
              className="p-2 text-white cursor-pointer"
              onClick={() => setShowMessageDropdown(!showMessageDropdown)}
            >
              <MessageCircle size={28} className="drop-shadow-lg" />
            </button>
            <span className="text-white text-xs font-medium mt-1">
              {comments.length > 1000
                ? `${(comments.length / 1000).toFixed(1)}K`
                : comments.length}
            </span>
          </div>

          {/* Share button */}
          <div className="flex flex-col items-center">
            <button
              className="p-2 text-white cursor-pointer"
              onClick={handleShare}
            >
              <Share size={28} className="drop-shadow-lg" />
            </button>
            <span className="text-white text-xs font-medium mt-1">
              {shares > 1000 ? `${(shares / 1000).toFixed(1)}K` : shares}
            </span>
          </div>

          {/* Mute/Unmute button */}
          <div className="flex flex-col items-center">
            <button
              onClick={onToggleMute}
              className="p-2 text-white cursor-pointer"
            >
              {globalMuted ? (
                <VolumeX size={28} className="drop-shadow-lg" />
              ) : (
                <Volume2 size={28} className="drop-shadow-lg" />
              )}
            </button>
          </div>

          {/* More options */}
          {isAuthenticated && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-2 text-white relative z-50">
                  <MoreHorizontal size={28} className="drop-shadow-lg" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-white rounded-lg shadow-lg p-2 min-w-40 z-[9999] border border-gray-200"
                  sideOffset={3}
                  align="start"
                >
                  {/* Show edit/delete options only for authenticated reel creators */}
                  {isAuthenticated && user && reel.user.id === user._id && (
                    <>
                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer">
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-red-50 text-red-600 rounded cursor-pointer">
                        Delete
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                    </>
                  )}
                  <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-red-50 text-red-600 rounded cursor-pointer">
                    Report
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer">
                    Not Interested
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={handleCopyLink}
                    className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                  >
                    Copy Link
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <Navigation />
      </div>
    </>
  );
};

const ReelView: React.FC = () => {
  const { reelId } = useParams<{ reelId: string }>();
  const navigate = useNavigate();
  const [globalMuted, setGlobalMuted] = useState(true);

  // Fetch single clip data using the hook
  const { data: clipData, isLoading, error } = useGetClipDetails(reelId || "");

  // Extract clip from the response (API returns array)
  const clip = Array.isArray(clipData) ? clipData[0] : clipData;

  // Transform clip to reel format
  const reel: ReelData | null = clip ? transformClipToReel(clip) : null;

  const handleToggleMute = () => {
    setGlobalMuted(!globalMuted);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Skeleton for reel loading */}
        <div className="relative w-full h-screen">
          {/* Video skeleton */}
          <Skeleton className="w-full h-full" />

          {/* Back button */}
          <div className="absolute top-4 left-4 z-50">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>

          {/* User info skeleton - Bottom left */}
          <div className="absolute bottom-0 left-0 right-16 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Action buttons skeleton - Right side */}
          <div className="absolute right-3 bottom-20 flex flex-col gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-3 w-6 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <p className="text-lg mb-2">Failed to load reel</p>
          <p className="text-sm text-gray-400">Please try again later</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No reel found
  if (!reel) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <p className="text-lg mb-2">Reel not found</p>
          <p className="text-sm text-gray-400">
            This reel may have been removed or is no longer available
          </p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black z-50">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-50 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Desktop wrapper - centers content with mobile aspect ratio */}
        <div className="flex justify-center items-center h-full w-full">
          <div className="relative w-full h-full lg:max-w-[400px] xl:max-w-[450px] 2xl:max-w-[500px] mx-auto bg-black">
            <ReelVideoSingle
              reel={reel}
              globalMuted={globalMuted}
              onToggleMute={handleToggleMute}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ReelView;
