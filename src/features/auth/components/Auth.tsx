import React from "react";
import BrandTitle from "@/components/BrandTitle";
import Button from "@/components/Button";
import splash_image from "@/assets/images/splashScreenImage.jpg";
import splash from "@/assets/images/splash-2.jpg";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { useAuth } from "@/features/auth/hooks";

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoggingOut } = useAuthStore();
  const { isInitialized, isLoading } = useAuth();
  const restaurant_url = import.meta.env.VITE_APP_RESTAURANT;

  React.useEffect(() => {
    // Only redirect after auth has been initialized
    if (isInitialized && isAuthenticated && user && !isLoggingOut) {
      // For iOS PWA, add a small delay to ensure loading fallback is hidden first
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       'standalone' in navigator && 
                       (navigator as unknown as { standalone?: boolean }).standalone === true;
      
      if (isIOSPWA) {
        // Small delay for iOS PWA to prevent white screen
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 100);
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoggingOut, navigate, isInitialized]);

  // Show loading spinner while auth is being initialized or during authenticated redirect
  if (!isInitialized || isLoading || (isAuthenticated && user && !isLoggingOut)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
          <p className="text-gray-600">
            {!isInitialized ? "Initializing..." : 
             isAuthenticated ? "Redirecting to home..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden flex flex-col h-screen md:flex-row md:items-center">
      {/* Content Container */}
      <div className="flex flex-col mx-6 z-10 md:mx-auto md:w-1/2 md:max-w-md md:px-0">
        <BrandTitle
          title="BoookBox"
          description="order, gift, redeem meal tickets and more around the world"
          className="text-center mb-12 mt-[4rem] md:mt-0 flex flex-col items-center justify-center"
          titleClassName="text-6xl font-bold font-inter mx-auto text-primary"
          descriptionClassName="text-lg text-black font-mf"
          brandImg={true}
        />
        <div className="flex flex-col gap-4 md:gap-6">
          <Button
            className="bg-primary h-[3.15rem] md:h-14 rounded-xl transition-colors hover:bg-primary/90"
            handleClick={() => navigate("/auth")}
          >
            <span className="text-white p-2 md:text-lg">
              Continue as a User
            </span>
          </Button>
          <Link
            className="bg-secondary h-[3.15rem] md:h-14 rounded-xl transition-colors hover:bg-secondary-dark flex items-center justify-center"
            to={`${restaurant_url}`}
          >
            <span className="text-white p-2 md:text-lg start-center">
              Continue as a Business
            </span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex md:w-1/2 md:h-screen md:items-center md:justify-center">
        {/* Use safer image loading approach */}
        <picture>
          <source media="(min-width: 768px)" srcSet={splash} />
          <img
            src={splash_image}
            alt="BoookBox Illustration"
            decoding="async"
            className="object-contain mt-[-8rem] z-auto md:hidden"
            style={{
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: 'auto'
            }}
            onError={(e) => {
              console.warn('Image failed to load:', e);
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img
            src={splash}
            alt="BoookBox Desktop Illustration"
            decoding="async"
            className="md:w-full md:p-8 object-contain md:mt-auto z-auto md:block hidden"
            style={{
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: 'auto'
            }}
            onError={(e) => {
              console.warn('Desktop image failed to load:', e);
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </picture>
      </div>
    </section>
  );
};

export default Auth;
