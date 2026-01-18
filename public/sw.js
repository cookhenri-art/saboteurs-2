/* =========================================================
   D10 - SERVICE WORKER PWA
   Cache strategy: Network First with Cache Fallback
   Version: 1.1 - Nouveau logo + corrections D7-D10
========================================================= */

const CACHE_NAME = 'saboteur-v1.4-v19';
const OFFLINE_URL = '/offline.html';

// Ressources à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/client.js',
  '/d7-animations.js',
  '/d8-performance.js',
  '/d9-avatars.js',
  '/video-tracks.js',
  '/video-tracks.css',
  '/video-briefing-ui.js',
  '/video-briefing.css',
  '/audio-mixer.js',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.webp',
  '/icons/icon-512x512.webp'
];

// Extensions de fichiers à mettre en cache
const CACHEABLE_EXTENSIONS = [
  '.html',
  '.css',
  '.js',
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.woff',
  '.woff2',
  '.mp3'
];

// =========================================================
// INSTALLATION
// =========================================================

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Pre-cache failed:', error);
      })
  );
});

// =========================================================
// ACTIVATION
// =========================================================

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// =========================================================
// FETCH STRATEGY
// =========================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes WebSocket et Socket.IO
  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }
  
  // Ignorer les requêtes API Daily.co
  if (url.hostname.includes('daily.co')) {
    return;
  }
  
  // Ignorer les requêtes API externes
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Stratégie: Network First avec Cache Fallback
  event.respondWith(
    networkFirstWithCache(request)
  );
});

/**
 * Network First avec Cache Fallback
 */
async function networkFirstWithCache(request) {
  const url = new URL(request.url);
  
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    // Si succès (200 uniquement, pas 206 Partial Content), mettre en cache et retourner
    // Les réponses 206 sont pour le streaming audio/vidéo et ne doivent pas être cachées
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      
      // Ne mettre en cache que les ressources appropriées
      if (shouldCache(url)) {
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    // Retourner directement les réponses 206 (streaming) sans cacher
    if (networkResponse.status === 206) {
      return networkResponse;
    }
    
    // Si erreur réseau mais pas offline, retourner l'erreur
    throw new Error('Network response was not ok');
    
  } catch (error) {
    // En cas d'erreur, essayer le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Si pas de cache et c'est une page, retourner la page offline
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Sinon, retourner une erreur
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Vérifie si une ressource doit être mise en cache
 */
function shouldCache(url) {
  const pathname = url.pathname;
  
  // Mettre en cache les fichiers avec extensions appropriées
  return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

// =========================================================
// MESSAGES
// =========================================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[ServiceWorker] Cache cleared');
    });
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// =========================================================
// PUSH NOTIFICATIONS (préparation future)
// =========================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/images/default/roles/astronaute.webp',
    badge: '/images/default/roles/astronaute.webp',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Saboteur', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Chercher une fenêtre existante
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// =========================================================
// BACKGROUND SYNC (préparation future)
// =========================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  // Synchroniser les données de jeu quand la connexion revient
  console.log('[ServiceWorker] Syncing game data...');
  
  // Notifier les clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE'
    });
  });
}
