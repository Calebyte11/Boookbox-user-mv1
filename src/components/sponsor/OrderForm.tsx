/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Gift,
  Info,
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
import type { GiftRequestDataAuth } from "@/services/giftRequestService";

// UPDATE THE OrderFormProps INTERFACE
interface ExtendedOrderFormProps extends OrderFormProps {
  giftRequestData?: GiftRequestDataAuth | null;
}

const OrderForm: React.FC<ExtendedOrderFormProps> = ({
  onSubmit,
  restaurantId,
  giftRequestData,
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

  // Check if this is a gift request
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

  // =================================================
  // Form initialization with gift request handling
  const formMethods = useForm<OrderFormValues>({
    defaultValues: {
      bookingType: isGiftRequest ? "others" : "public",
      redemptionMode: "pick-up",
      includeUtensils: false,
      deliveryType: deliveryType[0].name,
      recipientName: isGiftRequest ? giftRequestData?.user.fullName || "" : "",
      recipientPhone: isGiftRequest
        ? giftRequestData?.user.phoneNumber || ""
        : "",
      recipientEmail: isGiftRequest ? giftRequestData?.user.email || "" : "",
      recipientAddress: "",
      recipientRemark: "",
      numberOfRecipients: isGiftRequest
        ? String(giftRequestData?.quantity || 1)
        : "1",
      numberOfBookings: "1", // NEW: Add number of bookings field
      numberOfPeople: "2", // Default to 2 people for date bookings
      multipleRecipients: [],
      redemptionDate: new Date(),
      reason: isGiftRequest
        ? `Gift request fulfillment for ${
            giftRequestData?.user.accountType === "organization"
              ? giftRequestData?.user.organizationName
              : giftRequestData?.user.fullName
          }`
        : "",
      publicTags: "",
      datePartnerName: "",
      datePartnerPhone: "",
      datePartnerEmail: "",
      refundable: true, // Changed to true by default
      supportsMultipleClaims: false,
      autoGenerateTicket: true,
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
  // Watch form values
  const delivery = watch("redemptionMode") === "delivery";
  const bookingTypeWatched = watch("bookingType");
  const redemptionModeWatched = watch("redemptionMode");
  const numberOfRecipientsValueWatched = watch("numberOfRecipients");
  const numberOfBookingsWatched = watch("numberOfBookings");
  const deliveryTypeWatched = watch("deliveryType");

  // Computed display flags
  const showRecipientTabs =
    (redemptionModeWatched === "delivery" ||
      redemptionModeWatched === "pick-up" ||
      redemptionModeWatched === "dine-in" ||
      redemptionModeWatched === "dine-with-me") &&
    bookingTypeWatched !== "public" &&
    bookingTypeWatched !== "date";

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
    (redemptionModeWatched === "dine-in" &&
      bookingTypeWatched === "yourself") ||
    (redemptionModeWatched === "dine-with-me" &&
      (bookingTypeWatched === "yourself" || bookingTypeWatched === "date")) ||
    bookingTypeWatched === "yourself";

  // NEW: Show multiple claims and auto-generate only for non-public bookings
  const showMultipleClaims =
    bookingTypeWatched !== "public" &&
    (bookingTypeWatched === "yourself" ||
      bookingTypeWatched === "others" ||
      bookingTypeWatched === "date") && 
    (numberOfBookingsWatched !== "1" && numberOfBookingsWatched !== "0");
    // items.reduce((total, item) => total + item.quantity, 0) > 1;

  const showAutoGenerateTicket = bookingTypeWatched === "yourself";

  // NEW: Show number of bookings for all booking types
  const showNumberOfBookings = true;

  // Calculate cart total
  const cartTotal = items.reduce(
    (total, item) => total + item.pricePerUnit * item.quantity,
    0
  );

  // Calculate total amount based on booking type
  const calculateTotalAmount = () => {
    const numBookings = parseInt(numberOfBookingsWatched || "1", 10);
    const numRecipients = parseInt(numberOfRecipientsValueWatched || "1", 10);
    const numberOfPeopleWatched = watch("numberOfPeople");
    const numPeople = parseInt(numberOfPeopleWatched || "2", 10);

    let total = 0;
    if (bookingTypeWatched === "public") {
      // For public: cart total * number of bookings * number of recipients
      total = cartTotal * numBookings * numRecipients;
    } else if (bookingTypeWatched === "others") {
      if (deliveryTypeWatched === "multiple") {
        // For multiple recipients: cart total * number of recipients * number of bookings
        total = cartTotal * numRecipients * numBookings;
      } else {
        // For single recipient: cart total * number of bookings
        total = cartTotal * numBookings;
      }
    } else if (bookingTypeWatched === "date") {
      // For date: cart total * number of people
      total = cartTotal * numPeople;
    } else if (bookingTypeWatched === "yourself") {
      // For yourself: cart total * number of bookings
      total = cartTotal * numBookings;
    } else {
      total = cartTotal;
    }
    
    console.log("📊 OrderForm calculateTotalAmount:", {
      cartTotal,
      numBookings,
      numRecipients,
      bookingTypeWatched,
      deliveryTypeWatched,
      calculatedTotal: total,
    });
    
    return total;
  };

  // Calculate real number of bookings for backend
  const calculateRealNumberOfBookings = () => {
    const numBookings = parseInt(numberOfBookingsWatched || "1", 10);
    const numRecipients = parseInt(numberOfRecipientsValueWatched || "1", 10);
    const numberOfPeopleWatched = watch("numberOfPeople");
    const numPeople = parseInt(numberOfPeopleWatched || "2", 10);

    // For date bookings: use number of people
    if (bookingTypeWatched === "date") {
      return numPeople;
    }

    if (bookingTypeWatched === "others" && deliveryTypeWatched === "multiple") {
      // For multiple recipients: number of bookings * number of recipients
      return numBookings * numRecipients;
    }

    return numBookings;
  };
  // Effect to populate form with gift request data
  useEffect(() => {
    if (isGiftRequest && giftRequestData) {
      setValue("bookingType", "others");
      setValue("deliveryType", "single");
      setValue("recipientName", giftRequestData.user.fullName);
      setValue("recipientPhone", giftRequestData.user.phoneNumber);
      setValue("recipientEmail", giftRequestData.user.email);
      setValue("numberOfRecipients", String(giftRequestData.quantity));
      setValue(
        "reason",
        `Fulfilling gift request for ${
          giftRequestData.user.accountType === "organization"
            ? giftRequestData.user.organizationName
            : giftRequestData.user.fullName
        }`
      );

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

  // NEW: Effect to handle booking type changes and set defaults
  useEffect(() => {
    if (bookingTypeWatched === "public") {
      // For public bookings
      setValue("reason", "Great Impact made");
      setValue("supportsMultipleClaims", false);
      setValue("autoGenerateTicket", false);
      setValue("redemptionMode", "pick-up");
      setValue("recipientName", "");
      setValue("recipientEmail", "");
      setValue("recipientPhone", "");
      setValue("recipientAddress", "");
      setValue("multipleRecipients", []);
    } else if (bookingTypeWatched === "others") {
      // For others bookings
      if (!isGiftRequest) {
        setValue("reason", "shared kindness");
      }
    } else if (bookingTypeWatched === "yourself" && user) {
      // For yourself bookings
      setValue("recipientName", user.username || "");
      setValue("recipientEmail", user.email || "");
      setValue("recipientPhone", user.phone || "");
      setValue("deliveryType", "single");
    } else if (bookingTypeWatched === "date" && user) {
      // For date bookings
      setValue("redemptionMode", "dine-with-me");
      setValue("recipientName", user.username || "");
      setValue("recipientEmail", user.email || "");
      setValue("recipientPhone", user.phone || "");
    }
  }, [bookingTypeWatched, user, setValue, isGiftRequest]);

  // NEW: Effect to automatically set multiple claims to true when number of bookings > 1
  useEffect(() => {
    const numBookings = parseInt(numberOfBookingsWatched || "1", 10);

    if (bookingTypeWatched !== "public" && numBookings > 1) {
      setValue("supportsMultipleClaims", true);
    } else if (bookingTypeWatched !== "public" && numBookings === 1) {
      setValue("supportsMultipleClaims", false);
    }
  }, [numberOfBookingsWatched, bookingTypeWatched, setValue]);

  // Effect to ensure autoGenerateTicket is always true for "yourself" bookings
  useEffect(() => {
    if (bookingTypeWatched === "yourself") {
      setValue("autoGenerateTicket", true);
    }
  }, [bookingTypeWatched, setValue]);

  // Auto-fill user info for date bookings
  useEffect(() => {
    if (bookingTypeWatched === "date" && user) {
      setValue("recipientName", user.fullName || "");
      setValue("recipientPhone", user.phoneNumber || "");
      setValue("recipientEmail", user.email || "");
    }
  }, [bookingTypeWatched, user, setValue]);

  // Handle number of recipients change (for multiple recipients)
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

    if (!hasValidAuth()) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images.",
        variant: "error",
        duration: 1000,
      });
      return;
    }

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

    const previewUrl = URL.createObjectURL(file);

    setUploadedTicketDesign({
      file,
      url: "",
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

  const handleBrowseFileClick = () => {
    fileInputRef.current?.click();
  };




  // ============================ Handle form submission and create/update booking
  // Replace your handleBookingSubmit function with this corrected version:

const handleBookingSubmit = async (data: any) => {
  console.log("🎁 Gift Request Data:", giftRequestData);
  console.log("✅ Is Gift Request:", isGiftRequest);

  try {
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

        return;
      }
    } else if (uploadedTicketDesign?.url) {
      uploadedImageUrl = uploadedTicketDesign.url;
    }

    // Calculate the real number of bookings to send to backend
    const realNumberOfBookings = calculateRealNumberOfBookings();

    if (isEditMode && editBookingId) {
      // Update existing booking logic
      const updatePayload = {
        menuItems: items.map((item) => ({
          menuId: item.mealId,
          quantity: item.quantity,
        })),
        reason: data.reason || "Booking",
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
                          name:
                            isGiftRequest && giftRequestData
                              ? giftRequestData.user.accountType ===
                                "organization"
                                ? giftRequestData.user.organizationName
                                : giftRequestData.user.fullName
                              : data.recipientName || "",
                          email:
                            isGiftRequest && giftRequestData
                              ? giftRequestData.user.email
                              : data.recipientEmail || "",
                          phoneNumber:
                            isGiftRequest && giftRequestData
                              ? giftRequestData.user.phoneNumber
                              : data.recipientPhone || "",
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
        numberOfBookings: realNumberOfBookings,
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
        ...(data.bookingType === "public" && {
          tags: data.publicTags
            ? data.publicTags
                .split(",")
                .map((tag: string) => tag.trim().replace(/^#/, ""))
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

      navigate(`/booking/${editBookingId}`);
    } else {
      // NEW BOOKING CREATION - This was missing the actual execution
      const bookingPayload = {
        menuItems: items.map((item) => ({
          menuId: item.mealId,
          quantity: item.quantity,
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
            : data.bookingType === "date"
            ? "date"
            : "others",
        bookedFor:
          data.bookingType === "yourself"
            ? { type: "self" }
            : data.bookingType === "public"
            ? { type: "public" }
            : data.bookingType === "date"
            ? {
                type: "contact",
                contact: [
                  // User's info (auto-filled)
                  {
                    name: user?.fullName || "",
                    phone: user?.phoneNumber || "",
                    email: user?.email || "",
                    message: data.reason || "Date booking",
                  },
                  // Date partner info
                  {
                    name: data.datePartnerName || "",
                    phone: data.datePartnerPhone || "",
                    email: data.datePartnerEmail || "",
                    message: data.reason || "Date booking",
                  },
                ],
              }
            : {
                type: "contact",
                contact:
                  data.deliveryType === "single"
                    ? [
                        {
                          name:
                            isGiftRequest && giftRequestData
                              ? giftRequestData.user.accountType ===
                                "organization"
                                ? giftRequestData.user.organizationName
                                : giftRequestData.user.fullName
                              : data.recipientName || "",
                          phone:
                            isGiftRequest && giftRequestData
                              ? giftRequestData.user.phoneNumber
                              : data.recipientPhone || "",
                          email:
                            isGiftRequest && giftRequestData
                              ? giftRequestData.user.email
                              : data.recipientEmail || "",
                          message: data.reason || "",
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
        numberOfBookings: realNumberOfBookings,
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
        customImage: uploadedImageUrl || "",
        supportsMultipleClaims: data.supportsMultipleClaims || false,
        autoGenerateTicket: data.autoGenerateTicket || false,
        numberOfRecipients: parseInt(data.numberOfRecipients || "1", 10),
        ...(isGiftRequest &&
          giftRequestData && {
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

      setBookingPayload(bookingPayload);
      console.log("Booking payload:", bookingPayload);

      const recipientDetails =
        data.bookingType === "yourself"
          ? null
          : data.bookingType === "public"
          ? null
          : data.deliveryType === "single"
          ? {
              name:
                isGiftRequest && giftRequestData
                  ? giftRequestData.user.accountType === "organization"
                    ? giftRequestData.user.organizationName
                    : giftRequestData.user.fullName
                  : data.recipientName || "",
              phone:
                isGiftRequest && giftRequestData
                  ? giftRequestData.user.phoneNumber
                  : data.recipientPhone || "",
              email:
                isGiftRequest && giftRequestData
                  ? giftRequestData.user.email
                  : data.recipientEmail || "",
              message: data.reason || "",
            }
          : {
              name: `${data.numberOfRecipients} recipients`,
              phone: "Multiple phone numbers",
              email: "Multiple email addresses",
              message: `Booking for ${data.numberOfRecipients} recipients`,
            };

      const calculatedTotal = calculateTotalAmount();
      console.log("💾 Saving to Zustand store:", {
        calculatedTotalAmount: calculatedTotal,
        bookingType: data.bookingType,
        numberOfRecipients: parseInt(data.numberOfRecipients || "1", 10),
      });
      
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
        calculatedTotalAmount: calculatedTotal,
      });

      onSubmit(data);

      if (isGiftRequest) {
        sessionStorage.removeItem("giftRequestData");
      }

      navigate("/checkout");

      // Clean up the preview URL after successful booking
      if (uploadedTicketDesign?.preview) {
        URL.revokeObjectURL(uploadedTicketDesign.preview);
      }
      setUploadedTicketDesign(null);
    }
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

  // Show notification when delivery is selected
  useEffect(() => {
    if (redemptionModeWatched === "delivery") {
      const timeoutId = setTimeout(() => {
        toast({
          title: "Delivery Service Notice",
          description:
            "This service is not yet automated, you will be contacted.",
          variant: "info",
          duration: 3000,
        });
      }, 100);

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

      const formBookingType =
        booking.bookingType === "self"
          ? "yourself"
          : booking.bookingType === "public"
          ? "public"
          : booking.bookingType === "date"
          ? "date"
          : "others";

      const redemptionMode = booking.reason?.includes("delivery")
        ? "delivery"
        : booking.reason?.includes("dine-with-me")
        ? "dine-with-me"
        : booking.reason?.includes("dine-in")
        ? "dine-in"
        : "pickup";
      const includeUtensils =
        booking.reason?.includes("with utensils") || false;

      const publicTags = booking.reason?.includes("Public booking with tags:")
        ? booking.reason
            .split("Public booking with tags:")[1]
            ?.trim()
            .replace("none", "") || ""
        : "";

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

      if (formBookingType === "public" && publicTags) {
        setValue("publicTags", publicTags);
      }

      if (formBookingType !== "public") {
        const isMultiple =
          booking.bookedFor &&
          typeof booking.bookedFor === "string" &&
          booking.bookedFor.includes("recipients");
        setValue("deliveryType", isMultiple ? "multiple" : "single");
      }

      if (
        formBookingType === "others" &&
        booking.bookedFor &&
        typeof booking.bookedFor === "string"
      ) {
        if (!booking.bookedFor.includes("recipients")) {
          setValue("recipientName", booking.bookedFor);
        }
      }

      if (booking.menuItems && Array.isArray(booking.menuItems)) {
        try {
          useCartStore.getState().clearCart();

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

  // Effect to prevent form field changes when it's a gift request
  useEffect(() => {
    if (isGiftRequest && giftRequestData) {
      const subscription = watch((value, { name }) => {
        if (name === "bookingType" && value.bookingType !== "others") {
          setValue("bookingType", "others");
          toast({
            title: "Booking Type Locked",
            description:
              "This is a gift request fulfillment and must be booked for others.",
            variant: "info",
            duration: 2000,
          });
        }

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

      if (isGiftRequest && window.location.pathname.includes("/orders")) {
        window.addEventListener("beforeunload", () => {
          sessionStorage.removeItem("giftRequestData");
        });
      }
    };
  }, [uploadedTicketDesign?.preview, isGiftRequest]);
  // JSX PART 1: Form Header, Edit/Gift Indicators, and Booking Type Section
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

      {/* Show gift request indicator */}
      {isGiftRequest && giftRequestData && !isEditMode && (
        <div className="m-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Gift className="h-6 w-6 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-purple-800 font-medium">
                Gift Request Fulfillment
              </p>
              <p className="text-purple-700 text-sm mt-1">
                You're fulfilling a gift request from{" "}
                <span className="font-semibold">
                  {giftRequestData.user.accountType === "organization"
                    ? giftRequestData.user.organizationName
                    : giftRequestData.user.fullName}
                </span>{" "}
                for {giftRequestData.quantity}x {giftRequestData.product.name}
              </p>
              <p className="text-purple-600 text-xs mt-2">
                Recipient details have been pre-filled and locked for this
                request.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleBookingSubmit)}>
        {/* Include utensils */}
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

        {/* Section 1: Booking Type */}
        <div className={isGiftRequest ? "pointer-events-none opacity-60" : ""}>
          <BookingTypeSection control={control} errors={errors} />
        </div>
        <div className="border-t border-gray-300 my-4" />

        {/* Section 2: Redemption Mode */}
        <RedemptionModeSection control={control} errors={errors} />

        {/* Public Tags Section - Required for public bookings */}
        {showPublicTagsInput && (
          <>
            <div className="border-t border-gray-300 my-4" />
            <PublicTagsSection
              register={register}
              errors={errors}
              setValue={setValue}
              numberOfRecipientsValueWatched={
                numberOfRecipientsValueWatched || "1"
              }
            />
          </>
        )}

        {/* Number of People Section - ONLY for date bookings */}
        {bookingTypeWatched === "date" && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
            <p className="text-xl font-medium mb-2">Number of People</p>
            <p className="text-sm text-gray-600 mb-4">
              How many people are going on this date? (Minimum 2)
            </p>
            <div className="relative">
              <FormField<OrderFormValues>
                name="numberOfPeople"
                type="number"
                register={register}
                errors={errors}
                placeholder="Enter number of people"
                inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[44px]"
              />
            </div>
            {/* Show total amount calculation */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Total Amount: </span>₦
                {calculateTotalAmount().toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Cart Total (₦{cartTotal.toLocaleString()}) ×{" "}
                {watch("numberOfPeople") || 2} people
              </p>
            </div>
          </div>
        )}

        {/* Number of Bookings Section - Show for all booking types EXCEPT date */}
        {showNumberOfBookings && bookingTypeWatched !== "date" && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
            <p className="text-xl font-medium mb-2">Number of Bookings</p>
            <p className="text-sm text-gray-600 mb-4">
              {bookingTypeWatched === "public"
                ? "Specify how many bookings you want to create"
                : "Specify how many times this booking should be available"}
            </p>
            <div className="relative">
              <FormField<OrderFormValues>
                name="numberOfBookings"
                type="number"
                register={register}
                errors={errors}
                placeholder="Enter number of bookings"
                inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[44px]"
                disabled={bookingTypeWatched === "public" && false} // Editable for all types
              />
            </div>
            {/* Show total amount calculation */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Total Amount: </span>₦
                {calculateTotalAmount().toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {bookingTypeWatched === "public" && (
                  <>
                    Cart Total (₦{cartTotal.toLocaleString()}) ×{" "}
                    {numberOfBookingsWatched || 1} bookings
                  </>
                )}
                {bookingTypeWatched === "others" &&
                  deliveryTypeWatched === "multiple" && (
                    <>
                      Cart Total (₦{cartTotal.toLocaleString()}) ×{" "}
                      {numberOfRecipientsValueWatched || 1} recipients ×{" "}
                      {numberOfBookingsWatched || 1} bookings
                    </>
                  )}
                {bookingTypeWatched === "others" &&
                  deliveryTypeWatched === "single" && (
                    <>
                      Cart Total (₦{cartTotal.toLocaleString()}) ×{" "}
                      {numberOfBookingsWatched || 1} bookings
                    </>
                  )}
                {(bookingTypeWatched === "yourself" ||
                  bookingTypeWatched === "date") && (
                  <>
                    Cart Total (₦{cartTotal.toLocaleString()}) ×{" "}
                    {numberOfBookingsWatched || 1} bookings
                  </>
                )}
              </p>
            </div>
          </div>
        )}
        {/* JSX PART 2: Recipient Type Tabs */}
        {showRecipientTabs && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
            <Controller
              name="deliveryType"
              control={control}
              render={({ field: tabField }) => (
                <Tabs.Root
                  tabIndex={-1}
                  value={tabField.value}
                  onValueChange={(value) => {
                    if (isGiftRequest && value !== "single") {
                      toast({
                        title: "Delivery Type Locked",
                        description:
                          "Gift requests are for single recipients only.",
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
                            (bookingTypeWatched === "date" &&
                              redemptionModeWatched !== "dine-with-me")) &&
                            tab.name === "multiple") ||
                          (isGiftRequest && tab.name === "multiple")
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary ${
                          ((bookingTypeWatched === "yourself" ||
                            (bookingTypeWatched === "date" &&
                              redemptionModeWatched !== "dine-with-me")) &&
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
                            {bookingTypeWatched === "date"
                              ? "Enter Your Information"
                              : "Enter Recipient info"}
                          </p>

                          <div
                            className={
                              isGiftRequest
                                ? "pointer-events-none opacity-75"
                                : ""
                            }
                          >
                            {bookingTypeWatched === "yourself" ||
                            bookingTypeWatched === "date" ? (
                              <FormField<OrderFormValues>
                                name="recipientName"
                                register={register}
                                errors={errors}
                                placeholder="Enter full name"
                                inputClassName={
                                  isGiftRequest ||
                                  bookingTypeWatched === "yourself" ||
                                  bookingTypeWatched === "date"
                                    ? "bg-gray-100"
                                    : ""
                                }
                                disabled={
                                  bookingTypeWatched === "yourself" ||
                                  bookingTypeWatched === "date"
                                }
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
                                    setValue("recipientName", user.fullName);
                                    setValue("recipientEmail", user.email);
                                    setValue(
                                      "recipientPhone",
                                      user.phoneNumber
                                    );
                                  }
                                }}
                                placeholder={
                                  isGiftRequest
                                    ? giftRequestData.user.accountType ===
                                      "organization"
                                      ? giftRequestData.user.organizationName
                                      : giftRequestData.user.fullName
                                    : "Search for a recipient by name"
                                }
                                error={errors.recipientName?.message}
                                disabled={isGiftRequest}
                              />
                            )}
                          </div>

                          <div
                            className={
                              isGiftRequest
                                ? "pointer-events-none opacity-75"
                                : ""
                            }
                          >
                            <FormField<OrderFormValues>
                              name="recipientPhone"
                              type="tel"
                              control={control}
                              register={register}
                              errors={errors}
                              placeholder={
                                isGiftRequest
                                  ? giftRequestData.user.phoneNumber
                                  : "Enter phone number"
                              }
                              inputClassName={
                                isGiftRequest ||
                                bookingTypeWatched === "yourself" ||
                                bookingTypeWatched === "date"
                                  ? "bg-gray-100"
                                  : ""
                              }
                              disabled={
                                isGiftRequest ||
                                bookingTypeWatched === "yourself" ||
                                bookingTypeWatched === "date"
                              }
                            />
                          </div>

                          <div
                            className={
                              isGiftRequest
                                ? "pointer-events-none opacity-75"
                                : ""
                            }
                          >
                            <FormField<OrderFormValues>
                              name="recipientEmail"
                              type="email"
                              register={register}
                              errors={errors}
                              placeholder={
                                isGiftRequest
                                  ? giftRequestData.user.email
                                  : "Enter email address"
                              }
                              inputClassName={
                                isGiftRequest ||
                                bookingTypeWatched === "yourself" ||
                                bookingTypeWatched === "date"
                                  ? "bg-gray-100"
                                  : ""
                              }
                              disabled={
                                bookingTypeWatched === "yourself" ||
                                bookingTypeWatched === "date"
                              }
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
                            />
                            {!isGiftRequest && (
                              <p className="text-primary text-lg font-medium cursor-pointer">
                                Cancel
                              </p>
                            )}
                          </div>

                          <FormField<OrderFormValues>
                            name="recipientRemark"
                            register={register}
                            errors={errors}
                            placeholder="Add a remark for this recipient (optional)"
                            inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-[6rem]"
                          />

                          {/* For Date booking type, add second recipient (date partner) */}
                          {bookingTypeWatched === "date" && (
                            <>
                              <div className="border-t border-gray-300 my-4" />
                              <p className="text-lg font-medium mt-4">
                                Enter Your Date's Information
                              </p>

                              <UserSearchCombobox
                                value={watch("multipleRecipients.0.name") || ""}
                                onChange={(value) => {
                                  setValue("multipleRecipients.0.name", value);
                                }}
                                onUserSelect={(user: UserSearchResult) => {
                                  setValue(
                                    "multipleRecipients.0.name",
                                    user.fullName
                                  );
                                  setValue(
                                    "multipleRecipients.0.email",
                                    user.email
                                  );
                                  setValue(
                                    "multipleRecipients.0.phone",
                                    user.phoneNumber
                                  );
                                }}
                                placeholder="Search for your date by name"
                                error={
                                  errors.multipleRecipients?.[0]?.name?.message
                                }
                              />

                              <FormField<OrderFormValues>
                                name="multipleRecipients.0.phone"
                                type="tel"
                                control={control}
                                register={register}
                                errors={errors}
                                placeholder="Enter date's phone number"
                              />

                              <FormField<OrderFormValues>
                                name="multipleRecipients.0.email"
                                type="email"
                                register={register}
                                errors={errors}
                                placeholder="Enter date's email address"
                              />

                              <FormField<OrderFormValues>
                                name="multipleRecipients.0.remark"
                                register={register}
                                errors={errors}
                                placeholder="Add a remark for your date (optional)"
                                inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-[6rem]"
                              />
                            </>
                          )}
                        </div>
                      )}

                      {/* Continue to next part for multiple recipients... */}
                      {/* JSX PART 3: Multiple Recipients Tab Content */}
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

                          {/* Info about total bookings for multiple recipients */}
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                              <Info size={16} />
                              <span>
                                Total bookings to be created:{" "}
                                {calculateRealNumberOfBookings()}
                              </span>
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              ({numberOfRecipientsValueWatched || 1} recipients
                              × {numberOfBookingsWatched || 1} bookings each)
                            </p>
                          </div>

                          {fields.map((item, index) => (
                            <div key={item.id} className="space-y-3 relative">
                              <h3 className="text-lg font-medium mt-4">
                                Enter Recipient {index + 1} info
                              </h3>

                              <div>
                                {bookingTypeWatched === "yourself" ? (
                                  <FormField<OrderFormValues>
                                    name={
                                      `multipleRecipients.${index}.name` as const
                                    }
                                    register={register}
                                    errors={errors}
                                    placeholder={`Enter recipient ${
                                      index + 1
                                    } full name`}
                                  />
                                ) : (
                                  <UserSearchCombobox
                                    value={
                                      watch(
                                        `multipleRecipients.${index}.name`
                                      ) || ""
                                    }
                                    onChange={(value) =>
                                      setValue(
                                        `multipleRecipients.${index}.name`,
                                        value
                                      )
                                    }
                                    onUserSelect={(user: UserSearchResult) => {
                                      setValue(
                                        `multipleRecipients.${index}.name`,
                                        user.fullName
                                      );
                                      setValue(
                                        `multipleRecipients.${index}.email`,
                                        user.email
                                      );
                                      setValue(
                                        `multipleRecipients.${index}.phone`,
                                        user.phoneNumber
                                      );
                                    }}
                                    placeholder={`Search for recipient ${
                                      index + 1
                                    } by name`}
                                    error={
                                      errors.multipleRecipients?.[index]?.name
                                        ?.message
                                    }
                                  />
                                )}
                              </div>

                              <FormField<OrderFormValues>
                                name={
                                  `multipleRecipients.${index}.phone` as const
                                }
                                type="tel"
                                control={control}
                                register={register}
                                errors={errors}
                                placeholder="Enter phone number"
                              />

                              <FormField<OrderFormValues>
                                name={
                                  `multipleRecipients.${index}.email` as const
                                }
                                type="email"
                                register={register}
                                errors={errors}
                                placeholder="Enter email address"
                              />

                              <div className="flex justify-between items-center gap-2">
                                <FormField<OrderFormValues>
                                  name={
                                    `multipleRecipients.${index}.address` as const
                                  }
                                  register={register}
                                  errors={errors}
                                  placeholder="Enter street address or zipcode"
                                  inputClassName="lg:w-[25rem] w-full px-3 py-4 outline-none !focus:ring-0 !border-b focus:border-b-primary"
                                />
                                <p className="text-primary text-lg font-medium cursor-pointer">
                                  Cancel
                                </p>
                              </div>

                              <FormField<OrderFormValues>
                                name={
                                  `multipleRecipients.${index}.remark` as const
                                }
                                register={register}
                                errors={errors}
                                placeholder={`Add a remark for recipient ${
                                  index + 1
                                } (optional)`}
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

        {/* Date Partner Information Section - Only for date bookings */}
        {bookingTypeWatched === "date" && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
            <p className="text-xl font-medium mb-4">Date Partner Information</p>
            
            {/* User's Info - Auto-filled and disabled */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Your Information (Auto-filled)</p>
              <div className="space-y-3">
                <FormField<OrderFormValues>
                  name="recipientName"
                  type="text"
                  register={register}
                  errors={errors}
                  placeholder={user?.fullName || "Your full name"}
                  inputClassName="bg-gray-100"
                  disabled
                />
                <FormField<OrderFormValues>
                  name="recipientPhone"
                  type="tel"
                  register={register}
                  errors={errors}
                  placeholder={user?.phoneNumber || "Your phone number"}
                  inputClassName="bg-gray-100"
                  disabled
                />
                <FormField<OrderFormValues>
                  name="recipientEmail"
                  type="email"
                  register={register}
                  errors={errors}
                  placeholder={user?.email || "Your email"}
                  inputClassName="bg-gray-100"
                  disabled
                />
              </div>
            </div>

            {/* Date Partner's Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-3">Date Partner Information</p>
              <div className="space-y-3">
                <FormField<OrderFormValues>
                  name="datePartnerName"
                  type="text"
                  register={register}
                  errors={errors}
                  placeholder="Date partner's full name"
                />
                <FormField<OrderFormValues>
                  name="datePartnerPhone"
                  type="tel"
                  register={register}
                  errors={errors}
                  placeholder="Date partner's phone number"
                />
                <FormField<OrderFormValues>
                  name="datePartnerEmail"
                  type="email"
                  register={register}
                  errors={errors}
                  placeholder="Date partner's email address"
                />
              </div>
            </div>
          </div>
        )}

        {/* Calendar Date Range Selection */}
        {showRedemptionDatePicker && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
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
        {/* JSX PART 4: Ticket Customization, Reason, Settings, and Submit */}

        {/* Ticket Customization */}
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

        {/* Reason Section */}
        <div className="m-4">
          <div className="border-t border-gray-300 my-4" />
          <p className="text-xl font-medium mb-4">
            {bookingTypeWatched === "yourself"
              ? "Personal booking reason"
              : bookingTypeWatched === "public"
              ? "Public booking reason"
              : "Gift reason"}
          </p>

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
                isGiftRequest || bookingTypeWatched === "public"
                  ? "bg-gray-100"
                  : ""
              }`}
            />

            {!isGiftRequest && bookingTypeWatched !== "public" && (
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

        {/* Refundable Section - Always visible but disabled */}
        <div className="m-4">
          <div className="border-t border-gray-300 my-4" />
          <Controller
            name="refundable"
            control={control}
            render={({ field }) => (
              <div
                className={`flex p-4 border rounded-lg items-center gap-4 opacity-60 cursor-not-allowed border-primary bg-primary/5`}
              >
                <div className="p-2 flex flex-col gap-1 flex-1">
                  <h3 className="text-lg font-medium">Refundable Booking</h3>
                  <p className="text-black/50 text-sm">
                    This booking is refundable in case of cancellation
                  </p>
                </div>
                <Circle
                  fill="#ff7a00"
                  className="rounded-full ring-primary ring text-primary p-1 border border-primary rounded-full"
                />
              </div>
            )}
          />
        </div>

        {/* Multiple Claims Section with Hint */}
        {showMultipleClaims && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
            <p className="text-xl font-medium mb-2">Multiple Claims Support</p>

            {/* Hint/Instruction */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What does this mean?</p>
                <p>
                  <strong>Single Use:</strong> The ticket can only be redeemed
                  once by the recipient.
                </p>
                <p className="mt-1">
                  <strong>Multiple Claims:</strong> The recipient can use the
                  ticket multiple times until all items are claimed.
                </p>
                {parseInt(numberOfBookingsWatched || "1", 10) > 1 && (
                  <p className="mt-2 text-blue-700 font-medium">
                    ℹ️ Since you set {numberOfBookingsWatched} bookings,
                    multiple claims is automatically enabled.
                  </p>
                )}
              </div>
            </div>

            <Controller
              name="supportsMultipleClaims"
              control={control}
              render={({ field }) => (
                <div className="space-y-3">
                  <div
                    className={`flex p-4 border rounded-lg items-center gap-4 ${
                      parseInt(numberOfBookingsWatched || "1", 10) > 1
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    } ${
                      !field.value
                        ? "border-primary bg-primary/5"
                        : "border-gray-300"
                    }`}
                    onClick={() => {
                      if (parseInt(numberOfBookingsWatched || "1", 10) <= 1) {
                        field.onChange(false);
                      }
                    }}
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
                          ? "ring-primary ring text-primary p-1 border border-primary"
                          : ""
                      }`}
                    />
                  </div>
                  <div
                    className={`flex p-4 border rounded-lg items-center gap-4 ${
                      parseInt(numberOfBookingsWatched || "1", 10) > 1
                        ? "opacity-60 cursor-not-allowed border-primary bg-primary/5"
                        : "cursor-pointer"
                    } ${
                      field.value &&
                      parseInt(numberOfBookingsWatched || "1", 10) <= 1
                        ? "border-primary bg-primary/5"
                        : parseInt(numberOfBookingsWatched || "1", 10) <= 1
                        ? "border-gray-300"
                        : ""
                    }`}
                    onClick={() => {
                      if (parseInt(numberOfBookingsWatched || "1", 10) <= 1) {
                        field.onChange(true);
                      }
                    }}
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
                          ? "ring-primary ring text-primary p-1 border border-primary"
                          : ""
                      }`}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* Auto Generate Ticket Section - Only for "Yourself" bookings */}
        {showAutoGenerateTicket && (
          <div className="m-4">
            <div className="border-t border-gray-300 my-4" />
            <p className="text-xl font-medium mb-2">Ticket Generation</p>
            <p className="text-sm text-gray-600 mb-4">
              Your ticket will be automatically generated upon booking
            </p>
            <Controller
              name="autoGenerateTicket"
              control={control}
              render={({ field }) => (
                <div className="space-y-3">
                  <div
                    className={`flex p-4 border rounded-lg items-center gap-4 cursor-not-allowed opacity-75 border-primary bg-primary/5`}
                  >
                    <div className="p-2 flex flex-col gap-1 flex-1">
                      <h3 className="text-lg font-medium">Auto Generate</h3>
                      <p className="text-black/50 text-sm">
                        Tickets will be automatically generated upon booking
                      </p>
                    </div>
                    <Circle
                      fill="#ff7a00"
                      className="rounded-full ring-primary ring text-primary p-1 border border-primary"
                    />
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    This feature is automatically enabled for self bookings
                  </p>
                </div>
              )}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="mx-6 fixed bottom-4 left-0 right-0 z-50 md:relative lg:relative">
          {updateBookingMutation.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">
                {isEditMode ? "Update failed:" : "Booking failed:"}{" "}
                {updateBookingMutation.error?.message ||
                  "Something went wrong. Please try again."}
              </p>
            </div>
          )}

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
              price={`₦${calculateTotalAmount().toLocaleString()}`}
              textClassName="text-center"
              isValid={!updateBookingMutation.isPending && !isLoadingBooking}
              onClick={!errors && handleBookingSubmit}
            />

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
