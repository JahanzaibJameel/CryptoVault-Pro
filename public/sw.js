// Service Worker for CryptoVault Pro PWA
const CACHE_NAME = 'cryptovault-pro-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/js/polyfills.js'
];

const API_CACHE_URLS = [
  '/api/portfolio',
  '/api/market/data',
  '/api/watchlist',
  '/api/analytics/performance'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(CACHE_URLS.map(url => 
          new Request(url, { cache: 'force-cache' })
        ));
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event triggered');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        // Take control of all open pages
        return self.clients.claimAll();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // Handle different cache strategies based on URL
  let cacheName;
  let cacheStrategy = 'cacheFirst';

  if (url.pathname.startsWith('/api/')) {
    cacheName = API_CACHE;
    cacheStrategy = 'networkFirst';
  } else if (CACHE_URLS.some(cacheUrl => url.pathname === cacheUrl)) {
    cacheName = STATIC_CACHE;
  } else if (url.pathname.includes('.')) {
    cacheName = DYNAMIC_CACHE;
  } else {
    return fetch(request); // Pass through for other requests
  }

  event.respondWith(
    caches.open(cacheName)
      .then(cache => {
        return cache.match(request)
          .then(response => {
            // Return cached response if available and fresh
            if (response && isResponseFresh(response)) {
              console.log(`[SW] Cache hit: ${request.url}`);
              return response;
            }

            // Otherwise fetch from network
            console.log(`[SW] Cache miss: ${request.url}`);
            return fetch(request)
              .then(networkResponse => {
                // Cache the new response for future
                if (networkResponse.ok && cacheStrategy === 'cacheFirst') {
                  cache.put(request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(error => {
                console.error(`[SW] Network fetch failed: ${request.url}`, error);
                
                // Return offline fallback for API requests
                if (url.pathname.startsWith('/api/')) {
                  return new Response(
                    JSON.stringify({ 
                      error: 'Offline',
                      message: 'Network unavailable',
                      timestamp: new Date().toISOString()
                    }),
                    {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                      }
                    }
                  );
                }
                
                throw error;
              });
          });
      })
      .catch(error => {
        console.error(`[SW] Cache error: ${request.url}`, error);
        return fetch(request);
      })
  );
});

// Helper function to check if cached response is still fresh
function isResponseFresh(response) {
  if (!response || !response.headers) {
    return false;
  }

  const cacheControl = response.headers.get('cache-control');
  const expires = response.headers.get('expires');
  
  if (cacheControl && cacheControl.includes('no-cache')) {
    return false;
  }

  if (expires) {
    const expiryDate = new Date(expires);
    return expiryDate > new Date();
  }

  // Default cache age: 1 hour
  const lastModified = response.headers.get('last-modified');
  if (lastModified) {
    const modifiedDate = new Date(lastModified);
    const oneHourAgo = new Date(Date.now() - 3600000);
    return modifiedDate > oneHourAgo;
  }

  return true;
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event triggered');
  
  if (event.tag === 'portfolio-sync') {
    event.waitUntil(
      caches.open(API_CACHE)
        .then(cache => {
          return cache.match('/api/portfolio')
            .then(response => {
              if (response) {
                const portfolioData = response.json();
                console.log('[SW] Syncing portfolio data:', portfolioData);
                
                // Send to server when online
                return fetch('/api/portfolio/sync', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(portfolioData)
                })
                .then(syncResponse => {
                  if (syncResponse.ok) {
                    console.log('[SW] Portfolio sync successful');
                    // Update cache with fresh data
                    return cache.put('/api/portfolio', syncResponse.clone());
                  }
                })
                .catch(error => {
                  console.error('[SW] Portfolio sync failed:', error);
                });
              }
            });
        })
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  const data = event.data.json();
  
  // Show notification
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/assets/icons/icon-192x192.png',
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      requireInteraction: data.requireInteraction,
      actions: data.actions,
      silent: data.silent,
      vibrate: data.vibrate,
      renotify: data.renotify,
      dir: data.dir,
      lang: data.lang,
      timestamp: data.timestamp
    })
  );
});

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      if (self.skipWaiting) {
        self.skipWaiting();
        event.ports[0].postMessage({ type: 'SKIP_COMPLETE' });
      }
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ 
        type: 'VERSION', 
        version: '2.0.0'
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'PRELOAD_CRITICAL_ASSETS':
      preloadCriticalAssets().then(() => {
        event.ports[0].postMessage({ type: 'ASSETS_PRELOADED' });
      });
      break;
  }
});

// Preload critical assets
function preloadCriticalAssets() {
  return caches.open(STATIC_CACHE)
    .then(cache => {
      const criticalAssets = [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/assets/icons/icon-192x192.png',
        '/assets/icons/icon-512x512.png'
      ];
      
      return Promise.all(
        criticalAssets.map(asset => 
          cache.add(new Request(asset, { cache: 'force-cache' }))
        )
      );
    });
}

// Cache cleanup
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEANUP_CACHE') {
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.keys()
          .then(keys => {
            // Keep only the 50 most recent entries
            const keysToDelete = keys.slice(50);
            return Promise.all(
              keysToDelete.map(key => cache.delete(key))
            );
          })
          .then(() => {
            console.log(`[SW] Cache cleanup: removed ${keysToDelete.length} old entries`);
          });
      });
  }
});
