
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useEffect } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  type Resolver,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  User,
  Users,
  Utensils,
  Upload,
  ChevronDown,
  Check,
  Circle,
  X,
  Edit3,
  Gift, // ADD THIS NEW ICON
} from "lucide-react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tabs from "@radix-ui/react-tabs";
import type { OrderFormValues, OrderFormProps } from "@/features/sponsor/types";
import FormField from "@/components/FormField";
import UserSearchCombobox from "@/components/UserSearchCombobox";
import CartButton from "@/components/CartButton";
import Calendar from "./Calendar";
import BookingTypeSection from "./BookingTypeSection";
import RedemptionModeSection from "./RedemptionModeSection";
import PublicTagsSection from "./PublicTagsSection";
import { useCartStore } from "@/store/cartStore";
import { orderFormSchema } from "@/features/sponsor/schema";
import {
  useUpdateBooking,
  useBookingDetailQuery,
} from "@/hooks/useUserQueries";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
import { useImageUpload, useImageValidation } from "@/hooks/useImageUpload";
import { fileService, type ImageUploadResponse } from "@/services/fileService";
import { type UserSearchResult } from "@/services/usersService";
import useAuthStore from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { OrderFormSkeleton } from "@/components/SkeletonLoader";
import type { GiftRequestData } from "@/services/giftRequestService"; // ADD THIS IMPORT

// UPDATE THE OrderFormProps INTERFACE
interface ExtendedOrderFormProps extends OrderFormProps {
  giftRequestData?: GiftRequestData | null; // Add gift request data prop
}

const OrderForm: React.FC<ExtendedOrderFormProps> = ({ 
  onSubmit, 
  restaurantId,
  giftRequestData // ADD THIS PROP
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items } = useCartStore();
  const { hasValidAuth, user } = useAuthStore();
  const { updateBookingDetails, setBookingPayload } = useBookingStore();
  const [searchParams] = useSearchParams();

  console.log(giftRequestData);
  

  // Check if we're in edit mode
  const editBookingId = searchParams.get("editBooking");
  const isEditMode = !!editBookingId;
  
  // NEW: Check if this is a gift request
  const isGiftRequest = !!giftRequestData;

  // Fetch restaurant details
  const { data: restaurantData } = useRestaurantDetailQuery(restaurantId, {
    enabled: !!restaurantId,
  });

  // Fetch existing booking data when in edit mode
  const {
    data: editBookingData,
    isLoading: isLoadingBooking,
  }: { data: any; isLoading: boolean } = useBookingDetailQuery(
    editBookingId || "",
    {
      enabled: isEditMode && !!editBookingId,
    }
  );
  
  // State for uploaded ticket design
  const [uploadedTicketDesign, setUploadedTicketDesign] = useState<{
    file: File;
    url: string;
    preview: string;
    isUploading?: boolean;
  } | null>(null);

  const { uploadImage } = useImageUpload({
    onSuccess: () => {},
    showToast: false,
  });

  const { validateFile } = useImageValidation();
  
  const deliveryType = [
    { name: "single", icon: <User />, label: "Single Recipient" },
    { name: "multiple", icon: <Users />, label: "Multiple Recipients" },
  ];
  // =======================================================================
  // UPDATED: Form initialization with gift request handling
  const formMethods = useForm<OrderFormValues>({
    defaultValues: {
      bookingType: isGiftRequest ? "others" : "public", // Auto-set to "others" for gift requests
      redemptionMode: "pick-up",
      includeUtensils: false,
      deliveryType: deliveryType[0].name,
      recipientName: isGiftRequest ? giftRequestData?.user.fullName || "" : "",
      recipientPhone: isGiftRequest ? giftRequestData?.user.phoneNumber || "" : "",
      recipientEmail: isGiftRequest ? giftRequestData?.user.email || "" : "",
      recipientAddress: "",
      recipientRemark: "",
      numberOfRecipients: isGiftRequest ? String(giftRequestData?.quantity || 1) : "1",
      multipleRecipients: [],
      redemptionDate: new Date(),
      reason: isGiftRequest 
        ? `Gift request fulfillment for ${ 
          giftRequestData?.user.accountType === "organization"
            ? giftRequestData?.user.organizationName : giftRequestData?.user.fullName
        }` 
        : "",
      publicTags: "",
      refundable: false,
      supportsMultipleClaims: false,
      autoGenerateTicket: false,
      restaurantId: restaurantId || "",
      customImage: "",
      totalAmount: "",
    },
    resolver: yupResolver(
      orderFormSchema
    ) as unknown as Resolver<OrderFormValues>,
  });
  
  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors },
    setValue,
    getValues,
  } = formMethods;
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "multipleRecipients",
  });

  // NEW: Effect to populate form with gift request data
  useEffect(() => {
    if (isGiftRequest && giftRequestData) {
      // Set booking type to "others" (for gifting)
      setValue("bookingType", "others");
      
      // Set delivery type to "single" since gift requests are for individual recipients
      setValue("deliveryType", "single");
      
      // Pre-fill recipient information
      setValue("recipientName", giftRequestData.user.fullName);
      setValue("recipientPhone", giftRequestData.user.phoneNumber);
      setValue("recipientEmail", giftRequestData.user.email);
      
      // Set quantity from gift request
      setValue("numberOfRecipients", String(giftRequestData.quantity));
      
      // Set reason
      setValue("reason", `Fulfilling gift request for ${
        giftRequestData.user.accountType === "organization"
          ? giftRequestData.user.organizationName
          : giftRequestData.user.fullName}`);
      
      // Show toast notification
      toast({
        title: "Gift Request Loaded",
        description: `Recipient details have been pre-filled from the gift request.`,
        variant: "success",
        duration: 1000,
      });
    }
  }, [isGiftRequest, giftRequestData, setValue, toast]);

  // Populate menuItems from cart whenever cart changes
  useEffect(() => {
    if (items.length > 0) {
      const cartMenuItems = items.map((item) => ({
        menuId: item.mealId,
        quantity: item.quantity,
        name: item.mealName,
        price: item.pricePerUnit,
        currency: "NGN",
      }));

      setValue("menuItems", cartMenuItems);
      setValue("restaurantId", restaurantId || items[0]?.restaurantId || "");
    } else {
      setValue("menuItems", []);
    }
  }, [items, setValue, restaurantId]);

  const delivery = watch("redemptionMode") === "delivery";
  const bookingTypeWatched = watch("bookingType");
  const redemptionModeWatched = watch("redemptionMode");
  const numberOfRecipientsValueWatched = watch("numberOfRecipients");
  
  const showRecipientTabs =
    (redemptionModeWatched === "delivery" ||
      redemptionModeWatched === "pick-up" ||
      redemptionModeWatched === "dine-in" ||
      redemptionModeWatched === "dine-with-me") &&
    bookingTypeWatched !== "public";
    
  const showRedemptionDatePicker =
    redemptionModeWatched === "pick-up" ||
    bookingTypeWatched === "public" ||
    redemptionModeWatched === "dine-in" ||
    bookingTypeWatched === "date" ||
    redemptionModeWatched === "dine-with-me";
    
  const showPublicTagsInput = bookingTypeWatched === "public";
  
  const showTicketCustomization =
    redemptionModeWatched === "pick-up" ||
    redemptionModeWatched === "delivery" ||
    (redemptionModeWatched === "dine-in" && bookingTypeWatched === "yourself") ||
    (redemptionModeWatched === "dine-with-me" && (bookingTypeWatched === "yourself" || bookingTypeWatched === "date")) ||
    bookingTypeWatched === "yourself";
    
  const showMultipleClaims =
    (bookingTypeWatched === "yourself" || bookingTypeWatched === "others") &&
    items.reduce((total, item) => total + item.quantity, 0) > 1;

  // =======================

  const handleNumberOfRecipientsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const count = parseInt(e.target.value, 10) || 0;
    setValue("numberOfRecipients", e.target.value);
    const currentLength = getValues("multipleRecipients")?.length ?? 0;
    if (count > currentLength) {
      for (let i = currentLength; i < count; i++) {
        append({ name: "", phone: "", email: "", address: "" });
      }
    } else if (count < currentLength) {
      for (let i = currentLength; i > count; i--) {
        remove(i - 1);
      }
    }
  };

  const updateBookingMutation = useUpdateBooking(editBookingId || "");

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check authentication before proceeding
    if (!hasValidAuth()) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images.",
        variant: "error",
        duration: 1000,
      });
      return;
    }

    // Validate the file
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "error",
        duration: 1500,
      });
      return;
    }

    // Create preview URL immediately and store file for later upload
    const previewUrl = URL.createObjectURL(file);

    // Set the preview immediately for better UX - don't upload yet
    setUploadedTicketDesign({
      file,
      url: "", // Will be updated after upload during form submission
      preview: previewUrl,
      isUploading: false,
    });

    toast({
      title: "File selected",
      description:
        "Your ticket design will be uploaded when you submit the booking.",
      variant: "success",
    });
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    if (uploadedTicketDesign?.preview) {
      URL.revokeObjectURL(uploadedTicketDesign.preview);
    }
    setUploadedTicketDesign(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // UPDATED: Handle form submission and create/update booking
  const handleBookingSubmit = async (data: any) => {
    try {
      // Check if cart has items (especially important in edit mode)
      if (items.length === 0) {
        toast({
          title: "No items in cart",
          description:
            "Please add at least one item to your cart before proceeding.",
          variant: "error",
          duration: 1000,
        });
        return;
      }

      let uploadedImageUrl = "";

      // Upload image if one is selected
      if (uploadedTicketDesign?.file && !uploadedTicketDesign.url) {
        try {
          setUploadedTicketDesign((prev) =>
            prev ? { ...prev, isUploading: true } : null
          );

          const uploadResult = await new Promise<ImageUploadResponse>(
            (resolve, reject) => {
              uploadImage(
                { file: uploadedTicketDesign.file },
                {
                  onSuccess: (result: ImageUploadResponse) => {
                    resolve(result);
                  },
                  onError: (error: Error) => {
                    reject(error);
                  },
                }
              );
            }
          );

          if (!uploadResult || !uploadResult.url) {
            throw new Error("Upload result is invalid.");
          }

          uploadedImageUrl = uploadResult.url;

          // Update state with the uploaded URL
          setUploadedTicketDesign((prev) =>
            prev
              ? {
                  ...prev,
                  url: uploadedImageUrl,
                  isUploading: false,
                }
              : null
          );
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          setUploadedTicketDesign((prev) =>
            prev ? { ...prev, isUploading: false } : null
          );

          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown error";

          toast({
            title: "Image Upload Failed",
            description: `Your custom ticket design could not be uploaded. Reason: ${errorMessage}. Please try again or proceed without it.`,
            variant: "error",
            duration: 5000,
          });

          // Stop the submission process if upload fails
          return;
        }
      } else if (uploadedTicketDesign?.url) {
        uploadedImageUrl = uploadedTicketDesign.url;
      }
      
      if (isEditMode && editBookingId) {
        // Update existing booking
        const updatePayload = {
          menuItems: items.map((item) => ({
            menuId: item.mealId,
            quantity:
              data.deliveryType === "multiple" || data.bookingType === "public"
                ? item.quantity * parseInt(data.numberOfRecipients || "1", 10)
                : item.quantity,
          })),
          reason:
            data.reason ||
            `${data.redemptionMode} order${
              data.includeUtensils ? " with utensils" : ""
            }`,
          bookingType:
            data.bookingType === "yourself"
              ? "self"
              : data.bookingType === "public"
              ? "public"
              : "others",
          bookedFor:
            data.bookingType === "yourself"
              ? { type: "self" }
              : data.bookingType === "public"
              ? { type: "public" }
              : {
                  type: "contact",
                  contact:
                    data.deliveryType === "single"
                      ? [
                          {
                            name: data.recipientName || "",
                            email: data.recipientEmail || "",
                            phoneNumber: data.recipientPhone || "",
                            remark: data.recipientRemark || "",
                          },
                        ]
                      : (data.multipleRecipients || []).map(
                          (recipient: any) => ({
                            name: recipient.name || "",
                            email: recipient.email || "",
                            phoneNumber: recipient.phone || "",
                            remark: recipient.remark || "",
                          })
                        ),
                },
          restaurantId: restaurantId,
          numberOfBookings:
            data.deliveryType === "multiple" || data.bookingType === "public"
              ? items.reduce((total, item) => total + item.quantity, 0) *
                parseInt(data.numberOfRecipients || "1", 10)
              : items.reduce((total, item) => total + item.quantity, 0),
          validityDate: data.redemptionDate
            ? {
                start: new Date(data.redemptionDate).toISOString(),
                stop: new Date(
                  new Date(data.redemptionDate).getTime() +
                    7 * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : {
                start: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
                stop: new Date(
                  Date.now() + 14 * 24 * 60 * 60 * 1000
                ).toISOString(),
              },
          image: items[0]?.mealImage || "",
          // Add public tags if it's a public booking
          ...(data.bookingType === "public" && {
            tags: data.publicTags
              ? data.publicTags
                  .split(",")
                  .map((tag: string) => tag.trim().replace(/^#/, "")) // Strip # symbol
                  .filter((tag: string) => tag)
              : [],
          }),
        };

        await updateBookingMutation.mutateAsync(updatePayload);
        toast({
          title: "Booking updated successfully!",
          description: "Your booking has been updated.",
          variant: "success",
        });

        // Navigate back to booking details
        navigate(`/booking/${editBookingId}`);
      } else {
        // NEW: Enhanced booking payload with gift request metadata
        const bookingPayload = {
          menuItems: items.map((item) => ({
            menuId: item.mealId,
            quantity:
              data.deliveryType === "multiple" || data.bookingType === "public"
                ? item.quantity * parseInt(data.numberOfRecipients || "1", 10)
                : item.quantity,
            instructions: item.userInstruction || "",
          })),
          reason:
            data.reason ||
            `${data.redemptionMode} order${
              data.includeUtensils ? " with utensils" : ""
            }`,
          redemptionMode: data.redemptionMode,
          includeUtensils: data.includeUtensils,
          deliveryType: data.deliveryType,
          bookingType:
            data.bookingType === "yourself"
              ? "self"
              : data.bookingType === "public"
              ? "public"
              : "others",
          bookedFor:
            data.bookingType === "yourself"
              ? { type: "self" }
              : data.bookingType === "public"
              ? { type: "public" }
              : {
                  type: "contact",
                  contact:
                    data.deliveryType === "single"
                      ? [
                          {
                            name: data.recipientName || "",
                            email: data.recipientEmail || "",
                            phoneNumber: data.recipientPhone || "",
                            remark: data.recipientRemark || "",
                          },
                        ]
                      : (data.multipleRecipients || []).map(
                          (recipient: any) => ({
                            name: recipient.name || "",
                            email: recipient.email || "",
                            phoneNumber: recipient.phone || "",
                            remark: recipient.remark || "",
                          })
                        ),
                },
          restaurantId: restaurantId,
          numberOfBookings:
            data.deliveryType === "multiple" || data.bookingType === "public"
              ? items.reduce((total, item) => total + item.quantity, 0) *
                parseInt(data.numberOfRecipients || "1", 10)
              : items.reduce((total, item) => total + item.quantity, 0),
          validityDate: data.redemptionDate
            ? {
                start: new Date(data.redemptionDate).toISOString(),
                stop: new Date(
                  new Date(data.redemptionDate).getTime() +
                    7 * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : {
                start: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
                stop: new Date(
                  Date.now() + 14 * 24 * 60 * 60 * 1000
                ).toISOString(),
              },
          image: items[0]?.mealImage || "",
          // Add public tags if it's a public booking
          ...(data.bookingType === "public" && {
            tags: data.publicTags
              ? data.publicTags
                  .split(",")
                  .map((tag: string) =>
                    tag.trim().replace(/^#/, "").toLowerCase()
                  )
                  .filter((tag: string) => tag)
              : [],
          }),
          // Add custom image if uploaded
          customImage: uploadedImageUrl || "",
          // Add multiple claims support
          supportsMultipleClaims: data.supportsMultipleClaims || false,
          // Add auto generate ticket flag
          autoGenerateTicket: data.autoGenerateTicket || false,
          // NEW: Add gift request metadata if applicable
          ...(isGiftRequest && giftRequestData && {
            giftRequestId: giftRequestData._id,
            isGiftRequestFulfillment: true,
            giftRequestDetails: {
              requesterId: giftRequestData.user._id,
              requesterName: giftRequestData.user.fullName,
              requesterEmail: giftRequestData.user.email,
              originalQuantity: giftRequestData.quantity,
              originalAmount: giftRequestData.totalAmount,
            },
          }),
        };
        
        // Store booking payload for API call later
        setBookingPayload(bookingPayload);

        // Success - Save booking details to store for CheckoutDetails page
        const recipientDetails =
          data.bookingType === "yourself"
            ? null
            : data.bookingType === "public"
            ? null
            : data.deliveryType === "single"
            ? {
                name: data.recipientName || "",
                phone: data.recipientPhone || "",
                email: data.recipientEmail || "",
                message: data.reason || "",
              }
            : {
                name: `${data.numberOfRecipients} recipients`,
                phone: "Multiple phone numbers",
                email: "Multiple email addresses",
                message: `Booking for ${data.numberOfRecipients} recipients`,
              };

        // Update booking store with form data
        updateBookingDetails({
          bookingType: data.bookingType,
          numberOfRecipients: parseInt(data.numberOfRecipients || "1", 10),
          recipientDetails,
          deliveryDate: data.redemptionDate
            ? new Date(data.redemptionDate).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryTime: null,
          specialInstructions: data.reason || "",
          isGift:
            data.bookingType !== "yourself" && data.bookingType !== "public",
          paymentMethod: "",
          restaurantId,
          restaurantName:
            restaurantData?.name || items[0]?.restaurantName || "",
          location:
            restaurantData?.address ||
            (typeof restaurantData?.location === "string"
              ? restaurantData.location
              : restaurantData?.location
              ? `${restaurantData.location.coordinates[1]},${restaurantData.location.coordinates[0]}`
              : ""),
        });

        // Call the original onSubmit for any additional handling before navigation
        onSubmit(data);

        // NEW: Clear gift request data from sessionStorage after successful submission
        if (isGiftRequest) {
          sessionStorage.removeItem("giftRequestData");
        }

        navigate("/checkout");
      }

      // Clean up the preview URL after successful booking
      if (uploadedTicketDesign?.preview) {
        URL.revokeObjectURL(uploadedTicketDesign.preview);
      }
      setUploadedTicketDesign(null);
    } catch (error: unknown) {
      console.error(
        isEditMode ? "Booking update failed:" : "Booking failed:",
        error
      );
      setUploadedTicketDesign((prev) =>
        prev ? { ...prev, isUploading: false } : null
      );

      toast({
        title: isEditMode ? "Update failed" : "Booking failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "error",
      });
    }
  };
  
  const handleBrowseFileClick = () => {
    fileInputRef.current?.click();
  };
  // ================================================
  // Auto-populate user details when booking for yourself
  useEffect(() => {
    if (bookingTypeWatched === "yourself" && user) {
      // Auto-populate recipient fields with current user data
      setValue("recipientName", user.username || "");
      setValue("recipientEmail", user.email || "");
      setValue("recipientPhone", user.phone || "");

      // Force delivery type to single for self bookings
      setValue("deliveryType", "single");

      // Also populate ticket customization fields if they're visible
      if (showTicketCustomization) {
        setValue("ticketCustomizationRecipientName", user.username || "");
        setValue("ticketCustomizationRecipientEmail", user.email || "");
        setValue("ticketCustomizationRecipientPhone", user.phone || "");
      }
    } else if (bookingTypeWatched === "others") {
      // NEW: Don't clear fields if it's a gift request (keep pre-filled data)
      if (!isGiftRequest) {
        // Clear fields when switching to "others" to avoid confusion
        setValue("recipientName", "");
        setValue("recipientEmail", "");
        setValue("recipientPhone", "");
        setValue("recipientAddress", "");
        setValue("multipleRecipients", [
          { name: "", phone: "", email: "", address: "" },
        ]);
      }
    } else if (bookingTypeWatched === "public") {
      // For public bookings, set default to pick-up and clear recipient fields
      setValue("redemptionMode", "pick-up");
      setValue("recipientName", "");
      setValue("recipientEmail", "");
      setValue("recipientPhone", "");
      setValue("recipientAddress", "");
      setValue("multipleRecipients", []); // Clear multiple recipients for public bookings
    } else if (bookingTypeWatched === "date") {
      // For date bookings, set default to dine-with-me and clear recipient fields
      setValue("redemptionMode", "dine-with-me");
      setValue("recipientName", "");
      setValue("recipientEmail", "");
      setValue("recipientPhone", "");
      setValue("recipientAddress", "");
      setValue("multipleRecipients", [
        { name: "", phone: "", email: "", address: "" },
      ]);
    }
  }, [bookingTypeWatched, user, setValue, showTicketCustomization, isGiftRequest]);

  // Show notification when delivery is selected (only show once when user actively selects delivery)
  useEffect(() => {
    // Only show notification if redemption mode changes to delivery (not on initial load)
    if (redemptionModeWatched === "delivery") {
      const timeoutId = setTimeout(() => {
        toast({
          title: "Delivery Service Notice",
          description:
            "This service is not yet automated, you will be contacted.",
          variant: "info",
          duration: 3000,
        });
      }, 100); // Small delay to ensure it's a user action, not initial load

      return () => clearTimeout(timeoutId);
    }
  }, [redemptionModeWatched, toast]);

  // Pre-populate form with existing booking data when in edit mode
  useEffect(() => {
    if (isEditMode && editBookingData && !isLoadingBooking) {
      const booking =
        editBookingData &&
        typeof editBookingData === "object" &&
        "data" in editBookingData
          ? (editBookingData as { data: any }).data
          : editBookingData;

      console.log("Pre-populating form with booking data:", booking);

      // Map booking type back to form values
      const formBookingType =
        booking.bookingType === "self"
          ? "yourself"
          : booking.bookingType === "public"
          ? "public"
          : booking.bookingType === "date"
          ? "date"
          : "others";

      // Extract redemption mode from reason if possible
      const redemptionMode = booking.reason?.includes("delivery")
        ? "delivery"
        : booking.reason?.includes("dine-with-me")
        ? "dine-with-me"
        : booking.reason?.includes("dine-in")
        ? "dine-in"
        : "pickup";
      const includeUtensils =
        booking.reason?.includes("with utensils") || false;

      // Extract public tags if it's a public booking
      const publicTags = booking.reason?.includes("Public booking with tags:")
        ? booking.reason
            .split("Public booking with tags:")[1]
            ?.trim()
            .replace("none", "") || ""
        : "";

      // Pre-populate form fields
      setValue("bookingType", formBookingType);
      setValue("redemptionMode", redemptionMode);
      setValue("includeUtensils", includeUtensils);
      setValue("numberOfRecipients", String(booking.numberOfBookings || 1));
      setValue("reason", booking.reason || "");

      if (booking.validityDate) {
        const validityDate =
          typeof booking.validityDate === "string"
            ? booking.validityDate
            : booking.validityDate.stop || booking.validityDate.start;
        setValue("redemptionDate", new Date(validityDate));
      }

      // Set public tags if it's a public booking
      if (formBookingType === "public" && publicTags) {
        setValue("publicTags", publicTags);
      }

      // Set delivery type based on booking data
      if (formBookingType !== "public") {
        const isMultiple =
          booking.bookedFor &&
          typeof booking.bookedFor === "string" &&
          booking.bookedFor.includes("recipients");
        setValue("deliveryType", isMultiple ? "multiple" : "single");
      }

      // Populate recipient information if available
      if (
        formBookingType === "others" &&
        booking.bookedFor &&
        typeof booking.bookedFor === "string"
      ) {
        if (!booking.bookedFor.includes("recipients")) {
          // Single recipient - extract name from bookedFor
          setValue("recipientName", booking.bookedFor);
        }
      }
      
      // Populate cart with booking's menu items
      if (booking.menuItems && Array.isArray(booking.menuItems)) {
        try {
          // Clear existing cart first
          useCartStore.getState().clearCart();

          // Add each menu item to cart
          booking.menuItems.forEach((menuItem: any) => {
            const cartItem = {
              mealId: menuItem.menuId || menuItem.mealId || menuItem.id,
              mealName: menuItem.name || menuItem.mealName || "Meal",
              mealImage:
                menuItem.image || menuItem.mealImage || booking.image || "",
              quantity: menuItem.quantity || 1,
              price: menuItem.price || 0,
              pricePerUnit: menuItem.pricePerUnit || menuItem.price || 0,
              restaurantId: restaurantId,
              restaurantName:
                restaurantData?.name ||
                booking.restaurant?.name ||
                "Restaurant",
              choices: menuItem.choices || {},
            };

            console.log("Adding item to cart:", cartItem);
            useCartStore.getState().addItem(cartItem);
          });
        } catch (error) {
          console.error("Error populating cart:", error);
        }
      } else if (booking.image || booking.menuItems) {
        try {
          // Fallback: create a cart item from booking data
          const fallbackItem = {
            mealId: booking.mealId || booking.id || booking._id || "unknown",
            mealName: booking.reason || "Meal Package",
            mealImage: booking.image || "",
            quantity: booking.numberOfBookings || 1,
            price: 0, // Price might not be available in booking data
            pricePerUnit: 0,
            restaurantId: restaurantId,
            restaurantName:
              restaurantData?.name || booking.restaurant?.name || "Restaurant",
            choices: {},
          };

          console.log("Adding fallback item to cart:", fallbackItem);
          useCartStore.getState().clearCart();
          useCartStore.getState().addItem(fallbackItem);
        } catch (error) {
          console.error("Error creating fallback cart item:", error);
          toast({
            title: "Cart population failed",
            description:
              "There was an error loading your booking data. Please try again.",
            variant: "error",
          });
        }
      }
    }
  }, [
    isEditMode,
    editBookingData,
    isLoadingBooking,
    setValue,
    toast,
    restaurantId,
    restaurantData?.name,
  ]);

  // NEW: Effect to prevent form field changes when it's a gift request
  useEffect(() => {
    if (isGiftRequest && giftRequestData) {
      // Monitor bookingType changes and prevent switching away from "others"
      const subscription = watch((value, { name }) => {
        if (name === "bookingType" && value.bookingType !== "others") {
          // Reset back to "others" if user tries to change it
          setValue("bookingType", "others");
          toast({
            title: "Booking Type Locked",
            description: "This is a gift request fulfillment and must be booked for others.",
            variant: "info",
            duration: 2000,
          });
        }
        
        // Prevent delivery type changes for gift requests
        if (name === "deliveryType" && value.deliveryType !== "single") {
          setValue("deliveryType", "single");
          toast({
            title: "Delivery Type Locked",
            description: "Gift requests are for single recipients only.",
            variant: "info",
            duration: 2000,
          });
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [isGiftRequest, giftRequestData, watch, setValue, toast]);

  // Cleanup preview URL on component unmount
  useEffect(() => {
    return () => {
      if (uploadedTicketDesign?.preview) {
        URL.revokeObjectURL(uploadedTicketDesign.preview);
      }
      
      // NEW: Clean up gift request data if user leaves without completing
      if (isGiftRequest && window.location.pathname.includes("/orders")) {
        // Only clear if user is navigating away, not just refreshing
        window.addEventListener("beforeunload", () => {
          sessionStorage.removeItem("giftRequestData");
        });
      }
    };
  }, [uploadedTicketDesign?.preview, isGiftRequest]);
  // =====================================
  return (
    <>
      {/* Show loading state when in edit mode and still loading */}
      {isEditMode && isLoadingBooking && <OrderFormSkeleton />}

      {/* Show edit mode indicator */}
      {isEditMode && !isLoadingBooking && (
        <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-amber-800 font-medium">Edit Mode</p>
              <p className="text-amber-700 text-sm">
                You are editing an existing booking. Make your changes and click
                "Update Booking".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Show gift request indicator */}
      {isGiftRequest && giftRequestData && !isEditMode && (
        <div className="m-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Gift className="h-6 w-6 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-purple-800 font-medium">Gift Request Fulfillment</p>
              <p className="text-purple-700 text-sm mt-1">
                You're fulfilling a gift request from{" "}
                <span className="font-semibold">{giftRequestData.user.fullName}</span>
                {" "}for {giftRequestData.quantity}x {giftRequestData.product.name}
              </p>
              <p className="text-purple-600 text-xs mt-2">
                Recipient details have been pre-filled and locked for this request.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleBookingSubmit)}>
        {/* include utensils */}
        {delivery && (
          <>
            <div className="m-4 flex items-center justify-between bg-[#EADDFF] p-4 rounded-lg">
              <div className="flex gap-2 items-center">
                <Utensils />
                <p>Include utensils, napkin etc </p>
              </div>
              <Controller
                name="includeUtensils"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none ${
                      field.value ? "bg-primary" : "bg-gray-300"
                    }`}
                    role="switch"
                    aria-checked={field.value}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                        field.value ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                )}
              />
            </div>
            <div className="border-t border-gray-300 my-3" />
          </>
        )}
        
        {/* section-1: Booking Type */}
        {/* NEW: Disable booking type section for gift requests */}
        <div className={isGiftRequest ? "pointer-events-none opacity-60" : ""}>
          <BookingTypeSection control={control} errors={errors}/>
          {/* {isGiftRequest && (
            <p className="mx-4 text-xs text-gray-500 italic mt-2">
              Booking type is locked for gift request fulfillment
            </p>
          )} */}
        </div>
        <div className="border-t border-gray-300 my-4" />
        
        {/* section-2: Redemption Mode */}
        <RedemptionModeSection control={control} errors={errors} />
        
        {/* Public Tags Section - only shown for public bookings */}
        {showPublicTagsInput && (
          <PublicTagsSection
            register={register}
            errors={errors}
            setValue={setValue}
            numberOfRecipientsValueWatched={numberOfRecipientsValueWatched || "1"}
          />
        )}
        
        {/* Recipient type tabs */}
        {showRecipientTabs && (
          <div className="m-4">
            <Controller
              name="deliveryType"
              control={control}
              render={({ field: tabField }) => (
                <Tabs.Root
                  tabIndex={-1}
                  value={tabField.value}
                  onValueChange={(value) => {
                    // NEW: Prevent delivery type change for gift requests
                    if (isGiftRequest && value !== "single") {
                      toast({
                        title: "Delivery Type Locked",
                        description: "Gift requests are for single recipients only.",
                        variant: "info",
                        duration: 2000,
                      });
                      return;
                    }
                    tabField.onChange(value);
                  }}
                  className="flex flex-col"
                >
                  <Tabs.List
                    tabIndex={-1}
                    className="flex border-b border-gray-300 bg-[#FEF7F]"
                  >
                    {deliveryType.map((tab, index) => (
                      <Tabs.Trigger
                        tabIndex={-1}
                        key={`tab-trigger-${tab.name}-${index}`}
                        value={tab.name}
                        disabled={
                          ((bookingTypeWatched === "yourself" ||
                            (bookingTypeWatched === "date" && redemptionModeWatched !== "dine-with-me")) &&
                          tab.name === "multiple") ||
                          (isGiftRequest && tab.name === "multiple") // NEW: Disable multiple for gift requests
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary ${
                          ((bookingTypeWatched === "yourself" ||
                            (bookingTypeWatched === "date" && redemptionModeWatched !== "dine-with-me")) &&
                          tab.name === "multiple") ||
                          (isGiftRequest && tab.name === "multiple")
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-black"
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                  
                  {deliveryType.map((tab, index) => (
                    <Tabs.Content
                      key={`tab-content-${tab.name}-${index}`}
                      value={tab.name}
                      tabIndex={-1}
                      className="py-4 px-1 focus:outline-none"
                    >
                      {tab.name === "single" && (
                        <div className="space-y-1 mt-2">
                          <p className="text-lg font-medium">
                            Enter Recipient info
                          </p>
                          
                          {/* NEW: Show locked indicator for gift requests */}
                          {/* {isGiftRequest && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-800 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Recipient information is locked for this gift request
                              </p>
                            </div>
                          )} */}
                          
                          {/* Conditional rendering based on booking type */}
                          <div className={isGiftRequest ? "pointer-events-none opacity-75" : ""}>
                            {bookingTypeWatched === "yourself" ? (
                              <FormField<OrderFormValues>
                                name="recipientName"
                                register={register}
                                errors={errors}
                                placeholder="Enter full name"
                                inputClassName={isGiftRequest ? "bg-gray-100" : ""}
                              />
                            ) : (
                              <UserSearchCombobox
                                value={watch("recipientName") || ""}
                                onChange={(value) => {
                                  if (!isGiftRequest) {
                                    setValue("recipientName", value);
                                  }
                                }}
                                onUserSelect={(user: UserSearchResult) => {
                                  if (!isGiftRequest) {
                                    // Auto-populate other fields when user is selected
                                    setValue("recipientName", user.fullName);
                                    setValue("recipientEmail", user.email);
                                    setValue("recipientPhone", user.phoneNumber);
                                  }
                                }}
                                placeholder= {
                                  isGiftRequest ? giftRequestData.user.accountType === "organization" 
                                  ? giftRequestData.user.organizationName : giftRequestData.user.fullName
                                   : "Search for a recipient by name"
                                }
                                error={errors.recipientName?.message}
                                disabled={isGiftRequest} // NEW: Disable for gift requests
                              />
                            )}
                          </div>

                          <div className={isGiftRequest ? "pointer-events-none opacity-75" : ""}>
                            <FormField<OrderFormValues>
                              name="recipientPhone"
                              type="tel"
                              control={control}
                              register={register}
                              errors={errors}
                              placeholder={
                                  isGiftRequest ? giftRequestData.user.accountType === "organization" 
                                  ? giftRequestData.user.phoneNumber : giftRequestData.user.phoneNumber
                                   : "Enter phone number"
                                }
                              inputClassName={isGiftRequest ? "bg-gray-100" : ""}
                              disabled={isGiftRequest}
                            />
                          </div>
                          
                          <div className={isGiftRequest ? "pointer-events-none opacity-75" : ""}>
                            <FormField<OrderFormValues>
                              name="recipientEmail"
                              type="email"
                              register={register}
                              errors={errors}
                              placeholder={
                                isGiftRequest ? giftRequestData.user.accountType === "organization" 
                                ? giftRequestData.user.email : giftRequestData.user.email
                                  : "Enter email address"
                              }
                              inputClassName={isGiftRequest ? "bg-gray-100" : ""}
                              // disabled={isGiftRequest}
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <FormField<OrderFormValues>
                              name="recipientAddress"
                              register={register}
                              errors={errors}
                              placeholder="Enter street address or zipcode"
                              inputClassName={`lg:w-[25rem] w-full flex-1 px-3 py-4 outline-none !focus:ring-0 !border-b focus:border-b-primary ${
                                isGiftRequest ? "bg-gray-100" : ""
                              }`}
                              // disabled={isGiftRequest}
                            />
                            {/* cancel */}
                            {!isGiftRequest && (
                              <p className="text-primary text-lg font-medium cursor-pointer">
                                Cancel
                              </p>
                            )}
                          </div>
                          
                          {/* Recipient Remark Field */}
                          <FormField<OrderFormValues>
                            name="recipientRemark"
                            register={register}
                            errors={errors}
                            placeholder="Add a remark for this recipient (optional)"
                            inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-[6rem]"
                          />
                        </div>
                      )}
                      
                      {tab.name === "multiple" && (
                        <div className="space-y-1 mt-4">
                          <div className="relative">
                            <FormField<OrderFormValues>
                              name="numberOfRecipients"
                              type="number"
                              register={register}
                              errors={errors}
                              placeholder="Select number of recipient"
                              inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[44px]"
                              onChange={handleNumberOfRecipientsChange}
                            />
                            <RadixDropdownMenu.Root>
                              <RadixDropdownMenu.Trigger asChild>
                                <button
                                  type="button"
                                  className="absolute right-5 top-0 transform translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center focus:outline-none"
                                  aria-label="Select number of recipients"
                                >
                                  <span className="mr-1 text-sm text-medium">
                                    {numberOfRecipientsValueWatched || "1"}
                                  </span>
                                  <ChevronDown size={16} />
                                </button>
                              </RadixDropdownMenu.Trigger>
                              <RadixDropdownMenu.Portal>
                                <RadixDropdownMenu.Content
                                  className="bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[80px] max-h-[200px] overflow-y-auto p-1"
                                  sideOffset={5}
                                  align="end"
                                >
                                  {[...Array(10).keys()]
                                    .map((i) => i + 1)
                                    .map((num) => (
                                      <RadixDropdownMenu.Item
                                        key={`recipient-${num}`}
                                        className="relative flex items-center justify-center px-4 py-2 rounded-md text-sm select-none data-[highlighted]:bg-primary data-[highlighted]:text-white data-[state=checked]:font-semibold cursor-pointer"
                                        onSelect={() => {
                                          const val = String(num);
                                          setValue("numberOfRecipients", val, {
                                            shouldValidate: true,
                                          });
                                          const syntheticEvent = {
                                            target: { value: val },
                                          } as React.ChangeEvent<HTMLInputElement>;
                                          handleNumberOfRecipientsChange(
                                            syntheticEvent
                                          );
                                        }}
                                      >
                                        {num}
                                        {numberOfRecipientsValueWatched ===
                                          String(num) && (
                                          <Check className="absolute left-2 w-4 h-4 text-primary data-[highlighted]:text-white" />
                                        )}
                                      </RadixDropdownMenu.Item>
                                    ))}
                                </RadixDropdownMenu.Content>
                              </RadixDropdownMenu.Portal>
                            </RadixDropdownMenu.Root>
                          </div>

                          {fields.map((item, index) => (
                            <div key={item.id} className="space-y-3 relative">
                              <h3 className="text-lg font-medium">
                                Enter Recipient {index + 1} info
                              </h3>
                              
                              {/* Conditional rendering for multiple recipients based on booking type */}
                              <div>
                                {bookingTypeWatched === "yourself" ? (
                                  <FormField<OrderFormValues>
                                    name={`multipleRecipients.${index}.name` as const}
                                    register={register}
                                    errors={errors}
                                    placeholder={`Enter recipient ${index + 1} full name`}
                                  />
                                ) : (
                                  <UserSearchCombobox
                                    value={watch(`multipleRecipients.${index}.name`) || ""}
                                    onChange={(value) => setValue(`multipleRecipients.${index}.name`, value)}
                                    onUserSelect={(user: UserSearchResult) => {
                                      // Auto-populate this recipient's fields
                                      setValue(`multipleRecipients.${index}.name`, user.fullName);
                                      setValue(`multipleRecipients.${index}.email`, user.email);
                                      setValue(`multipleRecipients.${index}.phone`, user.phoneNumber);
                                    }}
                                    placeholder={`Search for recipient ${index + 1} by name`}
                                    error={errors.multipleRecipients?.[index]?.name?.message}
                                  />
                                )}
                              </div>

                              <FormField<OrderFormValues>
                                name={`multipleRecipients.${index}.phone` as const}
                                type="tel"
                                control={control}
                                register={register}
                                errors={errors}
                                placeholder="Enter phone number"
                              />
                              
                              <FormField<OrderFormValues>
                                name={`multipleRecipients.${index}.email` as const}
                                type="email"
                                register={register}
                                errors={errors}
                                placeholder="Enter email address"
                              />
                              
                              <div className="flex justify-between items-center gap-2">
                                <FormField<OrderFormValues>
                                  name={`multipleRecipients.${index}.address` as const}
                                  register={register}
                                  errors={errors}
                                  placeholder="Enter street address or zipcode"
                                  inputClassName="lg:w-[25rem] w-full px-3 py-4 outline-none !focus:ring-0 !border-b focus:border-b-primary"
                                />
                                {/* cancel */}
                                <p className="text-primary text-lg font-medium cursor-pointer">
                                  Cancel
                                </p>
                              </div>
                              
                              {/* Recipient Remark Field for Multiple Recipients */}
                              <FormField<OrderFormValues>
                                name={`multipleRecipients.${index}.remark` as const}
                                register={register}
                                errors={errors}
                                placeholder={`Add a remark for recipient ${index + 1} (optional)`}
                                inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-[6rem]"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Tabs.Content>
                  ))}
                </Tabs.Root>
              )}
            />
            {errors.deliveryType && (
              <p className="text-red-500 text-xs mt-1">
                {typeof errors.deliveryType.message === "string"
                  ? errors.deliveryType.message
                  : "Please select an option"}
              </p>
            )}
          </div>
        )}
        
        {/* for the Group pickup - calendar date range selection */}
        {showRedemptionDatePicker && (
          <div className="m-4">
            <p className="text-xl font-medium tracking pb-2">
              Enter ticket redemption date
            </p>
            <div className="p-4">
              <Controller
                name="redemptionDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    selectedDate={field.value}
                    onDateChange={field.onChange}
                  />
                )}
              />
            </div>
            {errors.redemptionDate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.redemptionDate.message}
              </p>
            )}
          </div>
        )}
        
        {/* Ticket customization - only shown when quantity ≥ 100 and redemption mode is Pickup */}
        {showTicketCustomization && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-3" />
            <div>
              <h2 className="font-medium text-xl py-2">Ticket Customization</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload a custom design for your tickets (optional)
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="inline-flex p-4 gap-3 items-center border-b w-full bg-gray-50">
                  <div className="rounded-full border p-3 bg-white">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">
                      Upload ticket design (Optional)
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Select and upload your personalized ticket design
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  {!uploadedTicketDesign ? (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer group">
                      <input
                        id="upload-ticket"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="space-y-2">
                          <p className="text-lg font-medium text-gray-900">
                            Choose a file
                          </p>
                          <p className="text-sm text-gray-500">
                            JPG or PNG format up to 20MB
                          </p>
                          <p className="text-xs text-gray-400">
                            1080p × 1080p resolution recommended
                          </p>
                        </div>

                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          onClick={handleBrowseFileClick}
                        >
                          Browse Files
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative flex justify-center items-center self-center">
                        <img
                          src={uploadedTicketDesign.preview}
                          alt="Uploaded ticket design"
                          className="max-w-full max-h-48 object-contain rounded-lg border"
                        />

                        {uploadedTicketDesign.isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                              <span className="text-sm font-medium">
                                Uploading...
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          disabled={uploadedTicketDesign.isUploading}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          aria-label="Remove uploaded image"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {uploadedTicketDesign.file.name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {fileService.formatFileSize(
                              uploadedTicketDesign.file.size
                            )}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {uploadedTicketDesign.url ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-green-600 font-medium">
                                Upload complete!
                              </span>
                            </>
                          ) : uploadedTicketDesign.isUploading ? (
                            <>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-blue-600">
                                Uploading...
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-sm text-gray-500">
                                Ready to upload
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reason Section - shown for all booking types with different options */}
        <div className="m-4">
          <div className="border-t border-gray-300 my-4" />
          <p className="text-xl font-medium mb-4">
            {bookingTypeWatched === "yourself"
              ? "Personal booking reason"
              : bookingTypeWatched === "public"
              ? "Public booking reason"
              : "Gift reason"}
          </p>

          {/* Reason input with dropdown for all booking types */}
          <div className="relative">
            <FormField<OrderFormValues>
              name="reason"
              register={register}
              errors={errors}
              placeholder={`Enter ${
                bookingTypeWatched === "yourself"
                  ? "personal booking"
                  : bookingTypeWatched === "public"
                  ? "public booking"
                  : "gift"
              } reason...`}
              inputClassName={`w-full px-3 py-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                isGiftRequest ? "bg-gray-100" : ""
              }`}
              // disabled={isGiftRequest} // NEW: Disable for gift requests
            />

            {!isGiftRequest && (
              <RadixDropdownMenu.Root>
                <RadixDropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center focus:outline-none"
                    aria-label="Select reason"
                  >
                    <ChevronDown size={20} />
                  </button>
                </RadixDropdownMenu.Trigger>
                <RadixDropdownMenu.Portal>
                  <RadixDropdownMenu.Content
                    className="bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[280px] max-h-[300px] overflow-y-auto p-1"
                    sideOffset={5}
                    align="end"
                  >
                    {(() => {
                      const predefinedReasons =
                        bookingTypeWatched === "yourself"
                          ? [
                              "Personal treat",
                              "Lunch break",
                              "Dinner plans",
                              "Date night",
                              "Family meal",
                              "Work meeting",
                              "Celebration",
                            ]
                          : bookingTypeWatched === "others"
                          ? [
                              "Birthday celebration",
                              "Anniversary gift",
                              "Thank you gesture",
                              "Holiday gift",
                              "Congratulations",
                              "Get well soon",
                              "Random act of kindness",
                            ]
                          : [
                              "Community support",
                              "Holiday sharing",
                              "Charity initiative",
                              "Random kindness",
                              "Festival celebration",
                              "Religious occasion",
                              "Social impact",
                            ];

                      return predefinedReasons.map((reason) => (
                        <RadixDropdownMenu.Item
                          key={`reason-option-${reason}`}
                          className="flex items-center px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-gray-100 focus:bg-gray-100 outline-none"
                          onSelect={() => {
                            setValue("reason", reason, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          {reason}
                        </RadixDropdownMenu.Item>
                      ));
                    })()}
                  </RadixDropdownMenu.Content>
                </RadixDropdownMenu.Portal>
              </RadixDropdownMenu.Root>
            )}
          </div>
        </div>
        
        {/* Refundable Section */}
        <div className="m-4">
          <div className="border-t border-gray-300 my-4" />
          <Controller
            name="refundable"
            control={control}
            render={({ field }) => (
              <div
                className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
                  field.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-300"
                }`}
                onClick={() => field.onChange(!field.value)}
              >
                <div className="p-2 flex flex-col gap-1 flex-1">
                  <h3 className="text-lg font-medium">Refundable Booking</h3>
                  <p className="text-black/50 text-sm">
                    Make this booking refundable in case of cancellation
                  </p>
                </div>
                <button
                  type="button"
                  aria-checked={field.value}
                  aria-label="Toggle refundable booking"
                >
                  <Circle
                    fill={`${field.value ? "#ff7a00" : "white"}`}
                    className={`rounded-full ${
                      field.value
                        ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
                        : ""
                    }`}
                  />
                </button>
              </div>
            )}
          />
          {errors.refundable && (
            <p className="text-red-500 text-xs mt-1">
              {errors.refundable.message}
            </p>
          )}
        </div>

        {/* =====================  */}
        {/* Multiple Claims Section - only show for yourself/others bookings with multiple items */}
    {showMultipleClaims && (
      <div className="m-4">
        <div className="border-t border-gray-300 my-4" />
        <p className="text-xl font-medium mb-4">Multiple Claims Support</p>
        <p className="text-sm text-gray-600 mb-4">
          Choose whether this ticket can be claimed multiple times or just
          once
        </p>
        <Controller
          name="supportsMultipleClaims"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              <div
                className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
                  !field.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-300"
                }`}
                onClick={() => field.onChange(false)}
              >
                <div className="p-2 flex flex-col gap-1 flex-1">
                  <h3 className="text-lg font-medium">Single Use Only</h3>
                  <p className="text-black/50 text-sm">
                    This ticket can only be claimed once per recipient
                  </p>
                </div>
                <Circle
                  fill={`${!field.value ? "#ff7a00" : "white"}`}
                  className={`rounded-full ${
                    !field.value
                      ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
                      : ""
                  }`}
                />
              </div>
              <div
                className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
                  field.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-300"
                }`}
                onClick={() => field.onChange(true)}
              >
                <div className="p-2 flex flex-col gap-1 flex-1">
                  <h3 className="text-lg font-medium">
                    Multiple Claims Allowed
                  </h3>
                  <p className="text-black/50 text-sm">
                    This ticket can be claimed multiple times by the same
                    recipient
                  </p>
                </div>
                <Circle
                  fill={`${field.value ? "#ff7a00" : "white"}`}
                  className={`rounded-full ${
                    field.value
                      ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
                      : ""
                  }`}
                />
              </div>
            </div>
          )}
        />
        {errors.supportsMultipleClaims && (
          <p className="text-red-500 text-xs mt-1">
            {errors.supportsMultipleClaims.message}
          </p>
        )}
      </div>
    )}
    
    {/* Auto Generate Ticket Section */}
    <div className="m-4">
      <div className="border-t border-gray-300 my-4" />
      <p className="text-xl font-medium mb-4">Ticket Generation</p>
      <p className="text-sm text-gray-600 mb-4">
        Choose whether to automatically generate tickets or handle manually
      </p>
      <Controller
        name="autoGenerateTicket"
        control={control}
        render={({ field }) => (
          <div className="space-y-3">
            <div
              className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
                field.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-300"
              }`}
              onClick={() => field.onChange(!field.value)}
            >
              <div className="p-2 flex flex-col gap-1 flex-1">
                <h3 className="text-lg font-medium">Auto Generate</h3>
                <p className="text-black/50 text-sm">
                  Tickets will be automatically generated upon booking
                </p>
              </div>
              <Circle
                fill={`${field.value ? "#ff7a00" : "white"}`}
                className={`rounded-full ${
                  field.value
                    ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
                    : ""
                }`}
              />
            </div>
          </div>
        )}
      />
      {errors.autoGenerateTicket && (
        <p className="text-red-500 text-xs mt-1">
          {errors.autoGenerateTicket.message}
        </p>
      )}
    </div>
    
    {/* Submit button */}
    <div className="mx-6 fixed bottom-4 left-0 right-0 z-50 md:relative lg:relative">
      {/* Show booking error if exists */}
      {updateBookingMutation.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            {isEditMode ? "Update failed:" : "Booking failed:"}{" "}
            {updateBookingMutation.error?.message ||
              "Something went wrong. Please try again."}
          </p>
        </div>
      )}
      
      {/* Show loading state for edit mode */}
      {isEditMode && isLoadingBooking && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">Loading booking data...</p>
        </div>
      )}
      
      <div className="space-y-3">
        <CartButton
          text={
            isEditMode
              ? updateBookingMutation.isPending
                ? "Updating Booking..."
                : "Update Booking"
              : isGiftRequest
              ? "Fulfill Gift Request"
              : "Proceed to Checkout"
          }
          textClassName="text-center"
          isValid={!updateBookingMutation.isPending && !isLoadingBooking}
          onClick={!errors && handleBookingSubmit}
        />
        
        {/* Cancel button for edit mode */}
        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate(`/booking/${editBookingId}`)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  </form>
</>
);
};

export default OrderForm;

// =================================================== TO BE CONTINUED ========================================================
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useRef, useState, useEffect } from "react";
// import {
//   useForm,
//   Controller,
//   useFieldArray,
//   type Resolver,
// } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import {
//   User,
//   Users,
//   Utensils,
//   Upload,
//   ChevronDown,
//   Check,
//   Circle,
//   X,
//   Edit3,
//   Gift,
// } from "lucide-react";
// import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
// import * as Tabs from "@radix-ui/react-tabs";
// import type { OrderFormValues, OrderFormProps } from "@/features/sponsor/types";
// import FormField from "@/components/FormField";
// import UserSearchCombobox from "@/components/UserSearchCombobox";
// import CartButton from "@/components/CartButton";
// import Calendar from "./Calendar";
// import BookingTypeSection from "./BookingTypeSection";
// import RedemptionModeSection from "./RedemptionModeSection";
// import PublicTagsSection from "./PublicTagsSection";
// import { useCartStore } from "@/store/cartStore";
// import { orderFormSchema } from "@/features/sponsor/schema";
// import {
//   useUpdateBooking,
//   useBookingDetailQuery,
//   useCreateBooking, // KEEP THIS - we'll use it here now
// } from "@/hooks/useUserQueries";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useToast } from "@/hooks/useToast";
// import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
// import { useImageUpload, useImageValidation } from "@/hooks/useImageUpload";
// import { fileService, type ImageUploadResponse } from "@/services/fileService";
// import { type UserSearchResult } from "@/services/usersService";
// import useAuthStore from "@/store/authStore";
// import { useBookingStore } from "@/store/bookingStore";
// import { OrderFormSkeleton } from "@/components/SkeletonLoader";
// import type { GiftRequestData } from "@/services/giftRequestService";
// import type { BookingCreateBody } from "@/services/usersService";

// // UPDATE THE OrderFormProps INTERFACE
// interface ExtendedOrderFormProps extends OrderFormProps {
//   giftRequestData?: GiftRequestData | null;
// }

// const OrderForm: React.FC<ExtendedOrderFormProps> = ({ 
//   onSubmit, 
//   restaurantId,
//   giftRequestData
// }) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const { items, clearCart } = useCartStore(); // ADD clearCart
//   const { hasValidAuth, user } = useAuthStore();
//   const { updateBookingDetails } = useBookingStore(); // REMOVE setBookingPayload
//   const [searchParams] = useSearchParams();
  
//   // NEW: State for tracking booking creation
//   const [isCreatingBooking, setIsCreatingBooking] = useState(false);

//   console.log(giftRequestData);

//   // ==========================================================
//   // Check if we're in edit mode
//   const editBookingId = searchParams.get("editBooking");
//   const isEditMode = !!editBookingId;
  
//   // Check if this is a gift request
//   const isGiftRequest = !!giftRequestData;

//   // Fetch restaurant details
//   const { data: restaurantData } = useRestaurantDetailQuery(restaurantId, {
//     enabled: !!restaurantId,
//   });

//   // Fetch existing booking data when in edit mode
//   const {
//     data: editBookingData,
//     isLoading: isLoadingBooking,
//   }: { data: any; isLoading: boolean } = useBookingDetailQuery(
//     editBookingId || "",
//     {
//       enabled: isEditMode && !!editBookingId,
//     }
//   );
  
//   // State for uploaded ticket design
//   const [uploadedTicketDesign, setUploadedTicketDesign] = useState<{
//     file: File;
//     url: string;
//     preview: string;
//     isUploading?: boolean;
//   } | null>(null);

//   const { uploadImage } = useImageUpload({
//     onSuccess: () => {},
//     showToast: false,
//   });

//   const { validateFile } = useImageValidation();
  
//   const deliveryType = [
//     { name: "single", icon: <User />, label: "Single Recipient" },
//     { name: "multiple", icon: <Users />, label: "Multiple Recipients" },
//   ];

//   // NEW: Initialize the create booking mutation here in OrderForm
//   const createBookingMutation = useCreateBooking();
//   const updateBookingMutation = useUpdateBooking(editBookingId || "");

//   // Form initialization with gift request handling
//   const formMethods = useForm<OrderFormValues>({
//     defaultValues: {
//       bookingType: isGiftRequest ? "others" : "public",
//       redemptionMode: "pick-up",
//       includeUtensils: false,
//       deliveryType: deliveryType[0].name,
//       recipientName: isGiftRequest ? giftRequestData?.user.fullName || "" : "",
//       recipientPhone: isGiftRequest ? giftRequestData?.user.phoneNumber || "" : "",
//       recipientEmail: isGiftRequest ? giftRequestData?.user.email || "" : "",
//       recipientAddress: "",
//       recipientRemark: "",
//       numberOfRecipients: isGiftRequest ? String(giftRequestData?.quantity || 1) : "1",
//       multipleRecipients: [],
//       redemptionDate: new Date(),
//       reason: isGiftRequest 
//         ? `Gift request fulfillment for ${ 
//           giftRequestData?.user.accountType === "organization"
//             ? giftRequestData?.user.organizationName : giftRequestData?.user.fullName
//         }` 
//         : "",
//       publicTags: "",
//       refundable: false,
//       supportsMultipleClaims: false,
//       autoGenerateTicket: false,
//       restaurantId: restaurantId || "",
//       customImage: "",
//       totalAmount: "",
//     },
//     resolver: yupResolver(
//       orderFormSchema
//     ) as unknown as Resolver<OrderFormValues>,
//   });
  
//   const {
//     control,
//     handleSubmit,
//     watch,
//     register,
//     formState: { errors },
//     setValue,
//     getValues,
//   } = formMethods;
  
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "multipleRecipients",
//   });

//   // Effect to populate form with gift request data
//   useEffect(() => {
//     if (isGiftRequest && giftRequestData) {
//       setValue("bookingType", "others");
//       setValue("deliveryType", "single");
//       setValue("recipientName", giftRequestData.user.fullName);
//       setValue("recipientPhone", giftRequestData.user.phoneNumber);
//       setValue("recipientEmail", giftRequestData.user.email);
//       setValue("numberOfRecipients", String(giftRequestData.quantity));
//       setValue("reason", `Fulfilling gift request for ${
//         giftRequestData.user.accountType === "organization"
//           ? giftRequestData.user.organizationName
//           : giftRequestData.user.fullName}`);
      
//       toast({
//         title: "Gift Request Loaded",
//         description: `Recipient details have been pre-filled from the gift request.`,
//         variant: "success",
//         duration: 1000,
//       });
//     }
//   }, [isGiftRequest, giftRequestData, setValue, toast]);

//   // Populate menuItems from cart whenever cart changes
//   useEffect(() => {
//     if (items.length > 0) {
//       const cartMenuItems = items.map((item) => ({
//         menuId: item.mealId,
//         quantity: item.quantity,
//         name: item.mealName,
//         price: item.pricePerUnit,
//         currency: "NGN",
//       }));

//       setValue("menuItems", cartMenuItems);
//       setValue("restaurantId", restaurantId || items[0]?.restaurantId || "");
//     } else {
//       setValue("menuItems", []);
//     }
//   }, [items, setValue, restaurantId]);

//   const delivery = watch("redemptionMode") === "delivery";
//   const bookingTypeWatched = watch("bookingType");
//   const redemptionModeWatched = watch("redemptionMode");
//   const numberOfRecipientsValueWatched = watch("numberOfRecipients");
  
//   const showRecipientTabs =
//     (redemptionModeWatched === "delivery" ||
//       redemptionModeWatched === "pick-up" ||
//       redemptionModeWatched === "dine-in" ||
//       redemptionModeWatched === "dine-with-me") &&
//     bookingTypeWatched !== "public";
    
//   const showRedemptionDatePicker =
//     redemptionModeWatched === "pick-up" ||
//     bookingTypeWatched === "public" ||
//     redemptionModeWatched === "dine-in" ||
//     bookingTypeWatched === "date" ||
//     redemptionModeWatched === "dine-with-me";
    
//   const showPublicTagsInput = bookingTypeWatched === "public";
  
//   const showTicketCustomization =
//     redemptionModeWatched === "pick-up" ||
//     redemptionModeWatched === "delivery" ||
//     (redemptionModeWatched === "dine-in" && bookingTypeWatched === "yourself") ||
//     (redemptionModeWatched === "dine-with-me" && (bookingTypeWatched === "yourself" || bookingTypeWatched === "date")) ||
//     bookingTypeWatched === "yourself";
    
//   const showMultipleClaims =
//     (bookingTypeWatched === "yourself" || bookingTypeWatched === "others") &&
//     items.reduce((total, item) => total + item.quantity, 0) > 1;

//   const handleNumberOfRecipientsChange = (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const count = parseInt(e.target.value, 10) || 0;
//     setValue("numberOfRecipients", e.target.value);
//     const currentLength = getValues("multipleRecipients")?.length ?? 0;
//     if (count > currentLength) {
//       for (let i = currentLength; i < count; i++) {
//         append({ name: "", phone: "", email: "", address: "" });
//       }
//     } else if (count < currentLength) {
//       for (let i = currentLength; i > count; i--) {
//         remove(i - 1);
//       }
//     }
//   };

//   // ============================================================
//   // Handle file input change
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!hasValidAuth()) {
//       toast({
//         title: "Authentication required",
//         description: "Please sign in to upload images.",
//         variant: "error",
//         duration: 1000,
//       });
//       return;
//     }

//     const validation = validateFile(file);
//     if (!validation.isValid) {
//       toast({
//         title: "Invalid file",
//         description: validation.error,
//         variant: "error",
//         duration: 1500,
//       });
//       return;
//     }

//     const previewUrl = URL.createObjectURL(file);

//     setUploadedTicketDesign({
//       file,
//       url: "",
//       preview: previewUrl,
//       isUploading: false,
//     });

//     toast({
//       title: "File selected",
//       description: "Your ticket design will be uploaded when you submit the booking.",
//       variant: "success",
//     });
//   };

//   // Remove uploaded file
//   const handleRemoveFile = () => {
//     if (uploadedTicketDesign?.preview) {
//       URL.revokeObjectURL(uploadedTicketDesign.preview);
//     }
//     setUploadedTicketDesign(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   // NEW: Main booking submission handler - Creates booking and navigates to checkout
//   const handleBookingSubmit = async (data: any) => {
//     try {
//       // Check if cart has items
//       if (items.length === 0) {
//         toast({
//           title: "No items in cart",
//           description: "Please add at least one item to your cart before proceeding.",
//           variant: "error",
//           duration: 1000,
//         });
//         return;
//       }

//       let uploadedImageUrl = "";

//       // Upload image if one is selected
//       if (uploadedTicketDesign?.file && !uploadedTicketDesign.url) {
//         try {
//           setUploadedTicketDesign((prev) =>
//             prev ? { ...prev, isUploading: true } : null
//           );

//           const uploadResult = await new Promise<ImageUploadResponse>(
//             (resolve, reject) => {
//               uploadImage(
//                 { file: uploadedTicketDesign.file },
//                 {
//                   onSuccess: (result: ImageUploadResponse) => {
//                     resolve(result);
//                   },
//                   onError: (error: Error) => {
//                     reject(error);
//                   },
//                 }
//               );
//             }
//           );

//           if (!uploadResult || !uploadResult.url) {
//             throw new Error("Upload result is invalid.");
//           }

//           uploadedImageUrl = uploadResult.url;

//           setUploadedTicketDesign((prev) =>
//             prev
//               ? {
//                   ...prev,
//                   url: uploadedImageUrl,
//                   isUploading: false,
//                 }
//               : null
//           );
//         } catch (uploadError) {
//           console.error("Image upload failed:", uploadError);
//           setUploadedTicketDesign((prev) =>
//             prev ? { ...prev, isUploading: false } : null
//           );

//           const errorMessage =
//             uploadError instanceof Error
//               ? uploadError.message
//               : "Unknown error";

//           toast({
//             title: "Image Upload Failed",
//             description: `Your custom ticket design could not be uploaded. Reason: ${errorMessage}. Please try again or proceed without it.`,
//             variant: "error",
//             duration: 5000,
//           });

//           return;
//         }
//       } else if (uploadedTicketDesign?.url) {
//         uploadedImageUrl = uploadedTicketDesign.url;
//       }
      
//       if (isEditMode && editBookingId) {
//         // UPDATE EXISTING BOOKING (keep existing logic)
//         const updatePayload = {
//           menuItems: items.map((item) => ({
//             menuId: item.mealId,
//             quantity:
//               data.deliveryType === "multiple" || data.bookingType === "public"
//                 ? item.quantity * parseInt(data.numberOfRecipients || "1", 10)
//                 : item.quantity,
//           })),
//           reason:
//             data.reason ||
//             `${data.redemptionMode} order${
//               data.includeUtensils ? " with utensils" : ""
//             }`,
//           bookingType:
//             data.bookingType === "yourself"
//               ? "self"
//               : data.bookingType === "public"
//               ? "public"
//               : "others",
//           bookedFor:
//             data.bookingType === "yourself"
//               ? { type: "self" }
//               : data.bookingType === "public"
//               ? { type: "public" }
//               : {
//                   type: "contact",
//                   contact:
//                     data.deliveryType === "single"
//                       ? [
//                           {
//                             name: data.recipientName || "",
//                             email: data.recipientEmail || "",
//                             phoneNumber: data.recipientPhone || "",
//                             remark: data.recipientRemark || "",
//                           },
//                         ]
//                       : (data.multipleRecipients || []).map(
//                           (recipient: any) => ({
//                             name: recipient.name || "",
//                             email: recipient.email || "",
//                             phoneNumber: recipient.phone || "",
//                             remark: recipient.remark || "",
//                           })
//                         ),
//                 },
//           restaurantId: restaurantId,
//           numberOfBookings:
//             data.deliveryType === "multiple" || data.bookingType === "public"
//               ? items.reduce((total, item) => total + item.quantity, 0) *
//                 parseInt(data.numberOfRecipients || "1", 10)
//               : items.reduce((total, item) => total + item.quantity, 0),
//           validityDate: data.redemptionDate
//             ? {
//                 start: new Date(data.redemptionDate).toISOString(),
//                 stop: new Date(
//                   new Date(data.redemptionDate).getTime() +
//                     7 * 24 * 60 * 60 * 1000
//                 ).toISOString(),
//               }
//             : {
//                 start: new Date(
//                   Date.now() + 7 * 24 * 60 * 60 * 1000
//                 ).toISOString(),
//                 stop: new Date(
//                   Date.now() + 14 * 24 * 60 * 60 * 1000
//                 ).toISOString(),
//               },
//           image: items[0]?.mealImage || "",
//           ...(data.bookingType === "public" && {
//             tags: data.publicTags
//               ? data.publicTags
//                   .split(",")
//                   .map((tag: string) => tag.trim().replace(/^#/, ""))
//                   .filter((tag: string) => tag)
//               : [],
//           }),
//         };

//         await updateBookingMutation.mutateAsync(updatePayload);
//         toast({
//           title: "Booking updated successfully!",
//           description: "Your booking has been updated.",
//           variant: "success",
//         });

//         navigate(`/booking/${editBookingId}`);
//       } else {
//         // NEW: CREATE NEW BOOKING HERE (moved from CheckoutDetail)
//         if (!restaurantId) {
//           throw new Error("Missing restaurant information. Please go back and try again.");
//         }

//         setIsCreatingBooking(true);
//         toast({
//           title: "Creating booking...",
//           description: "Please wait while we process your booking.",
//           variant: "default",
//           duration: 2000,
//         });

//         // Build the booking payload
//         const { menuItems, ...restOfData } = data;
//         console.log("menu iteemmmss :" + menuItems );
//         console.log("rest of the data :" + restOfData );
        

//         // Transform menuItems to items with pid instead of menuId
//         const transformedItems = items.map((item) => ({
//           pid: item.mealId,
//           quantity:
//             data.deliveryType === "multiple" || data.bookingType === "public"
//               ? item.quantity * parseInt(data.numberOfRecipients || "1", 10)
//               : item.quantity,
//           instructions: item.userInstruction || "",
//         }));

//         const createBookingPayload = {
//           businessId: restaurantId,
//           items: transformedItems,
//           reason:
//             data.reason ||
//             `${data.redemptionMode} order${
//               data.includeUtensils ? " with utensils" : ""
//             }`,
//           redemptionMode: data.redemptionMode,
//           includeUtensils: data.includeUtensils,
//           deliveryType: data.deliveryType,
//           bookingType:
//             data.bookingType === "yourself"
//               ? "self"
//               : data.bookingType === "public"
//               ? "public"
//               : "others",
//           bookedFor:
//             data.bookingType === "yourself"
//               ? { type: "self" }
//               : data.bookingType === "public"
//               ? { type: "public" }
//               : {
//                   type: "contact",
//                   contact:
//                     data.deliveryType === "single"
//                       ? [
//                           {
//                             name: data.recipientName || "",
//                             email: data.recipientEmail || "",
//                             phoneNumber: data.recipientPhone || "",
//                             remark: data.recipientRemark || "",
//                           },
//                         ]
//                       : (data.multipleRecipients || []).map(
//                           (recipient: any) => ({
//                             name: recipient.name || "",
//                             email: recipient.email || "",
//                             phoneNumber: recipient.phone || "",
//                             remark: recipient.remark || "",
//                           })
//                         ),
//                 },
//           numberOfBookings:
//             data.deliveryType === "multiple" || data.bookingType === "public"
//               ? items.reduce((total, item) => total + item.quantity, 0) *
//                 parseInt(data.numberOfRecipients || "1", 10)
//               : items.reduce((total, item) => total + item.quantity, 0),
//           validityDate: data.redemptionDate
//             ? {
//                 start: new Date(data.redemptionDate).toISOString(),
//                 stop: new Date(
//                   new Date(data.redemptionDate).getTime() +
//                     7 * 24 * 60 * 60 * 1000
//                 ).toISOString(),
//               }
//             : {
//                 start: new Date(
//                   Date.now() + 7 * 24 * 60 * 60 * 1000
//                 ).toISOString(),
//                 stop: new Date(
//                   Date.now() + 14 * 24 * 60 * 60 * 1000
//                 ).toISOString(),
//               },
//           image: items[0]?.mealImage || "",
//           currency: "NGN",
//           createdAt: new Date().toISOString(),
//           // Add public tags if it's a public booking
//           ...(data.bookingType === "public" && {
//             tags: data.publicTags
//               ? data.publicTags
//                   .split(",")
//                   .map((tag: string) =>
//                     tag.trim().replace(/^#/, "").toLowerCase()
//                   )
//                   .filter((tag: string) => tag)
//               : [],
//           }),
//           // Add custom image if uploaded
//           customImage: uploadedImageUrl || "",
//           // Add multiple claims support
//           supportsMultipleClaims: data.supportsMultipleClaims || false,
//           // Add auto generate ticket flag
//           autoGenerateTicket: data.autoGenerateTicket || false,
//           // Add gift request metadata if applicable
//           ...(isGiftRequest && giftRequestData && {
//             giftRequestId: giftRequestData._id,
//             isGiftRequestFulfillment: true,
//             giftRequestDetails: {
//               requesterId: giftRequestData.user._id,
//               requesterName: giftRequestData.user.fullName,
//               requesterEmail: giftRequestData.user.email,
//               originalQuantity: giftRequestData.quantity,
//               originalAmount: giftRequestData.totalAmount,
//             },
//           }),
//         };

//         console.log("Creating booking with payload:", createBookingPayload);

//         // CREATE THE BOOKING
//         const bookingResult = await createBookingMutation.mutateAsync(
//           createBookingPayload as unknown as BookingCreateBody
//         );

//         // Extract the booking ID from the result
//         const newBookingId = [
//           bookingResult?.data?.bookingId,
//           bookingResult?.bookingId,
//           bookingResult?.data?._id,
//           bookingResult?.data?.id,
//           bookingResult?._id,
//           bookingResult?.id,
//         ].find((id) => typeof id === "string" && id.length > 0);

//         if (!newBookingId) {
//           throw new Error("Failed to create booking - no valid ID returned");
//         }

//         console.log("Booking created successfully with ID:", newBookingId);

//         // Update booking store with minimal details for checkout
//         const recipientDetails =
//           data.bookingType === "yourself"
//             ? null
//             : data.bookingType === "public"
//             ? null
//             : data.deliveryType === "single"
//             ? {
//                 name: data.recipientName || "",
//                 phone: data.recipientPhone || "",
//                 email: data.recipientEmail || "",
//                 message: data.reason || "",
//               }
//             : {
//                 name: `${data.numberOfRecipients} recipients`,
//                 phone: "Multiple phone numbers",
//                 email: "Multiple email addresses",
//                 message: `Booking for ${data.numberOfRecipients} recipients`,
//               };

//         updateBookingDetails({
//           bookingId: newBookingId,
//           bookingType: data.bookingType,
//           numberOfRecipients: parseInt(data.numberOfRecipients || "1", 10),
//           recipientDetails,
//           deliveryDate: data.redemptionDate
//             ? new Date(data.redemptionDate).toISOString()
//             : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//           deliveryTime: null,
//           specialInstructions: data.reason || "",
//           isGift:
//             data.bookingType !== "yourself" && data.bookingType !== "public",
//           paymentMethod: "",
//           restaurantId,
//           restaurantName:
//             restaurantData?.name || items[0]?.restaurantName || "",
//           location:
//             restaurantData?.address ||
//             (typeof restaurantData?.location === "string"
//               ? restaurantData.location
//               : restaurantData?.location
//               ? `${restaurantData.location.coordinates[1]},${restaurantData.location.coordinates[0]}`
//               : ""),
//         });

//         toast({
//           title: "Booking created successfully!",
//           description: "Redirecting to checkout...",
//           variant: "success",
//           duration: 1500,
//         });

//         // Clear gift request data from sessionStorage after successful submission
//         if (isGiftRequest) {
//           sessionStorage.removeItem("giftRequestData");
//         }

//         // Call the original onSubmit for any additional handling
//         onSubmit(data);

//         // Navigate to checkout with the booking ID
//         navigate(`/checkout?bookingId=${newBookingId}`);
//       }

//       // Clean up the preview URL after successful booking
//       if (uploadedTicketDesign?.preview) {
//         URL.revokeObjectURL(uploadedTicketDesign.preview);
//       }
//       setUploadedTicketDesign(null);
//     } catch (error: unknown) {
//       console.error(
//         isEditMode ? "Booking update failed:" : "Booking creation failed:",
//         error
//       );
//       setUploadedTicketDesign((prev) =>
//         prev ? { ...prev, isUploading: false } : null
//       );

//       toast({
//         title: isEditMode ? "Update failed" : "Booking creation failed",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Something went wrong. Please try again.",
//         variant: "error",
//         duration: 3000,
//       });
//     } finally {
//       setIsCreatingBooking(false);
//     }
//   };
  
//   const handleBrowseFileClick = () => {
//     fileInputRef.current?.click();
//   };

//   // =========================================
//   // Auto-populate user details when booking for yourself
//   useEffect(() => {
//     if (bookingTypeWatched === "yourself" && user) {
//       setValue("recipientName", user.username || "");
//       setValue("recipientEmail", user.email || "");
//       setValue("recipientPhone", user.phone || "");
//       setValue("deliveryType", "single");

//       if (showTicketCustomization) {
//         setValue("ticketCustomizationRecipientName", user.username || "");
//         setValue("ticketCustomizationRecipientEmail", user.email || "");
//         setValue("ticketCustomizationRecipientPhone", user.phone || "");
//       }
//     } else if (bookingTypeWatched === "others") {
//       if (!isGiftRequest) {
//         setValue("recipientName", "");
//         setValue("recipientEmail", "");
//         setValue("recipientPhone", "");
//         setValue("recipientAddress", "");
//         setValue("multipleRecipients", [
//           { name: "", phone: "", email: "", address: "" },
//         ]);
//       }
//     } else if (bookingTypeWatched === "public") {
//       setValue("redemptionMode", "pick-up");
//       setValue("recipientName", "");
//       setValue("recipientEmail", "");
//       setValue("recipientPhone", "");
//       setValue("recipientAddress", "");
//       setValue("multipleRecipients", []);
//     } else if (bookingTypeWatched === "date") {
//       setValue("redemptionMode", "dine-with-me");
//       setValue("recipientName", "");
//       setValue("recipientEmail", "");
//       setValue("recipientPhone", "");
//       setValue("recipientAddress", "");
//       setValue("multipleRecipients", [
//         { name: "", phone: "", email: "", address: "" },
//       ]);
//     }
//   }, [bookingTypeWatched, user, setValue, showTicketCustomization, isGiftRequest]);

//   // Show notification when delivery is selected
//   useEffect(() => {
//     if (redemptionModeWatched === "delivery") {
//       const timeoutId = setTimeout(() => {
//         toast({
//           title: "Delivery Service Notice",
//           description: "This service is not yet automated, you will be contacted.",
//           variant: "info",
//           duration: 3000,
//         });
//       }, 100);

//       return () => clearTimeout(timeoutId);
//     }
//   }, [redemptionModeWatched, toast]);

//   // Pre-populate form with existing booking data when in edit mode
//   useEffect(() => {
//     if (isEditMode && editBookingData && !isLoadingBooking) {
//       const booking =
//         editBookingData &&
//         typeof editBookingData === "object" &&
//         "data" in editBookingData
//           ? (editBookingData as { data: any }).data
//           : editBookingData;

//       console.log("Pre-populating form with booking data:", booking);

//       const formBookingType =
//         booking.bookingType === "self"
//           ? "yourself"
//           : booking.bookingType === "public"
//           ? "public"
//           : booking.bookingType === "date"
//           ? "date"
//           : "others";

//       const redemptionMode = booking.reason?.includes("delivery")
//         ? "delivery"
//         : booking.reason?.includes("dine-with-me")
//         ? "dine-with-me"
//         : booking.reason?.includes("dine-in")
//         ? "dine-in"
//         : "pickup";
//       const includeUtensils =
//         booking.reason?.includes("with utensils") || false;

//       const publicTags = booking.reason?.includes("Public booking with tags:")
//         ? booking.reason
//             .split("Public booking with tags:")[1]
//             ?.trim()
//             .replace("none", "") || ""
//         : "";

//       setValue("bookingType", formBookingType);
//       setValue("redemptionMode", redemptionMode);
//       setValue("includeUtensils", includeUtensils);
//       setValue("numberOfRecipients", String(booking.numberOfBookings || 1));
//       setValue("reason", booking.reason || "");

//       if (booking.validityDate) {
//         const validityDate =
//           typeof booking.validityDate === "string"
//             ? booking.validityDate
//             : booking.validityDate.stop || booking.validityDate.start;
//         setValue("redemptionDate", new Date(validityDate));
//       }

//       if (formBookingType === "public" && publicTags) {
//         setValue("publicTags", publicTags);
//       }

//       if (formBookingType !== "public") {
//         const isMultiple =
//           booking.bookedFor &&
//           typeof booking.bookedFor === "string" &&
//           booking.bookedFor.includes("recipients");
//         setValue("deliveryType", isMultiple ? "multiple" : "single");
//       }

//       if (
//         formBookingType === "others" &&
//         booking.bookedFor &&
//         typeof booking.bookedFor === "string"
//       ) {
//         if (!booking.bookedFor.includes("recipients")) {
//           setValue("recipientName", booking.bookedFor);
//         }
//       }
      
//       // Populate cart with booking's menu items
//       if (booking.menuItems && Array.isArray(booking.menuItems)) {
//         try {
//           clearCart();

//           booking.menuItems.forEach((menuItem: any) => {
//             const cartItem = {
//               mealId: menuItem.menuId || menuItem.mealId || menuItem.id,
//               mealName: menuItem.name || menuItem.mealName || "Meal",
//               mealImage:
//                 menuItem.image || menuItem.mealImage || booking.image || "",
//               quantity: menuItem.quantity || 1,
//               price: menuItem.price || 0,
//               pricePerUnit: menuItem.pricePerUnit || menuItem.price || 0,
//               restaurantId: restaurantId,
//               restaurantName:
//                 restaurantData?.name ||
//                 booking.restaurant?.name ||
//                 "Restaurant",
//               choices: menuItem.choices || {},
//             };

//             console.log("Adding item to cart:", cartItem);
//             useCartStore.getState().addItem(cartItem);
//           });
//         } catch (error) {
//           console.error("Error populating cart:", error);
//         }
//       } else if (booking.image || booking.menuItems) {
//         try {
//           const fallbackItem = {
//             mealId: booking.mealId || booking.id || booking._id || "unknown",
//             mealName: booking.reason || "Meal Package",
//             mealImage: booking.image || "",
//             quantity: booking.numberOfBookings || 1,
//             price: 0,
//             pricePerUnit: 0,
//             restaurantId: restaurantId,
//             restaurantName:
//               restaurantData?.name || booking.restaurant?.name || "Restaurant",
//             choices: {},
//           };

//           console.log("Adding fallback item to cart:", fallbackItem);
//           clearCart();
//           useCartStore.getState().addItem(fallbackItem);
//         } catch (error) {
//           console.error("Error creating fallback cart item:", error);
//           toast({
//             title: "Cart population failed",
//             description:
//               "There was an error loading your booking data. Please try again.",
//             variant: "error",
//           });
//         }
//       }
//     }
//   }, [
//     isEditMode,
//     editBookingData,
//     isLoadingBooking,
//     setValue,
//     toast,
//     restaurantId,
//     restaurantData?.name,
//     clearCart,
//   ]);

//   // Effect to prevent form field changes when it's a gift request
//   useEffect(() => {
//     if (isGiftRequest && giftRequestData) {
//       const subscription = watch((value, { name }) => {
//         if (name === "bookingType" && value.bookingType !== "others") {
//           setValue("bookingType", "others");
//           toast({
//             title: "Booking Type Locked",
//             description: "This is a gift request fulfillment and must be booked for others.",
//             variant: "info",
//             duration: 2000,
//           });
//         }
        
//         if (name === "deliveryType" && value.deliveryType !== "single") {
//           setValue("deliveryType", "single");
//           toast({
//             title: "Delivery Type Locked",
//             description: "Gift requests are for single recipients only.",
//             variant: "info",
//             duration: 2000,
//           });
//         }
//       });

//       return () => subscription.unsubscribe();
//     }
//   }, [isGiftRequest, giftRequestData, watch, setValue, toast]);

//   // Cleanup preview URL on component unmount
//   useEffect(() => {
//     return () => {
//       if (uploadedTicketDesign?.preview) {
//         URL.revokeObjectURL(uploadedTicketDesign.preview);
//       }
      
//       // Clean up gift request data if user leaves without completing
//       if (isGiftRequest && window.location.pathname.includes("/orders")) {
//         window.addEventListener("beforeunload", () => {
//           sessionStorage.removeItem("giftRequestData");
//         });
//       }
//     };
//   }, [uploadedTicketDesign?.preview, isGiftRequest]);

//   // ================================================
//   // =====================================
//   // JSX RETURN - Form UI (Part 1 of 3)
//   // =====================================
//   return (
//     <>
//       {/* Show loading state when in edit mode and still loading */}
//       {isEditMode && isLoadingBooking && <OrderFormSkeleton />}

//       {/* Show edit mode indicator */}
//       {isEditMode && !isLoadingBooking && (
//         <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
//           <div className="flex items-center space-x-2">
//             <Edit3 className="h-5 w-5 text-amber-600" />
//             <div>
//               <p className="text-amber-800 font-medium">Edit Mode</p>
//               <p className="text-amber-700 text-sm">
//                 You are editing an existing booking. Make your changes and click
//                 "Update Booking".
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Show gift request indicator */}
//       {isGiftRequest && giftRequestData && !isEditMode && (
//         <div className="m-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
//           <div className="flex items-center space-x-3">
//             <Gift className="h-6 w-6 text-purple-600 flex-shrink-0" />
//             <div className="flex-1">
//               <p className="text-purple-800 font-medium">Gift Request Fulfillment</p>
//               <p className="text-purple-700 text-sm mt-1">
//                 You're fulfilling a gift request from{" "}
//                 <span className="font-semibold">{giftRequestData.user.fullName}</span>
//                 {" "}for {giftRequestData.quantity}x {giftRequestData.product.name}
//               </p>
//               <p className="text-purple-600 text-xs mt-2">
//                 Recipient details have been pre-filled and locked for this request.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       <form onSubmit={handleSubmit(handleBookingSubmit)}>
//         {/* include utensils */}
//         {delivery && (
//           <>
//             <div className="m-4 flex items-center justify-between bg-[#EADDFF] p-4 rounded-lg">
//               <div className="flex gap-2 items-center">
//                 <Utensils />
//                 <p>Include utensils, napkin etc </p>
//               </div>
//               <Controller
//                 name="includeUtensils"
//                 control={control}
//                 render={({ field }) => (
//                   <button
//                     type="button"
//                     onClick={() => field.onChange(!field.value)}
//                     className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none ${
//                       field.value ? "bg-primary" : "bg-gray-300"
//                     }`}
//                     role="switch"
//                     aria-checked={field.value}
//                   >
//                     <span
//                       className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
//                         field.value ? "translate-x-6" : "translate-x-1"
//                       }`}
//                     />
//                   </button>
//                 )}
//               />
//             </div>
//             <div className="border-t border-gray-300 my-3" />
//           </>
//         )}
        
//         {/* section-1: Booking Type */}
//         <div className={isGiftRequest ? "pointer-events-none opacity-60" : ""}>
//           <BookingTypeSection control={control} errors={errors}/>
//         </div>
//         <div className="border-t border-gray-300 my-4" />
        
//         {/* section-2: Redemption Mode */}
//         <RedemptionModeSection control={control} errors={errors} />
        
//         {/* Public Tags Section - only shown for public bookings */}
//         {showPublicTagsInput && (
//           <PublicTagsSection
//             register={register}
//             errors={errors}
//             setValue={setValue}
//             numberOfRecipientsValueWatched={numberOfRecipientsValueWatched || "1"}
//           />
//         )}
        
//         {/* Recipient type tabs */}
//         {showRecipientTabs && (
//           <div className="m-4">
//             <Controller
//               name="deliveryType"
//               control={control}
//               render={({ field: tabField }) => (
//                 <Tabs.Root
//                   tabIndex={-1}
//                   value={tabField.value}
//                   onValueChange={(value) => {
//                     if (isGiftRequest && value !== "single") {
//                       toast({
//                         title: "Delivery Type Locked",
//                         description: "Gift requests are for single recipients only.",
//                         variant: "info",
//                         duration: 2000,
//                       });
//                       return;
//                     }
//                     tabField.onChange(value);
//                   }}
//                   className="flex flex-col"
//                 >
//                   <Tabs.List
//                     tabIndex={-1}
//                     className="flex border-b border-gray-300 bg-[#FEF7F]"
//                   >
//                     {deliveryType.map((tab, index) => (
//                       <Tabs.Trigger
//                         tabIndex={-1}
//                         key={`tab-trigger-${tab.name}-${index}`}
//                         value={tab.name}
//                         disabled={
//                           ((bookingTypeWatched === "yourself" ||
//                             (bookingTypeWatched === "date" && redemptionModeWatched !== "dine-with-me")) &&
//                           tab.name === "multiple") ||
//                           (isGiftRequest && tab.name === "multiple")
//                         }
//                         className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary ${
//                           ((bookingTypeWatched === "yourself" ||
//                             (bookingTypeWatched === "date" && redemptionModeWatched !== "dine-with-me")) &&
//                           tab.name === "multiple") ||
//                           (isGiftRequest && tab.name === "multiple")
//                             ? "text-gray-400 cursor-not-allowed opacity-50"
//                             : "text-black"
//                         }`}
//                       >
//                         {tab.icon}
//                         <span>{tab.label}</span>
//                       </Tabs.Trigger>
//                     ))}
//                   </Tabs.List>
//                   {deliveryType.map((tab, index) => (
//                     <Tabs.Content
//                       key={`tab-content-${tab.name}-${index}`}
//                       value={tab.name}
//                       tabIndex={-1}
//                       className="py-4 px-1 focus:outline-none"
//                     >
//                       {tab.name === "single" && (
//                         <div className="space-y-1 mt-2">
//                           <p className="text-lg font-medium">
//                             Enter Recipient info
//                           </p>
                          
//                           {/* Conditional rendering based on booking type */}
//                           <div className={isGiftRequest ? "pointer-events-none opacity-75" : ""}>
//                             {bookingTypeWatched === "yourself" ? (
//                               <FormField<OrderFormValues>
//                                 name="recipientName"
//                                 register={register}
//                                 errors={errors}
//                                 placeholder="Enter full name"
//                                 inputClassName={isGiftRequest ? "bg-gray-100" : ""}
//                               />
//                             ) : (
//                               <UserSearchCombobox
//                                 value={watch("recipientName") || ""}
//                                 onChange={(value) => {
//                                   if (!isGiftRequest) {
//                                     setValue("recipientName", value);
//                                   }
//                                 }}
//                                 onUserSelect={(user: UserSearchResult) => {
//                                   if (!isGiftRequest) {
//                                     setValue("recipientName", user.fullName);
//                                     setValue("recipientEmail", user.email);
//                                     setValue("recipientPhone", user.phoneNumber);
//                                   }
//                                 }}
//                                 placeholder= {
//                                   isGiftRequest ? giftRequestData.user.accountType === "organization" 
//                                   ? giftRequestData.user.organizationName : giftRequestData.user.fullName
//                                    : "Search for a recipient by name"
//                                 }
//                                 error={errors.recipientName?.message}
//                                 disabled={isGiftRequest}
//                               />
//                             )}
//                           </div>

//                           <div className={isGiftRequest ? "pointer-events-none opacity-75" : ""}>
//                             <FormField<OrderFormValues>
//                               name="recipientPhone"
//                               type="tel"
//                               control={control}
//                               register={register}
//                               errors={errors}
//                               placeholder={
//                                   isGiftRequest ? giftRequestData.user.accountType === "organization" 
//                                   ? giftRequestData.user.phoneNumber : giftRequestData.user.phoneNumber
//                                    : "Enter phone number"
//                                 }
//                               inputClassName={isGiftRequest ? "bg-gray-100" : ""}
//                               disabled={isGiftRequest}
//                             />
//                           </div>
                          
//                           <div className={isGiftRequest ? "pointer-events-none opacity-75" : ""}>
//                             <FormField<OrderFormValues>
//                               name="recipientEmail"
//                               type="email"
//                               register={register}
//                               errors={errors}
//                               placeholder={
//                                   isGiftRequest ? giftRequestData.user.accountType === "organization" 
//                                   ? giftRequestData.user.email : giftRequestData.user.email
//                                    : "Enter email address"
//                                 }
//                               inputClassName={isGiftRequest ? "bg-gray-100" : ""}
//                               disabled={isGiftRequest}
//                             />
//                           </div>
                          
//                           <div className="flex justify-between items-center">
//                             <FormField<OrderFormValues>
//                               name="recipientAddress"
//                               register={register}
//                               errors={errors}
//                               placeholder="Enter street address or zipcode"
//                               inputClassName={`lg:w-[25rem] w-full flex-1 px-3 py-4 outline-none !focus:ring-0 !border-b focus:border-b-primary ${
//                                 isGiftRequest ? "bg-gray-100" : ""
//                               }`}
//                               disabled={isGiftRequest}
//                             />
//                             {!isGiftRequest && (
//                               <p className="text-primary text-lg font-medium cursor-pointer">
//                                 Cancel
//                               </p>
//                             )}
//                           </div>
                          
//                           {/* Recipient Remark Field */}
//                           <FormField<OrderFormValues>
//                             name="recipientRemark"
//                             register={register}
//                             errors={errors}
//                             placeholder="Add a remark for this recipient (optional)"
//                             inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-[6rem]"
//                           />
//                         </div>
//                       )}
                      
//                       {tab.name === "multiple" && (
//                         <div className="space-y-1 mt-4">
//                           <div className="relative">
//                             <FormField<OrderFormValues>
//                               name="numberOfRecipients"
//                               type="number"
//                               register={register}
//                               errors={errors}
//                               placeholder="Select number of recipient"
//                               inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[44px]"
//                               onChange={handleNumberOfRecipientsChange}
//                             />
//                             <RadixDropdownMenu.Root>
//                               <RadixDropdownMenu.Trigger asChild>
//                                 <button
//                                   type="button"
//                                   className="absolute right-5 top-0 transform translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center focus:outline-none"
//                                   aria-label="Select number of recipients"
//                                 >
//                                   <span className="mr-1 text-sm text-medium">
//                                     {numberOfRecipientsValueWatched || "1"}
//                                   </span>
//                                   <ChevronDown size={16} />
//                                 </button>
//                               </RadixDropdownMenu.Trigger>
//                               <RadixDropdownMenu.Portal>
//                                 <RadixDropdownMenu.Content
//                                   className="bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[80px] max-h-[200px] overflow-y-auto p-1"
//                                   sideOffset={5}
//                                   align="end"
//                                 >
//                                   {[...Array(10).keys()]
//                                     .map((i) => i + 1)
//                                     .map((num) => (
//                                       <RadixDropdownMenu.Item
//                                         key={`recipient-${num}`}
//                                         className="relative flex items-center justify-center px-4 py-2 rounded-md text-sm select-none data-[highlighted]:bg-primary data-[highlighted]:text-white data-[state=checked]:font-semibold cursor-pointer"
//                                         onSelect={() => {
//                                           const val = String(num);
//                                           setValue("numberOfRecipients", val, {
//                                             shouldValidate: true,
//                                           });
//                                           const syntheticEvent = {
//                                             target: { value: val },
//                                           } as React.ChangeEvent<HTMLInputElement>;
//                                           handleNumberOfRecipientsChange(
//                                             syntheticEvent
//                                           );
//                                         }}
//                                       >
//                                         {num}
//                                         {numberOfRecipientsValueWatched ===
//                                           String(num) && (
//                                           <Check className="absolute left-2 w-4 h-4 text-primary data-[highlighted]:text-white" />
//                                         )}
//                                       </RadixDropdownMenu.Item>
//                                     ))}
//                                 </RadixDropdownMenu.Content>
//                               </RadixDropdownMenu.Portal>
//                             </RadixDropdownMenu.Root>
//                           </div>

//                           {fields.map((item, index) => (
//                             <div key={item.id} className="space-y-3 relative">
//                               <h3 className="text-lg font-medium">
//                                 Enter Recipient {index + 1} info
//                               </h3>
                              
//                               <div>
//                                 {bookingTypeWatched === "yourself" ? (
//                                   <FormField<OrderFormValues>
//                                     name={`multipleRecipients.${index}.name` as const}
//                                     register={register}
//                                     errors={errors}
//                                     placeholder={`Enter recipient ${index + 1} full name`}
//                                   />
//                                 ) : (
//                                   <UserSearchCombobox
//                                     value={watch(`multipleRecipients.${index}.name`) || ""}
//                                     onChange={(value) => setValue(`multipleRecipients.${index}.name`, value)}
//                                     onUserSelect={(user: UserSearchResult) => {
//                                       setValue(`multipleRecipients.${index}.name`, user.fullName);
//                                       setValue(`multipleRecipients.${index}.email`, user.email);
//                                       setValue(`multipleRecipients.${index}.phone`, user.phoneNumber);
//                                     }}
//                                     placeholder={`Search for recipient ${index + 1} by name`}
//                                     error={errors.multipleRecipients?.[index]?.name?.message}
//                                   />
//                                 )}
//                               </div>

//                               <FormField<OrderFormValues>
//                                 name={`multipleRecipients.${index}.phone` as const}
//                                 type="tel"
//                                 control={control}
//                                 register={register}
//                                 errors={errors}
//                                 placeholder="Enter phone number"
//                               />
                              
//                               <FormField<OrderFormValues>
//                                 name={`multipleRecipients.${index}.email` as const}
//                                 type="email"
//                                 register={register}
//                                 errors={errors}
//                                 placeholder="Enter email address"
//                               />
                              
//                               <div className="flex justify-between items-center gap-2">
//                                 <FormField<OrderFormValues>
//                                   name={`multipleRecipients.${index}.address` as const}
//                                   register={register}
//                                   errors={errors}
//                                   placeholder="Enter street address or zipcode"
//                                   inputClassName="lg:w-[25rem] w-full px-3 py-4 outline-none !focus:ring-0 !border-b focus:border-b-primary"
//                                 />
//                                 <p className="text-primary text-lg font-medium cursor-pointer">
//                                   Cancel
//                                 </p>
//                               </div>
                              
//                               <FormField<OrderFormValues>
//                                 name={`multipleRecipients.${index}.remark` as const}
//                                 register={register}
//                                 errors={errors}
//                                 placeholder={`Add a remark for recipient ${index + 1} (optional)`}
//                                 inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-[6rem]"
//                               />
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </Tabs.Content>
//                   ))}
//                 </Tabs.Root>
//               )}
//             />
//             {errors.deliveryType && (
//               <p className="text-red-500 text-xs mt-1">
//                 {typeof errors.deliveryType.message === "string"
//                   ? errors.deliveryType.message
//                   : "Please select an option"}
//               </p>
//             )}
//           </div>
//         )}
        
//         {/* Calendar date range selection */}
//         {showRedemptionDatePicker && (
//           <div className="m-4">
//             <p className="text-xl font-medium tracking pb-2">
//               Enter ticket redemption date
//             </p>
//             <div className="p-4">
//               <Controller
//                 name="redemptionDate"
//                 control={control}
//                 render={({ field }) => (
//                   <Calendar
//                     selectedDate={field.value}
//                     onDateChange={field.onChange}
//                   />
//                 )}
//               />
//             </div>
//             {errors.redemptionDate && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.redemptionDate.message}
//               </p>
//             )}
//           </div>
//         )}
//         {/* Ticket customization - only shown when quantity ≥ 100 and redemption mode is Pickup */}
//         {showTicketCustomization && (
//           <div className="m-4">
//             <div className="border-t border-gray-300 my-3" />
//             <div>
//               <h2 className="font-medium text-xl py-2">Ticket Customization</h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 Upload a custom design for your tickets (optional)
//               </p>
              
//               <div className="border rounded-lg overflow-hidden">
//                 <div className="inline-flex p-4 gap-3 items-center border-b w-full bg-gray-50">
//                   <div className="rounded-full border p-3 bg-white">
//                     <Upload className="w-5 h-5 text-primary" />
//                   </div>
//                   <div className="flex-1">
//                     <h3 className="font-medium text-lg">
//                       Upload ticket design (Optional)
//                     </h3>
//                     <p className="text-sm text-gray-600 mt-1">
//                       Select and upload your personalized ticket design
//                     </p>
//                   </div>
//                 </div>

//                 <div className="p-6">
//                   {!uploadedTicketDesign ? (
//                     <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer group">
//                       <input
//                         id="upload-ticket"
//                         type="file"
//                         accept="image/*"
//                         ref={fileInputRef}
//                         onChange={handleFileChange}
//                         className="hidden"
//                       />

//                       <div className="flex flex-col items-center space-y-4">
//                         <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
//                           <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
//                         </div>

//                         <div className="space-y-2">
//                           <p className="text-lg font-medium text-gray-900">
//                             Choose a file
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             JPG or PNG format up to 20MB
//                           </p>
//                           <p className="text-xs text-gray-400">
//                             1080p × 1080p resolution recommended
//                           </p>
//                         </div>

//                         <button
//                           type="button"
//                           className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
//                           onClick={handleBrowseFileClick}
//                         >
//                           Browse Files
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       <div className="relative flex justify-center items-center self-center">
//                         <img
//                           src={uploadedTicketDesign.preview}
//                           alt="Uploaded ticket design"
//                           className="max-w-full max-h-48 object-contain rounded-lg border"
//                         />

//                         {uploadedTicketDesign.isUploading && (
//                           <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
//                             <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
//                               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
//                               <span className="text-sm font-medium">
//                                 Uploading...
//                               </span>
//                             </div>
//                           </div>
//                         )}

//                         <button
//                           type="button"
//                           onClick={handleRemoveFile}
//                           disabled={uploadedTicketDesign.isUploading}
//                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
//                           aria-label="Remove uploaded image"
//                         >
//                           <X size={16} />
//                         </button>
//                       </div>

//                       <div className="bg-gray-50 rounded-lg p-4 space-y-2">
//                         <div className="flex items-center justify-between">
//                           <p className="text-sm font-medium text-gray-900">
//                             {uploadedTicketDesign.file.name}
//                           </p>
//                           <span className="text-xs text-gray-500">
//                             {fileService.formatFileSize(
//                               uploadedTicketDesign.file.size
//                             )}
//                           </span>
//                         </div>

//                         <div className="flex items-center space-x-2">
//                           {uploadedTicketDesign.url ? (
//                             <>
//                               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                               <span className="text-sm text-green-600 font-medium">
//                                 Upload complete!
//                               </span>
//                             </>
//                           ) : uploadedTicketDesign.isUploading ? (
//                             <>
//                               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
//                               <span className="text-sm text-blue-600">
//                                 Uploading...
//                               </span>
//                             </>
//                           ) : (
//                             <>
//                               <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
//                               <span className="text-sm text-gray-500">
//                                 Ready to upload
//                               </span>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* Reason Section */}
//         <div className="m-4">
//           <div className="border-t border-gray-300 my-4" />
//           <p className="text-xl font-medium mb-4">
//             {bookingTypeWatched === "yourself"
//               ? "Personal booking reason"
//               : bookingTypeWatched === "public"
//               ? "Public booking reason"
//               : "Gift reason"}
//           </p>

//           <div className="relative">
//             <FormField<OrderFormValues>
//               name="reason"
//               register={register}
//               errors={errors}
//               placeholder={`Enter ${
//                 bookingTypeWatched === "yourself"
//                   ? "personal booking"
//                   : bookingTypeWatched === "public"
//                   ? "public booking"
//                   : "gift"
//               } reason...`}
//               inputClassName={`w-full px-3 py-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
//                 isGiftRequest ? "bg-gray-100" : ""
//               }`}
//               disabled={isGiftRequest}
//             />

//             {!isGiftRequest && (
//               <RadixDropdownMenu.Root>
//                 <RadixDropdownMenu.Trigger asChild>
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center focus:outline-none"
//                     aria-label="Select reason"
//                   >
//                     <ChevronDown size={20} />
//                   </button>
//                 </RadixDropdownMenu.Trigger>
//                 <RadixDropdownMenu.Portal>
//                   <RadixDropdownMenu.Content
//                     className="bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[280px] max-h-[300px] overflow-y-auto p-1"
//                     sideOffset={5}
//                     align="end"
//                   >
//                     {(() => {
//                       const predefinedReasons =
//                         bookingTypeWatched === "yourself"
//                           ? [
//                               "Personal treat",
//                               "Lunch break",
//                               "Dinner plans",
//                               "Date night",
//                               "Family meal",
//                               "Work meeting",
//                               "Celebration",
//                             ]
//                           : bookingTypeWatched === "others"
//                           ? [
//                               "Birthday celebration",
//                               "Anniversary gift",
//                               "Thank you gesture",
//                               "Holiday gift",
//                               "Congratulations",
//                               "Get well soon",
//                               "Random act of kindness",
//                             ]
//                           : [
//                               "Community support",
//                               "Holiday sharing",
//                               "Charity initiative",
//                               "Random kindness",
//                               "Festival celebration",
//                               "Religious occasion",
//                               "Social impact",
//                             ];

//                       return predefinedReasons.map((reason) => (
//                         <RadixDropdownMenu.Item
//                           key={`reason-option-${reason}`}
//                           className="flex items-center px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-gray-100 focus:bg-gray-100 outline-none"
//                           onSelect={() => {
//                             setValue("reason", reason, {
//                               shouldValidate: true,
//                             });
//                           }}
//                         >
//                           {reason}
//                         </RadixDropdownMenu.Item>
//                       ));
//                     })()}
//                   </RadixDropdownMenu.Content>
//                 </RadixDropdownMenu.Portal>
//               </RadixDropdownMenu.Root>
//             )}
//           </div>
//         </div>
        
//         {/* Refundable Section */}
//         <div className="m-4">
//           <div className="border-t border-gray-300 my-4" />
//           <Controller
//             name="refundable"
//             control={control}
//             render={({ field }) => (
//               <div
//                 className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
//                   field.value
//                     ? "border-primary bg-primary/5"
//                     : "border-gray-300"
//                 }`}
//                 onClick={() => field.onChange(!field.value)}
//               >
//                 <div className="p-2 flex flex-col gap-1 flex-1">
//                   <h3 className="text-lg font-medium">Refundable Booking</h3>
//                   <p className="text-black/50 text-sm">
//                     Make this booking refundable in case of cancellation
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   aria-checked={field.value}
//                   aria-label="Toggle refundable booking"
//                 >
//                   <Circle
//                     fill={`${field.value ? "#ff7a00" : "white"}`}
//                     className={`rounded-full ${
//                       field.value
//                         ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
//                         : ""
//                     }`}
//                   />
//                 </button>
//               </div>
//             )}
//           />
//           {errors.refundable && (
//             <p className="text-red-500 text-xs mt-1">
//               {errors.refundable.message}
//             </p>
//           )}
//         </div>

//         {/* Multiple Claims Section */}
//         {showMultipleClaims && (
//           <div className="m-4">
//             <div className="border-t border-gray-300 my-4" />
//             <p className="text-xl font-medium mb-4">Multiple Claims Support</p>
//             <p className="text-sm text-gray-600 mb-4">
//               Choose whether this ticket can be claimed multiple times or just once
//             </p>
//             <Controller
//               name="supportsMultipleClaims"
//               control={control}
//               render={({ field }) => (
//                 <div className="space-y-3">
//                   <div
//                     className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
//                       !field.value
//                         ? "border-primary bg-primary/5"
//                         : "border-gray-300"
//                     }`}
//                     onClick={() => field.onChange(false)}
//                   >
//                     <div className="p-2 flex flex-col gap-1 flex-1">
//                       <h3 className="text-lg font-medium">Single Use Only</h3>
//                       <p className="text-black/50 text-sm">
//                         This ticket can only be claimed once per recipient
//                       </p>
//                     </div>
//                     <Circle
//                       fill={`${!field.value ? "#ff7a00" : "white"}`}
//                       className={`rounded-full ${
//                         !field.value
//                           ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
//                           : ""
//                       }`}
//                     />
//                   </div>
//                   <div
//                     className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
//                       field.value
//                         ? "border-primary bg-primary/5"
//                         : "border-gray-300"
//                     }`}
//                     onClick={() => field.onChange(true)}
//                   >
//                     <div className="p-2 flex flex-col gap-1 flex-1">
//                       <h3 className="text-lg font-medium">
//                         Multiple Claims Allowed
//                       </h3>
//                       <p className="text-black/50 text-sm">
//                         This ticket can be claimed multiple times by the same recipient
//                       </p>
//                     </div>
//                     <Circle
//                       fill={`${field.value ? "#ff7a00" : "white"}`}
//                       className={`rounded-full ${
//                         field.value
//                           ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
//                           : ""
//                       }`}
//                     />
//                   </div>
//                 </div>
//               )}
//             />
//             {errors.supportsMultipleClaims && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.supportsMultipleClaims.message}
//               </p>
//             )}
//           </div>
//         )}
        
//         {/* Auto Generate Ticket Section */}
//         <div className="m-4">
//           <div className="border-t border-gray-300 my-4" />
//           <p className="text-xl font-medium mb-4">Ticket Generation</p>
//           <p className="text-sm text-gray-600 mb-4">
//             Choose whether to automatically generate tickets or handle manually
//           </p>
//           <Controller
//             name="autoGenerateTicket"
//             control={control}
//             render={({ field }) => (
//               <div className="space-y-3">
//                 <div
//                   className={`flex p-4 border rounded-lg items-center gap-4 cursor-pointer ${
//                     field.value
//                       ? "border-primary bg-primary/5"
//                       : "border-gray-300"
//                   }`}
//                   onClick={() => field.onChange(!field.value)}
//                 >
//                   <div className="p-2 flex flex-col gap-1 flex-1">
//                     <h3 className="text-lg font-medium">Auto Generate</h3>
//                     <p className="text-black/50 text-sm">
//                       Tickets will be automatically generated upon booking
//                     </p>
//                   </div>
//                   <Circle
//                     fill={`${field.value ? "#ff7a00" : "white"}`}
//                     className={`rounded-full ${
//                       field.value
//                         ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
//                         : ""
//                     }`}
//                   />
//                 </div>
//               </div>
//             )}
//           />
//           {errors.autoGenerateTicket && (
//             <p className="text-red-500 text-xs mt-1">
//               {errors.autoGenerateTicket.message}
//             </p>
//           )}
//         </div>
        
//         {/* UPDATED: Submit button - now creates booking instead of going to checkout */}
//         <div className="mx-6 fixed bottom-4 left-0 right-0 z-50 md:relative lg:relative">
//           {/* Show booking error if exists */}
//           {(updateBookingMutation.error || createBookingMutation.error) && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
//               <p className="text-red-700 text-sm">
//                 {isEditMode ? "Update failed:" : "Booking creation failed:"}{" "}
//                 {updateBookingMutation.error?.message ||
//                   createBookingMutation.error?.message ||
//                   "Something went wrong. Please try again."}
//               </p>
//             </div>
//           )}
          
//           {/* Show loading state for edit mode */}
//           {isEditMode && isLoadingBooking && (
//             <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
//               <p className="text-blue-700 text-sm">Loading booking data...</p>
//             </div>
//           )}
          
//           {/* Show creating booking state */}
//           {isCreatingBooking && (
//             <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
//               <div className="flex items-center space-x-2">
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//                 <p className="text-blue-700 text-sm">
//                   Creating your booking... Please wait.
//                 </p>
//               </div>
//             </div>
//           )}
          
//           <div className="space-y-3">
//             <CartButton
//               text={
//                 isEditMode
//                   ? updateBookingMutation.isPending
//                     ? "Updating Booking..."
//                     : "Update Booking"
//                   : isCreatingBooking
//                   ? "Creating Booking..."
//                   : isGiftRequest
//                   ? "Create Gift Booking"
//                   : "Create Booking"
//               }
//               textClassName="text-center"
//               isValid={
//                 !updateBookingMutation.isPending &&
//                 !createBookingMutation.isPending &&
//                 !isLoadingBooking &&
//                 !isCreatingBooking
//               }
//               onClick={handleSubmit(handleBookingSubmit)}
//               disabled={
//                 updateBookingMutation.isPending ||
//                 createBookingMutation.isPending ||
//                 isLoadingBooking ||
//                 isCreatingBooking
//               }
//             />
            
//             {/* Cancel button for edit mode */}
//             {isEditMode && (
//               <button
//                 type="button"
//                 onClick={() => navigate(`/booking/${editBookingId}`)}
//                 className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
//                 disabled={updateBookingMutation.isPending || isLoadingBooking}
//               >
//                 Cancel
//               </button>
//             )}
//           </div>
//         </div>
//       </form>
//     </>
//   );
// };

// export default OrderForm;
  
