// /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { Auth } from "@/features/auth/components/Auth";
// import {
//   // createUserWithEmailAndPassword,
//   signOut,
//   signInWithPopup,
//   // getRedirectResult,
//   GoogleAuthProvider,
//   // FacebookAuthProvider,
//   type AuthError as FirebaseAuthError,
//   onAuthStateChanged,
//   type User as FirebaseUser,
// } from "firebase/auth";
// import { loginUser } from "@/features/auth/services/userAuthApi";
// import { doc, getDoc } from "firebase/firestore";
// import { auth, db, analytics } from "@/firebase";
// import { logEvent } from "firebase/analytics";
// import type { User } from "@/types/auth";
// import { usersService } from "@/services/usersService";
// import { getEnvironmentInfo } from "@/utils/environmentInfo";

// // Initialize providers
// const googleProvider = new GoogleAuthProvider();

// // Configure Google provider
// googleProvider.addScope("email");
// googleProvider.addScope("profile");

// export interface AuthResponse {
//   user: User ;
//   isNewUser?: boolean;
// }
// export interface AuthError extends Error {
//   code: string;
// }

// /**
//  * Firebase Authentication Service
//  * Handles all authentication operations including social login
//  */
// export class AuthService {
//   /**
//    * Sign in with custom email and password
//    */
//   static async signIn(email: string, password: string): Promise<AuthResponse> {
    
//     try {
//       const envInfo = await getEnvironmentInfo();
//       const response = await loginUser({
//         email,
//         password,
//         environmentInfo: envInfo,
//       });
//       // console.log("AuthService: Got response from loginUser API", response);

//       // Calculate token expiry (7 days from now)
//       const tokenExpiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

//       const user: User = {
//         id: response.user._id,
//         username: response.user.fullName,
//         email: response.user.email,
//         role: (response.user.accountType as "user" | "organization") || "user",
//         photoURL: undefined, // API doesn't provide photoURL
//         token: response.token, // Store the token from API response
//         tokenExpiry: tokenExpiryTime, // Set token expiry
//         isVerified: response.user.isVerified || false,
//         phoneNumber: response.user.phoneNumber || "", // Add phone if available
//       };
//       // console.log("AuthService: Created user object", user);

//       // Log analytics event
//       if (analytics) {
//         logEvent(analytics, "login", {
//           method: "email",
//         });
//       }

//       return { user, isNewUser: false };
//     } catch (error) {
//       console.error("AuthService: Sign in error", error);
//       throw this.handleAuthError(error as FirebaseAuthError);
//     }
//   }
//   /**
//    * Sign in with Google
//    */

//   static async signInWithGoogle(): Promise<AuthResponse> {
//     try {
//       const envInfo = await getEnvironmentInfo();
//       const result = await signInWithPopup(auth, googleProvider);
//       const firebaseUser = result.user;

//       //  Get ID token
//       const idToken = await firebaseUser.getIdToken();
//       // console.log("Firebase ID token:", idToken);

//       //  Call your backend API to authenticate with Google
//       const response = await usersService.googleAuth({
//         credential: idToken,
//         environmentInfo: envInfo,
//       });

//       //  Handle backend response
//       if (!response || !response.user) {
//         throw new Error("Google authentication failed");
//       }

//       //  Construct user object
//       const user: User = {
//         id: response.user._id,
//         username: response.user.fullName || firebaseUser.displayName || "User",
//         email: response.user.email || firebaseUser.email!,
//         role: (response.user.accountType as "user" | "organization") || "user",
//         photoURL: response.user.profileImage || firebaseUser.photoURL || "",
//         isVerified: response.user.isVerified ?? true,
//         token: response.token, // Store the ID token
//         tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // Set token expiry (7 days)
//       };

//       return { user };
//     } catch (error) {
//       console.error("Google sign in error:", error);
//       throw error; // Let the calling component handle the error
//     }
//   }
//   /**
//    * Sign in with Facebook
//    */
//   static async signInWithFacebook(token: string){
//     try {
//       const envInfo = await getEnvironmentInfo();
//       const response = await usersService.facebookAuth({
//         credential: token,
//         environmentInfo: envInfo,
//       });

//       // Handle backend response
//       if (!response || !response.user) {
//         throw new Error("Facebook authentication failed");
//       }

//       // Construct user object
//       const user: User = {
//         id: response.user._id,
//         username: response.user.fullName || "User",
//         email: response.user.email,
//         role: (response.user.accountType as "user" | "organization") || "user",
//         photoURL: response.user.profileImage || "",
//         isVerified: response.user.isVerified ?? true,
//         token: response.token, // Store the ID token
//         tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // Set token expiry (7 days)
//       };
//       // Log analytics event
//       if (analytics) {
//         logEvent(analytics, "login", {
//           method: "facebook",
//         });
//       }

//       // login({ user });
//       return user;
//     } catch (error: any) {
//       console.error("Facebook sign in error:", error);

//       throw this.handleAuthError(error as any);
//     }
//   }
//   /**
//    * Handle redirect result for social sign-in
//    */
//   // static async handleRedirectResult(): Promise<AuthResponse | null> {
//   //   try {
//   //     const result = await getRedirectResult(auth);
//   //     if (!result) {
//   //       return null;
//   //     }

//   //     const firebaseUser = result.user;
//   //     const idToken = await firebaseUser.getIdToken();

//   //     // Determine the provider and call appropriate backend API
//   //     const providerId = result.providerId;
//   //     let response;

//   //     if (providerId === "facebook.com") {
//   //       response = await usersService.facebookAuth({
//   //         credential: idToken,
//   //       });
//   //     } else if (providerId === "google.com") {
//   //       response = await usersService.googleAuth({
//   //         credential: idToken,
//   //       });
//   //     } else {
//   //       throw new Error(`Unsupported provider: ${providerId}`);
//   //     }

//   //     if (!response || !response.user) {
//   //       throw new Error("Authentication failed");
//   //     }

//   //     const user: User = {
//   //       id: response.user._id,
//   //       username: response.user.fullName || firebaseUser.displayName || "User",
//   //       email: response.user.email || firebaseUser.email!,
//   //       role: (response.user.accountType as "user" | "organization") || "user",
//   //       photoURL: response.user.profileImage || firebaseUser.photoURL || "",
//   //       isVerified: response.user.isVerified ?? false,
//   //       token: response.token,
//   //       tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
//   //     };

//   //     // Log analytics event
//   //     if (analytics) {
//   //       logEvent(analytics, "login", {
//   //         method: providerId.replace(".com", ""),
//   //       });
//   //     }

//   //     return { user };
//   //   } catch (error) {
//   //     console.error("Redirect result error:", error);
//   //     throw this.handleAuthError(error as FirebaseAuthError);
//   //   }
//   // }

//   /**
//    * Sign out current user
//    */
//   static async signOut(): Promise<void> {
//     try {
//       await signOut(auth);

//       // Log analytics event
//       if (analytics) {
//         logEvent(analytics, "logout");
//       }
//     } catch (error) {
//       console.error("Sign out error:", error);
//       throw this.handleAuthError(error as FirebaseAuthError);
//     }
//   }

//   /**
//    * Get current user from Firebase Auth
//    */
//   static getCurrentUser(): FirebaseUser | null {
//     return auth.currentUser;
//   }

//   /**
//    * Listen to authentication state changes
//    */
//   static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
//     return onAuthStateChanged(auth, callback);
//   }
//   /**
//    * Get user data from Firestore
//    */
//   static async getUserData(uid: string): Promise<User | null> {
//     try {
//       const userDoc = await getDoc(doc(db, "users", uid));
//       if (userDoc.exists()) {
//         const data = userDoc.data();
//         return {
//           id: uid,
//           username: data.username,
//           email: data.email,
//           role: data.role,
//           photoURL: data.photoURL,
//           isVerified: data.isVerified || false,
//         };
//       }
//       return null;
//     } catch (error) {
//       console.error("Get user data error:", error);
//       return null;
//     }
//   }

//   /**
//    * Handle authentication errors
//    */
//   private static handleAuthError(error: FirebaseAuthError): Error {
//     let message = "An error occurred during authentication";

//     switch (error.code) {
//       case "auth/user-not-found":
//         message = "No account found with this email address";
//         break;
//       case "auth/wrong-password":
//         message = "Incorrect password";
//         break;
//       case "auth/email-already-in-use":
//         message = "An account with this email already exists";
//         break;
//       case "auth/weak-password":
//         message = "Password is too weak";
//         break;
//       case "auth/invalid-email":
//         message = "Invalid email address";
//         break;
//       case "auth/user-disabled":
//         message = "This account has been disabled";
//         break;

//       case "auth/popup-closed-by-user":
//         message = "Sign-in popup was closed before completion";
//         break;
//       case "auth/cancelled-popup-request":
//         message = "Sign-in was cancelled";
//         break;
//       case "auth/popup-blocked":
//         message = "Sign-in popup was blocked by the browser";
//         break;
//       case "auth/account-exists-with-different-credential":
//         message =
//           "An account already exists with this email using a different sign-in method";
//         break;
//       default:
//         message = error.message || message;
//     }

//     return new Error(message);
//   }
// }

// export default AuthService;


/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  type AuthError as FirebaseAuthError,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { loginUser } from "@/features/auth/services/userAuthApi";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, analytics } from "@/firebase";
import { logEvent } from "firebase/analytics";
import type { User } from "@/types/auth";
import { usersService } from "@/services/usersService";
import { getEnvironmentInfo } from "@/utils/environmentInfo";

// Initialize providers
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope("email");
googleProvider.addScope("profile");

export interface AuthResponse {
  user: User;
  isNewUser?: boolean;
}
export interface AuthError extends Error {
  code: string;
}

/**
 * Firebase Authentication Service
 * Handles all authentication operations including social login
 */
export class AuthService {
  /**
   * Sign in with custom email and password
   * @param email - User's email address
   * @param password - User's password
   * @param rememberMe - Whether to keep user logged in
   */
  static async signIn(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<AuthResponse> {
    try {
      const envInfo = await getEnvironmentInfo();
      const response = await loginUser({
        email,
        password,
        environmentInfo: envInfo,
        rememberMe, // Pass rememberMe to backend
      });

      // Calculate token expiry (7 days from now)
      const tokenExpiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      const user: User = {
        id: response.user._id,
        username: response.user.fullName,
        email: response.user.email,
        role: (response.user.accountType as "user" | "organization") || "user",
        photoURL: undefined, // API doesn't provide photoURL
        token: response.token, // Store the token from API response
        tokenExpiry: tokenExpiryTime, // Set token expiry
        isVerified: response.user.isVerified || false,
        phoneNumber: response.user.phoneNumber || "", // Add phone if available
      };

      // Log analytics event
      if (analytics) {
        logEvent(analytics, "login", {
          method: "email",
          rememberMe: rememberMe,
        });
      }

      return { user, isNewUser: false };
    } catch (error) {
      console.error("AuthService: Sign in error", error);
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  }

  /**
   * Sign in with Google
   * @param rememberMe - Whether to keep user logged in
   */
  static async signInWithGoogle(rememberMe: boolean = false): Promise<AuthResponse> {
    try {
      const envInfo = await getEnvironmentInfo();
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Get ID token
      const idToken = await firebaseUser.getIdToken();

      // Call your backend API to authenticate with Google
      const response = await usersService.googleAuth({
        credential: idToken,
        environmentInfo: envInfo,
        rememberMe, // Pass rememberMe to backend
      });

      // Handle backend response
      if (!response || !response.user) {
        throw new Error("Google authentication failed");
      }

      // Construct user object
      const user: User = {
        id: response.user._id,
        username: response.user.fullName || firebaseUser.displayName || "User",
        email: response.user.email || firebaseUser.email!,
        role: (response.user.accountType as "user" | "organization") || "user",
        photoURL: response.user.profileImage || firebaseUser.photoURL || "",
        isVerified: response.user.isVerified ?? true,
        token: response.token, // Store the ID token
        tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // Set token expiry (7 days)
      };

      // Log analytics event
      if (analytics) {
        logEvent(analytics, "login", {
          method: "google",
          rememberMe: rememberMe,
        });
      }

      return { user };
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error; // Let the calling component handle the error
    }
  }

  /**
   * Sign in with Facebook
   * @param token - Facebook access token
   * @param rememberMe - Whether to keep user logged in
   */
  static async signInWithFacebook(token: string, rememberMe: boolean = false) {
    try {
      const envInfo = await getEnvironmentInfo();
      const response = await usersService.facebookAuth({
        credential: token,
        environmentInfo: envInfo,
        rememberMe, // Pass rememberMe to backend
      });

      // Handle backend response
      if (!response || !response.user) {
        throw new Error("Facebook authentication failed");
      }

      // Construct user object
      const user: User = {
        id: response.user._id,
        username: response.user.fullName || "User",
        email: response.user.email,
        role: (response.user.accountType as "user" | "organization") || "user",
        photoURL: response.user.profileImage || "",
        isVerified: response.user.isVerified ?? true,
        token: response.token, // Store the ID token
        tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // Set token expiry (7 days)
      };

      // Log analytics event
      if (analytics) {
        logEvent(analytics, "login", {
          method: "facebook",
          rememberMe: rememberMe,
        });
      }

      return user;
    } catch (error: any) {
      console.error("Facebook sign in error:", error);
      throw this.handleAuthError(error as any);
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);

      // Log analytics event
      if (analytics) {
        logEvent(analytics, "logout");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  }

  /**
   * Get current user from Firebase Auth
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get user data from Firestore
   */
  static async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: uid,
          username: data.username,
          email: data.email,
          role: data.role,
          photoURL: data.photoURL,
          isVerified: data.isVerified || false,
        };
      }
      return null;
    } catch (error) {
      console.error("Get user data error:", error);
      return null;
    }
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: FirebaseAuthError): Error {
    let message = "An error occurred during authentication";

    switch (error.code) {
      case "auth/user-not-found":
        message = "No account found with this email address";
        break;
      case "auth/wrong-password":
        message = "Incorrect password";
        break;
      case "auth/email-already-in-use":
        message = "An account with this email already exists";
        break;
      case "auth/weak-password":
        message = "Password is too weak";
        break;
      case "auth/invalid-email":
        message = "Invalid email address";
        break;
      case "auth/user-disabled":
        message = "This account has been disabled";
        break;
      case "auth/popup-closed-by-user":
        message = "Sign-in popup was closed before completion";
        break;
      case "auth/cancelled-popup-request":
        message = "Sign-in was cancelled";
        break;
      case "auth/popup-blocked":
        message = "Sign-in popup was blocked by the browser";
        break;
      case "auth/account-exists-with-different-credential":
        message =
          "An account already exists with this email using a different sign-in method";
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}

export default AuthService;