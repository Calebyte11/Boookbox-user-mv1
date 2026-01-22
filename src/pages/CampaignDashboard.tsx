import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container } from "@radix-ui/themes";
import { useCampaignDetailQuery } from "@/hooks/useCampaignQueries";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  ArrowLeft,
  // Star,
  MapPin,
} from "lucide-react";
import SEO from "@/components/SEO";

const capitalizeWords = (str: string) => 
  str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const CampaignDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();

  const {
    data: campaign,
    isLoading,
    isError,
  } = useCampaignDetailQuery(campaignId || "");

  const handleBack = () => {
    navigate(-1);
  };

  const handleOrderNow = () => {
    if (campaign?.id || campaign?._id) {
      navigate(`/restaurants/${campaign.createdBy?.user._id}/meals/${campaign.product?._id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <Container size="4" className="mx-3 py-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#FF7A00] font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Campaign not found
          </h2>
          <p className="text-gray-600">
            We couldn't load this campaign. Please try again.
          </p>
        </div>
      </Container>
    );
  }

  // Calculate days left
  const endDate = new Date(campaign.endDate);
  const today = new Date();
  const daysLeft = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <>
      <SEO
        title={`${campaign.name || campaign.title} - Campaign`}
        description={campaign.description}
        keywords={`campaign, ${campaign.businessName}, offer`}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Image and Info */}
          <div className="lg:col-span-2">
            {/* Campaign Image */}
            <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden mb-6 bg-gray-100 shadow-lg">
              <img
                src={
                  campaign.image ||
                  campaign.businessImage ||
                  campaign.createdBy?.user.profileImage
                }
                alt={campaign.name || campaign.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Business Info Section */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    {campaign.status === "active"
                      ? "Ongoing"
                      : campaign.status === "upcoming"
                        ? "Upcoming"
                        : "Completed"}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                    {capitalizeWords(campaign.name || "Campaign")}
                  </h1>
                </div>
                <div className="flex gap-3">
                  <button className="p-3 border-2 border-gray-300 rounded-full hover:border-[#FF7A00] transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button className="p-3 border-2 border-gray-300 rounded-full hover:border-[#FF7A00] transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Business Details */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span className="text-sm">Billingsway Ikeja</span>
                </div>
              </div>
            </div>

            {/* Campaign Title and Description */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <p className="text-gray-700 leading-relaxed text-lg">
                {capitalizeWords(campaign.description ||
                  "This is an exciting campaign with great offers and benefits. Don't miss out on this opportunity!")}
              </p>
            </div>

            {/* Product Details Section - Card */}
            <div className="mb-1">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
                <div className="flex flex-col md:flex-row p-4">
                  {/* Left Side - Product Image and Title */}
                  <div className="w-full md:w-1/3 relative min-h-[200px]">
                    <img
                      src={
                        campaign.product?.images?.[0] ||
                        campaign.product?.image?.[0] ||
                        campaign.product?.image
                      }
                      alt={`${campaign.product?.name || "Product"}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent flex items-end p-4">
                      <div>
                        <div className="inline-block bg-[#FF7A00] text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
                          Featured
                        </div>
                        <h4 className="text-white font-bold text-sm line-clamp-2">
                          {capitalizeWords(campaign.product?.name ||
                            campaign.title ||
                            "Product")}
                        </h4>
                      </div>
                    </div>

                    {/* Discount */}
                    {campaign.discount && (
                      <div className="absolute top-0 right-0 flex items-end">
                        <div className="inline-block bg-[#ff7b00] text-white px-3 py-1  text-xs font-bold mb-2">
                          <p className="text-xl font-bold text-white">
                            -{campaign.discount.amount}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Product Details and Stats */}
                  <div className="w-full pt-2 flex flex-col">
                    {/* Product Name and Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {capitalizeWords(campaign.product?.name || campaign.title || "Product")}
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {capitalizeWords(campaign.product?.description ||
                          "High-quality product available for order. Don't miss this opportunity!")}
                      </p>
                    </div>

                    {/* Additional Product Details */}

                    {/* Product Specifications */}
                    {/* {campaign.specifications &&
                      Array.isArray(campaign.specifications) &&
                      campaign.specifications.length > 0 && ( border-b border-gray-200
                        <div className="pt-4 mt-4">
                          <p className="text-xs font-semibold text-gray-600 mb-3">
                            Key Features:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {campaign.specifications.map(
                              (spec: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-[#FF7A00]/10 text-[#FF7A00] px-2 py-1 rounded font-medium"
                                >
                                  {spec}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )} */}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pb-2">
                    {/* Category */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        Category
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {campaign.category || "N/A"}
                      </p>
                    </div>

                    {/* Unit Price */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        Unit Price
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {campaign.product.price ? `₦ ${campaign.product.price}` : "N/A"}
                      </p>
                    </div>

                    {/* Availability */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        Availability
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={
                            campaign.inStock !== false
                              ? "w-2 h-2 bg-emerald-500 rounded-full"
                              : "w-2 h-2 bg-red-500 rounded-full"
                          }
                        ></div>
                        <p className="text-sm font-bold text-gray-900">
                          {campaign.inStock !== false
                            ? "In Stock"
                            : "Out of Stock"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Campaign Stats and CTA */}
          <div className="lg:col-span-1">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl border shadow-sm border-gray-200 p-6 mb-6 sticky top-20">
              {/* Campaign Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">
                    {campaign.minOrder || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Min Order</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">
                    {campaign.maxOrder || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Max Order</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">
                    {campaign.numberOfSales || campaign.numberOfOrders || "0"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">
                    {daysLeft > 0 ? daysLeft : "0"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Days Left</p>
                </div>
              </div>

              {/* Discount Badge */}
              {/* {campaign.discount && (
                <div className="bg-[#FF7A00] text-white rounded-xl p-2 mb-6 text-center">
                  <p className="text-4xl font-bold">
                    {campaign.discount.amount}%
                  </p>
                  <p className="text-sm mt-1">Discount Available</p>
                </div>
              )} */}

              {/* Order Now Button */}
              <button
                onClick={handleOrderNow}
                className="w-full bg-[#FF7A00] text-white font-bold py-4 rounded-xl hover:bg-[#ff6a00] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Order Now
              </button>

              {/* Additional Info */}
              <p className="text-xs text-gray-500 text-center mt-4">
                End Date: {new Date(campaign.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default CampaignDashboard;
