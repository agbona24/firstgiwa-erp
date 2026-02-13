import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import offlineStorage from '../services/OfflineStorage';

const PWAContext = createContext();

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}

export function PWAProvider({ children }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [swRegistration, setSwRegistration] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);
    const [isOfflineReady, setIsOfflineReady] = useState(false);

    // Check if app is running in standalone mode (installed)
    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
        setIsInstalled(isStandalone);
    }, []);

    // Online/Offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log('🌐 Back online');
            // Trigger sync when back online
            triggerSync();
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.log('📴 Went offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Capture install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
            
            // Check if user dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            const dismissedAt = dismissed ? new Date(dismissed) : null;
            const daysSinceDismissed = dismissedAt 
                ? (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
                : Infinity;

            // Show banner if not dismissed recently (7 days)
            if (daysSinceDismissed > 7) {
                setShowInstallBanner(true);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setShowInstallBanner(false);
            setInstallPrompt(null);
            console.log('✅ PWA installed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            registerServiceWorker();
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            setSwRegistration(registration);
            console.log('✅ Service Worker registered');

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setUpdateAvailable(true);
                        console.log('🔄 Update available');
                    }
                });
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SYNC_COMPLETE') {
                    refreshSyncStatus();
                }
            });

            // Check if offline ready
            if (registration.active) {
                setIsOfflineReady(true);
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    // Trigger install prompt
    const promptInstall = useCallback(async () => {
        if (!installPrompt) {
            console.log('Install prompt not available');
            return false;
        }

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
        
        setInstallPrompt(null);
        setShowInstallBanner(false);
        return outcome === 'accepted';
    }, [installPrompt]);

    // Dismiss install banner
    const dismissInstallBanner = useCallback(() => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    }, []);

    // Apply update
    const applyUpdate = useCallback(() => {
        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }, [swRegistration]);

    // Trigger background sync
    const triggerSync = useCallback(async () => {
        if (swRegistration && 'sync' in swRegistration) {
            try {
                await swRegistration.sync.register('sync-sales');
                await swRegistration.sync.register('sync-payments');
                console.log('🔄 Background sync triggered');
            } catch (error) {
                console.error('Background sync failed:', error);
            }
        }
    }, [swRegistration]);

    // Refresh sync status
    const refreshSyncStatus = useCallback(async () => {
        try {
            const status = await offlineStorage.getSyncStatus();
            setSyncStatus(status);
        } catch (error) {
            console.error('Failed to get sync status:', error);
        }
    }, []);

    // Initial sync status
    useEffect(() => {
        refreshSyncStatus();
    }, [refreshSyncStatus]);

    // Subscribe to push notifications
    const subscribeToPush = useCallback(async () => {
        if (!swRegistration || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return null;
        }

        try {
            // Get VAPID public key from server
            const response = await fetch('/api/push/vapid-key');
            const { publicKey } = await response.json();

            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });

            console.log('✅ Push subscription successful');
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return null;
        }
    }, [swRegistration]);

    // Check push permission
    const checkPushPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }, []);

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await subscribeToPush();
        }
        return permission;
    }, [subscribeToPush]);

    // Cache data for offline use
    const cacheForOffline = useCallback(async (apiClient) => {
        try {
            await offlineStorage.fullSync(apiClient);
            await refreshSyncStatus();
            return true;
        } catch (error) {
            console.error('Cache for offline failed:', error);
            return false;
        }
    }, [refreshSyncStatus]);

    const value = {
        // Status
        isOnline,
        isOffline: !isOnline,
        isInstallable,
        isInstalled,
        isOfflineReady,
        updateAvailable,
        syncStatus,

        // Install
        showInstallBanner,
        promptInstall,
        dismissInstallBanner,

        // Update
        applyUpdate,

        // Sync
        triggerSync,
        refreshSyncStatus,
        cacheForOffline,

        // Push notifications
        subscribeToPush,
        checkPushPermission,
        requestNotificationPermission,

        // Service worker
        swRegistration
    };

    return (
        <PWAContext.Provider value={value}>
            {children}
        </PWAContext.Provider>
    );
}

// Helper function to convert base64 to Uint8Array for VAPID
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default PWAContext;
