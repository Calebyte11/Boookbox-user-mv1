
import { useMemo, useState } from "react";
import Heading from "./Heading";

import { Gift, HandHelping } from "lucide-react";
import { usePopularProductsQuery } from "@/hooks/usePopularProductsQuery";
import { useNavigate } from "react-router-dom";

import { formatCurrency } from "@/utils/formatCurrency";
import RequestPackageForm from "@/components/RequestPackageForm";
import RequestPackageModal from "@/components/RequestPackageModal";

interface PackageItem {
  id: string;
  brand: string;
  businessCategory: string;
  description: string;
  image: string;
  package: string;
  price?: number;
  restaurantId: string;
  menuId: string;
  currency: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any;
}

const PopularPackages = () => {
  const navigate = useNavigate();
  
  // State for Request Form (new layer)
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // State for Request Modal (final step)
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // State for selected package and shareable link
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [shareableLink, setShareableLink] = useState<string>("");

  // Fetch popular products using the dedicated endpoint
  const { data: popularProductsData, isLoading } = usePopularProductsQuery();

  // Transform popular products into packages
  const packages: PackageItem[] = useMemo(() => {
    if (!popularProductsData || !Array.isArray(popularProductsData)) return [];

    return popularProductsData.slice(0, 8).map((product) => ({
      id: `${product.restaurantId}-${product._id}`,
      brand: product.restaurant?.name || "Restaurant",
      businessCategory: product.business?.category || "Restaurant",
      description:
        product.description ||
        product.packageDescription ||
        `Delicious ${product.name || product.packageName}`,
      image:
        (Array.isArray(product.images) &&
          product.images.length > 0 &&
          product.images[0]) ||
        product.packageImage ||
        product.image ||
        product.restaurant?.profileImage ||
        product.restaurant?.image ||
        "",
      package: product.name || product.packageName || "Meal Package",
      price: product.price || product.pricing,
      restaurantId: product.restaurantId || "",
      menuId: product.menuId || product._id,
      currency: product.restaurant?.paymentCurrency || "NGN",
      category: product.category,
    }));
  }, [popularProductsData]);

  console.log(packages);

  const hasPackages = packages.length > 0;

  // Handle Request button click - Opens the form
  const handleRequestClick = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setShowRequestForm(true);
  };

  // Handle form close
  const handleCloseForm = () => {
    setShowRequestForm(false);
    setSelectedPackage(null);
  };

  // Handle form success - Opens the modal with shareable link
  const handleFormSuccess = (link: string) => {
    setShareableLink(link);
    setShowRequestForm(false);
    setShowRequestModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedPackage(null);
    setShareableLink("");
  };

  return (
    <>
      <section className="">
        <div className="max-w-7xl mx-auto flex justify-between items-center my-6">
          <Heading title="Popular Packages" status={hasPackages} />
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex bg-[#F8F8F8] rounded-lg shadow-sm gap-2 animate-pulse"
              >
                <div className="w-[150px] h-[120px] bg-gray-300 rounded-l-xl"></div>
                <div className="flex-col flex container p-2 gap-2 justify-between flex-1">
                  <div className="">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-10 bg-gray-300 rounded-full w-32"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                className="flex items-start bg-[#F8F8F8] rounded-lg shadow-sm h-[12em] w-full hover:shadow-sm"
                key={pkg.id}
              >
                <div className="shrink-0 w-40 sm:w-40 md:w-48 h-full rounded-l-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={pkg.image}
                    alt={pkg.brand}
                    className="w-full h-full object-cover object-center rounded-l-lg"
                  />
                </div>
                <div className="flex-col flex container p-2 justify-between flex-1  h-full w-40">
                  <div>
                    <h1
                      className="font-semibold text-lg truncate capitalize"
                      title={pkg.package}
                    >
                      {pkg.package}
                    </h1>
                    <p className="text-black text-sm truncate" title={pkg.brand}>
                      {pkg.brand}
                    </p>

                    {/* Category Badge */}
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded-full border border-blue-200">
                      {pkg.businessCategory === "restaurant"
                        ? "Restaurant"
                        : pkg.businessCategory === "groceries"
                        ? "Grocery Store"
                        : pkg.businessCategory === "frozen-foods"
                        ? "Frozen Foods Store"
                        : pkg.businessCategory === "wine-drinks"
                        ? "Wine & Drinks Store"
                        : ""}
                    </span>

                    {pkg.price && (
                      <p className="mt-3 text-primary font-semibold text-sm">
                        {formatCurrency(pkg.price, pkg.currency || "NGN")}
                      </p>
                    )}
                  </div>
                  <p
                    className="text-gray-400 text-sm text-ellipsis text-pretty line-clamp-2 my-1"
                    title={pkg.description}
                  >
                    {pkg.description}
                  </p>
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          pkg.businessCategory === "restaurant"
                            ? `/restaurants/${pkg.restaurantId}/meals/${pkg.menuId}`
                            : `/${pkg.businessCategory}/${pkg.restaurantId}/items/${pkg.menuId}`
                        )
                      }
                      className="bg-primary hover:bg-primary/90 p-1.5 text-white inline-flex rounded-lg items-center justify-center gap-1 flex-1 text-xs transition-colors"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span className="truncate">Gift</span>
                    </button>
                    <button
                      onClick={() => handleRequestClick(pkg)}
                      type="button"
                      className="bg-green-100 hover:bg-green-200 border p-1.5 text-green-800 inline-flex rounded-lg items-center justify-center gap-1 flex-1 text-xs transition-colors"
                    >
                      <HandHelping className="w-4 h-4" />
                      <span className="truncate">Request</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}{" "}
        {!isLoading && packages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No popular packages available at the moment.
            </p>
          </div>
        )}
      </section>

      {/* Request Form (First Layer) */}
      {selectedPackage && (
        <RequestPackageForm
          isOpen={showRequestForm}
          onClose={handleCloseForm}
          packageData={selectedPackage}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Request Modal (Second Layer - Sharing) */}
      {selectedPackage && shareableLink && (
        <RequestPackageModal
          isOpen={showRequestModal}
          onClose={handleCloseModal}
          packageData={selectedPackage}
          shareableLink={shareableLink}
        />
      )}
    </>
  );
};

export default PopularPackages;