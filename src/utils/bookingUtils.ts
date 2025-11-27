// Utility helpers to extract and normalize booking details

export type BookingSummary = {
  id?: string;
  bookingId?: string;
  status?: string;
  bookedAt?: string; // ISO
  bookedAtTimestamp?: number;
  bookedBy?: {
    id?: string;
    name?: string;
    email?: string;
    profileImage?: string;
    accountType?: string;
    organizationName?: string;
    phoneNumber?: string;
  };
  restaurant?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    profileImage?: string;
    restaurantId?: string;
    paymentCurrency?: string;
  };
  items: Array<{
    id?: string;
    menuId?: string;
    name?: string;
    price?: number;
    quantity?: number;
    images?: string[];
    totalPrice?: number;
  }>;
  totals: {
    totalAmount?: number; // source value from API
    deliveryFee?: number;
    calculatedTotal?: number; // calculated from items + delivery
  };
  numberOfBookings?: number;
  redemptionMode?: string;
  includeUtensils?: boolean;
  validity?: {
    start?: string | null;
    stop?: string | null;
  };
  tags?: string[];
  image?: string;
  paymentReference?: string;
  isExpired?: boolean;
};

type RawObject = Record<string, unknown>;

/**
 * Extracts a normalized booking summary from a raw booking object.
 * Handles missing fields gracefully.
 */
export function extractBookingSummary(raw: RawObject): BookingSummary {
  if (!raw || typeof raw !== "object") {
    return {
      items: [],
      totals: { calculatedTotal: 0, deliveryFee: 0 },
    };
  }

  const r = raw as RawObject;

  const rawMenuItems = r["menuItems"];

  const items: BookingSummary["items"] = Array.isArray(rawMenuItems)
    ? (rawMenuItems as unknown[]).map((mi) => {
        const miObj = (mi as RawObject) || {};
        const menu = (miObj["menu"] as RawObject) || {};

        const priceRaw = menu["price"];
        let price = 0;
        if (typeof priceRaw === "number") price = priceRaw;
        else if (typeof priceRaw === "string") price = Number(priceRaw) || 0;

        const quantityRaw = miObj["quantity"];
        let quantity = 0;
        if (typeof quantityRaw === "number") quantity = quantityRaw;
        else if (typeof quantityRaw === "string") quantity = Number(quantityRaw) || 0;

        const images = Array.isArray(menu["images"]) ? (menu["images"] as unknown[]).filter(i => typeof i === 'string') as string[] : [];

        const totalPrice = price * quantity;

        return {
          id: typeof miObj["_id"] === "string" ? (miObj["_id"] as string) : undefined,
          menuId: typeof menu["menuId"] === "string"
            ? (menu["menuId"] as string)
            : typeof menu["_id"] === "string"
            ? (menu["_id"] as string)
            : undefined,
          name: typeof menu["name"] === "string" ? (menu["name"] as string) : "",
          price,
          quantity,
          images,
          totalPrice,
        };
      })
    : [];

  const calculatedItemsTotal = items.reduce<number>((s, it) => s + (it.totalPrice ?? 0), 0);

  const deliveryFeeRaw = r["deliveryFee"];
  const deliveryFee = typeof deliveryFeeRaw === "number" ? deliveryFeeRaw : typeof deliveryFeeRaw === "string" ? Number(deliveryFeeRaw) || 0 : 0;

  const totalAmountRaw = r["totalAmount"];
  const totalAmount = typeof totalAmountRaw === "number" ? totalAmountRaw : typeof totalAmountRaw === "string" ? Number(totalAmountRaw) || undefined : undefined;

  const calculatedTotal = calculatedItemsTotal + deliveryFee;

  const validityDate = (r["validityDate"] as RawObject) || (r["validity"] as RawObject) || {};
  const validityStart = typeof validityDate["start"] === "string" ? (validityDate["start"] as string) : null;
  const validityStop = typeof validityDate["stop"] === "string" ? (validityDate["stop"] as string) : null;

  const now = Date.now();
  let isExpired = false;
  if (typeof r["status"] === "string" && r["status"] === "expired") isExpired = true;
  else if (validityStop) {
    const stopTs = Date.parse(validityStop);
    if (!Number.isNaN(stopTs)) isExpired = stopTs < now;
  }

  const bookedByUser = (r["bookedByUser"] as RawObject) || {};
  const bookedAtRestaurant = (r["bookedAtRestaurant"] as RawObject) || {};

  return {
    id: typeof r["_id"] === "string" ? (r["_id"] as string) : undefined,
    bookingId: typeof r["bookingId"] === "string" ? (r["bookingId"] as string) : undefined,
    status: typeof r["status"] === "string" ? (r["status"] as string) : undefined,
    bookedAt: typeof r["bookedAt"] === "string" ? (r["bookedAt"] as string) : typeof r["createdAt"] === "string" ? (r["createdAt"] as string) : undefined,
    bookedAtTimestamp: typeof r["bookedAt"] === "string" ? Date.parse(r["bookedAt"] as string) : typeof r["createdAt"] === "string" ? Date.parse(r["createdAt"] as string) : undefined,
    bookedBy: {
      id: typeof r["bookedById"] === "string" ? (r["bookedById"] as string) : typeof bookedByUser["_id"] === "string" ? (bookedByUser["_id"] as string) : undefined,
      name: typeof r["bookedByName"] === "string" ? (r["bookedByName"] as string) : typeof bookedByUser["fullName"] === "string" ? (bookedByUser["fullName"] as string) : typeof bookedByUser["organizationName"] === "string" ? (bookedByUser["organizationName"] as string) : undefined,
      email: typeof bookedByUser["email"] === "string" ? (bookedByUser["email"] as string) : undefined,
      profileImage: typeof r["bookedByProfileImage"] === "string" ? (r["bookedByProfileImage"] as string) : typeof bookedByUser["profileImage"] === "string" ? (bookedByUser["profileImage"] as string) : undefined,
      accountType: typeof bookedByUser["accountType"] === "string" ? (bookedByUser["accountType"] as string) : undefined,
      organizationName: typeof bookedByUser["organizationName"] === "string" ? (bookedByUser["organizationName"] as string) : undefined,
      phoneNumber: typeof bookedByUser["phoneNumber"] === "string" ? (bookedByUser["phoneNumber"] as string) : undefined,
    },
    restaurant: {
      id: typeof bookedAtRestaurant["_id"] === "string" ? (bookedAtRestaurant["_id"] as string) : typeof r["restaurantId"] === "string" ? (r["restaurantId"] as string) : undefined,
      name: typeof bookedAtRestaurant["name"] === "string" ? (bookedAtRestaurant["name"] as string) : undefined,
      address: typeof bookedAtRestaurant["address"] === "string" ? (bookedAtRestaurant["address"] as string) : undefined,
      city: typeof bookedAtRestaurant["city"] === "string" ? (bookedAtRestaurant["city"] as string) : undefined,
      state: typeof bookedAtRestaurant["state"] === "string" ? (bookedAtRestaurant["state"] as string) : undefined,
      country: typeof bookedAtRestaurant["country"] === "string" ? (bookedAtRestaurant["country"] as string) : undefined,
      phone: typeof bookedAtRestaurant["phone"] === "string" ? (bookedAtRestaurant["phone"] as string) : undefined,
      profileImage: typeof bookedAtRestaurant["profileImage"] === "string" ? (bookedAtRestaurant["profileImage"] as string) : typeof r["image"] === "string" ? (r["image"] as string) : undefined,
      restaurantId: typeof bookedAtRestaurant["restaurantId"] === "string" ? (bookedAtRestaurant["restaurantId"] as string) : typeof r["restaurantId"] === "string" ? (r["restaurantId"] as string) : undefined,
      paymentCurrency: typeof bookedAtRestaurant["paymentCurrency"] === "string" ? (bookedAtRestaurant["paymentCurrency"] as string) : undefined,
    },
    items,
    totals: {
      totalAmount,
      deliveryFee,
      calculatedTotal,
    },
    numberOfBookings: typeof r["numberOfBookings"] === "number" ? (r["numberOfBookings"] as number) : typeof r["numberOfBookings"] === "string" ? Number(r["numberOfBookings"]) || undefined : undefined,
    redemptionMode: typeof r["redemptionMode"] === "string" ? (r["redemptionMode"] as string) : undefined,
    includeUtensils: Boolean(r["includeUtensils"]),
    validity: {
      start: validityStart,
      stop: validityStop,
    },
    tags: Array.isArray(r["tags"]) ? (r["tags"] as unknown[]).filter(t => typeof t === 'string') as string[] : [],
    image: typeof r["image"] === "string" ? (r["image"] as string) : typeof bookedAtRestaurant["profileImage"] === "string" ? (bookedAtRestaurant["profileImage"] as string) : undefined,
    paymentReference: typeof r["paymentReference"] === "string" ? (r["paymentReference"] as string) : undefined,
    isExpired,
  };
}

/**
 * Map an array of raw bookings into summaries.
 */
export function extractBookingSummaries(rawList: unknown[]): BookingSummary[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((r) => extractBookingSummary(r as RawObject));
}
