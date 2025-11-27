/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Define workbox interface
interface Window {
  workbox?: {
    messageSkipWaiting: () => void;
    addEventListener: (event: string, callback: () => void) => void;
  };
}
