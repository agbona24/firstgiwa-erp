# PWA & Offline Mode Guide

FactoryPulse ERP includes Progressive Web App (PWA) functionality that enables:
- **Install as App**: Install on desktop/mobile for native-like experience
- **Offline Support**: Continue working even without internet
- **Push Notifications**: Get alerts for important events
- **Background Sync**: Automatic sync when connection restored

## Quick Start

### 1. Install the App

On supported browsers (Chrome, Edge, Safari), you'll see an "Install" prompt. You can also:
- Click the install icon in the browser address bar
- Use the install banner that appears in the app

### 2. Enable Push Notifications

Go to **Settings > Notifications** and enable push notifications to receive:
- Low stock alerts
- New order notifications
- Payment due reminders
- Production updates

### 3. Setup for Production

#### Generate VAPID Keys

```bash
# Run the key generation script
chmod +x scripts/generate-vapid-keys.sh
./scripts/generate-vapid-keys.sh

# Or manually with npx
npx web-push generate-vapid-keys
```

Add the generated keys to your `.env` file:

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

#### Generate PNG Icons (Optional)

If you need PNG icons instead of SVG:

```bash
# Using ImageMagick
brew install imagemagick
chmod +x scripts/generate-icons.sh
./scripts/generate-icons.sh
```

#### Install Web Push Package (Optional)

For server-side push notifications:

```bash
composer require minishlink/web-push
```

## Features

### Offline POS

The POS terminal works offline:

1. Products, customers, and categories are cached locally
2. Sales can be created while offline
3. When back online, sales are automatically synced
4. Visual indicator shows online/offline status

**Using Offline POS in code:**

```jsx
import { useOfflinePOS } from '../hooks/useOfflinePOS';

function POSComponent() {
    const {
        products,
        customers,
        createSale,
        isOnline,
        pendingSales,
        syncPendingData
    } = useOfflinePOS();

    const handleSale = async (saleData) => {
        const result = await createSale(saleData);
        if (result.offline) {
            console.log('Sale saved offline, will sync later');
        }
    };
}
```

### IndexedDB Storage

Data is cached locally in IndexedDB for offline access:

| Store | Purpose |
|-------|---------|
| `products` | Product catalog |
| `customers` | Customer directory |
| `categories` | Product categories |
| `pending_sales` | Offline sales queue |
| `pending_payments` | Offline payments queue |
| `sync_queue` | Generic sync operations |

**Using OfflineStorage service:**

```javascript
import offlineStorage from '../services/OfflineStorage';

// Cache products
await offlineStorage.cacheProducts(productsArray);

// Get cached products
const products = await offlineStorage.getProducts();

// Search products offline
const results = await offlineStorage.searchProducts('soap');

// Add offline sale
const sale = await offlineStorage.addPendingSale(saleData);

// Check sync status
const status = await offlineStorage.getSyncStatus();
```

### Push Notifications

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/push/vapid-key` | GET | Get VAPID public key |
| `/api/v1/push/subscribe` | POST | Subscribe to notifications |
| `/api/v1/push/unsubscribe` | POST | Unsubscribe |
| `/api/v1/push/test` | POST | Send test notification |

#### Subscribing to Push

```jsx
import { usePWA } from '../contexts/PWAContext';

function NotificationSettings() {
    const { requestNotificationPermission } = usePWA();

    const handleEnable = async () => {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            console.log('Push notifications enabled!');
        }
    };
}
```

#### Sending Notifications (Backend)

```php
use App\Models\PushSubscription;

// Get user's subscriptions
$subscriptions = PushSubscription::forUser($userId)->active()->get();

// Send notification (requires minishlink/web-push package)
foreach ($subscriptions as $subscription) {
    // Use your notification service
}
```

### PWA Components

#### Install Banner
```jsx
import { PWAInstallBanner } from '../components/PWAComponents';
// Automatically shows when app is installable
```

#### Offline Indicator
```jsx
import { OfflineIndicator } from '../components/PWAComponents';
// Shows banner when offline
```

#### Online Status Badge
```jsx
import { OnlineStatusBadge } from '../components/PWAComponents';
// Shows connection status in navbar
```

#### Sync Status Card
```jsx
import { SyncStatusCard } from '../components/PWAComponents';
// Detailed sync status for settings page
```

## Service Worker

The service worker (`public/sw.js`) handles:

### Caching Strategies

| Resource Type | Strategy |
|---------------|----------|
| Static assets (JS, CSS, images) | Cache First |
| API requests | Network First, fallback to cache |
| Offline page | Pre-cached |

### Background Sync

When offline sales/payments are created, they're queued for background sync:

```javascript
// Register sync (done automatically)
registration.sync.register('sync-sales');
registration.sync.register('sync-payments');
```

### Cache Management

```javascript
// Cache version
const CACHE_NAME = 'factorypulse-v1';

// Pre-cached files
const PRECACHE_FILES = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icons/icon.svg'
];
```

## Troubleshooting

### Service Worker Not Registering

1. Ensure HTTPS (required for service workers)
2. Check browser console for errors
3. Try unregistering and re-registering:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
       regs.forEach(reg => reg.unregister());
   });
   ```

### Offline Data Not Syncing

1. Check IndexedDB in DevTools > Application > Storage
2. Verify network connection
3. Check `pending_sales` store for queued items
4. Trigger manual sync: Settings > Sync Now

### Push Notifications Not Working

1. Ensure VAPID keys are configured in `.env`
2. Check notification permissions in browser
3. Verify subscription in `push_subscriptions` table
4. Test with: `POST /api/v1/push/test`

### Icons Not Showing

1. Generate PNG icons using the script
2. Verify icons exist in `/public/icons/`
3. Check manifest.json paths
4. Clear browser cache

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PWA Install | ✅ | ❌ | ✅* | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ✅* | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |

*Safari requires additional setup for some features

## File Structure

```
public/
├── manifest.json          # PWA manifest
├── sw.js                   # Service worker
├── offline.html           # Offline fallback page
└── icons/
    ├── icon.svg           # SVG icon (scalable)
    ├── icon-72x72.png     # Small icon
    ├── icon-192x192.png   # Medium icon
    └── icon-512x512.png   # Large icon

resources/js/
├── contexts/
│   └── PWAContext.jsx     # PWA state management
├── services/
│   └── OfflineStorage.js  # IndexedDB operations
├── hooks/
│   └── useOfflinePOS.js   # Offline POS hook
└── components/
    └── PWAComponents.jsx  # UI components

app/
├── Http/Controllers/Api/
│   └── PushNotificationController.php
└── Models/
    └── PushSubscription.php

scripts/
├── generate-icons.sh      # Icon generation
└── generate-vapid-keys.sh # VAPID key generation
```
