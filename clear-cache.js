// Clear Service Worker Cache Script
// Run this in browser console to clear corrupted cache

(async function clearAllCaches() {
  console.log('🧹 Clearing all caches...');
  
  try {
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => {
          console.log('Unregistering SW:', registration.scope);
          return registration.unregister();
        })
      );
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('✅ All caches cleared! Reloading page...');
    
    // Force reload
    window.location.reload(true);
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
})();
