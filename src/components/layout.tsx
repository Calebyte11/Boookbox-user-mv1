import {type ReactNode,type FC, lazy, Suspense} from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Navigation from "./Navigation";
import EmailVerificationPopup from "./EmailVerificationPopup";
import useAuthStore from "@/store/authStore";
import Footer from "@/components/Footer"
import { ClientOnly } from "./ClientOnly";

const AutoPushNotification = lazy(() => import("./AutoPushNotification"));

interface LayoutProps {
  children: ReactNode;
  customHeader?: ReactNode;
  showDefaultHeader?: boolean;
}

const Layout: FC<LayoutProps> = ({
  children,
  customHeader,
  showDefaultHeader = true,
}) => {
  const { user } = useAuthStore();
  const location = useLocation();
  // Hide mobile nav on /gifts and /tickets and their subroutes
  const hideMobileHeader =
    location.pathname.startsWith("/gifts") ||
    location.pathname.startsWith("/tickets/") || // hides for /tickets/* subroutes only
    location.pathname.startsWith("/posts") ||
    location.pathname.startsWith("/recipt") ||
    location.pathname.startsWith("/receivedTicket") ||
    location.pathname.startsWith("/map");
  const hideMobileNav =
    location.pathname.startsWith("/notification") ||
    location.pathname.startsWith("/receivedTicket") ||
    location.pathname.startsWith("/map");

    

  const CheckHeader = () => (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      {!hideMobileHeader && (showDefaultHeader || customHeader) && (
        <div>
          {/* Mobile Header: Show customHeader if provided, otherwise show default Header if showDefaultHeader is true */}
          <div className="md:hidden">
            {customHeader ? (
              <div className="md:px-4 md:pt-4">{customHeader}</div>
            ) : showDefaultHeader ? (
              <Header />
            ) : null}
          </div>
        </div>
      )}
      {/* Desktop Header: Show default Header if showDefaultHeader is true */}
      <div className="hidden md:block">
        {showDefaultHeader ? <Header /> : null}
      </div>
    </header>
  );

  return (
    <div className="flex flex-col min-h-screen font-roboto">
      
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <AutoPushNotification />
        </Suspense>
      </ClientOnly>
      <CheckHeader />
      {/* Main content area with responsive padding */}
      <main
        className={`
          bg-gray-50
          flex-grow 
          md:px-4 px-0 pb-24 
          md:pb-4 md:pl-64 md:pr-4 
          ${showDefaultHeader || customHeader ? "pt-0" : "pt-8"}
          mx-auto w-full max-w-7xl
          ${
            location.pathname.startsWith("/map")
              ? "h-screen !p-0"
              : "min-h-screen"
          }`}
      >
        {children}
       
        {!hideMobileNav && (
          <Footer/>
        )}
        
      </main>
      {/* Mobile Navigation - fixed at bottom */}
      {!hideMobileNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
          <Navigation />
        </div>
      )}{" "}
      {/* Desktop Navigation - fixed sidebar */}
      <div className="hidden md:block fixed left-0 top-0 z-30 h-full pt-16">
        <Navigation />
      </div>
      {/* Email Verification Popup - shows after 2 minutes for unverified users */}
      {!user?.isVerified && <EmailVerificationPopup />}
    </div>
  );
};

export default Layout;