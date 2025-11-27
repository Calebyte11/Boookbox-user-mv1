import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import type { AuthState, User, ProfileSyncData } from "@/types/auth";
import {
  getStorage,
  clearAllStorage,
  STORAGE_KEYS,
  setRememberMe,
  getRememberMe,
  migrateAuthStorage,
} from "@/utils/storageUtils";

import {
  safeEncodeToken,
  safeDecodeToken,
  validateEncodedToken,
} from "@/utils/tokenUtils";

type StoreSet = (
  partial:
    | AuthState
    | Partial<AuthState>
    | ((state: AuthState) => AuthState | Partial<AuthState>),
  replace?: boolean
) => void;
type StoreGet = () => AuthState;

type AuthSyncPayload = {
  user: User | null;
  rememberMe: boolean;
};

type AuthChannelMessage =
  | { type: "auth:login"; payload: AuthSyncPayload }
  | { type: "auth:logout" }
  | { type: "auth:request-sync" }
  | { type: "auth:sync-state"; payload: AuthSyncPayload };

type AuthChannelEnvelope = AuthChannelMessage & {
  source: string;
  timestamp: number;
};

const AUTH_CHANNEL_NAME = "boookbox-auth-sync";
const AUTH_SYNC_STORAGE_KEY = "boookbox-auth-sync-message";

let broadcastAuthMessage: ((message: AuthChannelMessage) => void) | null = null;
let cachedTabId: string | null = null;
let profileUpdateListenerRef: ((event: CustomEvent) => void) | null = null;

const getTabId = () => {
  if (cachedTabId) {
    return cachedTabId;
  }

  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    cachedTabId = window.crypto.randomUUID();
  } else {
    cachedTabId = `tab-${Math.random().toString(36).slice(2)}`;
  }

  return cachedTabId;
};

const attachProfileUpdateListener = (get: StoreGet) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!profileUpdateListenerRef) {
    profileUpdateListenerRef = (event: CustomEvent) => {
      const { syncProfileToAuth } = get();
      syncProfileToAuth(event.detail);
    };
  }

  window.removeEventListener(
    "profile:updated",
    profileUpdateListenerRef as EventListener
  );
  window.addEventListener(
    "profile:updated",
    profileUpdateListenerRef as EventListener
  );
};

const detachProfileUpdateListener = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (profileUpdateListenerRef) {
    window.removeEventListener(
      "profile:updated",
      profileUpdateListenerRef as EventListener
    );
  }
};

const dynamicAuthStorage: PersistStorage<Partial<AuthState>> = {
  getItem: (name: string) => {
    try {
      const raw = getStorage().getItem(name);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as StorageValue<Partial<AuthState>>;
    } catch (error) {
      console.error("Auth Store: Failed to read persisted auth state", error);
      return null;
    }
  },
  setItem: (name: string, value) => {
    try {
      getStorage().setItem(name, JSON.stringify(value));
    } catch (error) {
      console.error("Auth Store: Failed to persist auth state", error);
    }
  },
  removeItem: (name: string) => {
    try {
      getStorage().removeItem(name);
    } catch (error) {
      console.error("Auth Store: Failed to remove persisted auth state", error);
    }
  },
};

const setupCrossTabCommunication = (set: StoreSet, get: StoreGet) => {
  if (typeof window === "undefined") {
    return;
  }

  if (broadcastAuthMessage) {
    return;
  }

  const tabId = getTabId();
  let channel: BroadcastChannel | null = null;

  const send = (message: AuthChannelMessage) => {
    const envelope: AuthChannelEnvelope = {
      ...message,
      source: tabId,
      timestamp: Date.now(),
    };

    if (channel) {
      channel.postMessage(envelope);
    } else {
      try {
        localStorage.setItem(AUTH_SYNC_STORAGE_KEY, JSON.stringify(envelope));
        localStorage.removeItem(AUTH_SYNC_STORAGE_KEY);
      } catch (error) {
        console.error("Auth Store: Failed to broadcast auth sync message", error);
      }
    }
  };

  const applyAuthSyncPayload = (payload: AuthSyncPayload) => {
    if (!payload) {
      return;
    }

    const { user, rememberMe } = payload;

    try {
      setRememberMe(rememberMe);
      migrateAuthStorage(rememberMe);
      get().initializeStorage();
    } catch (error) {
      console.error("Auth Store: Failed to align storage preference", error);
    }

    if (user) {
      set({
        user: { ...user },
        isAuthenticated: true,
        loading: false,
        error: null,
        isLoggingOut: false,
      });
      get().setInitialized(true);

      attachProfileUpdateListener(get);
    } else {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        isLoggingOut: false,
      });
      get().setInitialized(false);

      detachProfileUpdateListener();
    }
  };

  const handleIncoming = (message: AuthChannelEnvelope | null) => {
    if (!message || message.source === tabId) {
      return;
    }

    switch (message.type) {
      case "auth:login":
        applyAuthSyncPayload(message.payload);
        break;
      case "auth:sync-state":
        if (typeof message.payload !== "undefined") {
          applyAuthSyncPayload(message.payload);
        }
        break;
      case "auth:logout":
        try {
          clearAllStorage();
        } catch (error) {
          console.error("Auth Store: Failed to clear storage on synced logout", error);
        }
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
          isLoggingOut: false,
        });
        get().setInitialized(false);
        detachProfileUpdateListener();
        break;
      case "auth:request-sync": {
        const state = get();
        const payload: AuthSyncPayload = {
          user: state.isAuthenticated ? state.user : null,
          rememberMe: getRememberMe(),
        };

        if (state.isInitialized || (state.isAuthenticated && state.user)) {
          send({ type: "auth:sync-state", payload });
        }
        break;
      }
      default:
        break;
    }
  };

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.addEventListener("message", (event: MessageEvent<AuthChannelEnvelope>) => {
      handleIncoming(event.data ?? null);
    });
  }

  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key !== AUTH_SYNC_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const data: AuthChannelEnvelope = JSON.parse(event.newValue);
      handleIncoming(data);
    } catch (error) {
      console.error("Auth Store: Failed to parse auth sync storage event", error);
    }
  });

  broadcastAuthMessage = (message: AuthChannelMessage) => {
    send(message);
  };

  setTimeout(() => {
    send({ type: "auth:request-sync" });
  }, 0);
};

/**
 * Authentication store using Zustand with cross-tab persistence
 */
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      setupCrossTabCommunication(set, get);

      return {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        isLoggingOut: false,
        isInitialized: false,

        login: (user: User) => {
          // console.log("Auth Store: Logging in user", user);

          try {
            get().initializeStorage();
          } catch (error) {
            console.error("Auth Store: Failed to initialize storage before login", error);
          }

          // Encode token before storing
          let encodedToken: string | undefined;
          if (user.token) {
            const encoded = safeEncodeToken(user.token);
            if (encoded) {
              encodedToken = encoded;
            } else {
              encodedToken = user.token;
            }
          }

          const normalizedUser: User = {
            ...user,
            token: encodedToken, // Store encoded token
            isVerified: user.isVerified ?? false, // Ensure isVerified is set
          };

          set({
            user: {
              ...normalizedUser,
            },
            isAuthenticated: true,
            loading: false,
            error: null,
            isInitialized: true,
          });

          // Set up profile update listener after login
          attachProfileUpdateListener(get);

          if (broadcastAuthMessage) {
            broadcastAuthMessage({
              type: "auth:login",
              payload: {
                user: normalizedUser,
                rememberMe: getRememberMe(),
              },
            });
          }
        },

        logout: async () => {
          console.log("Auth Store: Starting logout process");

          // IMMEDIATELY clear auth state synchronously to prevent race conditions
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            isLoggingOut: true, // Track logout in progress
            isInitialized: false, // Reset initialization state
          });

          // 2. Remove profile update listener
          detachProfileUpdateListener();

          // 3. Clear all browser storage (localStorage, sessionStorage)
          try {
            clearAllStorage();
          } catch (e) {
            console.error("Error clearing all storage:", e);
          }

          // 4. Clear any cached data (await completion)
          try {
            if ("caches" in window) {
              const cacheNames = await caches.keys();
              if (cacheNames.length > 0) {
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
                console.log("Auth Store: All caches cleared.");
              }
            }
          } catch (e) {
            console.error("Error clearing caches:", e);
          }

          if (broadcastAuthMessage) {
            broadcastAuthMessage({ type: "auth:logout" });
          }

          // 5. Dispatch logout event for other components to listen
          window.dispatchEvent(new CustomEvent("auth:logout"));
          console.log("Auth Store: Dispatched auth:logout event.");

          // 6. Mark logout as complete
          set({
            isLoggingOut: false,
          });
        },

        forceLogout: () => {
          console.log("Auth Store: Force logout - clearing state immediately");

          // Clear state immediately and synchronously
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            isLoggingOut: true,
            isInitialized: false, // Reset initialization state
          });

          // Remove profile update listener
          detachProfileUpdateListener();

          // Clear storage synchronously
          try {
            clearAllStorage();
          } catch (e) {
            console.error("Error clearing storage in force logout:", e);
          }

          if (broadcastAuthMessage) {
            broadcastAuthMessage({ type: "auth:logout" });
          }

          // Dispatch logout event
          window.dispatchEvent(new CustomEvent("auth:logout"));

          // Clear logout state after a brief moment
          setTimeout(() => {
            set({ isLoggingOut: false });
          }, 100);
        },

        updateUser: (updatedUserData: Partial<User>) => {
          const { user } = get();
          if (!user) return;

          set({
            user: {
              ...user,
              ...updatedUserData,
            },
          });
        },

        syncProfileToAuth: (profileData: ProfileSyncData) => {
          const { user } = get();
          if (!user) return;

          const syncedData: Partial<User> = {
            isVerified: profileData.isVerified ?? user.isVerified,
            fullName: profileData.fullName,
            profileImage: profileData.profileImage,
            accountType: profileData.accountType,
            address: profileData.address,
            city: profileData.city,
            state: profileData.state,
            country: profileData.country,
            phoneNumber: profileData.phoneNumber,
            birthday: profileData.birthday,
            ...(profileData.accountType === "organization" && {
              contactEmail: profileData.contactEmail,
              organizationName: profileData.organizationName,
            }),
          };

          // Update user with synced profile data
          set({
            user: {
              ...user,
              ...syncedData,
            },
          });
        },

        isTokenValid: () => {
          const { user } = get();

          if (!user || !user.token || !user.tokenExpiry) {
            return false;
          }
          const isValid = Date.now() < user.tokenExpiry;

          return isValid;
        },

        refreshTokenIfNeeded: async () => {
          const { user, isTokenValid, forceLogout } = get();

          if (!user || !user.token) {
            return;
          }

          if (!isTokenValid()) {
            forceLogout();

            window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
          }
        },

        /**
         * Get the decoded token for API usage
         * @returns Decoded token string or null if not available
         */
        getDecodedToken: () => {
          const { user } = get();
          if (!user || !user.token) {
            return null;
          }

          // Decode token for usage
          const decodedToken = safeDecodeToken(user.token);
          if (!decodedToken) {
            // console.error("Auth Store: Failed to decode token");
            return null;
          }

          return decodedToken;
        },

        /**
         * Validate the current stored token
         * @returns true if token is valid and properly formatted
         */
        validateCurrentToken: () => {
          const { user } = get();
          if (!user || !user.token) {
            return { isValid: false, decodedToken: null };
          }

          return validateEncodedToken(user.token);
        },

        /**
         * Check if user has valid authentication (token exists and is valid)
         * @returns true if user is properly authenticated
         */
        hasValidAuth: () => {
          const { user, isTokenValid } = get();
          return !!(user && user.token && isTokenValid());
        },

        /**
         * Initialize storage based on remember me preference
         * This ensures auth data is in the correct storage location
         */
        initializeStorage: () => {
          const rememberMe =
            localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
          const correctStorage = rememberMe ? localStorage : sessionStorage;
          const incorrectStorage = rememberMe ? sessionStorage : localStorage;

          // Check if auth data exists in the incorrect storage
          const incorrectStorageData = incorrectStorage.getItem(
            STORAGE_KEYS.AUTH_STORAGE
          );
          const correctStorageData = correctStorage.getItem(
            STORAGE_KEYS.AUTH_STORAGE
          );

          // If data exists in incorrect storage and not in correct storage, migrate it
          if (incorrectStorageData && !correctStorageData) {
            correctStorage.setItem(
              STORAGE_KEYS.AUTH_STORAGE,
              incorrectStorageData
            );
            incorrectStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
          }
        },

        /**
         * Set the initialization state
         */
        setInitialized: (initialized: boolean) => {
          set({ isInitialized: initialized });
        },
      };
    },
    {
      name: STORAGE_KEYS.AUTH_STORAGE,
      storage: dynamicAuthStorage,
      partialize: (state) =>
        ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        } as Partial<AuthState>),
    }
  )
);

export default useAuthStore;
