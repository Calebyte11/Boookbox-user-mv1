export interface User {
  id?: string;
  email: string;
  role: "user" | "organization";
  photoURL?: string;
  profileImage?: string; // Add profileImage field for API consistency
  username?: string;
  token?: string; // Add token for custom API auth
  tokenExpiry?: number; // Add token expiry timestamp
  isVerified: boolean;
  phoneNumber?: string;
  phone?: string;
  // Additional profile fields synced from profile API
  fullName?: string;
  accountType?: "user" | "organization";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  contactEmail?: string; // For organization accounts
  organizationName?: string; // For organization accounts
  category?: string; // For organization accounts
  birthday?: {
    day?: number;
    month?: string;
    year?: number;
  };
}

export interface ProfileSyncData {
  _id?: string;
  fullName?: string;
  email?: string;
  isVerified?: boolean;
  profileImage?: string;
  accountType?: "user" | "organization";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phoneNumber?: string;
  contactEmail?: string;
  organizationName?: string;
  category?: string;
  birthday?: {
    day?: number;
    month?: string;
    year?: number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  isInitialized: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  forceLogout: () => void;
  updateUser: (updatedUserData: Partial<User>) => void;
  syncProfileToAuth: (profileData: ProfileSyncData) => void;
  isTokenValid: () => boolean;
  refreshTokenIfNeeded: () => Promise<void>;
  getDecodedToken: () => string | null;
  validateCurrentToken: () => {
    isValid: boolean;
    decodedToken: string | null;
    error?: string;
  };
  hasValidAuth: () => boolean;
  setInitialized: (initialized: boolean) => void;
  initializeStorage: () => void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    isVerified: boolean;
  };
}
