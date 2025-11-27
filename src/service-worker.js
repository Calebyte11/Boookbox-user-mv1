import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST)

// Optimized Service Worker for iOS compatibility
const CACHE_NAME = "BoookBox-v4";
const OFFLINE_URL = "/";
// Platform detection for push notification support
const isIOS = /iPad|iPhone|iPod/.test(self.navigator?.userAgent || '') && !self.MSStream;
const isAndroid = /android/i.test(self.navigator?.userAgent || '');
const isWindowsDesktop = /windows/i.test(self.navigator?.userAgent || '') && !/mobile/i.test(self.navigator?.userAgent || '');
const isIOSPWA = isIOS && self.navigator?.standalone === true;

// Only enable push notifications for Android and Windows Desktop
const shouldSupportPushNotifications = isAndroid || isWindowsDesktop;

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Essential resources for iOS with font fallbacks
        const cacheUrls = isIOS 
          ? [OFFLINE_URL, '/manifest.webmanifest', '/favicon.ico']
          : [OFFLINE_URL, '/manifest.webmanifest', '/favicon.ico'];
        
        return cache.addAll(cacheUrls).catch(err => {
          console.error('[Service Worker] Cache failed:', err);
          // Continue even if caching fails
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[Service Worker] Install failed:', err);
        self.skipWaiting(); // Still skip waiting even if install fails
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Simplified fetch handler with iOS workarounds
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and non-http(s) URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // For iOS PWA, add timeout for network requests
          const networkTimeout = isIOSPWA ? 3000 : 8000; // Reduced iOS timeout
          const networkPromise = fetch(event.request);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), networkTimeout)
          );
          
          const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
          
          // Ensure we got a valid response
          if (networkResponse && networkResponse.ok) {
            return networkResponse;
          } else {
            throw new Error('Invalid network response');
          }
        } catch (error) {
          console.log('[Service Worker] Network failed for navigation, returning app shell');
          const cache = await caches.open(CACHE_NAME);
          
          // First try to get the cached root page
          let cachedResponse = await cache.match('/');
          if (!cachedResponse) {
            // Fallback to index.html if root not cached
            cachedResponse = await cache.match('/index.html');
          }
          
          if (cachedResponse) {
            return cachedResponse;
          } else {
            // Last resort - create a minimal HTML response that loads the app
            return new Response(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>BoookBox</title>
                  <style>
                    body { margin: 0; padding: 20px; font-family: -apple-system, sans-serif; }
                    .loading { text-align: center; margin-top: 50px; }
                  </style>
                </head>
                <body>
                  <div class="loading">
                    <h1>BoookBox</h1>
                    <p>Loading...</p>
                    <script>window.location.reload();</script>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          }
        }
      })()
    );
    return;
  }

  // For other requests: cache-first with network fallback
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        console.log(`[Service Worker] Returning cached: ${event.request.url}`);
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses (avoid opaque responses)
        if (networkResponse.ok && networkResponse.type === 'basic') {
          console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
          await cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.error(`[Service Worker] Network failed for: ${event.request.url}`, error);
        
        // Special handling for fonts - return empty response instead of error
        if (event.request.destination === 'font' || event.request.url.includes('font')) {
          return new Response('', { 
            status: 200, 
            statusText: 'OK',
            headers: { 'Content-Type': 'font/woff2' } 
          });
        }
        
        // Special handling for images on iOS
        if (event.request.destination === 'image') {
          return new Response(
            '<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        
        return Response.error();
      }
    })()
  );
});

// iOS-specific limited message handling
if (!isIOS) {
  self.addEventListener('message', (event) => {
    if (event.data?.type === "CHECK_PAYMENT_RETURN") {
      const url = event.data.url || self.location.href;
      const urlParams = new URLSearchParams(new URL(url).search);
      const hasPaymentParams = !!(
        urlParams.get("status") ||
        urlParams.get("tx_ref") ||
        urlParams.get("reference") ||
        urlParams.get("payment")
      );
      
      if (hasPaymentParams) {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PAYMENT_RETURN",
              params: Object.fromEntries(urlParams.entries()),
              timestamp: Date.now(),
            });
          });
        });
      }
    }
  });
}

// Push notifications (only for Android and Windows Desktop)
if (shouldSupportPushNotifications && 'pushManager' in self.registration) {
  console.log('[Service Worker] Push notifications enabled for supported platform');
  
  self.addEventListener('push', (event) => {
    const fallbackNotification = {
      title: 'BoookBox',
      body: 'You have a new notification',
      icon: '/favicon.ico'
    };
    
    const notificationData = event.data?.json() || fallbackNotification;
    
    event.waitUntil(
      self.registration.showNotification(
        notificationData.title || fallbackNotification.title,
        {
          body: notificationData.body || fallbackNotification.body,
          icon: notificationData.icon || fallbackNotification.icon,
          badge: '/favicon.ico',
          data: notificationData.data || {}
        }
      )
    );
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        const focusedClient = clientList.find(c => c.focused);
        
        if (focusedClient) {
          return focusedClient.focus();
        }
        
        if (clientList.length > 0) {
          return clientList[0].navigate(urlToOpen).then(client => client.focus());
        }
        
        return clients.openWindow(urlToOpen);
      })
    );
  });
} else {
  console.log('[Service Worker] Push notifications disabled for this platform (iOS or other unsupported platform)');
}