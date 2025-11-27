import React, { useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  BadgeCheck,
  Tag,
  ShoppingCart,
} from "lucide-react";

import { Avatar, Skeleton } from "@radix-ui/themes";

import ImageModal from "@/components/ImageModal";
import {
  usePostById,
  useReactToPost,
  useCommentOnPost,
  usePostComments,
  useSharePost,
} from "@/hooks/usePosts";
import type { PostComment } from "@/services/postService";
import { wasEdited, formatTimestampWithEdit } from "@/utils/diffInSeconds";
import useAuthStore from "@/store/authStore";
import Button from "@/components/Button";
import { formatCurrency } from "@/utils/formatCurrency";

type MaybeImageValue =
  | string
  | {
      url?: string;
      secure_url?: string;
      secureUrl?: string;
      path?: string;
      src?: string;
      downloadURL?: string;
    }
  | null
  | undefined;

const PUBLIC_APP_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL as string | undefined
)
  ?.trim()
  .replace(/\/?$/, "");

const resolveImageValue = (value: MaybeImageValue): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;

  const candidates = [
    value.secure_url,
    value.secureUrl,
    value.url,
    value.src,
    value.path,
    value.downloadURL,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return undefined;
};

const resolveImageArray = (value: unknown): string[] => {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];

  const resolved = values
    .map((item) => resolveImageValue(item as MaybeImageValue))
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    );

  return Array.from(new Set(resolved));
};

const resolveShareUrl = (postId: string): string => `${PUBLIC_APP_URL || ''}/post/${postId}`;

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState<string>("");
  const [imageModalAlt, setImageModalAlt] = useState<string>("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const { user, isAuthenticated } = useAuthStore();

  // Debug logging
  // console.log('PostDetail Debug:', {
  //   isAuthenticated,
  //   user: user ? { id: user.id, fullName: user.fullName } : null,
  //   postId
  // });

  // Fetch post data
  const { data: post, isLoading, error } = usePostById(postId!);
  // console.log("PostDetail Debug: post data", post);

  // Check if this is a visitor (not authenticated)
  const isVisitor = !isAuthenticated;

  // Image modal handlers
  const openImageModal = (src: string, alt: string) => {
    setImageModalSrc(src);
    setImageModalAlt(alt);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageModalSrc("");
    setImageModalAlt("");
  };

  // Initialize state based on post data
  const [isLiked, setIsLiked] = useState(!!post?.reaction);
  const [likesCount, setLikesCount] = useState(post?.reactions || 0);
  const [sharesCount, setSharesCount] = useState(post?.shares || 0);
  const [isLiking, setIsLiking] = useState(false);

  React.useEffect(() => {
    if (!post) return;

    setIsLiked(!!post.reaction);
    setLikesCount(post.reactions || 0);
    setSharesCount(post.shares || 0);
  }, [post]);

  // Hooks for interactions
  const reactMutation = useReactToPost();
  const commentMutation = useCommentOnPost();
  const shareMutation = useSharePost();
  const { data: commentsResponse, refetch: refetchComments } = usePostComments(
    postId!,
    1,
    50 // Load more comments on detail page
  );

  // Handle the API response structure
  const comments: PostComment[] = Array.isArray(commentsResponse)
    ? commentsResponse
    : commentsResponse &&
      typeof commentsResponse === "object" &&
      "data" in commentsResponse
    ? (commentsResponse as { data: PostComment[] }).data || []
    : [];

  // Handle like/reaction
  const handleLike = async () => {
    if (!isAuthenticated || !post || isLiking) return;

    setIsLiking(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);

    try {
      await reactMutation.mutateAsync({
        pid: post._id,
        type: newLikedState ? "like" : "unlike",
      });
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount(newLikedState ? likesCount - 1 : likesCount + 1);
      console.error("Failed to react to post:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (
      !commentInput.trim() ||
      isSubmittingComment ||
      !isAuthenticated ||
      !post
    )
      return;

    setIsSubmittingComment(true);
    try {
      await commentMutation.mutateAsync({
        pid: post._id,
        text: commentInput.trim(),
      });
      setCommentInput("");
      refetchComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle visitor action (sign-up/sign-in) - use React Router state for redirect
  const handleVisitorAction = (action: string) => {
    const from = location.pathname + location.search;
    if (action === "sign-up") {
      navigate("/auth/signup", { state: { from } });
    } else if (action === "sign-in") {
      navigate("/auth/login", { state: { from } });
    }
  };

  // Handle share action
  const handleShare = async () => {
    if (!post) return;

    // Track the share in the backend first
    try {
      await shareMutation.mutateAsync(post._id);
      // Update local shares count
      setSharesCount((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to track share:", error);
      // Continue with sharing even if tracking fails
    }

    const shareUrl = resolveShareUrl(post._id);
    const shareData = {
      title: post.title || "Check out this post on BoookBox",
      text: post.message || "Sharing a post from BoookBox",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing:", error);
        // Revert shares count if sharing was cancelled
        if (error instanceof Error && error.name === "AbortError") {
          setSharesCount((prev) => prev - 1);
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      try {
        await navigator.clipboard.writeText(shareText);
        // silent success - copy completed
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Post skeleton */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-48 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-4 bg-white border-b">
            <Button
              className="p-2 bg-[#ECE6F0] rounded-lg w-[40px] h-[40px]"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Post</h1>
          </div>

          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Post not found</p>
              <p className="text-sm">
                This post may have been deleted or doesn't exist.
              </p>
            </div>
            <Button
              onClick={() => navigate("/home/posts")}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Back to Posts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Extract user info from the nested structure
  const postUser = post.postedBy?.id;
  const bookingData = post.data?.resource;
  const menuData =
    post.type === "restaurant-offer" ? post.data?.resource ?? null : null;

  const postImages = resolveImageArray(post.images);
  const bookingImage = resolveImageValue(bookingData?.customImage);
  const menuImages = resolveImageArray(menuData?.images);

  const combinedImages = Array.from(
    new Set([
      ...(bookingImage ? [bookingImage] : []),
      ...postImages,
      ...menuImages,
    ])
  );

  // const primaryOgImage = combinedImages[0];
  // const shareUrl = resolveShareUrl(post._id);

  // Prepare customizations preview (show name + first item) to avoid [object Object]
  const customizations: unknown[] = Array.isArray(menuData?.customizations)
    ? (menuData!.customizations as unknown[])
    : [];
  const customizationPreview = customizations.slice(0, 3);

  // Get display name based on account type
  const getDisplayName = () => {
    if (post.postedBy?.role === "Restaurant") {
      return postUser?.name || "Unknown Restaurant";
    }
    // organization accounts may set accountType and organizationName
    if (postUser?.accountType === "organization" && postUser.organizationName) {
      return postUser.organizationName;
    }
    return postUser?.fullName || postUser?.name || "Unknown User";
  };

  // Check if user has badges
  const hasBadges = !!(postUser?.badges && postUser.badges.length > 0);

  // Get comment display name based on account type
  const getCommentDisplayName = (
    commenter:
      | {
          fullName?: string;
          name?: string;
          accountType?: string;
          organizationName?: string;
          role?: string;
        }
      | undefined
      | null
  ) => {
    if (!commenter) return "Unknown User";

    if (commenter.role === "Restaurant") {
      return commenter.name || "Unknown Restaurant";
    }
    // organization accounts may set accountType and organizationName
    if (
      commenter.accountType === "organization" &&
      commenter.organizationName
    ) {
      return commenter.organizationName;
    }
    return commenter.fullName || commenter.name || "Unknown User";
  };

  // Handle restaurant-offer actions for detail page
  const handleBuyNow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetMealOrMenuId = menuData?.menuId || menuData?._id;
    const restaurantId = menuData?.restaurant?._id;
    if (targetMealOrMenuId) {
      navigate(`/restaurants/${restaurantId}/meals/${targetMealOrMenuId}`);
      return;
    }

    if (restaurantId) {
      navigate(`/restaurants/${restaurantId}`);
    }
  };

  const handleViewMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetId = menuData?.menuId || menuData?._id;
    if (menuData && targetId) {
      navigate(`/menu/${targetId}`);
      return;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Button
                className="p-2 bg-[#ECE6F0] rounded-lg w-[40px] h-[40px]"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Post</h1>
            </div>

            {/* Visitor CTA in header */}
            {isVisitor && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleVisitorAction("sign-in")}
                  className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90"
                >
                  Join BoookBox
                </Button>
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="bg-white">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar
                radius="full"
                  className="w-10 h-10 rounded-full object-cover"
                  onClick={() => {
                    if (postUser?.profileImage) {
                      openImageModal(
                        postUser.profileImage,
                        `${getDisplayName()}'s profile image`
                      );
                    }
                  }}
                  src={postUser?.profileImage || "/api/placeholder/150/150"}
                  alt={getDisplayName()}
                  fallback={getDisplayName().charAt(0).toUpperCase()}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {getDisplayName()}
                      </h3>
                      {hasBadges && (
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <span className="text-gray-400">•</span>
                    <p className="text-sm text-gray-500">
                      {post.postedAt
                        ? formatTimestampWithEdit(
                            new Date(post.postedAt),
                            wasEdited(post.postedAt, post.updatedAt)
                          )
                        : "Just now"}
                    </p>
                  </div>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Post Content */}
            {(post.title ||
              post.subtitle ||
              post.message ||
              (post.type === "gifting" && bookingData) ||
              (post.type === "restaurant-offer" && menuData) ||
              (post.tags && post.tags.length > 0)) && (
              <div className="px-4 pb-3">
                {post.title && (
                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                    {post.title}
                  </h2>
                )}
                {post.subtitle && (
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    {post.subtitle}
                  </h3>
                )}
                {post.message && (
                  <p className="text-gray-900 text-sm leading-relaxed mb-2">
                    {post.message}
                  </p>
                )}

                {/* Special content for booking posts */}
                {post.type === "gifting" && bookingData && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      {bookingData.bookedAtRestaurant && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                bookingData.bookedAtRestaurant?.profileImage
                              ) {
                                openImageModal(
                                  bookingData.bookedAtRestaurant.profileImage,
                                  `${bookingData.bookedAtRestaurant.name} profile image`
                                );
                              }
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Avatar
                            radius="full"
                              className="w-12 h-12 cursor-pointer rounded-full"
                              src={bookingData.bookedAtRestaurant.profileImage}
                              alt={bookingData.bookedAtRestaurant.name}
                              // className="w-12 h-12 rounded-full object-cover"
                              fallback={bookingData.bookedAtRestaurant.name
                                .charAt(0)
                                .toUpperCase()}
                            />
                          </button>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {bookingData.bookedAtRestaurant.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {bookingData.numberOfBookings} booking
                              {bookingData.numberOfBookings !== 1
                                ? "s"
                                : ""} • {bookingData.bookingType}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {bookingData.reason && (
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Reason:</span>{" "}
                        {bookingData.reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Restaurant Offer Content (match Posts.tsx) */}
                {post.type === "restaurant-offer" && menuData && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 mb-3 border border-orange-100">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">
                            {menuData.restaurant?.name}
                          </h4>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {menuData.name}
                        </p>

                        {menuData.description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {menuData.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {menuData.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium w-fit">
                                <Tag className="w-3 h-3" />
                                {menuData.category}
                              </span>
                            )}
                            {menuData.price !== undefined && (
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(
                                  menuData.price,

                                  menuData.restaurant?.paymentCurrency ??
                                    bookingData?.bookedAtRestaurant
                                      ?.paymentCurrency ??
                                    "NGN"
                                )}
                              </span>
                            )}
                          </div>

                          {menuData.isAvailable && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Available Now
                            </span>
                          )}
                        </div>

                        {customizations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <p className="text-xs text-gray-600 mb-1">
                              Customization options available:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {customizationPreview.map((c, i) => {
                                // Each customization may be an object with name and items or a simple string
                                if (c && typeof c === "object") {
                                  const cu = c as Record<string, unknown>;
                                  const name =
                                    typeof cu["name"] === "string"
                                      ? (cu["name"] as string)
                                      : undefined;
                                  const items = Array.isArray(cu["items"])
                                    ? (cu["items"] as unknown[])
                                    : undefined;
                                  const label =
                                    name ||
                                    (items && items.length > 0
                                      ? String(items[0])
                                      : JSON.stringify(cu));
                                  // const sub = items && items.length > 0 ? String(items[0]) : null;
                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full font-medium">
                                        {label}
                                      </span>
                                    </div>
                                  );
                                }

                                // fallback for primitive values
                                return (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-white border border-orange-100 text-orange-800 text-xs rounded-full"
                                  >
                                    {String(c)}
                                  </span>
                                );
                              })}

                              {customizations.length >
                                customizationPreview.length && (
                                <span className="px-2 py-1 bg-white border border-orange-100 text-orange-800 text-xs rounded-full">
                                  +
                                  {customizations.length -
                                    customizationPreview.length}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={handleBuyNow}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Order Now
                          </button>
                          <button
                            onClick={handleViewMenu}
                            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post Images */}
            {combinedImages.length > 0 && (
              <div className="mb-0">
                {combinedImages.length === 1 ? (
                  <img
                    src={combinedImages[0]}
                    alt="Post content"
                    className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageModal(combinedImages[0], "Post content");
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-0.5 max-h-80 overflow-hidden">
                    {combinedImages.slice(0, 4).map((image, index) => (
                      <div key={image} className="relative">
                        <img
                          src={image}
                          alt={`Post content ${index + 1}`}
                          className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageModal(image, `Post content ${index + 1}`);
                          }}
                        />
                        {index === 3 && combinedImages.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              +{combinedImages.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Post Actions */}
            <div className="px-4 py-3 border-b">
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        handleVisitorAction("sign-in");
                        return;
                      }
                      handleLike();
                    }}
                    disabled={isLiking}
                    className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        isLiked && isAuthenticated
                          ? "text-red-500 fill-current"
                          : "text-gray-700"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        handleVisitorAction("sign-in");
                        return;
                      }
                      commentInputRef.current?.focus();
                    }}
                    className="text-gray-700 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>

                  <button
                    onClick={handleShare}
                    className="text-gray-700 transition-colors"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Visitor Sign-up Prompt */}
              <div className="flex gap-3 items-center">
                {/* Likes Count - Always show for engagement visibility */}
                <div className="mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {likesCount} {likesCount === 1 ? "like" : "likes"}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {sharesCount} {sharesCount === 1 ? "share" : "shares"}
                  </span>
                </div>
              </div>

              {isVisitor && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 mb-2">
                    Join BoookBox to like, comment, and interact with posts!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVisitorAction("sign-up")}
                      className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90"
                    >
                      Sign Up
                    </Button>
                    <Button
                      onClick={() => handleVisitorAction("sign-in")}
                      className="bg-white text-primary border border-primary px-3 py-1 rounded text-xs hover:bg-primary/10"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comments ({comments.length})
              </h3>

              {/* Add Comment Input */}
              {isAuthenticated ? (
                <div className="flex items-start gap-3 mb-6">
                  <Avatar
                    className="w-8 h-8 mt-1 object-cover"
                    src={user?.profileImage || "/api/placeholder/150/150"}
                    alt={user?.fullName || "You"}
                    // className="w-full h-full rounded-full object-cover"
                    radius="full"
                    fallback=// className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-white text-xs"
                    {(user?.fullName || "U").charAt(0).toUpperCase()}
                  />
                  <div className="flex-1">
                    <textarea
                      ref={commentInputRef}
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full bg-transparent border border-gray-300 rounded-lg p-3 text-sm placeholder-gray-500 resize-none"
                      rows={3}
                      disabled={isSubmittingComment}
                    />
                    {commentInput.trim() && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleCommentSubmit}
                          disabled={isSubmittingComment}
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isSubmittingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm" onClick={() => handleVisitorAction("sign-up")}>
                    {isVisitor
                      ? "Join BoookBox to add comments"
                      : "Sign in to add a comment"}
                  </p>
                  {/* {isVisitor && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => handleVisitorAction("sign-up")}
                        className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90"
                      >
                        Sign Up
                      </Button>
                      <Button
                        onClick={() => handleVisitorAction("sign-in")}
                        className="bg-white text-primary border border-primary px-3 py-1 rounded text-xs hover:bg-primary/10"
                      >
                        Sign In
                      </Button>
                    </div>
                  )} */}
                </div>
              )}

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment: PostComment) => (
                    <div key={comment._id} className="flex gap-3">
                      <Avatar className="w-8 h-8"
                        radius="full"
                          src={
                            comment.commenter?.id?.profileImage ||
                            "/api/placeholder/150/150"
                          }
                          alt={getCommentDisplayName(comment.commenter?.id)}
                          // className="w-full h-full rounded-full object-cover"
                        
                        fallback= 
                          {getCommentDisplayName(comment.commenter?.id)
                            .charAt(0)
                            .toUpperCase()}
                      
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            {getCommentDisplayName(comment.commenter?.id)}
                          </div>
                          <p className="text-gray-900 text-sm">
                            {comment.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 px-3">
                          <span className="text-xs text-gray-500">
                            {formatTimestampWithEdit(
                              new Date(comment.commentedAt),
                              wasEdited(comment.commentedAt, comment.updatedAt)
                            )}
                          </span>
                          <button className="text-xs text-gray-500 font-semibold hover:text-gray-700">
                            Like
                          </button>
                          <button className="text-xs text-gray-500 font-semibold hover:text-gray-700">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 text-sm">No comments yet</p>
                  <p className="text-gray-500 text-xs">
                    Be the first to comment on this post
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Bottom Banner */}
          {/* {isVisitor && (
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary to-orange-600 text-white p-4 shadow-lg z-50">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Join BoookBox Community!</h3>
                  <p className="text-sm text-orange-100">
                    Connect with food lovers, share meals, and spread kindness
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleVisitorAction("sign-up")}
                    className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Sign Up Free
                  </Button>
                  <Button
                    onClick={() => handleVisitorAction("sign-in")}
                    className="bg-transparent border border-white text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        src={imageModalSrc}
        alt={imageModalAlt}
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
      />
    </>
  );
};

export default PostDetail;
