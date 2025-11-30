import React, { useState, useEffect, lazy, Suspense } from "react";
import BrandTitle from "@/components/BrandTitle";
import Google from "@/assets/svg/google.svg";
import Facebook from "@/assets/svg/facebook.svg";
import FormField from "@/components/FormField";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "@/features/auth/hooks";
import { setRememberMe } from "@/utils/storageUtils";
import * as yup from "yup";
import { useToast } from "@/hooks/useToast";
import useAuthStore from "@/store/authStore";
import { usersService } from "@/services/usersService";
import { getEnvironmentInfo } from "@/utils/environmentInfo";
import Footer from "@/components/Footer";
import path from "path";

// Lazy load heavy dependencies
const FacebookLogin = lazy(() => import("@greatsumini/react-facebook-login"));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FacebookLoginResponse = any;
type User = {
  id: string;
  username: string;
  email: string;
  role: "user" | "organization";
  photoURL: string;
  isVerified: boolean;
  token: string;
  tokenExpiry: number;
  phoneNumber: string;
};

// Enhanced iOS PWA detection with more safety checks
const isIOSPWA = () => {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    // More comprehensive iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches ||
                        ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
    
    return isIOS && isStandalone;
  } catch (error) {
    console.warn('iOS PWA detection failed:', error);
    return false;
  }
};

// Enhanced safe navigation with better error handling
const createSafeNavigate = (navigate: (path: string) => void) => {
  console.log(path);
  
  return (path: string) => {
    try {
      if (isIOSPWA()) {
        // For iOS PWA, use setTimeout to avoid timing issues
        setTimeout(() => {
          try {
            window.location.href = path;
          } catch (locationError) {
            console.error('iOS navigation failed:', locationError);
            // Fallback to React Router
            navigate(path);
          }
        }, 50);
      } else {
        navigate(path);
      }
    } catch (navError) {
      console.error('Navigation failed:', navError);
      // Last resort fallback
      try {
        window.location.href = path;
      } catch (fallbackError) {
        console.error('All navigation methods failed:', fallbackError);
      }
    }
  };
};

const schema = yup.object().shape({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
  rememberMe: yup.boolean().default(false),
});

interface SignInFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Enhanced error boundary with iOS-specific handling
class IOSAuthErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { hasError: boolean; errorInfo?: string }
> {
  state = { hasError: false, errorInfo: undefined };
  
  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true, 
      errorInfo: error.message 
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('iOS Auth Error:', error, errorInfo);
    
    // iOS-specific error reporting
    if (isIOSPWA()) {
      console.warn('iOS PWA Error Details:', {
        userAgent: navigator.userAgent,
        standalone: ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone),
        displayMode: window.matchMedia?.('(display-mode: standalone)')?.matches,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Unable to load page
            </h2>
            <p className="text-gray-600 mb-6">
              {isIOSPWA() 
                ? "There was an issue loading the authentication page on iOS. Please try refreshing."
                : "Something went wrong while loading the page."
              }
            </p>
            {this.state.errorInfo && (
              <p className="text-sm text-gray-500 mb-4">
                Error: {this.state.errorInfo}
              </p>
            )}
            <div className="space-y-3">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, errorInfo: undefined });
                  window.location.reload();
                }}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Reload Page
              </button>
              {isIOSPWA() && (
                <button 
                  onClick={() => {
                    try {
                      window.location.href = '/auth/signin';
                    } catch {
                      window.location.reload();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Go to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Enhanced component initialization hook
const useIOSPWAInit = () => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initializeComponent = async () => {
      try {
        // Longer delay for iOS PWA to ensure everything is loaded
        const initDelay = isIOSPWA() ? 2000 : 300;
        
        await new Promise(resolve => setTimeout(resolve, initDelay));
        
        if (isIOSPWA()) {
          // iOS PWA specific setup
          try {
            // Fix viewport height issues
            const setVh = () => {
              if (document?.documentElement?.style && window.innerHeight) {
                document.documentElement.style.setProperty(
                  '--vh',
                  `${window.innerHeight * 0.01}px`
                );
              }
            };
            
            setVh();
            
            // Add resize listener with debouncing
            let resizeTimeout: NodeJS.Timeout;
            const debouncedResize = () => {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(setVh, 100);
            };
            
            window.addEventListener('resize', debouncedResize, { passive: true });
            window.addEventListener('orientationchange', debouncedResize, { passive: true });
            
            cleanup = () => {
              clearTimeout(resizeTimeout);
              window.removeEventListener('resize', debouncedResize);
              window.removeEventListener('orientationchange', debouncedResize);
            };
            
            // Prevent iOS scroll bounce
            document.body.style.overscrollBehavior = 'none';
            
            // Fix iOS 100vh issues
            document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
            
          } catch (iosError) {
            console.warn('iOS PWA setup failed:', iosError);
            // Don't throw, just log the warning
          }
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('Component initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Initialization failed');
        // Still set ready to true to show the component
        setIsReady(true);
      }
    };

    initializeComponent();
    
    return cleanup;
  }, []);

  return { isReady, initError };
};

// Enhanced Google Button with better error handling
const SafeGoogleButton: React.FC<{
  onClick: () => void;
  loading: boolean;
  buttonText: string;
}> = ({ onClick, loading, buttonText }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      try {
        setIsLoaded(true);
      } catch (error) {
        console.error('Google button load error:', error);
        setLoadError(true);
        setIsLoaded(true); // Show button anyway
      }
    }, isIOSPWA() ? 2000 : 800);

    return () => clearTimeout(loadTimer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="bg-gray-200 h-[4rem] md:h-14 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading Google...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-gray-200 h-[4rem] md:h-14 rounded-xl flex items-center justify-center">
        <span className="text-gray-500 text-sm">Google login unavailable</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="bg-[#4286F8] h-[4rem] md:h-14 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 w-full"
      onClick={() => {
        try {
          onClick();
        } catch (error) {
          console.error('Google button click error:', error);
        }
      }}
      disabled={loading}
    >
      <img src={Google} alt="google-logo" className="w-6 h-6" />
      <span className="text-white font-semibold text-base md:text-lg ml-3">
        {loading ? "Please wait..." : buttonText}
      </span>
    </button>
  );
};

// Enhanced async operation wrapper
const withIOSErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      
      if (isIOSPWA()) {
        console.warn(`iOS PWA ${operationName} error:`, {
          error: error instanceof Error ? error.message : String(error),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  };
};

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const safeNavigate = createSafeNavigate(navigate);
  const { signInWithEmail, signInWithGoogle, isLoading, error, isInitialized } = useAuth();
  const { isReady, initError } = useIOSPWAInit();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMeValue = watch("rememberMe");

  // Enhanced form submission with better error handling
// Replace your redirectAfterAuth function with this diagnostic version:

const redirectAfterAuth = () => {
  console.log("====== REDIRECT DEBUG START ======");
  
  const navDelay = isIOSPWA() ? 200 : 50;
  const state = location.state as { from?: string } | undefined;

  let target = "/home";

  console.log("📍 location.pathname:", location.pathname);
  console.log("📍 location.search:", location.search);
  console.log("📍 location.state:", state);

  if (state?.from && typeof state.from === "string" && state.from.trim()) {
    target = state.from;
    console.log("✅ Using location.state.from:", target);
  } else {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");

    console.log("🔍 next parameter:", next);

    if (next) {
      try {
        const decoded = decodeURIComponent(next);
        console.log("✅ Decoded next:", decoded);

        // Check if it's a full URL
        try {
          const url = new URL(decoded);
          console.log("🌐 Detected full URL:", url.href);

          // Use window.location for full URLs
          setTimeout(() => {
            console.log("🚀 [FULL URL] Navigating via window.location to:", url.href);
            window.location.href = url.href;
          }, navDelay);
          return; // Exit early
        } catch {
          // Not a valid full URL → treat as internal path
          target = decoded;
          console.log("🔗 Treating as internal path:", target);
        }
      } catch (decodeError) {
        console.warn("⚠️ Failed to decode next param:", decodeError);
        target = next;
      }
    } else {
      console.log("❌ No 'next' parameter found - defaulting to:", target);
    }
  }

  console.log("🎯 FINAL TARGET (internal):", target);
  console.log("⏱️ Will navigate in", navDelay, "ms");

  setTimeout(() => {
    console.log("🚀 [INTERNAL] Navigating to:", target);
    safeNavigate(target);
  }, navDelay);
};
// Replace your onSubmit function with this diagnostic version:

const onSubmit = withIOSErrorHandling(async (data: SignInFormData) => {
  if (!isInitialized) {
    console.log("⚠️ Not initialized, skipping submit");
    return;
  }

  console.log("🔵 ===== SUBMIT START =====");
  console.log("📧 Email:", data.email);
  console.log("🔐 RememberMe:", data.rememberMe);
  console.log("📍 Current location before auth:", {
    pathname: location.pathname,
    search: location.search,
  });

  setIsSubmitting(true);
  
  try {
    if (typeof setRememberMe === 'function') {
      setRememberMe(data.rememberMe);
    }

    console.log("🔄 Calling signInWithEmail...");
    const beforePath = window.location.pathname;
    
    await signInWithEmail(data.email.toLowerCase(), data.password, data.rememberMe);
    
    const afterPath = window.location.pathname;
    console.log("✅ signInWithEmail completed");
    console.log("📍 Path before auth:", beforePath);
    console.log("📍 Path after auth:", afterPath);
    
    if (beforePath !== afterPath) {
      console.log("🚨 WARNING: signInWithEmail changed the path!");
      console.log("🚨 This is why your redirect doesn't work!");
      console.log("🚨 Check your useAuth hook for navigate() calls");
    }

    if (typeof toast === 'function') {
      toast({
        title: "Success",
        description: "Signed in successfully!",
        variant: "success",
      });
    }

    console.log("🚀 Calling redirectAfterAuth...");
    redirectAfterAuth();
    
  } catch (err) {
    console.error("❌ Sign in failed:", err);
    
    if (typeof toast === 'function') {
      toast({
        title: "Sign In Failed",
        description: err instanceof Error ? err.message : "Sign in failed. Please try again.",
        variant: "error",
      });
    }
  } finally {
    setIsSubmitting(false);
    console.log("🔵 ===== SUBMIT END =====");
  }
}, "Sign In");

// DO THE SAME FOR handleGoogleSignIn:

const handleGoogleSignIn = withIOSErrorHandling(async () => {
  if (isGoogleLoading || isLoading || !isInitialized) return;

  console.log("🔵 ===== GOOGLE SIGN IN START =====");
  console.log("📍 Current location:", {
    pathname: location.pathname,
    search: location.search,
  });

  setIsGoogleLoading(true);
  
  try {
    if (!signInWithGoogle || typeof signInWithGoogle !== 'function') {
      throw new Error("Google authentication not available");
    }
    
    if (typeof setRememberMe === 'function') {
      setRememberMe(rememberMeValue);
    }

    console.log("🔄 Calling signInWithGoogle...");
    const beforePath = window.location.pathname;

    await signInWithGoogle(rememberMeValue);
    
    const afterPath = window.location.pathname;
    console.log("✅ signInWithGoogle completed");
    console.log("📍 Path before auth:", beforePath);
    console.log("📍 Path after auth:", afterPath);
    
    if (beforePath !== afterPath) {
      console.log("🚨 WARNING: signInWithGoogle changed the path!");
      console.log("🚨 Check your useAuth hook for navigate() calls");
    }
    
    if (typeof toast === 'function') {
      toast({
        title: "Success",
        description: "Signed in with Google successfully!",
        variant: "success",
      });
    }
    
    console.log("🚀 Calling redirectAfterAuth...");
    redirectAfterAuth();
    
  } catch (err) {
    console.error("❌ Google sign in failed:", err);
    
    if (typeof toast === 'function') {
      toast({
        title: "Google Sign In Failed",
        description: err instanceof Error ? err.message : "Google sign in failed. Please try again.",
        variant: "error",
      });
    }
  } finally {
    setIsGoogleLoading(false);
    console.log("🔵 ===== GOOGLE SIGN IN END =====");
  }
}, "Google Sign In");
  const handleFacebook = async (res: FacebookLoginResponse) => {
    if (!isInitialized) {
      console.warn("Facebook login attempted before auth initialization");
      return;
    }

    try {
      // Enhanced validation of Facebook response
      if (!res || typeof res !== 'object') {
        throw new Error("Invalid Facebook response");
      }

      if (!res.accessToken || typeof res.accessToken !== 'string') {
        throw new Error("No access token received from Facebook");
      }

      setIsFacebookLoading(true);
      
      // Check if required services are available
      if (!getEnvironmentInfo || typeof getEnvironmentInfo !== 'function') {
        throw new Error("Environment service not available");
      }

      if (!usersService?.facebookAuth || typeof usersService.facebookAuth !== 'function') {
        throw new Error("Facebook authentication service not available");
      }

      const envInfo = await getEnvironmentInfo();
      const fbUser = await usersService.facebookAuth({
        credential: res.accessToken,
        environmentInfo: envInfo,
        rememberMe: rememberMeValue, // Add rememberMe here
      });

      if (!fbUser?.token || !fbUser?.user) {
        throw new Error("Facebook authentication failed - invalid response");
      }

      // Safely construct user object with fallbacks
      const user: User = {
        id: fbUser.user._id || '',
        username: fbUser.user.fullName || "User",
        email: fbUser.user.email || '',
        role: (fbUser.user.accountType as "user" | "organization") || "user",
        photoURL: fbUser.user.profileImage || "",
        isVerified: fbUser.user.isVerified ?? false,
        token: fbUser.token,
        tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
        phoneNumber: fbUser.user.phoneNumber || ""
      };

      // Validate required user fields
      if (!user.email || !user.token) {
        throw new Error("Facebook authentication failed - missing required user data");
      }

      toast({
        title: "Success",
        description: "Signed in with Facebook successfully!",
        variant: "success",
      });
      
      login(user);
      redirectAfterAuth();
    } catch (error) {
      console.error("Facebook auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during Facebook sign in";
      
      toast({
        title: "Facebook Sign In Failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsFacebookLoading(false);
    }
  };

  // Show loading state with error info if available - wait for both component and auth initialization
  if (!isReady || !isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600 text-center">
          {!isInitialized ? "Initializing authentication..." :
           isIOSPWA() ? "Loading iOS app..." : "Loading..."}
        </p>
        {initError && (
          <p className="text-red-500 text-sm mt-2 text-center">
            {initError}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col min-h-screen md:flex-row overflow-hidden">
      {/* Left side - Brand and social login */}
      <div className="md:flex md:w-1/2 md:min-h-screen md:bg-[#f8f6f9] md:items-center md:justify-center">
        <div className="flex flex-col mx-6 z-10 md:mx-auto md:max-w-md md:w-full">
          <BrandTitle
            title="BoookBox"
            description="order, gift, redeem meal tickets and more around the world"
            className="text-center mb-12 mt-[4rem] md:mt-0 flex flex-col items-center justify-center"
            titleClassName="text-6xl font-bold font-inter mx-auto text-primary"
            descriptionClassName="text-lg text-black font-mf"
            brandImg={true}
          />

          <div className="flex flex-col gap-4 md:gap-6">
            <SafeGoogleButton 
              onClick={handleGoogleSignIn} 
              loading={isGoogleLoading || isLoading || !isInitialized} 
              buttonText={!isInitialized ? "Initializing..." : "Continue with Google"}
            />
            
            <Suspense 
              fallback={
                <div className="bg-gray-200 h-[4rem] md:h-14 rounded-xl animate-pulse flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Loading Facebook...</span>
                </div>
              }
            >
              <FacebookLogin
                appId="572654712555502"
                onSuccess={handleFacebook}
                render={({ onClick }) => (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isInitialized) {
                        console.warn("Facebook login attempted before initialization");
                        return;
                      }
                      try {
                        onClick?.();
                      } catch (error) {
                        console.error('Facebook button error:', error);
                        toast({
                          title: "Facebook Login Failed",
                          description: "Could not connect to Facebook",
                          variant: "error",
                        });
                      }
                    }}
                    disabled={isFacebookLoading || !isInitialized}
                    className="flex items-center justify-center bg-white h-[4rem] md:h-14 rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50 w-full shadow-sm"
                  >
                    <img src={Facebook} alt="facebook-logo" />
                    <p className="text-black font-medium text-base md:text-lg ml-3">
                      {!isInitialized ? "Initializing..." :
                       isFacebookLoading ? "Signing in..." : "Continue with Facebook"}
                    </p>
                  </button>
                )}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="mt-12 mx-6 flex-col flex md:mt-0 md:mx-auto md:w-1/2 md:max-w-md md:px-8 md:justify-center">
        <h2 className="text-2xl font-bold text-primary mb-8 hidden md:block font-inter">
          Welcome back
        </h2>

        {(errors.root || (error && !isSubmitting)) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {errors.root?.message || error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="md:w-full">
          <FormField
            name="email"
            type="email"
            register={register}
            errors={errors}
            placeholder="Email Address"
            inputClassName="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
          />
          <FormField
            name="password"
            type="password"
            register={register}
            errors={errors}
            placeholder="Password"
            inputClassName="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
            show={true}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                {...register("rememberMe")}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Keep me logged in
              </label>
            </div>
            <div className="text-sm">
              <Link to="/auth/forget-password" className="font-medium text-primary hover:text-primary/90">
                Forgot your password?
              </Link>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !isInitialized}
            className="bg-primary h-14 rounded-lg flex items-center justify-center mt-6 w-full hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center text-white">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing In...
              </div>
            ) : !isInitialized ? (
              <span className="text-center text-white font-medium text-lg">
                Initializing...
              </span>
            ) : (
              <span className="text-center text-white font-medium text-lg">
                Sign In
              </span>
            )}
          </button>
          
          {/* <div className="text-center mt-4">
            <span className="text-gray-600 text-sm">
              Don't have an account?{" "}
            </span>
            <Link to="/auth/signup" className="text-primary font-medium hover:text-primary/90 hover:underline ">
              Sign up
            </Link>
          </div> */}
          <div className="text-center mt-4">
  <span className="text-gray-600 text-sm">
    Don't have an account?{" "}
  </span>
  <Link 
    to={`/auth/signup${location.search}`}  // Pass the search params (including 'next')
    className="text-primary font-medium hover:text-primary/90 hover:underline "
  >
    Sign up
  </Link>
</div>
          
          <Footer/>
        </form>
      </div>
    </section>
  );
};

export default function SafeSignIn() {
  return (
    <IOSAuthErrorBoundary>
      <SignIn />
    </IOSAuthErrorBoundary>
  );
}