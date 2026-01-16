import { useQuery } from "@tanstack/react-query";
import { campaignService, type CampaignFilters } from "@/services/campaignService";

// Query key definitions
export const campaignQueryKeys = {
  campaigns: {
    all: ["campaigns"] as const,
    list: (filters?: CampaignFilters) => ["campaigns", "list", filters] as const,
    recommended: (lat: number, lng: number, limit?: number, page?: number) =>
      ["campaigns", "recommended", { lat, lng, limit, page }] as const,
    top: (limit?: number, page?: number) =>
      ["campaigns", "top", { limit, page }] as const,
    ongoing: (limit?: number, page?: number) =>
      ["campaigns", "ongoing", { limit, page }] as const,
    detail: (id: string) => ["campaigns", "detail", id] as const,
    byBusiness: (bid: string) => ["campaigns", "byBusiness", bid] as const,
  },
};

// Get all campaigns
export function useAllCampaignsQuery(
  filters?: CampaignFilters,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: campaignQueryKeys.campaigns.list(filters),
    queryFn: () => campaignService.getAllCampaigns(filters),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes default
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get recommended campaigns based on location
export function useRecommendedCampaignsQuery(
  lat?: number,
  lng?: number,
  limit: number = 6,
  page: number = 1,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: campaignQueryKeys.campaigns.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      limit,
      page
    ),
    queryFn: () =>
      campaignService.getRecommendedCampaigns(lat as number, lng as number, limit, page),
    enabled: options?.enabled ?? hasCoords,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get top campaigns by sales
export function useTopCampaignsQuery(
  limit: number = 6,
  page: number = 1,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: campaignQueryKeys.campaigns.top(limit, page),
    queryFn: () => campaignService.getTopCampaigns(limit, page),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get ongoing campaigns
export function useOngoingCampaignsQuery(
  limit: number = 10,
  page: number = 1,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: campaignQueryKeys.campaigns.ongoing(limit, page),
    queryFn: () => campaignService.getOngoingCampaigns(limit, page),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get campaign by ID
export function useCampaignDetailQuery(
  campaignId: string,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: campaignQueryKeys.campaigns.detail(campaignId),
    queryFn: () => campaignService.getCampaignById(campaignId),
    enabled: options?.enabled !== undefined ? options.enabled : !!campaignId,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get campaigns by business
export function useCampaignsByBusinessQuery(
  businessId: string,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: campaignQueryKeys.campaigns.byBusiness(businessId),
    queryFn: () => campaignService.getCampaignsByBusiness(businessId),
    enabled: options?.enabled !== undefined ? options.enabled : !!businessId,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
