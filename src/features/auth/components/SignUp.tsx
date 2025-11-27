/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, lazy, Suspense } from "react";
import BrandTitle from "@/components/BrandTitle";
import Button from "@/components/Button";
import Google from "@/assets/svg/google.svg";
import Facebook from "@/assets/svg/facebook.svg";
import FormField from "@/components/FormField";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import Title from "@/features/auth/components/Title";
import { useAuth } from "@/features/auth/hooks";
import { registerUser } from "@/features/auth/services/userAuthApi";
import SplashImage from "@/assets/images/splash-2.jpg";
import LocationIcon from "@/assets/svg/location_searching.svg";
import LocationOn from "@/assets/svg/location_on.svg";
import { convertDateStringToBirthday } from "@/utils/birthdayUtils";
import useAuthStore from "@/store/authStore";
import { useResendVerificationMutation } from "@/features/auth/hooks/useEmailVerification";
import { useLocationService } from "@/hooks/useLocationService";
import { useToast } from "@/hooks/useToast";
import { usersService } from "@/services/usersService";
import type { User } from "@/types/auth";
import type { LoginUserResponse } from "../services/userAuthApi";
import { getEnvironmentInfo } from "@/utils/environmentInfo";
import Footer from "@/components/Footer";
import OrganizationCategoryDropdown from "@/components/OrganizationCategoryDropdown";
import { Text } from "@radix-ui/themes";

// Lazy load heavy dependencies
const FacebookLogin = lazy(() => import("@greatsumini/react-facebook-login"));

// iOS PWA detection utility with safety checks
const isIOSPWA = () => {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    
    return isIOS && isStandalone;
  } catch (error) {
    console.warn('iOS PWA detection failed:', error);
    return false;
  }
};

interface SignUpFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  accountType: "user" | "organization";
  organizationName?: string;
  category: string;
  contactEmail?: string;
  dateOfBirth: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  gender?: string; // added gender
  referralCode?: string;
}

interface PasswordRequirementProps {
  text: string;
  isMet: boolean;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({
  text,
  isMet,
}) => (
  <li className="flex items-center justify-between space-x-2">
    <p className={`text-sm ${isMet ? "text-primary" : "text-gray-500"}`}>
      {text}
    </p>
    {isMet && (
      <span className="w-4 h-4 rounded border-2 border-primary bg-primary flex items-center justify-center">
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    )}
  </li>
);

const getFieldsForStep = (step: number): (keyof SignUpFormData)[] => {
  switch (step) {
    case 1: return ["email"];
    case 2: return ["password"];
    case 3: return ["firstName", "lastName", "phoneNumber", "accountType", "organizationName", "contactEmail", "gender"];
    case 4: return ["dateOfBirth"];
    case 5: return ["address"];
    default: return [];
  }
};

class AuthErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error) {
    console.error('Auth Error:', error);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-primary text-white rounded"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const GoogleButton = ({ 
  onClick, 
  loading 
}: { 
  onClick: () => void; 
  loading: boolean 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, isIOSPWA() ? 1500 : 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="bg-gray-200 h-16 md:h-14 rounded-xl animate-pulse"></div>
    );
  }

  return (
    <Button
      className="bg-[#4286F8] h-16 md:h-14 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50"
      handleClick={onClick}
      disabled={loading}
    >
      <img src={Google} alt="google-logo" className="w-6 h-6" />
      <span className="text-white font-semibold text-base md:text-lg ml-3">
        {loading ? "Please wait..." : "Continue with Google"}
      </span>
    </Button>
  );
};

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, isLoading, error, isInitialized } = useAuth();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const resendVerificationMutation = useResendVerificationMutation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Safe navigation for iOS PWA
  const safeNavigate = (path: string) => {
    try {
      if (isIOSPWA()) {
        // Use location.href for iOS PWA for more reliable navigation
        window.location.href = path;
      } else {
        // Use React Router for normal web apps
        navigate(path);
      }
    } catch (navError) {
      console.error('Navigation failed:', navError);
      // Fallback to window.location as last resort
      try {
        window.location.href = path;
      } catch (fallbackNavError) {
        console.error('Fallback navigation failed:', fallbackNavError);
      }
    }
  };

  const {
    getCurrentLocation,
    addressParts,
    ipLocation,
    isLoading: isLocationServiceLoading,
  } = useLocationService({
    autoRequest: false,
  });

  // Initialize component with iOS PWA safeguards
  useEffect(() => {
    const initDelay = isIOSPWA() ? 1000 : 100;
    
    const timer = setTimeout(() => {
      try {
        // Set up viewport units for iOS with safety checks
        if (isIOSPWA() && typeof window !== 'undefined' && window.innerHeight) {
          const setVh = () => {
            try {
              if (document?.documentElement?.style) {
                document.documentElement.style.setProperty(
                  '--vh',
                  `${window.innerHeight * 0.01}px`
                );
              }
            } catch (vhError) {
              console.warn('Viewport height setup failed:', vhError);
            }
          };
          
          setVh();
          
          // Add resize listener with error handling
          const handleResize = () => {
            try {
              setVh();
            } catch (resizeError) {
              console.warn('Resize handler error:', resizeError);
            }
          };
          
          if (window.addEventListener) {
            window.addEventListener('resize', handleResize, { passive: true });
          }
          
          // Cleanup function
          return () => {
            if (window.removeEventListener) {
              window.removeEventListener('resize', handleResize);
            }
          };
        }
      
        setIsComponentReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        // Always show component even if initialization fails
        setIsComponentReady(true);
      }
    }, initDelay);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setError: setFormError,
    setValue,
  } = useForm<SignUpFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      accountType: "user",
      organizationName: "",
      category: "",
      contactEmail: "",
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      gender: "",
      referralCode: "",
    },
  });

  useEffect(() => {
    const referralCode = searchParams.get("referralCode");
    if (referralCode) {
      setValue("referralCode", referralCode);
    }
  }, [searchParams, setValue]);

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentStepValid = () => {
    const fieldsToCheck = getFieldsForStep(currentStep);
    const formValues = watch();

    return fieldsToCheck.every((field) => {
      const value = formValues[field];
      if (field === "accountType") {
        return value === "user" || value === "organization";
      }
      if (
        (field === "organizationName" || field === "contactEmail" || field === "category") &&
        formValues.accountType !== "organization"
      ) {
        return true;
      }
      if (
        (field === "organizationName" || field === "contactEmail") &&
        formValues.accountType === "organization"
      ) {
        return value && value.trim() !== "";
      }
      if (field === "phoneNumber") {
        return value && value.startsWith("+") && value.length >= 10;
      }
      return value && value.trim() !== "";
    });
  };

  const isValid = isCurrentStepValid();

  const onSubmit = async (data: SignUpFormData) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${data.firstName} ${data.lastName}`;
      const birthday = convertDateStringToBirthday(data.dateOfBirth);

      const payload = {
        fullName,
        email: data.email.toLowerCase(),
        password: data.password,
        accountType: data.accountType,
        organizationName: data.organizationName,
        category: data.category,
        contactEmail: data.contactEmail,
        birthday: birthday,
        phoneNumber: data.phoneNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        gender: data.gender,
        ...(data.referralCode && { referralCode: data.referralCode }),
      } as any;

      await registerUser(payload);

      try {
        await resendVerificationMutation.mutateAsync(data.email.toLowerCase());
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next');
        safeNavigate(next ? decodeURIComponent(next) : "/auth/email-verification");
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setFormError("root", {
        type: "manual",
        message: err instanceof Error ? err.message : "Sign up failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isInitialized) {
      // console.warn("Google signup attempted before auth initialization");
      return;
    }

    try {
      // Add safety check for Google auth function
      if (!signInWithGoogle || typeof signInWithGoogle !== 'function') {
        throw new Error("Google authentication not available");
      }
      
  await signInWithGoogle();
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  setTimeout(() => safeNavigate(next ? decodeURIComponent(next) : "/home"), 100);
    } catch (err) {
      console.error("Google sign up failed:", err);
      toast({
        title: "Google Sign Up Failed",
        description: err instanceof Error ? err.message : "Google sign up failed. Please try again.",
        variant: "error",
      });
    }
  };

  const handleFacebookSignUp = async (res: any) => {
    if (!isInitialized) {
      // console.warn("Facebook signup attempted before auth initialization");
      return;
    }

    setIsFacebookLoading(true);

    try {
      // Enhanced validation of Facebook response
      if (!res || typeof res !== 'object') {
        throw new Error("Invalid Facebook response");
      }

      if (!res.accessToken || typeof res.accessToken !== 'string') {
        throw new Error("No access token received from Facebook");
      }

      // Check if required services are available
      if (!getEnvironmentInfo || typeof getEnvironmentInfo !== 'function') {
        throw new Error("Environment service not available");
      }

      if (!usersService?.facebookAuth || typeof usersService.facebookAuth !== 'function') {
        throw new Error("Facebook authentication service not available");
      }

      const envInfo = await getEnvironmentInfo();
      const fbUser: LoginUserResponse = await usersService.facebookAuth({
        credential: res.accessToken,
        environmentInfo: envInfo,
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
        description: "Signed up with Facebook successfully!",
        variant: "success",
      });
      
  login(user);
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  setTimeout(() => safeNavigate(next ? decodeURIComponent(next) : "/home"), 100);
    } catch (error) {
      console.error("Facebook auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during Facebook sign up";
      
      toast({
        title: "Facebook Sign Up Failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError("");
    
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      // Wrap location service call in additional error handling
      try {
        await getCurrentLocation();
      } catch (locationServiceError) {
        console.warn('Location service failed, using fallback:', locationServiceError);
        // Don't throw here, let it fall through to use IP location
      }

      let locationData = null;
      
      // Try to use GPS location first
      if (addressParts?.city && addressParts?.state) {
        locationData = {
          city: addressParts.city,
          state: addressParts.state,
          country: addressParts.country || "Unknown",
          address: addressParts.formatted || `${addressParts.city}, ${addressParts.state}`,
        };
      } 
      // Fallback to IP location
      else if (ipLocation?.city && ipLocation?.state) {
        locationData = {
          city: ipLocation.city,
          state: ipLocation.state,
          country: ipLocation.country || "Unknown",
          address: `${ipLocation.city}, ${ipLocation.state}`,
        };
      }

      if (locationData) {
        // Safely set form values
        try {
          setValue("address", locationData.address);
          setValue("city", locationData.city);
          setValue("state", locationData.state);
          setValue("country", locationData.country);
        } catch (setValueError) {
          console.error('Failed to set form values:', setValueError);
          setLocationError("Failed to populate location fields");
        }
      } else {
        setLocationError("Unable to determine your location. Please enter manually.");
      }
    } catch (error) {
      console.error("Location detection failed:", error);
      
      // Try IP location as final fallback
      if (ipLocation?.city && ipLocation?.state) {
        try {
          setValue("address", `${ipLocation.city}, ${ipLocation.state}`);
          setValue("city", ipLocation.city);
          setValue("state", ipLocation.state);
          setValue("country", ipLocation.country || "Unknown");
        } catch (fallbackError) {
          console.error('Fallback location setting failed:', fallbackError);
          setLocationError("Location services unavailable. Please enter manually.");
        }
      } else {
        setLocationError("Unable to retrieve your location. Please enter manually.");
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return { title: "Create your Account", description: "Enter your Email Address" };
      case 2: return { title: "Create your Account", description: "Choose a Password" };
      case 3: return { title: "Personal Information", description: "Tell us about yourself" };
      case 4: return { title: "Date of Birth", description: "Can we know your Birthday?" };
      case 5: return { title: "Address Information", description: "Where are you Located?" };
      default: return { title: "Create your Account", description: "Enter your Email Address" };
    }
  };

  const renderStep = () => {
    const accountType = watch("accountType");
    const referralCode = watch("referralCode");

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              name="email"
              type="email"
              register={register}
              errors={errors}
              placeholder="Email Address"
              inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
            />
            {referralCode && (
              <>
              <Text>Referral Code</Text>
              <FormField
                name="referralCode"
                type="text"
                register={register}
                errors={errors}
                placeholder="Referral Code"
                inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full bg-gray-100"
                disabled={true}
              />
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <FormField
              name="password"
              type="password"
              show={true}
              register={register}
              errors={errors}
              placeholder="Password"
              inputClassName="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
            />
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <ul className="space-y-2">
                <PasswordRequirement
                  text="At least 8 characters"
                  isMet={watch("password")?.length >= 8}
                />
                <PasswordRequirement
                  text="At least one lowercase letter"
                  isMet={/[a-z]/.test(watch("password") || "")}
                />
                <PasswordRequirement
                  text="At least one uppercase letter"
                  isMet={/[A-Z]/.test(watch("password") || "")}
                />
                <PasswordRequirement
                  text="At least one number"
                  isMet={/[0-9]/.test(watch("password") || "")}
                />
                <PasswordRequirement
                  text="At least one special character"
                  isMet={/[^a-zA-Z0-9]/.test(watch("password") || "")}
                />
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-2">
            <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
              <FormField
                name="firstName"
                type="text"
                register={register}
                errors={errors}
                placeholder="First Name"
                inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
              />
              <FormField
                name="lastName"
                type="text"
                register={register}
                errors={errors}
                placeholder="Last Name"
                inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
              />
            </div>
            <FormField
              name="phoneNumber"
              type="tel"
              control={control}
              register={register}
              errors={errors}
              placeholder="Phone Number"
              inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
              className="mb-2"
            />
            {/* Gender select */}
            <div className="my-3">
              {/* <label className="text-sm font-medium text-gray-700 block mb-2">Gender</label> */}
              <select
                {...register('gender')}
                className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full bg-white"
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Account Type</p>
              <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    {["user", "organization"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`flex items-center gap-2 px-4 py-4 rounded-lg border transition-colors w-full
                          ${
                            field.value === type
                              ? "border-primary bg-primary/10 font-semibold text-primary"
                              : "border-gray-300 bg-white text-gray-700"
                          }
                        `}
                        onClick={() => field.onChange(type)}
                      >
                        <span className="capitalize">
                          {type === "user" ? "Individual User" : "Organization"}
                        </span>
                        <span
                          className={`w-5 h-5 flex items-center justify-center rounded-full border ${
                            field.value === type
                              ? "border-primary bg-primary"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {field.value === type && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.accountType && (
                <p className="text-red-500 text-sm">
                  {errors.accountType.message}
                </p>
              )}
            </div>
            {accountType === "organization" && (
              <div className="space-y-4 mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700">
                  Organization Details
                </h4>
                <FormField
                  name="organizationName"
                  type="text"
                  register={register}
                  errors={errors}
                  placeholder="Organization Name"
                  inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full bg-white"
                />
                <OrganizationCategoryDropdown
                  name="category"
                  control={control}
                  errors={errors}
                  placeholder="Select organization category"
                  label="Organization Category"
                />
                <FormField
                  name="contactEmail"
                  type="email"
                  register={register}
                  errors={errors}
                  placeholder="Contact Email"
                  inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full bg-white"
                />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <FormField
              name="dateOfBirth"
              type="date"
              register={register}
              errors={errors}
              placeholder="Date of Birth"
              inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
            />
            <p className="text-sm text-gray-600">
              You must be at least 13 years old to create an account.
            </p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <FormField
              name="address"
              type="text"
              register={register}
              errors={errors}
              placeholder="Street address or zip code"
              inputClassName="p-4 border-b border-gray-300 focus:outline-none focus:border-primary w-full"
              icon={<img src={LocationOn} alt="address icon" className="w-5 h-5" />}
              iconPosition="left"
            />
            <button
              type="button"
              className="h-14 w-full border-b border-gray-300 text-primary bg-white hover:bg-gray-50 transition-colors flex items-center gap-3"
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation || isLocationServiceLoading}
            >
              {isLoadingLocation || isLocationServiceLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-black"
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
              ) : (
                <div className="flex items-center gap-3">
                  <img src={LocationIcon} alt="location" className="w-5" />
                  <div>
                    <p className="font-normal text-black">
                      Use Current Location
                    </p>
                    <p className="text-[#CAC4D0] text-sm">
                      Find your current location
                    </p>
                  </div>
                </div>
              )}
            </button>
            {locationError && (
              <p className="text-red-500 text-sm">{locationError}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isComponentReady || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-600">
            {!isInitialized ? "Initializing authentication..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Left side - Brand and social login (only show on step 1) */}
      <div className="md:w-1/2 md:min-h-screen md:flex md:items-center md:justify-center md:bg-[#f8f6f9]">
        <div className="mx-6 md:mx-auto md:max-w-md md:w-full">
          {currentStep === 1 && (
            <>
              <BrandTitle
                title="BoookBox"
                description="Gift and redeem meal tickets globally"
                className="text-center my-12 flex flex-col items-center justify-center"
                titleClassName="text-6xl font-bold font-inter text-primary"
                descriptionClassName="text-lg text-gray-700"
                brandImg={true}
              />
              <div className="flex flex-col gap-4 md:gap-6">
                <GoogleButton 
                  onClick={handleGoogleSignUp} 
                  loading={isLoading || !isInitialized} 
                />
                <Suspense fallback={<div className="bg-gray-200 h-16 md:h-14 rounded-xl animate-pulse"></div>}>
                  <FacebookLogin
                    appId="572654712555502"
                    onSuccess={handleFacebookSignUp}
                    render={({ onClick }) => (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isInitialized) {
                            console.warn("Facebook signup attempted before initialization");
                            return;
                          }
                          onClick?.();
                        }}
                        className="bg-white h-16 md:h-14 rounded-xl flex items-center justify-center shadow hover:bg-gray-50 transition-colors disabled:opacity-50 w-full"
                        disabled={isFacebookLoading || !isInitialized}
                      >
                        <img src={Facebook} alt="facebook-logo" />
                        <p className="text-black font-medium ml-3">
                          {!isInitialized ? "Initializing..." :
                           isFacebookLoading ? "Signing up..." : "Continue with Facebook"}
                        </p>
                      </button>
                    )}
                  />
                </Suspense>
              </div>
            </>
          )}
          {currentStep > 1 && (
            <div className="md:block hidden">
              <img
                src={SplashImage}
                alt="Illustration"
                className="bg-inherit object-cover w-full"
                decoding="async"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="md:flex-1 flex md:items-center md:justify-center p-6 md:p-0 flex-col gap-3 overflow-y-auto h-screen">
        {currentStep > 1 && (
          <button
            type="button"
            className="hover:text-primary text-black flex items-center mt-4 mb-6 cursor-pointer self-start p-2 rounded-xl hover:bg-gray-50 ml-3"
            onClick={handlePrevStep}
          >
            <ChevronLeft className="w-8" />
          </button>
        )}
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="md:pb-8">
            <Title
              title={getStepTitle().title}
              description={getStepTitle().description}
              className="mb-6"
            />

            {(error || errors.root) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  {error || errors.root?.message}
                </p>
              </div>
            )}

            <div className="mb-6">{renderStep()}</div>

            <div className={`flex gap-4 flex-col`}>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`${
                  currentStep === 1 ? "w-full" : "flex-1"
                } rounded-lg ${
                  isValid
                    ? "bg-primary hover:bg-primary/90 text-white"
                    : "bg-primary text-white"
                } transition-colors disabled:opacity-50 h-14 p-4`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
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
                    {currentStep === 5 ? "Creating Account..." : "Processing..."}
                  </div>
                ) : currentStep === 5 ? (
                  "Create Account"
                ) : (
                  "Continue"
                )}
              </button>
              {currentStep === 1 && (
                <div className="flex items-center self-center">
                  <span className="text-gray-600 text-sm">
                    Already have an account?{" "}
                  </span>
                  <Link
                    to="/auth/login"
                    className="text-primary hover:underline font-medium hover:text-primary/90 ml-1"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>

            {currentStep === 2 && (
              <div className="text-center mt-6">
                <p className="text-gray-500 text-sm">or sign up with</p>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    className="h-12 w-12 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors p-2 disabled:opacity-50"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading || !isInitialized}
                  >
                    <img src={Google} alt="google-logo" className="w-full h-full" />
                  </button>
                  <Suspense fallback={<div className="h-12 w-12 rounded-full border border-gray-200 bg-gray-100 animate-pulse"></div>}>
                    <FacebookLogin
                      appId="572654712555502"
                      onSuccess={handleFacebookSignUp}
                      render={({ onClick }) => (
                        <button
                          type="button"
                          onClick={onClick}
                          className="h-12 w-12 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors p-2 disabled:opacity-50"
                          disabled={isFacebookLoading}
                        >
                          <img src={Facebook} alt="facebook-logo" className="w-full h-full" />
                        </button>
                      )}
                    />
                  </Suspense>
                </div>
              </div>
            )}
            <Footer/>
          </form>
        </div>
      </div>
      
      {/* Mobile splash image */}
      {currentStep > 1 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5 && (
        <div className="md:hidden -z-10">
          <img
            src={SplashImage}
            alt="Illustration"
            className="md:hidden object-contain -mt-40 w-full"
          />
        </div>
      )}
    </div>
  );
};

export default function SafeSignUp() {
  return (
    <AuthErrorBoundary>
      <SignUp />
    </AuthErrorBoundary>
  );
}