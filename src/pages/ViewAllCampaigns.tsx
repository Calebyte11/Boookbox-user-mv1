/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@radix-ui/themes";
import {
  useRecommendedCampaignsQuery,
  useTopCampaignsQuery,
  useOngoingCampaignsQuery,
} from "@/hooks/useCampaignQueries";
import { useLocationService } from "@/hooks/useLocationService";
import { ListSkeleton } from "@/components/SkeletonLoader";
import type { Campaign } from "@/services/campaignService";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

interface TabConfig {
  id: "recommended" | "top" | "ongoing";
  label: string;
  count: number;
}

const ViewAllCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const locationService = useLocationService() as any;
  const latitude = locationService?.latitude;
  const longitude = locationService?.longitude;
  const [activeTab, setActiveTab] = useState<"recommended" | "top" | "ongoing">(
    "recommended"
  );
  const [page, setPage] = useState(1);
  const pageLimit = 12;

  // Fetch campaigns data for all tabs
  const {
    data: recommendedCampaigns = [],
    isLoading: isRecommendedLoading,
    isError: isRecommendedError,
  } = useRecommendedCampaignsQuery(latitude, longitude, pageLimit, page, {
    enabled: latitude !== null && longitude !== null,
  });

  const {
    data: topCampaigns = [],
    isLoading: isTopLoading,
    isError: isTopError,
  } = useTopCampaignsQuery(pageLimit, page);

  const {
    data: ongoingCampaigns = [],
    isLoading: isOngoingLoading,
    isError: isOngoingError,
  } = useOngoingCampaignsQuery(pageLimit, page);

  // Get active tab data
  const getActiveCampaigns = () => {
    switch (activeTab) {
      case "top":
        return topCampaigns;
      case "ongoing":
        return ongoingCampaigns;
      case "recommended":
      default:
        return recommendedCampaigns;
    }
  };

  const getIsLoading = () => {
    switch (activeTab) {
      case "top":
        return isTopLoading;
      case "ongoing":
        return isOngoingLoading;
      case "recommended":
      default:
        return isRecommendedLoading;
    }
  };

  const getIsError = () => {
    switch (activeTab) {
      case "top":
        return isTopError;
      case "ongoing":
        return isOngoingError;
      case "recommended":
      default:
        return isRecommendedError;
    }
  };

  const activeCampaigns = getActiveCampaigns();
  const isLoading = getIsLoading();
  const isError = getIsError();

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: "recommended", label: "Recommended For You", count: recommendedCampaigns.length },
    { id: "top", label: "Top Campaigns", count: topCampaigns.length },
    { id: "ongoing", label: "Ongoing Campaigns", count: ongoingCampaigns.length },
  ];

  const handleCampaignClick = (campaign: Campaign) => {
    navigate(
      `/campaigns/${campaign._id || campaign.id}`
    );
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <SEO
        title="All Campaigns"
        description="Explore all available campaigns and special offers."
        keywords="campaigns, offers, discounts, businesses"
      />
      <Container size="4" className="mx-3 py-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#FF7A00] font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          All Campaigns
        </h1>
        <p className="text-gray-600 mb-8">
          Discover amazing campaigns and special offers from your favorite businesses.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1); // Reset to first page when changing tabs
              }}
              className={`pb-3 px-4 whitespace-nowrap font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-[#FF7A00] border-b-2 border-[#FF7A00]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div>
            <ListSkeleton count={12} />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-4">
                We couldn't load the campaigns. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[#FF7A00] text-white font-semibold rounded-lg hover:bg-[#ff6a00] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && activeCampaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                No campaigns found
              </h2>
              <p className="text-gray-600">
                There are currently no {activeTab} campaigns available.
              </p>
            </div>
          </div>
        )}

        {/* Campaigns Grid */}
        {!isLoading && !isError && activeCampaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((campaign) => (
              <div
                key={campaign._id || campaign.id}
                onClick={() => handleCampaignClick(campaign)}
                className="group relative h-[300px] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100"
              >
                {/* Background Image */}
                <img
                  src={campaign.image || campaign.businessImage || campaign.profileImage}
                  alt={campaign.name || campaign.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Campaign Info */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  {/* Business Name */}
                  <p className="text-xs md:text-sm font-semibold text-gray-200 mb-1 line-clamp-1">
                    {campaign.businessName || "Campaign"}
                  </p>

                  {/* Campaign Title */}
                  <h3 className="text-base md:text-lg font-bold text-white mb-3 line-clamp-2">
                    {campaign.name || campaign.title || "Featured Campaign"}
                  </h3>

                  {/* Campaign Details Row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {campaign.discountPercentage && (
                        <span className="bg-[#FF7A00] text-white font-bold text-xs px-2 py-1 rounded-full">
                          {campaign.discountPercentage}% OFF
                        </span>
                      )}
                      {campaign.numberOfOrders && (
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                          {campaign.numberOfOrders} Orders
                        </span>
                      )}
                      {campaign.numberOfSales && (
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                          {campaign.numberOfSales} Sales
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {campaign.status && (
                    <div className="mt-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          campaign.status === "ongoing"
                            ? "bg-green-500/80 text-white"
                            : campaign.status === "upcoming"
                            ? "bg-blue-500/80 text-white"
                            : "bg-gray-500/80 text-white"
                        }`}
                      >
                        {campaign.status.charAt(0).toUpperCase() +
                          campaign.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && activeCampaigns.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-semibold">Page {page}</span>
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={activeCampaigns.length < pageLimit}
              className="px-4 py-2 bg-[#FF7A00] text-white font-semibold rounded-lg hover:bg-[#ff6a00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </Container>
    </>
  );
};

export default ViewAllCampaigns;
