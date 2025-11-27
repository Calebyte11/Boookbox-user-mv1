// Comprehensive iOS PWA Debug Script
// Paste this in browser console to diagnose white screen issues

console.log('🔍 Starting iOS PWA Debug Check...');

const debugInfo = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  device: {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    isIOSPWA: navigator.standalone === true,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio
    },
    safariVersion: /Version\/([0-9.]+)/.test(navigator.userAgent) ? 
      navigator.userAgent.match(/Version\/([0-9.]+)/)[1] : 'Not Safari'
  },
  location: {
    supported: 'geolocation' in navigator,
    permissions: 'permissions' in navigator,
    permissionState: null,
    locationStore: window.locationStore || 'Not available in console'
  },
  pwa: {
    serviceWorker: 'serviceWorker' in navigator,
    caches: 'caches' in window,
    manifest: !!document.querySelector('link[rel="manifest"]'),
    hasRoot: !!document.getElementById('root'),
    hasLoadingFallback: !!document.getElementById('loading-fallback'),
    bodyClasses: document.body.className
  },
  fonts: {
    supported: 'fonts' in document,
    ready: false
  },
  errors: []
};

// Check location permission
if ('permissions' in navigator) {
  navigator.permissions.query({name: 'geolocation'})
    .then(result => {
      debugInfo.location.permissionState = result.state;
      console.log('📍 Location permission:', result.state);
    })
    .catch(err => {
      debugInfo.errors.push('Location permission check failed: ' + err.message);
    });
}

// Check font loading
if ('fonts' in document) {
  document.fonts.ready.then(() => {
    debugInfo.fonts.ready = true;
    console.log('🔤 Fonts loaded successfully');
  });
}

// Check for console errors
const originalConsoleError = console.error;
const capturedErrors = [];
console.error = function(...args) {
  capturedErrors.push(args.join(' '));
  originalConsoleError.apply(console, arguments);
};

// Check service worker status
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('⚙️ Service Worker ready:', registration);
    debugInfo.pwa.serviceWorkerScope = registration.scope;
    debugInfo.pwa.serviceWorkerState = registration.active?.state;
  });

  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📋 Service Worker registrations:', registrations.length);
    debugInfo.pwa.serviceWorkerCount = registrations.length;
  });
}

// Check caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('💾 Available caches:', cacheNames);
    debugInfo.pwa.cacheNames = cacheNames;
  });
}

// Check for React and app mounting
setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    debugInfo.react = {
      hasRoot: true,
      rootHTML: rootElement.innerHTML.length > 0,
      reactFiberNode: !!rootElement._reactInternalFiber || !!rootElement._reactInternalInstance
    };
  }

  debugInfo.errors = capturedErrors;
  
  // Display comprehensive debug info
  console.log('📊 Debug Report:', debugInfo);
  
  // Specific recommendations based on findings
  console.log('\n🔧 Recommendations:');
  
  if (debugInfo.device.isIOSPWA) {
    console.log('• iOS PWA detected - location requests should be delayed');
    console.log('• Check for aggressive geolocation calls in Header component');
    console.log('• Location access failures on iOS are common - ensure fallbacks are working');
  }
  
  if (!debugInfo.react?.rootHTML) {
    console.log('• React app may not be mounting - check for JavaScript errors');
    console.log('• Check if loading fallback is still showing');
  }
  
  if (debugInfo.location.permissionState === 'denied') {
    console.log('• Location permission denied - this may cause component blocking');
    console.log('• Consider IP-based location as fallback instead of GPS');
  }
  
  if (!debugInfo.fonts.ready) {
    console.log('• Fonts not loaded - may cause layout issues');
  }
  
  if (debugInfo.errors.length > 0) {
    console.log('• JavaScript errors detected:', debugInfo.errors);
  }
  
  // Check Header component
  console.log('\n🔍 Checking Header component:');
  try {
    const headerElement = document.querySelector('header');
    if (headerElement) {
      console.log('✅ Header element found in DOM');
      
      // Check if location display exists in header
      const locationElement = headerElement.querySelector('[data-location-display]') || 
                             headerElement.querySelector('.location-display') ||
                             headerElement.querySelector('[class*="location"]');
      
      if (locationElement) {
        console.log('✅ Location display element found in header:', locationElement.textContent);
      } else {
        console.log('❌ Location display element not found in header');
      }
    } else {
      console.log('❌ Header element not found in DOM');
    }
  } catch (e) {
    console.log('❌ Error checking header:', e);
  }
  
  // Test location safely
  if (debugInfo.device.isIOS && debugInfo.location.supported) {
    console.log('\n🧪 Testing iOS-safe location request...');
    
    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 600000
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location test successful:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.log('❌ Location test failed:', error.message);
      },
      options
    );
  }
  
}, 3000);

// Monitor for app loading
const checkAppLoaded = () => {
  const isLoaded = document.body.classList.contains('app-loaded');
  const hasContent = document.getElementById('root')?.innerHTML.length > 100;
  
  if (isLoaded && hasContent) {
    console.log('✅ App successfully loaded');
  } else {
    console.log('⏳ App still loading... Root content:', hasContent, 'Body classes:', document.body.className);
    setTimeout(checkAppLoaded, 2000);
  }
};

setTimeout(checkAppLoaded, 1000);
