/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "./apiClient";
import { restaurantService } from "./restaurantService";
import { usersService } from "./usersService";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  image?: string;
  type: "restaurant" | "ticket" | "gift" | "booking" | "menu" | "user";
  route: string;
  metadata?: any;
  // Type-specific IDs for proper navigation
  ticketId?: string;
  bookingId?: string;
  restaurantId?: string;
  menuId?: string;
  userId?: string;
}

export class SearchService {
  // Helper method to clean search queries
  private static cleanQuery(query: string): string {
    if (!query) return query;

    return query
      .replace(/#/g, "") // Remove hashtags
      .replace(/[@]/g, "") // Remove @ symbols
      .trim(); // Remove leading/trailing whitespace
  }

  // Search restaurants
  static async searchRestaurants(query: string): Promise<SearchResult[]> {
    try {
      const restaurants = await restaurantService.getAllRestaurants();
      const cleanedQuery = this.cleanQuery(query);

      if (!cleanedQuery.trim()) return [];

      const filteredRestaurants = restaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(cleanedQuery.toLowerCase()) ||
          (restaurant.address &&
            restaurant.address
              .toLowerCase()
              .includes(cleanedQuery.toLowerCase())) ||
          (restaurant.cuisineType &&
            (Array.isArray(restaurant.cuisineType)
              ? restaurant.cuisineType.some((type) =>
                  type.toLowerCase().includes(cleanedQuery.toLowerCase())
                )
              : restaurant.cuisineType
                  .toLowerCase()
                  .includes(cleanedQuery.toLowerCase()))) ||
          (restaurant.kitchenType &&
            (typeof restaurant.kitchenType === "string"
              ? restaurant.kitchenType
                  .toLowerCase()
                  .includes(cleanedQuery.toLowerCase())
              : Array.isArray(restaurant.kitchenType)
              ? restaurant.kitchenType.some((type: string) =>
                  type.toLowerCase().includes(cleanedQuery.toLowerCase())
                )
              : false))
      );
      return filteredRestaurants.map((restaurant) => ({
        id: restaurant.restaurantId || restaurant._id,
        title: restaurant.name,
        description: restaurant.address || "Restaurant",
        image: restaurant.image,
        type: "restaurant" as const,
        route: `/restaurants/${restaurant.restaurantId || restaurant._id}`,
        restaurantId: restaurant.restaurantId || restaurant._id,
        metadata: {
          rating: restaurant.rating,
          priceRange: restaurant.priceRange,
          cuisineType: restaurant.cuisineType,
          kitchenType: restaurant.kitchenType,
        },
      }));
    } catch (error) {
      console.error("Error searching restaurants:", error);
      return [];
    }
  }
  // Search menu items for a specific restaurant
  static async searchMenuItems(
    restaurantId: string,
    query: string
  ): Promise<SearchResult[]> {
    try {
      const menus = await restaurantService.getRestaurantMenus(restaurantId);
      const cleanedQuery = this.cleanQuery(query);

      if (!cleanedQuery.trim()) return [];

      const filteredMenus = menus.filter(
        (menu: any) =>
          (menu.name &&
            menu.name.toLowerCase().includes(cleanedQuery.toLowerCase())) ||
          (menu.packageName &&
            menu.packageName
              .toLowerCase()
              .includes(cleanedQuery.toLowerCase())) ||
          (menu.description &&
            menu.description
              .toLowerCase()
              .includes(cleanedQuery.toLowerCase())) ||
          (menu.packageDescription &&
            menu.packageDescription
              .toLowerCase()
              .includes(cleanedQuery.toLowerCase())) ||
          (menu.category &&
            menu.category.toLowerCase().includes(cleanedQuery.toLowerCase()))
      );

      return filteredMenus.map((menu: any) => ({
        id: menu.menuId || menu._id || "",
        title: menu.name || menu.packageName || "Menu Item",
        description:
          menu.description || menu.packageDescription || "Delicious meal",
        image: menu.packageImage || menu.image,
        type: "menu" as const,
        route: `/restaurants/${restaurantId}/meals/${menu.menuId || menu._id}`,
        menuId: menu.menuId || menu._id,
        restaurantId: restaurantId,
        metadata: {
          price: menu.price || menu.pricing,
          currency: menu.currency,
          availability: menu.availability,
        },
      }));
    } catch (error: any) {
      console.error("Error searching menu items:", error);
      return [];
    }
  }
  // Search users by name or email
  static async searchUsers(query: string): Promise<SearchResult[]> {
    try {
      const cleanedQuery = this.cleanQuery(query);
      const users = await usersService.findUser(cleanedQuery);

      if (!cleanedQuery.trim()) return [];

      // Ensure users is an array
      const userList = Array.isArray(users) ? users : [users].filter(Boolean);

      return userList.map((user: any) => ({
        id: user.userId || user._id || "",
        title: user.name || user.fullName || "Unknown User",
        description: user.email || "User",
        image: user.profilePicture,
        type: "user" as const,
        route: `/profile/${user.userId || user._id}`,
        userId: user.userId || user._id,
        metadata: {
          role: user.role,
        },
      }));
    } catch (error: any) {
      console.error("Error searching users:", error);
      return [];
    }
  }

  // Search tickets/gifts (bookings)
  static async searchTicketsAndGifts(query: string): Promise<SearchResult[]> {
    try {
      const cleanedQuery = this.cleanQuery(query);
      if (!cleanedQuery.trim()) return [];

      // Search in user bookings for tickets and gifts
      const bookingResults = await this.searchUserBookings(cleanedQuery);

      // Transform bookings to tickets/gifts format
      return bookingResults.map((result) => ({
        ...result,
        type:
          result.metadata?.status === "paid" ||
          result.metadata?.status === "active"
            ? ("ticket" as const)
            : ("gift" as const),
        route:
          result.metadata?.status === "paid"
            ? `/bookings/${result.bookingId}`
            : `/bookings/${result.bookingId}`,
      }));
    } catch (error: any) {
      console.error("Error searching tickets and gifts:", error);
      return [];
    }
  }

  // Combined search for restaurants, menus, users, tickets, and gifts
  static async searchAll(query: string): Promise<SearchResult[]> {
    try {
      const [restaurantResults, userResults, ticketGiftResults] =
        await Promise.all([
          this.searchRestaurants(query),
          this.searchUsers(query),
          this.searchTicketsAndGifts(query),
        ]);

      // Combine all results and sort by relevance/type
      const allResults = [
        ...restaurantResults,
        ...userResults,
        ...ticketGiftResults,
      ];

      // Sort results: restaurants first, then tickets/gifts, then users
      return allResults.sort((a, b) => {
        const typeOrder = {
          restaurant: 1,
          ticket: 2,
          gift: 3,
          booking: 4,
          menu: 5,
          user: 6,
        };
        return typeOrder[a.type] - typeOrder[b.type];
      });
    } catch (error) {
      console.error("Error in combined search:", error);
      return [];
    }
  }
  // Search for meals across all restaurants
  static async searchAllMeals(query: string): Promise<SearchResult[]> {
    try {
      // Since we don't have a global meals search endpoint,
      // we'll search through restaurants and their menus
      const restaurants = await restaurantService.getAllRestaurants();
      const results: SearchResult[] = [];

      if (!query.trim()) return [];

      for (const restaurant of restaurants) {
        try {
          const menuResults = await this.searchMenuItems(
            restaurant.restaurantId || restaurant._id,
            query
          );
          results.push(...menuResults);
        } catch (error) {
          console.log(error);
          // Skip restaurants that fail to load menus
          continue;
        }
      }

      return results;
    } catch (error: any) {
      console.error("Error searching all meals:", error);
      return [];
    }
  }

  // Search restaurants by specific kitchen type
  static async searchRestaurantsByKitchenType(
    kitchenType: string
  ): Promise<SearchResult[]> {
    try {
      const restaurants = await restaurantService.getAllRestaurants();

      if (!kitchenType.trim()) return [];

      const filteredRestaurants = restaurants.filter(
        (restaurant) =>
          restaurant.kitchenType &&
          ((typeof restaurant.kitchenType === "string" &&
            restaurant.kitchenType.toLowerCase() ===
              kitchenType.toLowerCase()) ||
            (Array.isArray(restaurant.kitchenType) &&
              restaurant.kitchenType.some(
                (type: string) =>
                  type.toLowerCase() === kitchenType.toLowerCase()
              )))
      );

      return filteredRestaurants.map((restaurant) => ({
        id: restaurant.restaurantId || restaurant._id,
        title: restaurant.name,
        description: `${restaurant.kitchenType} • ${
          restaurant.address || "Restaurant"
        }`,
        image: restaurant.image,
        type: "restaurant" as const,
        route: `/restaurants/${restaurant.restaurantId || restaurant._id}`,
        restaurantId: restaurant.restaurantId || restaurant._id,
        metadata: {
          rating: restaurant.rating,
          priceRange: restaurant.priceRange,
          cuisineType: restaurant.cuisineType,
          kitchenType: restaurant.kitchenType,
        },
      }));
    } catch (error) {
      console.error("Error searching restaurants by kitchen type:", error);
      return [];
    }
  }

  // Search for restaurants by various criteria
  static async searchRestaurantsAdvanced(filters: {
    cuisine?: string;
    location?: string;
    rating?: number;
    priceRange?: string;
  }): Promise<SearchResult[]> {
    try {
      const restaurants = await restaurantService.getAllRestaurants();

      const filteredRestaurants = restaurants.filter((restaurant: any) => {
        if (filters.cuisine && restaurant.cuisineType) {
          const cuisineMatch = Array.isArray(restaurant.cuisineType)
            ? restaurant.cuisineType.some((type: string) =>
                type.toLowerCase().includes(filters.cuisine!.toLowerCase())
              )
            : restaurant.cuisineType
                .toLowerCase()
                .includes(filters.cuisine.toLowerCase());
          if (!cuisineMatch) return false;
        }

        if (filters.location && restaurant.address) {
          if (
            !restaurant.address
              .toLowerCase()
              .includes(filters.location.toLowerCase())
          ) {
            return false;
          }
        }

        if (filters.rating && restaurant.rating) {
          if (restaurant.rating < filters.rating) return false;
        }

        if (filters.priceRange && restaurant.priceRange) {
          if (restaurant.priceRange !== filters.priceRange) return false;
        }

        return true;
      });

      return filteredRestaurants.map((restaurant: any) => ({
        id: restaurant.restaurantId || restaurant._id || "",
        title: restaurant.name || "Unknown Restaurant",
        description: restaurant.address || "Restaurant",
        image: restaurant.image,
        type: "restaurant" as const,
        route: `/restaurants/${restaurant.restaurantId || restaurant._id}`,
        restaurantId: restaurant.restaurantId || restaurant._id,
        metadata: {
          rating: restaurant.rating,
          priceRange: restaurant.priceRange,
          cuisineType: restaurant.cuisineType,
        },
      }));
    } catch (error: any) {
      console.error("Error in advanced restaurant search:", error);
      return [];
    }
  }
  // Get search suggestions
  static async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (!query.trim()) return [];

      // Generate suggestions from restaurants data
      const restaurants = await restaurantService.getAllRestaurants();
      const suggestions: Set<string> = new Set();

      restaurants.forEach((restaurant: any) => {
        if (restaurant.name?.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(restaurant.name);
        }

        if (restaurant.cuisineType) {
          if (Array.isArray(restaurant.cuisineType)) {
            restaurant.cuisineType.forEach((cuisine: string) => {
              if (cuisine.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(cuisine);
              }
            });
          } else if (
            restaurant.cuisineType.toLowerCase().includes(query.toLowerCase())
          ) {
            suggestions.add(restaurant.cuisineType);
          }
        }

        if (
          restaurant.kitchenType &&
          restaurant.kitchenType.toLowerCase().includes(query.toLowerCase())
        ) {
          suggestions.add(restaurant.kitchenType);
        }
      });

      return Array.from(suggestions).slice(0, 10);
    } catch (error: any) {
      console.error("Error getting search suggestions:", error);
      return [];
    }
  } // Search within a specific user's bookings
  static async searchUserBookings(query: string): Promise<SearchResult[]> {
    try {
      if (!query.trim()) return [];

      const endpoint = `${
        API_ENDPOINTS.BOOKINGS.SEARCH
      }?query=${encodeURIComponent(query)}`;
      const response = await apiClient.get<any>(endpoint);
      const bookings = response.data || [];

      return bookings.map((booking: any) => {
        // Format date properly
        const formatDate = (dateString: string) => {
          try {
            const date = new Date(dateString);
            return isNaN(date.getTime())
              ? "Date TBD"
              : date.toLocaleDateString();
          } catch {
            return "Date TBD";
          }
        };

        // Create better title and description based on booking type
        const isTicket =
          booking.status === "paid" ||
          booking.status === "active" ||
          booking.status === "unused";
        const restaurantName =
          booking.restaurantName || booking.restaurant?.name || "Restaurant";
        // Add bookedBy (user who made the booking) if available
        let bookedBy = "";
        if (booking.bookedBy) {
          if (typeof booking.bookedBy === "string") {
            bookedBy = booking.bookedBy;
          } else if (booking.bookedBy.name) {
            bookedBy = booking.bookedBy.name;
          } else if (booking.bookedBy.fullName) {
            bookedBy = booking.bookedBy.fullName;
          }
        }
        let title = "";
        let description = "";

        if (isTicket) {
          title = `${restaurantName} Ticket`;
          description = `Status: ${
            booking.status || "Unknown"
          } • Valid: ${formatDate(
            booking.validityDate?.start || booking.bookingDate
          )}`;
        } else {
          title = `Booking at ${restaurantName}`;
          description = `Date: ${formatDate(booking.bookingDate)} • Status: ${
            booking.status || "Unknown"
          }`;
        }

        // Add tags if available
        if (
          booking.tags &&
          Array.isArray(booking.tags) &&
          booking.tags.length > 0
        ) {
          description += ` • Tags: ${booking.tags.slice(0, 2).join(", ")}`;
        }

        return {
          id: booking.bookingId || booking._id || "",
          title,
          description,
          image: booking.image || booking.restaurant?.image,
          type: isTicket ? ("ticket" as const) : ("booking" as const),
          route: isTicket
            ? `/bookings/${booking.bookingId || booking._id}`
            : `/bookings/${booking.bookingId || booking._id}`,
          bookingId: booking.bookingId || booking._id,
          restaurantId: booking.restaurantId,
          metadata: {
            status: booking.status,
            numberOfGuests: booking.numberOfGuests || booking.numberOfBookings,
            tags: booking.tags,
            validityDate: booking.validityDate,
            bookedBy, // Added bookedBy
            bookingType: booking.bookingType, // Added bookingType
          },
        };
      });
    } catch (error: any) {
      console.error("Error searching user bookings:", error);
      return [];
    }
  }
  // A general-purpose global search that queries multiple endpoints
  static async globalSearch(query: string): Promise<SearchResult[]> {
    const cleanedQuery = this.cleanQuery(query);
    if (!cleanedQuery) return [];

    try {
      // Enhanced global search that includes all entity types
      const [restaurantResults, userResults, ticketGiftResults, mealResults] =
        await Promise.all([
          this.searchRestaurants(cleanedQuery),
          this.searchUsers(cleanedQuery),
          this.searchTicketsAndGifts(cleanedQuery),
          this.searchAllMeals(cleanedQuery).catch(() => []), // Fallback to empty array if meals search fails
        ]);

      // Combine and prioritize results
      const allResults = [
        ...restaurantResults,
        ...ticketGiftResults,
        ...mealResults.slice(0, 5), // Limit meals to top 5 to avoid overwhelming results
        ...userResults,
      ];

      // Remove duplicates based on id and type
      const uniqueResults = allResults.filter(
        (result, index, self) =>
          index ===
          self.findIndex((r) => r.id === result.id && r.type === result.type)
      );

      return uniqueResults;
    } catch (error: any) {
      console.error("Error performing global search:", error);
      return [];
    }
  }
}
