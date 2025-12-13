/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "./apiClient";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  image?: string;
  type: "business" | "product" | "ticket" | "gift" | "booking";
  route: string;
  metadata?: any;
  businessId?: string;
  productId?: string;
  bookingId?: string;
}

export interface BackendSearchResponse {
  success: boolean;
  page: number;
  limit: number;
  query: string;
  data: {
    businesses: {
      data: any[];
      total: number;
    };
    products: {
      data: any[];
      total: number;
    };
    freeTickets: {
      data: any[];
      total: number;
    };
  };
  businesses: {
      data: any[];
      total: number;
    };
  products: {
    data: any[];
    total: number;
  };
  freeTickets: {
    data: any[];
    total: number;
  };
}

export class SearchService {
  /**
   * Main search method that uses the unified backend endpoint
   */
  static async search(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      const cleanedQuery = this.cleanQuery(query);
      
      if (!cleanedQuery.trim()) {
        return [];
      }

      const endpoint = API_ENDPOINTS.USER_SEARCH.GLOBAL(cleanedQuery, page, limit);
      const response = await apiClient.get<BackendSearchResponse>(endpoint);

      console.log("Search API Response:", response.data);

      if (!response.data || !response.success) {
        console.warn("Search failed or no success flag");
        
        return [];
      } else {
        console.log("Search successful", response.data);
      }

      const results = response.data;
      console.log("Search Results:", results);
      
      const searchResults: SearchResult[] = [];
// Correct extraction of the real backend structure
const { businesses, products, freeTickets } = results;

// Businesses
if (Array.isArray(businesses.data) && businesses.data.length > 0) {
  searchResults.push(...this.transformBusinesses(businesses.data));
}

// Products
if (Array.isArray(products.data) && products.data.length > 0) {
  searchResults.push(...this.transformProducts(products.data));
}

// Free Tickets
if (Array.isArray(freeTickets.data) && freeTickets.data.length > 0) {
  searchResults.push(...this.transformBookings(freeTickets.data));
}


      console.log("Total search results:", searchResults.length);
      return searchResults;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  /**
   * Transform business data from backend to SearchResult format
   */
  private static transformBusinesses(businesses: any[]): SearchResult[] {
    return businesses.map((business) => ({
      id: business._id,
      title: business.name,
      description: this.formatAddress(business),
      image: business.profileImage || business.image,
      type: "business" as const,
      route: this.getBusinessRoute(business),
      businessId: business._id,
      metadata: {
        category: business.category,
        badges: business.badges,
        city: business.city,
        state: business.state,
        country: business.country,
        isActive: business.isActive,
      },
    }));
  }

  /**
   * Transform product data from backend to SearchResult format
   */
  private static transformProducts(products: any[]): SearchResult[] {
    return products.map((product) => ({
      id: product._id,
      title: product.name,
      description: product.description || this.formatProductDescription(product),
      image: product.images?.[0] || product.image,
      type: "product" as const,
      route: this.getProductRoute(product),
      productId: product._id,
      businessId: product.business?._id,
      metadata: {
        price: product.price,
        currency: product.business?.paymentCurrency,
        type: product.type,
        category: product.category,
        businessName: product.business?.name,
        businessCategory: product.business?.category,
      },
    }));
  }

  /**
   * Transform booking/ticket data from backend to SearchResult format
   */
  private static transformBookings(bookings: any[]): SearchResult[] {
    return bookings.map((booking) => {
      const isTicket = booking.status === "paid" || booking.status === "active" || booking.status === "unused";
      const businessName = booking.bookedAtBusiness?.name || "Business";
      
      return {
        id: booking._id,
        title: isTicket ? `${businessName} Ticket` : `Booking at ${businessName}`,
        description: this.formatBookingDescription(booking),
        image: booking.bookedAtBusiness?.profileImage,
        type: isTicket ? ("ticket" as const) : ("booking" as const),
        route: `/bookings/${booking.bookingId || booking._id}`,
        bookingId: booking.bookingId || booking._id,
        businessId: booking.bookedAtBusiness?._id,
        metadata: {
          status: booking.status,
          numberOfBookings: booking.numberOfBookings,
          reason: booking.reason,
          bookingType: booking.bookingType,
          validityDate: booking.validityDate,
          bookedBy: booking.bookedByUser?.fullName,
          businessName,
          businessCategory: booking.bookedAtBusiness?.category,
          slotsTaken: booking.slotsTaken,
        },
      };
    });
  }

  /**
   * Helper method to clean search queries
   */
  private static cleanQuery(query: string): string {
    if (!query) return query;

    return query
      .replace(/#/g, "")
      .replace(/[@]/g, "")
      .trim();
  }

  /**
   * Format business address
   */
  private static formatAddress(business: any): string {
    const parts = [];
    
    if (business.address) parts.push(business.address);
    if (business.city) parts.push(business.city);
    if (business.state) parts.push(business.state);
    
    return parts.join(", ") || business.category || "Business";
  }

  /**
   * Format product description
   */
  private static formatProductDescription(product: any): string {
    const parts = [];
    
    if (product.business?.name) {
      parts.push(product.business.name);
    }
    
    if (product.price && product.business?.paymentCurrency) {
      parts.push(`${product.business.paymentCurrency} ${product.price.toLocaleString()}`);
    }
    
    return parts.join(" • ") || "Product";
  }

  /**
   * Format booking description
   */
  private static formatBookingDescription(booking: any): string {
    const parts = [];
    
    parts.push(`Status: ${booking.status || "Unknown"}`);
    
    if (booking.validityDate?.start) {
      const date = new Date(booking.validityDate.start);
      if (!isNaN(date.getTime())) {
        parts.push(`Valid: ${date.toLocaleDateString()}`);
      }
    }
    
    if (booking.numberOfBookings) {
      parts.push(`${booking.numberOfBookings} slot${booking.numberOfBookings > 1 ? "s" : ""}`);
    }
    
    return parts.join(" • ");
  }

  /**
   * Get appropriate route for business based on category
   */
  private static getBusinessRoute(business: any): string {
    const id = business._id;
    const category = business.category;
    
    switch (category) {
      case "restaurant":
        return `/restaurants/${id}`;
      case "groceries":
        return `/groceries/${id}`;
      case "frozen-foods":
        return `/frozen-foods/${id}`;
      case "wine-drinks":
        return `/wine-drinks/${id}`;
      default:
        return `/businesses/${id}`;
    }
  }

  /**
   * Get appropriate route for product based on business category
   */
  private static getProductRoute(product: any): string {
    const businessId = product.business?._id;
    const productId = product._id;
    const category = product.business?.category;
    
    if (!businessId || !productId) {
      return `/products/${productId}`;
    }
    
    switch (category) {
      case "restaurant":
        return `/restaurants/${businessId}/meals/${productId}`;
      case "groceries":
        return `/groceries/${businessId}/items/${productId}`;
      case "frozen-foods":
        return `/frozen-foods/${businessId}/items/${productId}`;
      case "wine-drinks":
        return `/wine-drinks/${businessId}/items/${productId}`;
      default:
        return `/businesses/${businessId}/products/${productId}`;
    }
  }

  /**
   * Get search suggestions (can be enhanced with a dedicated backend endpoint if available)
   */
  static async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const cleanedQuery = this.cleanQuery(query);
      
      if (!cleanedQuery.trim() || cleanedQuery.length < 2) {
        return [];
      }

      // Perform a limited search to get suggestions
      const results = await this.search(cleanedQuery, 1, 5);
      
      // Extract unique titles as suggestions
      const suggestions = new Set<string>();
      
      results.forEach((result) => {
        if (result.title && suggestions.size < 10) {
          suggestions.add(result.title);
        }
        
        // Add business names from products
        if (result.type === "product" && result.metadata?.businessName) {
          if (suggestions.size < 10) {
            suggestions.add(result.metadata.businessName);
          }
        }
      });
      
      return Array.from(suggestions);
    } catch (error) {
      console.error("Error getting search suggestions:", error);
      return [];
    }
  }
}