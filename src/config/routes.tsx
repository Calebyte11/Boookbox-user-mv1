import { type RouteObject, useRoutes } from "react-router-dom";
// import { useEffect, useState } from "react";
import HomePage from "@/pages/Home";
import Layout from "@/components/layout";
import SignUp from "@/features/auth/components/SignUp";
import AuthPage from "@/features/auth/components/AuthPage";
import SignIn from "@/features/auth/components/SignIn";
import AllTicketView from "@/pages/AllTicketView";
import AllTicketsNearYou from "@/pages/AllTicketsNearYou";
import AllGiftView from "@/pages/AllGiftView";
import TicketView from "@/pages/TicketView";
import ClaimTicketView from "@/pages/ClaimTicketView";
import ConfirmAddress from "@/features/auth/components/ConfirmAddress";
import RecipientGifts from "@/pages/Gifts";
import RecipientTickets from "@/pages/Tickets";
import RecipientProfile from "@/pages/Profile";
import RestaurantProfilePage from "@/pages/RestaurantProfilePage";
import RestaurantRatingsPage from "@/pages/RestaurantRatingsPage";
import MealDetailsPage from "@/pages/MealDetailsPage";
import CheckoutDetails from "@/pages/CheckoutDetails";
import Success from "@/components/Success";

// ====== for all business categories =======
import ViewAllRestaurant from "@/pages/ViewAllRestaurant";
import ViewAllGroceries from "@/pages/ViewAllGroceries";
import ViewAllFrozenFoods from "@/pages/ViewAllFrozenFoods";
import ViewAllWineDrinks from "@/pages/ViewAllWineDrinks";

import ViewAllPublicTickets from "@/pages/ViewAllPublicTickets";
import BookingDetailView from "@/pages/BookingDetailView";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderPage from "@/pages/OrderPage";
import HeaderPageLayout from "@/components/HeaderPageLayout";
import Auth from "@/features/auth/components/Auth";
import Receipt from "@/pages/Receipt";
import useAuthStore from "@/store/authStore";
import EmailVerification from "@/features/auth/components/EmailVerification";
import CreateNewPassword from "@/features/auth/components/forgetPassword/CreateNewPassword";
import ForgetPassword from "@/features/auth/components/forgetPassword/ForgetPassword";
import GiftedBanner from "@/components/GiftedBanner";
import Map from "@/pages/Map";
import AuthRedirect from "@/components/AuthRedirect";
import Notification from "@/pages/Notification";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import AboutUs from "@/pages/AboutUs";
import Reel from "@/pages/Reel";
import ReelView from "@/pages/ReelView";
import PostDetail from "@/pages/PostDetail";
import VerifyPayment from "@/pages/VerifyPayment";
import NotFound from "@/pages/NotFound";
import GiftRequestHandler from "@/components/GiftRequestHandler"; // Add this import

// ===== for friend request ====
// import FriendRequestRedirect from "@/components/FriendRequestRedirect";

// Wrapper component to conditionally show header based on authentication
const PostDetailWrapper = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout showDefaultHeader={isAuthenticated}>
      <PostDetail />
    </Layout>
  );
};

// A small component to handle the nested auth routes
const AuthRoutes = () =>
  useRoutes([
    { path: "/", element: <AuthPage /> },
    { path: "signup", element: <SignUp /> },
    { path: "login", element: <SignIn /> },
    { path: "confirm-address", element: <ConfirmAddress /> },
    { path: "forget-password", element: <ForgetPassword /> },
    { path: "create-new-password", element: <CreateNewPassword /> },
  ]);

/**
 * Route configuration for the entire application.
 * This object-based format is required for server-side rendering with React Router.
 */
export const routes: RouteObject[] = [
  // --- Public & Auth Routes ---
  { path: "/", element: <Auth /> },
  { path: "/auth/email-verification", element: <EmailVerification /> },
  { path: "/terms-of-service", element: <TermsOfService /> },
  { path: "/privacy-policy", element: <PrivacyPolicy /> },
  { path: "/about-us", element: <AboutUs /> },
  {
    path: "/auth/*",
    element: (
      <AuthRedirect>
        <AuthRoutes />
      </AuthRedirect>
    ),
  },
  // --- Public Content Routes (for SEO) ---
  { path: "/post/:postId", element: <PostDetailWrapper /> },
  { path: "/p/:postId", element: <PostDetailWrapper /> }, // Alternative short-link
  { path: "/reel/:reelId", element: <ReelView /> },
  // ====== Friend Request Route =======
  // { 
  //   path: "/friend-request", 
  //   element: <FriendRequestRedirect /> 
  // },
  // ====== Gift Request Route ======= (ADD THIS NEW ROUTE)

  {
    path: "/gifting/requests/r/:requestId",
    element: <GiftRequestHandler />
  },

  // --- Protected Routes (Main App) ---
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <Layout>
          <HomePage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/home/:tab",
    element: (
      <ProtectedRoute>
        <Layout>
          <HomePage />
        </Layout>
      </ProtectedRoute>
    ),
  },

  // ====== for all the different categories =======
  {
    path: "/restaurants/:restaurantId/meals/:mealId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Meal Details" headerType="meal">
          <MealDetailsPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/groceries/:restaurantId/items/:mealId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Item Details" headerType="meal">
          <MealDetailsPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/frozen-foods/:restaurantId/items/:mealId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Item Details" headerType="meal">
          <MealDetailsPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/wine-drinks/:restaurantId/items/:mealId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Item Details" headerType="meal">
          <MealDetailsPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/bookings/gifts",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="My Gift">
          <AllGiftView />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/view-all",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="My Tickets">
          <AllTicketView />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/near-you",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="All Tickets Near You" headerType="simple">
          <AllTicketsNearYou />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/gifts",
    element: (
      <ProtectedRoute>
        <Layout>
          <RecipientGifts />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets",
    element: (
      <ProtectedRoute>
        <Layout>
          <RecipientTickets />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/receivedTicket",
    element: (
      <ProtectedRoute>
        <Layout>
          <GiftedBanner />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/viewdetails/:ticketId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Ticket Details" headerType="simple">
          <TicketView />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/claim/:ticketId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="ticket" headerType="simple">
          <ClaimTicketView />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Profile" headerType="profile">
          <RecipientProfile />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },

  // ======for all BUSINESS CATEGORIES =======
  {
    path: "/restaurants/:restaurantId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Restaurant Profile" headerType="restaurant">
          <RestaurantProfilePage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/groceries/:restaurantId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Grocery Store Profile" headerType="restaurant">
          <RestaurantProfilePage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/frozen-foods/:restaurantId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Frozen Foods Store Profile" headerType="restaurant">
          <RestaurantProfilePage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/wine-drinks/:restaurantId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Wine & Drinks Store Profile" headerType="restaurant">
          <RestaurantProfilePage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },


  // ======== for RESTAURANT RATINGS (will circle back to this) ========
  {
    path: "/restaurants/:restaurantId/ratings",
    element: (
      <ProtectedRoute>
        <RestaurantRatingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/groceries/:restaurantId/ratings",
    element: (
      <ProtectedRoute>
        <RestaurantRatingsPage />
      </ProtectedRoute>
    ),
  },{
    path: "/frozen-foods/:restaurantId/ratings",
    element: (
      <ProtectedRoute>
        <RestaurantRatingsPage />
      </ProtectedRoute>
    ),
  },{
    path: "/wine-drinks/:restaurantId/ratings",
    element: (
      <ProtectedRoute>
        <RestaurantRatingsPage />
      </ProtectedRoute>
    ),
  },
  // ======= for all business categories =======
  {
    path: "/restaurants/view-all",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="View All Restaurants" headerType="simple">
          <ViewAllRestaurant />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/groceries/view-all",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="View All Groceries" headerType="simple">
          <ViewAllGroceries />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/frozen-foods/view-all",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="View All Frozen Foods" headerType="simple">
          <ViewAllFrozenFoods />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/wine-drinks/view-all",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="View All Wine & Drinks" headerType="simple">
          <ViewAllWineDrinks />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/public/view-all",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="View All Public Tickets" headerType="simple">
          <ViewAllPublicTickets />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/restaurants/:businessId/orders",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Order Page" headerType="simple">
          <OrderPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/groceries/:businessId/orders",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Order Page" headerType="simple">
          <OrderPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/frozen-foods/:businessId/orders",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Order Page" headerType="simple">
          <OrderPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/wine-drinks/:businessId/orders",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Order Page" headerType="simple">
          <OrderPage />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/bookings/:bookingId",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Booking Details" headerType="simple">
          <BookingDetailView />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/checkout",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Checkout" headerType="simple">
          <CheckoutDetails />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/payment-success",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Payment Successful" headerType="simple">
          <Success />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  { path: "/users/verify-payment", element: <VerifyPayment /> },
  {
    path: "/receipt/:id",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Receipt" headerType="simple">
          <Receipt />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/map",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Map" headerType="simple">
          <Map />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Notification" headerType="simple">
          <Notification />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reels",
    element: (
      <ProtectedRoute>
        <HeaderPageLayout title="Reels" headerType="simple">
          <Reel />
        </HeaderPageLayout>
      </ProtectedRoute>
    ),
  },
  // --- Catch-all Route ---
  {
    path: "*",
    element: <NotFound />,
  },
];

/**
 * The main AppRoutes component that renders the appropriate routes.
 * It uses the `useRoutes` hook with the shared `routes` configuration.
 */
const AppRoutes = () => {
  return useRoutes(routes);
};

export default AppRoutes;
