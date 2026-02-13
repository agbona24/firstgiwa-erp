import { usePWA } from '../contexts/PWAContext';

function IconBase({ className = '', children, viewBox = '0 0 24 24' }) {
    return (
        <svg
            className={className}
            viewBox={viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

function X({ className }) {
    return <IconBase className={className}><path d="M18 6L6 18M6 6l12 12" /></IconBase>;
}

function Download({ className }) {
    return <IconBase className={className}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></IconBase>;
}

function Smartphone({ className }) {
    return <IconBase className={className}><rect x="7" y="2" width="10" height="20" rx="2" ry="2" /><path d="M12 18h.01" /></IconBase>;
}

function Wifi({ className }) {
    return <IconBase className={className}><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><path d="M12 20h.01" /></IconBase>;
}

function WifiOff({ className }) {
    return <IconBase className={className}><path d="M1 1l22 22" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a11 11 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.58 9" /><path d="M8.53 16.11a6 6 0 0 1 3.47-1.11" /><path d="M12 20h.01" /></IconBase>;
}

function RefreshCw({ className }) {
    return <IconBase className={className}><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></IconBase>;
}

function Check({ className }) {
    return <IconBase className={className}><path d="M20 6 9 17l-5-5" /></IconBase>;
}

function Bell({ className }) {
    return <IconBase className={className}><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M9 17a3 3 0 0 0 6 0" /></IconBase>;
}

/**
 * PWA Install Banner - Shows when app can be installed
 */
export function PWAInstallBanner() {
    const { showInstallBanner, promptInstall, dismissInstallBanner } = usePWA();

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-2xl p-4 text-white">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-white/20 rounded-lg p-3">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">Install FactoryPulse</h3>
                        <p className="text-blue-100 text-sm mt-1">
                            Install our app for faster access and offline support
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={promptInstall}
                                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Install Now
                            </button>
                            <button
                                onClick={dismissInstallBanner}
                                className="px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={dismissInstallBanner}
                        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Offline Indicator - Shows when user is offline
 */
export function OfflineIndicator() {
    const { isOffline, syncStatus } = usePWA();

    if (!isOffline) return null;

    const pendingCount = syncStatus
        ? syncStatus.pendingSales + syncStatus.pendingPayments
        : 0;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-900 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    <span className="font-medium text-sm">You're offline</span>
                    {pendingCount > 0 && (
                        <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {pendingCount} pending sync
                        </span>
                    )}
                </div>
                <span className="text-xs opacity-75">
                    Changes will sync when you're back online
                </span>
            </div>
        </div>
    );
}

/**
 * Online Status Badge - Shows in header/navbar
 */
export function OnlineStatusBadge({ className = '' }) {
    const { isOnline, syncStatus, triggerSync } = usePWA();

    const pendingCount = syncStatus
        ? syncStatus.pendingSales + syncStatus.pendingPayments
        : 0;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {isOnline ? (
                <div className="flex items-center gap-1.5 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Online</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-amber-500">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Offline</span>
                </div>
            )}
            {pendingCount > 0 && (
                <button
                    onClick={triggerSync}
                    className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full hover:bg-amber-200 transition-colors"
                    title={`${pendingCount} items pending sync`}
                >
                    <RefreshCw className="w-3 h-3" />
                    {pendingCount}
                </button>
            )}
        </div>
    );
}

/**
 * Update Available Banner
 */
export function UpdateBanner() {
    const { updateAvailable, applyUpdate } = usePWA();

    if (!updateAvailable) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
            <div className="bg-slate-900 text-white rounded-lg shadow-xl p-4 max-w-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-green-500/20 rounded-full p-2">
                        <RefreshCw className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium">Update Available</h4>
                        <p className="text-slate-400 text-sm mt-1">
                            A new version of FactoryPulse is ready
                        </p>
                        <button
                            onClick={applyUpdate}
                            className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Update Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Notification Permission Card
 */
export function NotificationPermissionCard({ onComplete }) {
    const { requestNotificationPermission, checkPushPermission } = usePWA();

    const handleEnable = async () => {
        const permission = await requestNotificationPermission();
        onComplete?.(permission);
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-blue-500/20 rounded-xl p-3">
                    <Bell className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Enable Notifications</h3>
                    <p className="text-slate-400 mt-1">
                        Get instant alerts for low stock, new orders, and payment updates
                    </p>
                    <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            Low stock alerts
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            New order notifications
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            Payment reminders
                        </li>
                    </ul>
                    <button
                        onClick={handleEnable}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Enable Notifications
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Sync Status Card - Shows detailed sync information
 */
export function SyncStatusCard() {
    const { syncStatus, isOnline, triggerSync, refreshSyncStatus } = usePWA();

    if (!syncStatus) return null;

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Sync Status</h3>
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                            <Wifi className="w-4 h-4" />
                            Online
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-400 text-sm">
                            <WifiOff className="w-4 h-4" />
                            Offline
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">
                        {syncStatus.pendingSales}
                    </div>
                    <div className="text-sm text-slate-400">Pending Sales</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">
                        {syncStatus.pendingPayments}
                    </div>
                    <div className="text-sm text-slate-400">Pending Payments</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">
                        {syncStatus.productsCached}
                    </div>
                    <div className="text-sm text-slate-400">Cached Products</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">
                        {syncStatus.customersCached}
                    </div>
                    <div className="text-sm text-slate-400">Cached Customers</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                    Last synced: {formatTime(syncStatus.productsCache?.cachedAt)}
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={triggerSync}
                        disabled={!isOnline}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sync Now
                    </button>
                    <button
                        onClick={refreshSyncStatus}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-slideUp {
    animation: slideUp 0.3s ease-out;
}
`;
if (typeof document !== 'undefined') {
    document.head.appendChild(style);
}
