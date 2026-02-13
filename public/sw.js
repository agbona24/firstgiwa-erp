// FactoryPulse Service Worker
// Handles offline caching, background sync, and push notifications

const CACHE_NAME = 'factorypulse-v2';
const OFFLINE_URL = '/offline.html';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// API routes to cache for offline (GET requests only)
const CACHEABLE_API_ROUTES = [
    '/api/v1/products',
    '/api/v1/categories',
    '/api/v1/customers',
    '/api/v1/units',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Routes that should always go to the network (bypass SW caching)
const NETWORK_ONLY_ROUTES = ['/install', '/setup'];

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // Skip network-only routes (install/setup wizards) - let browser handle normally
    if (NETWORK_ONLY_ROUTES.some(route => url.pathname.startsWith(route))) {
        return;
    }

    // API requests - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Navigation requests (HTML pages) - Network first, offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    // Static assets (JS, CSS, images) - Cache first, network fallback
    event.respondWith(cacheFirstStrategy(request));
});

// Network-first strategy for navigation requests (HTML pages)
async function networkFirstNavigation(request) {
    try {
        const networkResponse = await fetch(request);
        // Cache successful navigation responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Try cached version first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Last resort: show offline page
        const offlineResponse = await caches.match(OFFLINE_URL);
        if (offlineResponse) {
            return offlineResponse;
        }
        throw error;
    }
}

// Cache-first strategy for static assets (JS, CSS, images)
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
    const url = new URL(request.url);
    const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.includes(route));

    try {
        const networkResponse = await fetch(request);
        
        // Cache successful GET responses for cacheable routes
        if (networkResponse.ok && isCacheable) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Try cache fallback for cacheable routes
        if (isCacheable) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('[SW] Serving from cache (offline):', request.url);
                return cachedResponse;
            }
        }
        
        // Return offline JSON response for API requests
        return new Response(
            JSON.stringify({ 
                error: 'offline', 
                message: 'You are offline. This data is not available.' 
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-offline-sales') {
        event.waitUntil(syncOfflineSales());
    }
    
    if (event.tag === 'sync-offline-payments') {
        event.waitUntil(syncOfflinePayments());
    }
});

// Sync offline sales when back online
async function syncOfflineSales() {
    try {
        // Get pending sales from IndexedDB
        const db = await openDatabase();
        const pendingSales = await getAllFromStore(db, 'pendingSales');
        
        for (const sale of pendingSales) {
            try {
                const response = await fetch('/api/v1/sales-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sale.data),
                });
                
                if (response.ok) {
                    // Remove from pending
                    await deleteFromStore(db, 'pendingSales', sale.id);
                    console.log('[SW] Synced offline sale:', sale.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync sale:', sale.id, error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Sync offline payments
async function syncOfflinePayments() {
    try {
        const db = await openDatabase();
        const pendingPayments = await getAllFromStore(db, 'pendingPayments');
        
        for (const payment of pendingPayments) {
            try {
                const response = await fetch('/api/v1/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payment.data),
                });
                
                if (response.ok) {
                    await deleteFromStore(db, 'pendingPayments', payment.id);
                    console.log('[SW] Synced offline payment:', payment.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync payment:', payment.id, error);
            }
        }
    } catch (error) {
        console.error('[SW] Payment sync failed:', error);
    }
}

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    let data = { title: 'FactoryPulse', body: 'You have a new notification' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body || data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'factorypulse-notification',
        renotify: true,
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // Open or focus the app
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if app is already open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// IndexedDB helpers
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FactoryPulseOffline', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Stores for offline data
            if (!db.objectStoreNames.contains('pendingSales')) {
                db.createObjectStore('pendingSales', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('pendingPayments')) {
                db.createObjectStore('pendingPayments', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('cachedProducts')) {
                db.createObjectStore('cachedProducts', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('cachedCustomers')) {
                db.createObjectStore('cachedCustomers', { keyPath: 'id' });
            }
        };
    });
}

function getAllFromStore(db, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function deleteFromStore(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

console.log('[SW] Service worker loaded');
