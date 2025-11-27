// import { pid } from "process";

export const API_ENDPOINTS = {
  // User Authentication
  USER_AUTH: {
    REGISTER: "/api/users/auth/register",
    LOGIN: "/api/users/auth/login",
    GOOGLE: "/api/users/auth/google",
    FACEBOOK: "/api/users/auth/facebook",
    SEND_VERIFICATION_EMAIL: "/api/users/auth/send-verf-code/email",
    VERIFY_EMAIL: "/api/users/auth/verify-email",
    LOGOUT: "/api/users/auth/logout",
    PASSWORD_RESET_SEND_CODE: "/api/users/auth/password-reset/send-code",
    PASSWORD_RESET_VERIFY_CODE: "/api/users/auth/password-reset/verify-code",
    PASSWORD_RESET_RESET: "/api/users/auth/password-reset/reset",
  },

  // User Profile
  USER_PROFILE: {
    GET: "/api/users/profile",
    UPDATE: "/api/users/profile/update",
  },

  // User Search
  USER_SEARCH: {
    SEARCH_USERS: (query: string) => `/api/users/search?q=${query}`,
  },

  // Bookings
  BOOKINGS: {
    GET: "/api/users/bookings", // fetch all bookings (paginated)
    GET_ALL: "/api/users/bookings/all", // if this exists separately
    CREATE: "/api/users/bookings/create",
    UPDATE: (bid: string) => `/api/users/bookings/update/${bid}`,
    DELETE: (bid: string) => `/api/users/bookings/delete/${bid}`,
    VIEW: (bid: string) => `/api/users/bookings/view/${bid}`,
    CLAIM: (bid: string) => `/api/users/bookings/${bid}/claim`,
    PAY: (bid: string) => `/api/users/bookings/pay/${bid}`,
    // VERIFY_PAYMENT: (bid: string) =>
    //   `/api/users/bookings/verify-payment/${bid}`,
    VERIFY_PAYMENT: "/confirm-payment",
    VERIFY_PAYMENT_POST: "/confirm-payment",
    INITIALIZE_PAYMENT: "/api/users/initialize-booking-payment",
    CONFIRM_PAYMENT: "/confirm-payment",
    SELF: "/api/users/bookings/private/self",
    OTHERS: "/api/users/bookings/private/others",
    GIFTS: "/api/users/bookings/private/gifts",
    PUBLIC: "/api/users/bookings/public",
    NEARBY: "/api/users/bookings/nearby",
    SEARCH: "/api/users/bookings/search", // search bookings by tag
  },
  // Tickets
  TICKETS: {
    GET_ALL: "/api/users/tickets",
    VIEW: (tid: string) => `/api/users/tickets/view/${tid}`,
    MESSAGES_BY_BOOKING: (bid: string) =>
      `/api/users/tickets/messages/b/${bid}`,
    POST_MESSAGE: (tid: string) => `/api/users/tickets/message/t/${tid}/post`,
    POST_REACTION: (tid: string) => `/api/users/tickets/reaction/t/${tid}/post`,
    GET_ENGAGEMENTS: (bid: string) => `/api/users/tickets/engagements/b/${bid}`,
    NOTIFY_REDEMPTION: "/api/users/tickets/redemption/notify",
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: "/api/users/notifications",
    MARK_READ: (nid: string) => `/api/users/notifications/${nid}/mark-read`,
    MARK_ALL_READ: "/api/users/notifications/mark-all-read",
    DELETE: (nid: string) => `/api/users/notifications/${nid}/delete`,
    GET_UNREAD_COUNT: "/api/users/notifications/unread-count",
    DELETE_ALL_NOTIFICATION: "/api/users/notifications/delete/all",
  },

    // ======== FOR ALL BUSINESS ROUTES ======
  BUSINESSES: {
    GET_ALL: (
      category?: string,
      limit?: number,
      page?: number,
    ) => "/u/businesses/all?category=" + (category || "") + `&limit=${limit || 10}&page=${page || 1}`,
    GET_BY_LOCATION: "/u/businesses/location",
    GET_NEARBY: "/u/businesses/nearby",
    VIEW_BY_ID: (bid: string) => `/u/businesses/view/${bid}`,
    LIST_PRODUCTS: (bid: string) => `/u/business/${bid}/products`,
    GET_PRODUCT_INFO: (bid: string, pid: string) =>
      `/u/business/${bid}/products/${pid}`, // ==== EXAMPLE FOR A SINGLE BUSINESS ======
    // Popular products
    GET_POPULAR_PRODUCTS: "/u/businesses/products/popular",
    GET_POPULAR_PRODUCTS_BY_BUSINESS: (bid: string) => // ==== EXAMPLE FOR A SINGLE BUSINESS ======
      `/u/business/${bid}/products/popular`,
    // User-specific business endpoints
    GET_FAVOURITES: "/u/businesses/favourites",
    TOGGLE_FAVOURITE: (bid: string) =>
      `/u/businesses/favourite/b/${bid}/toggle`,
    GET_RATINGS: (bid: string) => `/u/businesses/${bid}/ratings`,
    RATE: (bid: string) => `/u/businesses/rate/b/${bid}`,
    // RECOMMENDED BUSINESS
    GET_RECOMMENDED_BUSINESS: (
      lat: number,
      lng: number,
      category?: string,
      limit?: number,
      page?: number
    ) =>
      `/u/businesses/recommended?category=${category}&lat=${lat}&lng=${lng}&page=${page}&limit=${limit}`,

    //FIND RESERVED BUSINESS PRODUCT
    FIND_RESERVED_PRODUCT: (bid: string, reservationCode: string) =>
      `/u/businesses/${bid}/products/reserved?rsvcode=${reservationCode}&page=1&limit=10`,
  },

  // User Search/Existence
  FIND_USER: "/api/users/find",

  // File uploads
  FILES: {
    UPLOAD_IMAGE: "/api/files/upload/image/public",
  },

  //reels
  CLIPS: {
    // Get all clips (paginated)
    GET_ALL: "/reels",
    GET_BY_ID: (cid: string) => `/reels/${cid}`,

    // Get engagements for a clip
    GET_ENGAGEMENTS: (cid: string) => `/reels/${cid}/engagements`,

    // Get comments for a clip (paginated)
    GET_COMMENTS: (cid: string) => `/reels/${cid}/comments`,

    // Post a new clip (upload)
    POST: "/reels/post",

    // React to a clip
    REACT: (cid: string) => `/reels/${cid}/react`,

    // Comment on a clip
    COMMENT: (cid: string) => `/reels/${cid}/comment`,

    // Track (add) a view for a clip
    VIEW: (cid: string) => `/reels/${cid}/view`,

    // Edit a comment on a clip
    EDIT_COMMENT: (cid: string) => `/reels/comments/edit/${cid}`,

    // Delete a comment on a clip
    DELETE_COMMENT: (cid: string) => `/reels/comments/delete/${cid}`,
    SHARE: (cid: string) => `/reels/${cid}/share`,
  },
  SPOTLIGHT: {
    // Get the active spotlight video (public)
    GET_VIDEO: "/spotlight/video",

    // Get the active spotlight image (public)
    GET_IMAGE: "/spotlight/image",

    // Update the spotlight video (admin)
    UPDATE_VIDEO: "/files/upload/spotlight/video",

    // Update the spotlight image (admin)
    UPDATE_IMAGE: "/files/upload/spotlight/image",
  },

  // POST
  POSTS: {
    FEED: "/posts/feed", // GET
    GET_BY_ID: (pid: string) => `/posts/${pid}`, // GET
    SHARE_BOOKING: "/posts/bookings/create", // POST
    REACT: (pid: string) => `/posts/${pid}/react`, // POST
    COMMENT: (pid: string) => `/posts/${pid}/comment`, // POST
    ENGAGEMENT: (pid: string) => `/posts/${pid}/engagements`, // GET
    COMMENTS: (pid: string) => `/posts/${pid}/comments`, // GET paginated
    EDIT_COMMENT: (cid: string) => `/posts/comments/edit/${cid}`, // PATCH
    DELETE_COMMENT: (cid: string) => `/posts/comments/delete/${cid}`, // DELETE
    EDIT: (pid: string) => `/posts/edit/${pid}`, // PATCH
    DELETE: (pid: string) => `/posts/delete/${pid}`, // DELETE
    SHARE: (pid: string) => `/posts/${pid}/share`, //POST
  },
} as const;

// Type definitions
export type BookingId = string;
export type TicketId = string;
export type RestaurantId = string;
export type GroceriesId = string;
export type FrozenFoodsId = string;
export type WineDrinksId = string;
export type MenuId = string;
export type NotificationId = string;

// Helper functions for user endpoints
export const getUserEndpoint = {
  // Bookings
  updateBooking: (bid: BookingId) => API_ENDPOINTS.BOOKINGS.UPDATE(bid),
  deleteBooking: (bid: BookingId) => API_ENDPOINTS.BOOKINGS.DELETE(bid),
  claimBooking: (bid: BookingId) => API_ENDPOINTS.BOOKINGS.CLAIM(bid),
  payForBooking: (bid: BookingId) => API_ENDPOINTS.BOOKINGS.PAY(bid),
  // verifyPayment: (bid: BookingId) => API_ENDPOINTS.BOOKINGS.VERIFY_PAYMENT(bid),
  viewBooking: (bid: BookingId) => API_ENDPOINTS.BOOKINGS.VIEW(bid),
  searchBookings: () => API_ENDPOINTS.BOOKINGS.SEARCH,

  // Popular Menus for all categories 
  getPopularRestaurantMenus: () => `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=restaurant`,
  getPopularGroceriesMenus: () => `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=groceries`,
  getPopularFrozenFoodsMenus: () => `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=frozen_foods`,
  getPopularWineDrinksMenus: () => `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=wine_drinks`,

  getPopularMenusByRestaurant: (bid: RestaurantId) =>
    API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(bid),
  getPopularMenusByGroceries: (bid: GroceriesId) =>
    API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(bid),
  getPopularMenusByFrozenFoods: (bid: FrozenFoodsId) =>
    API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(bid),
  getPopularMenusByWineDrinks: (bid: WineDrinksId) =>
    API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(bid),

  // Tickets
  viewTicket: (tid: TicketId) => API_ENDPOINTS.TICKETS.VIEW(tid),
  getTicketMessages: (bid: BookingId) =>
    API_ENDPOINTS.TICKETS.MESSAGES_BY_BOOKING(bid),
  postTicketMessage: (tid: TicketId) => API_ENDPOINTS.TICKETS.POST_MESSAGE(tid),
  postTicketReaction: (tid: TicketId) =>
    API_ENDPOINTS.TICKETS.POST_REACTION(tid),
  getTicketEngagements: (bid: BookingId) =>
    API_ENDPOINTS.TICKETS.GET_ENGAGEMENTS(bid),

  // Notifications
  getNotifications: () => API_ENDPOINTS.NOTIFICATIONS.GET_ALL,
  markNotificationRead: (nid: NotificationId) =>
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(nid),
  markAllNotificationsRead: () => API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
  deleteNotification: (nid: NotificationId) =>
    API_ENDPOINTS.NOTIFICATIONS.DELETE(nid),
  getUnreadNotificationsCount: () =>
    API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT,
  deleteAllNotifications: () =>
    API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL_NOTIFICATION,

  // Favourites & Ratings
  getFavourites: () => API_ENDPOINTS.BUSINESSES.GET_FAVOURITES,
  toggleFavourite: (rid: RestaurantId) =>
    API_ENDPOINTS.BUSINESSES.TOGGLE_FAVOURITE(rid),
  getRatings: (rid: RestaurantId) => API_ENDPOINTS.BUSINESSES.GET_RATINGS(rid),
  rateRestaurant: (rid: RestaurantId) => API_ENDPOINTS.BUSINESSES.RATE(rid),
  // User Search
  findUser: () => API_ENDPOINTS.FIND_USER,
} as const;

