// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import {
//   getFavoriteStatus,
//   toggleFavorite,
//   getUserRating,
//   rateRestaurant,
//   getRestaurantRating,
//   type RatingData,
// } from "@/services/favoriteRatingService";
// import { useToast } from "@/hooks/useToast";

// // Favorites Hooks
// export const useFavoriteStatus = (restaurantId: string) => {
//   return useQuery({
//     queryKey: ["favorite", restaurantId],
//     queryFn: () => getFavoriteStatus(restaurantId),
//     enabled: !!restaurantId,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

// export const useToggleFavorite = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: (restaurantId: string) => toggleFavorite(restaurantId),
//     onMutate: async (restaurantId) => {
//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({ queryKey: ["favorite", restaurantId] });

//       // Snapshot the previous value
//       const previousFavoriteData = queryClient.getQueryData([
//         "favorite",
//         restaurantId,
//       ]); // Optimistically update the cache
//       queryClient.setQueryData(
//         ["favorite", restaurantId],
//         (old: { isFavorite?: boolean; success?: boolean } | undefined) => {
//           return {
//             ...old,
//             isFavorite: !old?.isFavorite,
//             success: true,
//           };
//         }
//       );

//       // Return a context object with the snapshotted value
//       return { previousFavoriteData };
//     },
//     onSuccess: (data, restaurantId) => {
//       // Update the favorite status in cache with actual server response
//       queryClient.setQueryData(["favorite", restaurantId], {
//         success: data?.success,
//         isFavorite: data?.isFavorite,
//       });

//       // Show success message
//       toast({
//         title: data.isFavorite
//           ? "Added to Favorites"
//           : "Removed from Favorites",
//         description:
//           data.message ||
//           (data.isFavorite
//             ? "Restaurant added to your favorites list"
//             : "Restaurant removed from your favorites list"),
//         variant: "success",
//       });

//       // Invalidate related queries
//       queryClient.invalidateQueries({ queryKey: ["favorites"] });
//       queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
//     },
//     onError: (error: Error, restaurantId, context) => {
//       // Rollback optimistic update on error
//       if (context?.previousFavoriteData) {
//         queryClient.setQueryData(
//           ["favorite", restaurantId],
//           context.previousFavoriteData
//         );
//       }

//       toast({
//         title: "Error",
//         description: error.message || "Failed to update favorite status",
//         variant: "error",
//       });
//     },
//   });
// };

// // Rating Hooks
// export const useUserRating = (restaurantId: string) => {
//   return useQuery({
//     queryKey: ["userRating", restaurantId],
//     queryFn: () => getUserRating(restaurantId),
//     enabled: !!restaurantId,
//     staleTime: 10 * 60 * 1000, // 10 minutes
//   });
// };

// export const useRestaurantRating = (restaurantId: string) => {
//   return useQuery({
//     queryKey: ["restaurantRating", restaurantId],
//     queryFn: () => getRestaurantRating(restaurantId),
//     enabled: !!restaurantId,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

// export const useRateRestaurant = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: ({
//       restaurantId,
//       ratingData,
//     }: {
//       restaurantId: string;
//       ratingData: RatingData;
//     }) => rateRestaurant(restaurantId, ratingData),
//     onSuccess: ({ restaurantId }) => {
//       // Update caches
//       queryClient.invalidateQueries({ queryKey: ["userRating", restaurantId] });
//       queryClient.invalidateQueries({
//         queryKey: ["restaurantRating", restaurantId],
//       });
//       queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });

//       // Show success message
//       toast({
//         title: "Rating Submitted",
//         description: "Thank you for your feedback!",
//         variant: "success",
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to submit rating",
//         variant: "error",
//       });
//     },
//   });
// };


// useFavoriteRating.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  toggleFavorite,
  getFavoriteStatus,
  rateBusiness,
  getUserRating,
  type BusinessCategory,
} from "@/services/favoriteRatingService";

// Helper to convert normalized category to API category format
const normalizedToApiCategory = (normalized: string): BusinessCategory => {
  const map: Record<string, BusinessCategory> = {
    Restaurant: "restaurant",
    Groceries: "groceries",
    FrozenFoods: "frozen_foods",
    WineDrinks: "wine_drinks",
  };
  return map[normalized] || "restaurant";
};

// Get favorite status for a business
export const useFavoriteStatus = (businessId: string, category?: string) => {
  const apiCategory = category ? normalizedToApiCategory(category) : undefined;
  
  return useQuery({
    queryKey: ["favorite-status", businessId, apiCategory],
    queryFn: () => getFavoriteStatus(businessId, apiCategory),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Toggle favorite status
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      businessId, 
      category 
    }: { 
      businessId: string; 
      category?: string;
    }) => {
      // Validate businessId before making the API call
      if (!businessId || businessId.trim() === '') {
        console.error("Missing restaurant ID - businessId:", businessId, "category:", category);
        throw new Error("Missing restaurant ID");
      }
      
      console.log("Toggling favorite for:", { businessId, category });
      const apiCategory = category ? normalizedToApiCategory(category) : undefined;
      return toggleFavorite(businessId, apiCategory);
    },
    onSuccess: (data, variables) => {
      console.log("Toggle favorite success:", data);
      
      // Invalidate and refetch favorite status
      queryClient.invalidateQueries({
        queryKey: ["favorite-status", variables.businessId],
      });
      
      // Also invalidate the business detail to update the UI
      queryClient.invalidateQueries({
        queryKey: ["restaurant-detail", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["groceries-detail", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["frozen-foods-detail", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wine-drinks-detail", variables.businessId],
      });
    },
    onError: (error) => {
      console.error("Toggle favorite error:", error);
    },
  });
};

// Get user's rating for a business
export const useUserRating = (businessId: string, category?: string) => {
  const apiCategory = category ? normalizedToApiCategory(category) : undefined;
  
  return useQuery({
    queryKey: ["user-rating", businessId, apiCategory],
    queryFn: () => getUserRating(businessId, apiCategory),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Submit a rating for a business
export const useRateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      ratingData,
      category,
    }: {
      restaurantId: string;
      ratingData: { rating: number; comment?: string };
      category?: string;
    }) => {
      const apiCategory = category ? normalizedToApiCategory(category) : undefined;
      return rateBusiness(restaurantId, ratingData, apiCategory);
    },
    onSuccess: (data, variables) => {
      // Invalidate user rating query
      queryClient.invalidateQueries({
        queryKey: ["user-rating", variables.restaurantId],
      });
      
      // Invalidate business detail to update average rating
      queryClient.invalidateQueries({
        queryKey: ["restaurant-detail", variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["groceries-detail", variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["frozen-foods-detail", variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wine-drinks-detail", variables.restaurantId],
      });
    },
    onError: (error) => {
      console.error("Rate business error:", error);
    },
  });
};