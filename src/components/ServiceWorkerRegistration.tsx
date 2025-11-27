import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

// Type for PWA standalone check
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Main component that handles SW registration
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production to prevent HMR conflicts
    if (import.meta.env.DEV) {
      console.log('Development mode: Skipping service worker registration to prevent HMR conflicts');
      // Proactively unregister any previously installed SWs and clear caches to avoid stale chunks
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => {
            console.log('Unregistering service worker in development:', reg);
            reg.unregister();
          });
        }).catch(err => console.warn('SW unregister error (dev):', err));
      }
      if (typeof caches !== 'undefined' && caches.keys) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(err => console.warn('Cache clear error (dev):', err));
      }
      document.body.classList.add('app-loaded');
      return;
    }

    const updateServiceWorker = async () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
          // Check if this is iOS PWA
          const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                           'standalone' in navigator && 
                           navigator.standalone === true;

          const updateSW = registerSW({
            onNeedRefresh() {
              console.log('PWA needs refresh');
              updateSW(true);
            },
            onOfflineReady() {
              console.log('PWA ready to work offline');
              // For iOS PWA, mark app as loaded here since SW is ready
              if (isIOSPWA) {
                setTimeout(() => {
                  document.body.classList.add('app-loaded');
                  console.log('iOS PWA marked as loaded after SW ready');
                }, 500);
              }
            },
            onRegisterError(error) {
              console.error("SW registration error", error);
              // Don't let SW errors block the app
              document.body.classList.add('app-loaded');
            },
            onRegistered(r) {
              console.log('SW Registered: ', r);
            },
            onRegisteredSW(swUrl, r) {
              console.log('SW Registered: ', swUrl, r);
            },
            immediate: !isIOSPWA // Don't register immediately on iOS PWA
          });
        } catch (error) {
          console.error("Error registering service worker:", error);
          // Don't let errors block the app
          document.body.classList.add('app-loaded');
        }
      }
    };

    const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                     'standalone' in navigator && 
                     navigator.standalone === true;

    if (isIOSPWA) {
      // For iOS PWA, delay SW registration and mark app as loaded sooner
      setTimeout(() => {
        updateServiceWorker();
      }, 2000);
      
      // Mark app as loaded faster for iOS PWA
      setTimeout(() => {
        document.body.classList.add('app-loaded');
        console.log('iOS PWA marked as loaded (early)');
      }, 1500);
    } else {
      // For other platforms, register immediately
      updateServiceWorker();
      
      setTimeout(() => {
        document.body.classList.add('app-loaded');
      }, 1000);
    }
  }, []);

  return null; // This component doesn't render anything
}
