import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, BadgeCheck, Tag,  ShoppingCart } from "lucide-react";
import {Avatar} from "@radix-ui/themes";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { Skeleton } from "@radix-ui/themes";
import PostForm from "./PostForm";
import type { PostFormData } from "./PostForm";
import ImageModal from "./ImageModal";
import { 
  useFeed, 
  useReactToPost, 
  useCommentOnPost, 
  usePostComments,
  useEditPost,
  useDeletePost,
  useEditComment,
  useDeleteComment,
  useSharePost
} from "@/hooks/usePosts";
import type { Post, PostComment } from "@/services/postService";
import { wasEdited, formatTimestampWithEdit } from "@/utils/diffInSeconds";
import useAuthStore from "@/store/authStore";
import { useUserProfileQuery } from "@/hooks/useUserQueries";
import { formatCurrency } from "@/utils/formatCurrency";



interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(!!post.reaction);
  const [likesCount, setLikesCount] = useState(post.reactions || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState<string>("");
  const [imageModalAlt, setImageModalAlt] = useState<string>("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editData, setEditData] = useState<PostFormData>({
    title: post.title || "",
    subtitle: post.subtitle || "",
    message: post.message || "",
    tags: post.tags || []
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  const { isAuthenticated } = useAuthStore();
  const { data: userProfile } = useUserProfileQuery();
  const navigate = useNavigate();
  
  // Hooks for post mutations
  const editPostMutation = useEditPost();
  const deletePostMutation = useDeletePost();
  const shareMutation = useSharePost();
  
  // Hooks for comment mutations
  const editCommentMutation = useEditComment();
  const deleteCommentMutation = useDeleteComment();
  
  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  
  // Check if current user owns this post
  
  // Extract user info from the nested structure
  const postUser = post.postedBy?.id;
  const bookingData = post.type === "gifting" ? post.data?.resource ?? null : null;
  const menuData = post.type === "business-offer" ? post.data?.resource ?? null : null;

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

  const isPostOwner = userProfile?.id === postUser?._id || userProfile?._id === postUser?._id;
  
  // Image modal handler
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
  
  // Hooks for interactions
  const reactMutation = useReactToPost();
  const commentMutation = useCommentOnPost();
  const { data: commentsResponse, refetch: refetchComments } = usePostComments(
    post._id, 
    1, 
    20
  );

  
  
  // Handle the API response structure - it might be direct array or wrapped in data property
  const comments: PostComment[] = Array.isArray(commentsResponse) 
    ? commentsResponse 
    : (commentsResponse && typeof commentsResponse === 'object' && 'data' in commentsResponse)
      ? (commentsResponse as { data: PostComment[] }).data || []
      : [];

  // Handle like/reaction
  const handleLike = async () => {
    if (!isAuthenticated || isLiking) return;
    
    setIsLiking(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);
    
    try {
      await reactMutation.mutateAsync({
        pid: post._id,
        type: newLikedState ? "like" : "unlike"
      });
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount(newLikedState ? likesCount - 1 : likesCount + 1);
      console.error('Failed to react to post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || isSubmittingComment || !isAuthenticated) return;
    
    setIsSubmittingComment(true);
    try {
      await commentMutation.mutateAsync({
        pid: post._id,
        text: commentInput.trim()
      });
      setCommentInput("");
      refetchComments();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle comment edit
  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  // Handle comment edit submit
  const handleEditCommentSubmit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    
    try {
      await editCommentMutation.mutateAsync({
        cid: commentId,
        text: editingCommentText.trim()
      });
      setEditingCommentId(null);
      setEditingCommentText("");
      refetchComments();
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  // Handle comment edit cancel
  const handleEditCommentCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      setDeletingCommentId(null);
      refetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Check if user owns a comment
  const isCommentOwner = (comment: PostComment) => {
    return userProfile?.id === comment.commenter?.id?._id || 
           userProfile?._id === comment.commenter?.id?._id;
  };

  // Handle comment button click
  const handleCommentClick = () => {
    setShowComments(!showComments);
    if (!showComments) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  };

  // Handle navigation to post detail
  const handlePostClick = () => {
    navigate(`/post/${post._id}`);
  };

  // Handle share action (local optimistic update + backend tracking)
  const handleShare = async () => {
    if (!post) return;

    // Track the share in the backend first
    try {
      await shareMutation.mutateAsync(post._id);
      // Update local shares count
      setSharesCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to track share:', error);
      // Continue with sharing even if tracking fails
    }

    const shareUrl = `${window.location.origin}/post/${post._id}`;
    const shareData = {
      title: post.title || "Check out this post on BoookBox",
      text: post.message || "Sharing a post from BoookBox",
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
        // Revert shares count if sharing was cancelled
        if (error instanceof Error && error.name === 'AbortError') {
          setSharesCount(prev => prev - 1);
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      try {
        await navigator.clipboard.writeText(shareText);
        // silent copy
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  // Handle edit post
  const handleEditPost = async () => {
    try {
      await editPostMutation.mutateAsync({
        pid: post._id,
        data: {
          title: editData.title,
          subtitle: editData.subtitle,
          message: editData.message,
          tags: editData.tags,
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit post:', error);
    }

  };

  // Handle delete post
  const handleDeletePost = async () => {
    try {
      await deletePostMutation.mutateAsync(post._id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  // Handle business-offer actions
  const handleBuyNow = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetMealOrMenuId = menuData?.menuId || menuData?._id;
      const restaurantId = menuData?.business?._id;
      if (targetMealOrMenuId) {
        navigate(`/restaurants/${restaurantId}/meals/${targetMealOrMenuId}`);
        return;
      }
  
      if (restaurantId) {
        navigate(`/restaurants/${restaurantId}`);
        
      }
    };

  const handleViewMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click navigation
    const targetMealOrMenuId = menuData?.menuId || menuData?._id;
      const restaurantId = menuData?.business?._id;
    if (menuData && targetMealOrMenuId) {
      navigate(`/restaurants/${restaurantId}/meals/${targetMealOrMenuId}`);
      return;
    }

    // No special ids found - nothing more to do (menu fallback already handled)
  };

  return (
    <div className="bg-white border-b border-gray-900 mb-0">
      {/* Post Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10"
            
              src={postUser?.profileImage || "/api/placeholder/150/150"}
              alt={getDisplayName()}
              // className="w-full h-full rounded-full object-cover"
              fallback={getDisplayName().charAt(0).toUpperCase()}
              radius="full"
          />
          <div className=" w-full">
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-gray-900 text-sm text-pretty">
                  {getDisplayName()}
                </h3>
                {hasBadges && (
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                )}
              </div>
              {/* <span className="text-gray-500 text-sm"></span> */}
              <p className="text-xs text-gray-500"> {"• "}
                {post.postedAt ? formatTimestampWithEdit(
                  new Date(post.postedAt), 
                  wasEdited(post.postedAt, post.updatedAt)
                ) : "Just now"}
              </p>
            </div>
          </div>
        </div>
        
        {/* More Actions Dropdown - Only show for post owner */}
        {isAuthenticated && isPostOwner && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                disabled={editPostMutation.isPending || deletePostMutation.isPending}
              >
                {editPostMutation.isPending || deletePostMutation.isPending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[180px] bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in-0 zoom-in-95"
                sideOffset={8}
                align="end"
              >
                <div className="py-1">
                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer outline-none transition-colors group"
                    onSelect={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                    <span className="font-medium">Edit Post</span>
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Separator className="h-px bg-gray-100 my-2 mx-2" />
                  
                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none transition-colors group"
                    onSelect={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
                    <span className="font-medium">Delete Post</span>
                  </DropdownMenu.Item>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Post Content */}
      {(post.title || post.subtitle || post.message || (post.type === "gifting" && bookingData) || (post.type === "business-offer" && menuData) || (post.tags && post.tags.length > 0)) && (
        <div 
          className="px-4 pb-3 ml-13 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handlePostClick}
        >
          {/* Title and Subtitle Section */}
          {(post.title || post.subtitle) && (
            <div className="mb-3">
              {post.title && (
                <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                  {post.title}
                </h2>
              )}
              {post.subtitle && (
                <h3 className="text-base font-medium text-gray-600 leading-relaxed">
                  {post.subtitle}
                </h3>
              )}
            </div>
          )}
          
          {/* Message Content */}
          {post.message && (
            <div className="mb-3">
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {post.message}
              </p>
            </div>
          )}

          {/* Restaurant Offer Content */}
          {post.type === "business-offer" && menuData && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 mb-3 border border-orange-100">
              <div className="flex items-start gap-4">
                <div className="shrink-0 hidden lg:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (menuData.business?.profileImage) {
                        openImageModal(
                          menuData.business.profileImage,
                          `${menuData.business.name} profile image`
                        );
                      }
                    }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Avatar
                      src={menuData.business?.profileImage}
                      alt={menuData.business?.name}
                      fallback={menuData.business?.name?.charAt(0).toUpperCase() || "R"}
                      className="w-8 h-8 cursor-pointer"
                      radius="full"
                    />
                  </button>
                </div>

                <div className="flex-1 min-w-0 bg-b">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900 text-lg">{menuData.business?.name}</h4>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {/* <MapPin className="w-3 h-3 inline mr-1" /> */}
                    {menuData.name}
                  </p>

                  {menuData.description && (
                    <p className="text-sm text-gray-700 mb-3">{menuData.description}</p>
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
                           
                            menuData.business?.paymentCurrency ?? bookingData?.bookedAtRestaurant?.paymentCurrency ?? "NGN"
                          )}
                        </span>
                      )}
                    </div>

                    {menuData.isAvailable && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Available Now</span>
                    )}
                  </div>

                  {menuData.customizations && menuData.customizations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Customization options available:</p>
                      <div className="flex flex-wrap gap-1">
                        {menuData.customizations.slice(0, 3).map((custom, index: number) => (
                          <span key={index} className="text-xs bg-white text-gray-700 px-2 py-1 rounded border">{custom.name}</span>
                        ))}
                        {menuData.customizations.length > 3 && (
                          <span className="text-xs text-gray-500">+{menuData.customizations.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button onClick={handleBuyNow} className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Order Now
                    </button>
                    <button onClick={handleViewMenu} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">View Details</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special content for booking posts */}
          {post.type === "gifting" && bookingData && (
            <div className="bg-gray-50 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-3 mb-2">
                {bookingData.bookedAtRestaurant && (
                  <>
                    
                      <Avatar
                        src={bookingData.bookedAtRestaurant.profileImage}
                        alt={bookingData.bookedAtRestaurant.name}
                        // className="w-full h-full rounded-full object-cover"
                        fallback={bookingData.bookedAtRestaurant.name.charAt(0).toUpperCase()}
                      />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {bookingData.bookedAtRestaurant.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {bookingData.numberOfBookings} booking{bookingData.numberOfBookings !== 1 ? 's' : ''} • {bookingData.bookingType}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {bookingData.reason && (
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Reason:</span> {bookingData.reason}
                </p>
              )}
            </div>
          )}
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Images */}
      {(() => {
        // Combine post images and custom booking image
        const allImages = [...(post.images || [])];
        
        // Add booking custom image for gifting posts
        if (post.type === "gifting" && bookingData?.customImage) {
          allImages.unshift(bookingData.customImage);
        }
        
        // Add menu item images for business-offer posts
        if (post.type === "business-offer" && menuData?.images) {
          allImages.unshift(...(menuData.images || []));
        }

        return allImages.length > 0 && (
          <div className="mb-0 ml-11">
            {allImages.length === 1 ? (
              <img
                src={allImages[0]}
                alt="Post content"
                className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  openImageModal(allImages[0], "Post content");
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-0.5 max-h-80 overflow-hidden">
                {allImages.slice(0, 2).map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Post content ${index + 1}`}
                      className="object-contain cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageModal(image, `Post content ${index + 1}`);
                      }}
                    />
                    {index === 3 && allImages.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          +{allImages.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Post Actions */}
      <div className="px-3 py-3 ml-11">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  const next = `/post/${post._id}`;
                  navigate(`/auth/login?next=${encodeURIComponent(next)}`);
                  return;
                }
                handleLike();
              }}
              disabled={isLiking}
              className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart 
                className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`}
              />
            </button>
            
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  const next = `/post/${post._id}`;
                  navigate(`/auth/login?next=${encodeURIComponent(next)}`);
                  return;
                }
                handleCommentClick();
              }}
              className="text-gray-700 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            
            <button 
              onClick={() => {
                if (!isAuthenticated) {
                  const next = `/post/${post._id}`;
                  navigate(`/auth/login?next=${encodeURIComponent(next)}`);
                  return;
                }
                handleShare();
              }}
              className="text-gray-700 transition-colors inline-flex items-center"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

       <div className="flex gap-3 items-center">
         {/* Likes Count */}
        {likesCount > 0 && (
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </span>
          </div>
        )}

        {/* Shares Count */}
        {sharesCount > 0 && (
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {sharesCount} {sharesCount === 1 ? 'share' : 'shares'}
            </span>
          </div>
        )}
       </div>

        {/* Comments Section */}
        <div>
          {/* View Comments Button */}
          {comments.length > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-sm text-gray-500 mb-2 hover:text-gray-700"
            >
              {showComments ? 'Hide' : 'View all'} {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </button>
          )}

          {/* Comments List */}
          {showComments && comments.length > 0 && (
            <ScrollArea.Root className="mb-3" style={{ height: '200px' }}>
              <ScrollArea.Viewport className="w-full h-full">
                <div className="space-y-2 pr-3">
                  {comments.map((comment: PostComment) => (
                    <div key={comment._id} className="flex gap-2">
                      <Avatar className="w-6 h-6 flex-shrink-0 mt-1"
                          src={comment.commenter?.id?.profileImage || "/api/placeholder/150/150"}
                          // alt={comment.commenter?.id?.fullName || "Unknown"}
                          radius="full"
                          // className="w-full h-full rounded-full object-cover"
                          size="1"
                         fallback ={(comment.commenter?.id?.fullName || "U").charAt(0).toUpperCase()}
                        />
                      <div className="flex-1 min-w-0">
                        {/* Comment Content */}
                        {editingCommentId === comment._id ? (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900 block mb-2">
                              {comment.commenter?.id.fullName || "Unknown User"}
                            </span>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditCommentSubmit(comment._id);
                                  }
                                  if (e.key === 'Escape') {
                                    handleEditCommentCancel();
                                  }
                                }}
                                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primary"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditCommentSubmit(comment._id)}
                                disabled={editCommentMutation.isPending || !editingCommentText.trim()}
                                className="text-xs text-blue-500 font-semibold hover:text-blue-700 disabled:opacity-50 px-2"
                              >
                                {editCommentMutation.isPending ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={handleEditCommentCancel}
                                className="text-xs text-gray-500 font-semibold hover:text-gray-700 px-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {comment.commenter?.id.fullName || "Unknown User"}
                            </span>{' '}
                            <span className="text-gray-900">{comment.text}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-1">
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
                          
                          {/* Edit and Delete buttons for comment owner */}
                          {isAuthenticated && isCommentOwner(comment) && editingCommentId !== comment._id && (
                            <>
                              <button 
                                onClick={() => handleEditComment(comment._id, comment.text)}
                                className="text-xs text-gray-500 font-semibold hover:text-blue-600 transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => setDeletingCommentId(comment._id)}
                                className="text-xs text-gray-500 font-semibold hover:text-red-600 transition-colors"
                                disabled={deleteCommentMutation.isPending}
                              >
                                {deleteCommentMutation.isPending && deletingCommentId === comment._id ? "Deleting..." : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                orientation="vertical"
              >
                <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          )}

          {/* Add Comment Input */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="w-8 h-8 flex-shrink-0"
                  src={userProfile?.profileImage || "/api/placeholder/150/150"}
                 radius="full"
                fallback ={(userProfile?.fullName || "U").charAt(0).toUpperCase()}
                size="2"
                />
              <div className="flex-1">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-500"
                  disabled={isSubmittingComment}
                />
              </div>
              {commentInput.trim() && (
                <button
                  onClick={handleCommentSubmit}
                  disabled={isSubmittingComment}
                  className="text-blue-500 text-sm font-semibold hover:text-blue-700 disabled:opacity-50"
                >
                  {isSubmittingComment ? "Posting..." : "Post"}
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Sign in to add a comment..."
                className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-500 cursor-not-allowed"
                disabled
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Post Dialog */}
      <Dialog.Root open={isEditing} onOpenChange={setIsEditing}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg z-50 max-h-[85vh] overflow-hidden">
            <PostForm
              data={editData}
              onDataChange={setEditData}
              onSubmit={handleEditPost}
              onCancel={() => setIsEditing(false)}
              isSubmitting={editPostMutation.isPending}
              submitLabel="Update Post"
              title="Edit Post"
              description="Update your post content and settings"
              suggestedTags={[
                "BoookBox", "FoodSharing", "Community", "Meals", "Restaurant", 
                "Giving", "Kindness", "FoodForAll", "Support", "Local", "Charity",
                "Experience", "Delicious", "Grateful", "Sharing", "Joy"
              ]}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <Dialog.Title className="text-xl font-bold text-red-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                Delete Post ?
              </Dialog.Title>
              {/* <p className="text-sm text-red-600 mt-1">
                This action is permanent and cannot be undone
              </p> */}
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-gray-800 leading-relaxed">
                  This can’t be undone. Once deleted, all comments, reactions, and associated data will be permanently removed.
                </p>
                
                {post.title && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                    <p className="text-sm text-gray-600">Post to be deleted:</p>
                    <p className="font-medium text-gray-900 mt-1 truncate">
                      "{post.title}"
                    </p>
                  </div>
                )}
              </div>
{/* 
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Warning
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      This will permanently remove your post from BoookBox and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
                onClick={handleDeletePost}
                disabled={deletePostMutation.isPending}
              >
                {deletePostMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Comment Delete Confirmation Dialog */}
      <Dialog.Root open={!!deletingCommentId} onOpenChange={(open) => !open && setDeletingCommentId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <Dialog.Title className="text-xl font-bold text-red-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                Delete Comment?
              </Dialog.Title>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-gray-800 leading-relaxed">
                  This action cannot be undone. Once deleted, this comment will be permanently removed.
                </p>
                
                {deletingCommentId && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                    <p className="text-sm text-gray-600">Comment to be deleted:</p>
                    <p className="font-medium text-gray-900 mt-1">
                      "{comments.find(c => c._id === deletingCommentId)?.text}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
                onClick={() => deletingCommentId && handleDeleteComment(deletingCommentId)}
                disabled={deleteCommentMutation.isPending}
              >
                {deleteCommentMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Image Modal */}
      <ImageModal
        src={imageModalSrc}
        alt={imageModalAlt}
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
      />
    </div>
  );
};

const Posts: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data: feedData, isLoading, error, isError } = useFeed(page, 10);


  const posts: Post[] = Array.isArray(feedData)
    ? feedData
    : (feedData && typeof feedData === 'object' && 'data' in feedData)
      ? (feedData as { data: Post[] }).data || []
      : [];
  const hasMorePosts = (feedData?.currentPage || 1) < (feedData?.totalPages || 1);

  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="space-y-0">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white border-b border-gray-200 p-4">
              {/* Header skeleton */}
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              {/* Content skeleton */}
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-48 w-full" />
              {/* Actions skeleton */}
              <div className="flex gap-4 mt-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">Failed to load posts</p>
            <p className="text-sm">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!posts.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm">Be the first to share your BoookBox experience!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full">
      {/* Posts Feed with ScrollArea */}
      <ScrollArea.Root className="w-full h-[calc(100vh-200px)]">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="space-y-0">
            {posts.map((post: Post) => (
              <PostItem key={post._id} post={post} />
            ))}
            
            {/* Load More Button */}
            {hasMorePosts && (
              <div className="text-center py-6 border-b border-gray-200">
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={isLoading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Loading..." : "Load More Posts"}
                </button>
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};

export default Posts;