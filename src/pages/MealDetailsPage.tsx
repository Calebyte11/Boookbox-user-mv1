/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import refuel from "@/assets/images/refuel.png";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Plus, Minus, ChevronDown, Check } from "lucide-react";
import Button from "@/components/Button";
import * as Accordion from "@radix-ui/react-accordion";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useCartStore } from "@/store/cartStore";
import FormField from "@/components/FormField";
import { useRestaurantMenuInfoQuery } from "@/hooks/useRestaurantQueries";
import { MealDetailsSkeleton } from "@/components/SkeletonLoader";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/hooks/useToast";
import { useMealHeaderStore } from "@/store/mealHeaderStore";
interface MealChoicesForm {
  [key: string]: string[] | string;
  userInstruction: string;
}
interface PricingTier {
  unitPrice: number;
  dozen?: {
    price: number;
    quantity: number;
  };
  carton?: {
    price: number;
    quantity: number;
  };
}

interface Customization {
  id: string;
  type: string;
  value: string;
  pricingTier?: PricingTier;
}

interface MealInfo {
  mealId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  isAvailable: boolean;
  ingredients: string[];
  tags: string[];
  customizations?: Customization[];
}

const ProductDetailsPage: React.FC = () => {
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId, mealId } = useParams<{
    restaurantId: string;
    mealId: string;
  }>();
  const { toast } = useToast();

  // Get minOrder from location state if navigated from CampaignDashboard
  const campaignMinOrder = (location.state as any)?.minOrder || null;
  const campaignMaxOrder = (location.state as any)?.maxOrder || null;
  const campaignId = (location.state as any)?.campaignId || null;

  // Store campaign info in sessionStorage if coming from campaign
  useEffect(() => {
    if (campaignId) {
      sessionStorage.setItem(
        "campaignOrderData",
        JSON.stringify({
          campaignId,
          minOrder: campaignMinOrder,
          maxOrder: campaignMaxOrder,
        })
      );
    }
  }, [campaignId, campaignMinOrder, campaignMaxOrder]);

  // State for quantity counter - initialize with minOrder if available
  const [quantity, setQuantity] = useState(campaignMinOrder || 1);

  // Function to get applicable pricing tier and multiplier for multiples
  const getApplicablePricingTier = (pricingTier: PricingTier | undefined, currentQuantity: number) => {
    if (!pricingTier) return null;
    if (pricingTier.carton && currentQuantity % pricingTier.carton.quantity === 0 && currentQuantity >= pricingTier.carton.quantity) {
      const multiplier = currentQuantity / pricingTier.carton.quantity;
      return { type: 'carton', price: pricingTier.carton.price * multiplier, quantity: pricingTier.carton.quantity, multiplier };
    }
    if (pricingTier.dozen && currentQuantity % pricingTier.dozen.quantity === 0 && currentQuantity >= pricingTier.dozen.quantity) {
      const multiplier = currentQuantity / pricingTier.dozen.quantity;
      return { type: 'dozen', price: pricingTier.dozen.price * multiplier, quantity: pricingTier.dozen.quantity, multiplier };
    }
    return null;
  };

  // Fetch meal details using the restaurantId and mealId, with caching (only supported options)
  const { data: mealData, isLoading: isMealLoading } = useRestaurantMenuInfoQuery(
    restaurantId!,
    mealId!,
    {
      enabled: !!restaurantId && !!mealId,
    }
  );

  // Robustly handle mealData and memoize mealInfos
  const mealInfos: MealInfo[] = useMemo(() => {
    if (!mealData) return [];
    if (!Array.isArray(mealData)) return [];
    return mealData.map((item: any) => ({
      mealId: item.menuId || item._id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      currency: item.restaurant?.paymentCurrency || "NGN",
      images: Array.isArray(item.images)
        ? item.images
        : item.images
        ? [item.images]
        : [],
      isAvailable: item.isAvailable,
      ingredients: item.ingredients,
      tags: item.tags,
      customizations: item.customizations,
    }));
  }, [mealData]);

  // Memoize the effective unit price based on quantity and pricing tiers
  const effectiveUnitPrice = useMemo(() => {
    const getEffectivePrice = (meal: MealInfo, currentQuantity: number) => {
      const customization = meal.customizations?.[0];
      const applicableTier = getApplicablePricingTier(customization?.pricingTier, currentQuantity);
      if (applicableTier) {
        return applicableTier.price / currentQuantity; // Return unit price
      }
      return meal.price;
    };
    return mealInfos.length > 0 ? getEffectivePrice(mealInfos[0], quantity) : 0;
  }, [mealInfos, quantity]);

  // Set meal header info in zustand store when mealInfos is loaded
  const setMeal = useMealHeaderStore((state) => state.setMeal);
  const clearMeal = useMealHeaderStore((state) => state.clearMeal);
  useEffect(() => {
    if (mealInfos && mealInfos.length > 0) {
      const meal = mealInfos[0];
      setMeal({
        mealId: meal.mealId,
        name: meal.name,
        image: meal.images?.[0] || refuel,
        description: meal.description,
        category: meal.category,
      });
    } else {
      clearMeal();
    }
    // Clear meal on unmount
    return () => {
      clearMeal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealInfos]);
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<MealChoicesForm>({
    mode: "onChange",
  });
  // If mealData is not available, handle loading or error states
  if (isMealLoading) {
    return <MealDetailsSkeleton />;
  }

  // If mealInfos is empty, show a fallback UI
  if (!mealInfos || mealInfos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
        Meal not found or unavailable.
      </div>
    );
  }

  const onSubmit: SubmitHandler<MealChoicesForm> = (data) => {
    // Use the loaded meal data directly
    const currentMeal = mealInfos?.[0];
    if (!currentMeal) return;

    // Convert dynamic form data to CartItemChoices format
    const choices: Record<string, string[]> = {};
    Object.keys(data).forEach((key) => {
      if (key !== "userInstruction" && Array.isArray(data[key])) {
        choices[key] = data[key] as string[];
      }
    });

    // Determine which pricing tier was applied
    const appliedTier = getApplicablePricingTier(
      currentMeal.customizations?.[0]?.pricingTier,
      quantity
    );

    const cartItem = {
      mealId: currentMeal.mealId,
      mealName: currentMeal.name,
      pricePerUnit: effectiveUnitPrice,
      quantity,
      choices,
      image: currentMeal.images?.[0] || refuel,
      restaurantId: restaurantId!,
      userInstruction: data.userInstruction,
      appliedPricingTier: appliedTier?.type as 'unit' | 'dozen' | 'carton' | undefined,
      baseUnitPrice: currentMeal.price,
      pricingTierData: currentMeal.customizations?.[0]?.pricingTier ? {
        dozen: currentMeal.customizations[0].pricingTier.dozen,
        carton: currentMeal.customizations[0].pricingTier.carton,
      } : undefined,
    };
    addItem(cartItem);
    // UX feedback: show added message
    toast({
      title: "Item added to cart!",
      // description: "You can view your cart to proceed with checkout.",
      variant: "success",
      duration: 2000,
    });
    // Reset form and quantity after adding to cart, do not navigate away
    reset();
    setQuantity(1);
    navigate(`/restaurants/${restaurantId}`, { replace: true });
  };

  // Handle quantity increment and decrement
  const incrementQuantity = () => {
    const maximumQuantity = campaignMaxOrder || Infinity;
    setQuantity((prev: number) => (prev < maximumQuantity ? prev + 1 : maximumQuantity));
  };
  const decrementQuantity = () => {
    const minimumQuantity = campaignMinOrder || 1;
    setQuantity((prev: number) => (prev > minimumQuantity ? prev - 1 : minimumQuantity));
  };

  // Quick buy function for bulk pricing tiers
  const handleQuickBuy = (tierQuantity: number, tierPrice: number, tierType: 'dozen' | 'carton') => {
    const currentMeal = mealInfos?.[0];
    if (!currentMeal) return;

    // Get pricing tier data for recalculation in OrderPage
    const pricingTierData = currentMeal.customizations?.[0]?.pricingTier;

    // Convert dynamic form data to CartItemChoices format (use form values if available)
    const choices: Record<string, string[]> = {};

    const cartItem = {
      mealId: currentMeal.mealId,
      mealName: currentMeal.name,
      pricePerUnit: tierPrice / tierQuantity, // Store effective unit price
      quantity: tierQuantity,
      choices,
      image: currentMeal.images?.[0] || refuel,
      restaurantId: restaurantId!,
      userInstruction: "",
      appliedPricingTier: tierType,
      baseUnitPrice: currentMeal.price, // Store base unit price for recalculation
      pricingTierData, // Store full pricing tier data for recalculation
    };
    addItem(cartItem);
    // UX feedback: show added message
    toast({
      title: "Item added to cart!",
      variant: "success",
      duration: 2000,
    });
    navigate(`/restaurants/${restaurantId}`, { replace: true });
  };

  const renderCustomizationItem = (
    type: string,
    customizations: Customization[],
    index: number
  ) => {
    const fieldName = type;


    return (
      <Accordion.Item
        key={`${fieldName}-${index}`}
        value={fieldName}
        className="overflow-hidden"
        tabIndex={-1}
      >
        <Accordion.Header className="w-full border-b border-gray-200">
          <Accordion.Trigger tabIndex={-1} className="flex justify-between items-start w-full py-4 group transition-all">
            <div className="flex flex-col items-start">
              {type && type.trim() && (
                <span className="font-medium text-black capitalize">
                  {type}
                </span>
              )}
              {type && type.trim() && (
                <span className="font-medium text-gray-400 text-sm">
                  Select your preferences
                </span>
              )}
            </div>
            <ChevronDown className="w-5 h-5 text-gray-600 transition-transform duration-300 group-data-[state=open]:rotate-180" />
          </Accordion.Trigger>
        </Accordion.Header>

        <Accordion.Content tabIndex={-1} className="p-4 bg-white border-t border-gray-200">
          <Controller
            name={fieldName}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <div className="space-y-3">
                <div className="flex flex-col gap-y-1">
                  {customizations.map((customization) => {
                    const isChecked = Array.isArray(field.value)
                      ? field.value.includes(customization.value)
                      : false;

                    return (
                      <Button
                        key={customization.id}
                        type="button"
                        onClick={() => {
                          const currentSelections =
                            (field.value as string[]) || [];
                          const itemValue = customization.value;
                          let newSelections: string[];

                          // Handle special "none" option logic if it exists
                          if (itemValue === "none") {
                            if (currentSelections.includes("none")) {
                              newSelections = [];
                            } else {
                              newSelections = ["none"];
                            }
                          } else {
                            if (currentSelections.includes(itemValue)) {
                              newSelections = currentSelections.filter(
                                (selectedItem) => selectedItem !== itemValue
                              );
                            } else {
                              newSelections = [
                                ...currentSelections.filter(
                                  (selectedItem) => selectedItem !== "none"
                                ),
                                itemValue,
                              ];
                            }
                          }
                          field.onChange(newSelections);
                        }}
                        className="flex items-center justify-between w-full text-left p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 cursor-pointer transition-all"
                      >
                        <span className="text-sm text-black capitalize">{customization.value}</span>
                        <Check
                          className={`border rounded-md p-0.5 w-6 h-6 transition-colors ${
                            isChecked
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-400 border-gray-300"
                          }`}
                        />
                      </Button>
                    );
                  })}
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-1">{error.message}</p>
                )}
              </div>
            )}
          />
        </Accordion.Content>
      </Accordion.Item>
    );
  };

  return (
    <div className="relative font-roboto">
      {/* Added to cart feedback */}

      <div className="relative w-full h-64 hidden md:block">
        {" "}
        <img
          src={mealInfos?.[0]?.images?.[0] || refuel}
          alt={mealInfos?.[0]?.name || "Meal"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        {/* Content that respects safe areas */}
        <div className="relative z-10 pt-[env(safe-area-inset-top)] px-4 h-full flex flex-col justify-start pb-6 ">
          <div className="flex justify-between mt-5">
            <Button
              className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </div>
      {/* Restaurant Info Section */}
      <div className="p-6">
        <div>
          <span className="text-gray-400">
            {mealInfos?.[0]?.category || "Lunch"}
          </span>{" "}
          <h1 className="text-3xl font-bold mb-4 capitalize">
            {mealInfos?.[0]?.name || "Meal Name"}
          </h1>{" "}
          <p className="text-black/50">
            {mealInfos?.[0]?.description ||
              "Rice or Spaghetti with a juicy lap of chicken and a bottle of Coca-cola"}
          </p>
          {/* Display ingredients if available */}
          {mealInfos?.[0]?.ingredients &&
            mealInfos[0].ingredients.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Ingredients:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mealInfos[0].ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          {/* Display tags if available */}
          {mealInfos?.[0]?.tags && mealInfos[0].tags.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {mealInfos[0].tags.map((tag, index) => (
                  <span
                    key={`special-tags-${index}`}
                    className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Display pricing tiers if available */}
          {mealInfos?.[0]?.customizations?.[0]?.pricingTier && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Bulk Pricing:</h3>
              <div className="flex flex-col gap-2">
                {mealInfos[0]?.customizations?.[0]?.pricingTier?.dozen && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-800">
                            Dozen Price
                          </span>
                          <span className="text-sm text-gray-600">
                            (Qty: {mealInfos[0]?.customizations?.[0]?.pricingTier?.dozen?.quantity})
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-primary mt-1">
                          {formatCurrency(
                            mealInfos[0]?.customizations?.[0]?.pricingTier?.dozen?.price || 0,
                            mealInfos[0]?.currency || 'NGN'
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleQuickBuy(
                          mealInfos[0]?.customizations?.[0]?.pricingTier?.dozen?.quantity || 0,
                          mealInfos[0]?.customizations?.[0]?.pricingTier?.dozen?.price || 0,
                          'dozen'
                        )}
                        className="ml-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                )}
                {mealInfos[0]?.customizations?.[0]?.pricingTier?.carton && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-800">
                            Carton Price
                          </span>
                          <span className="text-sm text-gray-600">
                            (Qty: {mealInfos[0]?.customizations?.[0]?.pricingTier?.carton?.quantity})
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-primary mt-1">
                          {formatCurrency(
                            mealInfos[0]?.customizations?.[0]?.pricingTier?.carton?.price || 0,
                            mealInfos[0]?.currency || 'NGN'
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleQuickBuy(
                          mealInfos[0]?.customizations?.[0]?.pricingTier?.carton?.quantity || 0,
                          mealInfos[0]?.customizations?.[0]?.pricingTier?.carton?.price || 0,
                          'carton'
                        )}
                        className="ml-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}{" "}
          {/* Quantity counter*/}
          <p className="py-4">Quantity</p>
          <div className="inline-flex p-3 border gap-3 py-2 rounded-full">
            <Button
              onClick={decrementQuantity}
              disabled={quantity <= (campaignMinOrder || 1)}
              className={`${
                quantity <= (campaignMinOrder || 1) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Minus />
            </Button>
            <span className="min-w-[20px] text-center">{quantity}</span>
            <Button
              onClick={incrementQuantity}
              disabled={campaignMaxOrder !== null && quantity >= campaignMaxOrder}
              className={`${
                campaignMaxOrder !== null && quantity >= campaignMaxOrder ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Plus />
            </Button>
          </div>
          <div className="border border-gray-400 my-4" />
        </div>{" "}
        {/* choice form  */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 ">
          {" "}
          {mealInfos?.[0]?.customizations &&
          Array.isArray(mealInfos[0].customizations) &&
          mealInfos[0].customizations.length > 0 ? (
            (() => {
              // Filter out customizations with undefined or empty type, then group by type
              const validCustomizations = mealInfos[0].customizations.filter(
                (customization) => customization.type && customization.type.trim() !== ''
              );
              
              const groupedCustomizations = validCustomizations.reduce(
                (acc, customization) => {
                  if (!acc[customization.type]) {
                    acc[customization.type] = [];
                  }
                  acc[customization.type].push(customization);
                  return acc;
                },
                {} as Record<string, Customization[]>
              );

              return (
                <Accordion.Root
                  type="multiple"
                  tabIndex={-1}
                  className="w-full space-y-3 capitalize"
                  onValueChange={() => {}} // override focus behavior
                >
                  {Object.entries(groupedCustomizations).map(
                    ([type, customizations], index) =>
                      renderCustomizationItem(type, customizations, index)
                  )}
                </Accordion.Root>
              );
            })()
          ) : (
            <div className="text-center text-gray-500 py-6">
              No customization options available for this meal.
            </div>
          )}
          {/* Special Instruction */}
          <div className="py-2">
            <h3 className="text-lg font-medium text-black">
              Special Instruction
            </h3>
            <p className="text-black/50 text-sm">
              please note that special instruction may result to price
              adjustment after your order is processed
            </p>
            <div className="py-4">
              <FormField
                name="userInstruction"
                register={register}
                errors={errors}
                placeholder="Add any request here"
              />
            </div>
          </div>{" "}
          <Button
            type="submit"
            className="text-white mt-4 w-full items-center rounded-full py-2.5 font-semibold text-base transition-colors inline-flex px-3 gap-2 relative bg-primary hover:bg-orange-600 justify-between mb-8 md:mb-0 flex-col"
          >
            <div className="w-full flex items-center justify-between">
              <span className="text-primary bg-white w-6 h-6 rounded-full">
                {quantity}
              </span>
              <span className="">Add to Cart</span>
              <span className="text-white">
                {formatCurrency(
                  quantity * effectiveUnitPrice,
                  mealInfos?.[0]?.currency || "NGN"
                )}
              </span>
            </div>
            {getApplicablePricingTier(mealInfos[0]?.customizations?.[0]?.pricingTier, quantity) && (
              <span className="text-xs mt-1 text-orange-100 italic">
                Bulk pricing applied! You're getting {getApplicablePricingTier(mealInfos[0]?.customizations?.[0]?.pricingTier, quantity)?.type} rate
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
// Legacy export for backward compatibility
export { ProductDetailsPage as MealDetailsPage };
