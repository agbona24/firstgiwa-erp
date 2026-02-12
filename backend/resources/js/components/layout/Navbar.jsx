import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../contexts/BranchContext';
import { notificationAPI } from '../../services/notificationAPI';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth();
    const { branches, selectedBranch, changeBranch } = useBranch();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showBranchSelector, setShowBranchSelector] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [companyName] = useState(() => localStorage.getItem('company_name') || 'ERP System');
    const searchRef = useRef(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoadingNotifications(true);
            const res = await notificationAPI.getAll({ per_page: 10 });
            if (res.data?.data) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unread_count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 60 seconds
        const pollInterval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(pollInterval);
    }, [fetchNotifications]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (showSearch && searchRef.current) searchRef.current.focus();
    }, [showSearch]);

    useEffect(() => {
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(s => !s);
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowQuickActions(false);
                setShowNotifications(false);
                setShowBranchSelector(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const quickActions = [
        { label: 'New Booking', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', path: '/sales-orders/create', color: 'text-blue-400' },
        { label: 'Collect Payment', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', path: '/payments/collect', color: 'text-green-400' },
        { label: 'Record Expense', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', path: '/expenses/create', color: 'text-orange-400' },
        { label: 'New Purchase Order', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z', path: '/purchase-orders/create', color: 'text-purple-400' },
        { label: 'Start Production Run', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', path: '/production/create', color: 'text-teal-400' },
        { label: 'POS Terminal', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', path: '/pos', color: 'text-indigo-400' },
    ];

    const searchResults = searchQuery.length >= 2 ? [
        { type: 'page', items: [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Inventory', path: '/inventory' },
            { label: 'Sales Orders', path: '/sales-orders' },
            { label: 'Purchase Orders', path: '/purchase-orders' },
            { label: 'Customers', path: '/customers' },
            { label: 'Suppliers', path: '/suppliers' },
            { label: 'Payments', path: '/payments' },
            { label: 'POS Terminal', path: '/pos' },
            { label: 'Production', path: '/production' },
            { label: 'Formulas', path: '/formulas' },
            { label: 'Expenses', path: '/expenses' },
            { label: 'Staff', path: '/staff' },
            { label: 'Payroll', path: '/payroll' },
            { label: 'Settings', path: '/settings' },
            { label: 'Profit & Loss', path: '/profit-loss' },
            { label: 'VAT Report', path: '/vat-report' },
            { label: 'Credit Facility', path: '/credit-facility' },
            { label: 'Audit Trail', path: '/audit-trail' },
        ].filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase())) },
        { type: 'action', items: quickActions.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase())) },
    ] : [];

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleLogout = async () => {
        // Close dropdown immediately
        setShowProfileMenu(false);
        
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const goTo = (path) => {
        navigate(path);
        setShowSearch(false);
        setShowQuickActions(false);
        setShowNotifications(false);
        setSearchQuery('');
    };

    const getNotifIcon = (type) => {
        switch (type) {
            case 'approval': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'stock': return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
            case 'payment': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'expense': return 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
            default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    };

    const getNotifColor = (type) => {
        switch (type) {
            case 'approval': return 'text-blue-500';
            case 'stock': return 'text-red-500';
            case 'payment': return 'text-amber-500';
            case 'expense': return 'text-orange-500';
            default: return 'text-teal-500';
        }
    };

    return (
        <>
            <nav className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg">
                <div className="px-4 md:px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Left: Menu + Branding */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onMenuClick}
                                className="lg:hidden p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h1 className="text-xl md:text-2xl font-bold text-white">{companyName}</h1>
                        </div>

                        {/* Center: Global Search */}
                        <div className="hidden md:flex flex-1 max-w-md mx-6" data-tour="global-search">
                            <button
                                onClick={() => setShowSearch(true)}
                                className="w-full flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-15 rounded-lg text-blue-200 text-sm transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span>Search orders, customers, products...</span>
                                <kbd className="ml-auto px-1.5 py-0.5 bg-white bg-opacity-10 rounded text-xs font-mono">Ctrl+K</kbd>
                            </button>
                        </div>

                        {/* Right: Toolbar items */}
                        <div className="flex items-center gap-1 md:gap-2">
                            {/* Date & Branch Selector (desktop) */}
                            <div className="hidden lg:flex items-center gap-2 mr-2">
                                <div className="text-right">
                                    <p className="text-xs font-medium text-blue-100">
                                        {currentTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="text-[10px] text-blue-300">
                                        {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-blue-700" />
                                
                                {/* Branch Selector Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowBranchSelector(!showBranchSelector); setShowQuickActions(false); setShowNotifications(false); setShowProfileMenu(false); }}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-lg transition shadow-sm"
                                    >
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span className="text-xs font-medium text-white">{selectedBranch?.name || 'Select Branch'}</span>
                                        <svg className="w-3 h-3 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    {/* Branch Dropdown Menu */}
                                    {showBranchSelector && (
                                        <>
                                            {/* Backdrop to close dropdown on outside click */}
                                            <div 
                                                className="fixed inset-0 z-40" 
                                                onClick={() => setShowBranchSelector(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                                                <div className="p-3 border-b border-slate-100">
                                                    <h4 className="text-sm font-semibold text-slate-900">Select Branch</h4>
                                                    <p className="text-xs text-slate-500">Switch to view data from another branch</p>
                                                </div>
                                                <div className="py-1 max-h-60 overflow-y-auto">
                                                    {branches.length === 0 ? (
                                                        <div className="px-4 py-3 text-sm text-slate-500">No branches available</div>
                                                    ) : (
                                                        branches.map(branch => (
                                                            <button
                                                                key={branch.id}
                                                                onClick={() => {
                                                                    changeBranch(branch.id);
                                                                    setShowBranchSelector(false);
                                                                    // Reload the page to refresh all data with new branch
                                                                    window.location.reload();
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition ${
                                                                    selectedBranch?.id === branch.id ? 'bg-blue-50' : ''
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                selectedBranch?.id === branch.id ? 'bg-blue-600' : 'bg-slate-200'
                                                            }`}>
                                                                <svg className={`w-4 h-4 ${selectedBranch?.id === branch.id ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${
                                                                    selectedBranch?.id === branch.id ? 'text-blue-700' : 'text-slate-900'
                                                                }`}>
                                                                    {branch.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">{branch.code || branch.location || `Branch #${branch.id}`}</p>
                                                            </div>
                                                            {selectedBranch?.id === branch.id && (
                                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mobile search */}
                            <button
                                onClick={() => setShowSearch(true)}
                                className="md:hidden p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            {/* Quick Actions */}
                            <div className="relative" data-tour="quick-actions">
                                <button
                                    onClick={() => { setShowQuickActions(!showQuickActions); setShowNotifications(false); setShowProfileMenu(false); }}
                                    className="p-2 bg-blue-700 text-white hover:bg-blue-600 rounded-lg transition shadow-sm"
                                    title="Quick Actions"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </button>
                                {showQuickActions && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowQuickActions(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-20">
                                            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</p>
                                            {quickActions.map((action, i) => (
                                                <button key={i} onClick={() => goTo(action.path)} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                                    <svg className={`w-4 h-4 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                                    </svg>
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Notifications */}
                            <div className="relative" data-tour="notifications">
                                <button
                                    onClick={() => { setShowNotifications(!showNotifications); setShowQuickActions(false); setShowProfileMenu(false); }}
                                    className="relative p-2 bg-blue-700 text-white hover:bg-blue-600 rounded-lg transition shadow-sm"
                                    title="Notifications"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20">
                                            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                                                {unreadCount > 0 && (
                                                    <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:text-blue-800">
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {loadingNotifications ? (
                                                    <div className="py-8 text-center">
                                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                        <p className="text-xs text-slate-400 mt-2">Loading...</p>
                                                    </div>
                                                ) : notifications.length === 0 ? (
                                                    <div className="py-8 text-center">
                                                        <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                        </svg>
                                                        <p className="text-sm text-slate-500 mt-2">No notifications</p>
                                                    </div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <button
                                                            key={notif.id}
                                                            onClick={() => {
                                                                if (!notif.read) handleMarkAsRead(notif.id);
                                                                goTo(notif.action_url || '/dashboard');
                                                            }}
                                                            className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-3 border-b border-slate-100 last:border-0 ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                                        >
                                                            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${notif.icon_color || getNotifColor(notif.type)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={notif.icon || getNotifIcon(notif.type)} />
                                                            </svg>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                                                                {notif.message && <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.message}</p>}
                                                                <p className="text-xs text-slate-400 mt-0.5">{notif.time_ago}</p>
                                                            </div>
                                                            {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                            <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
                                                <button onClick={() => goTo('/notifications')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all</button>
                                                {unreadCount > 0 && <Badge variant="warning">{unreadCount} unread</Badge>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profile */}
                            <div className="relative" data-tour="user-menu">
                                <button
                                    onClick={() => { setShowProfileMenu(!showProfileMenu); setShowQuickActions(false); setShowNotifications(false); }}
                                    className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 transition shadow-sm"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold border-2 border-amber-400">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                                        <p className="text-xs text-blue-200">{user?.email}</p>
                                    </div>
                                    <svg className="w-4 h-4 text-white hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-20">
                                            <div className="px-4 py-3 border-b border-slate-200">
                                                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                                                <p className="text-xs text-slate-600">{user?.email}</p>
                                            </div>
                                            <button onClick={() => { setShowProfileSettings(true); setShowProfileMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Profile Settings
                                            </button>
                                            <button onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                                Change Password
                                            </button>
                                            <div className="border-t border-slate-200 mt-2 pt-2">
                                                <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Global Search Modal (Cmd+K) */}
            {showSearch && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowSearch(false)} />
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search pages, orders, customers, products..."
                                className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none"
                            />
                            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500 font-mono">ESC</kbd>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {searchQuery.length < 2 ? (
                                <div className="p-4">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>
                                    {quickActions.map((action, i) => (
                                        <button key={i} onClick={() => goTo(action.path)} className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3">
                                            <svg className={`w-4 h-4 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                            </svg>
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-2">
                                    {searchResults[0]?.items.length > 0 && (
                                        <>
                                            <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages</p>
                                            {searchResults[0].items.map((item, i) => (
                                                <button key={i} onClick={() => goTo(item.path)} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    {item.label}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {searchResults[1]?.items.length > 0 && (
                                        <>
                                            <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Actions</p>
                                            {searchResults[1].items.map((item, i) => (
                                                <button key={i} onClick={() => goTo(item.path)} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3">
                                                    <svg className={`w-4 h-4 ${item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                                    </svg>
                                                    {item.label}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {searchResults[0]?.items.length === 0 && searchResults[1]?.items.length === 0 && (
                                        <div className="px-4 py-8 text-center text-sm text-slate-400">No results found for "{searchQuery}"</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <Modal isOpen={showProfileSettings} onClose={() => setShowProfileSettings(false)} title="Profile Settings" size="md">
                <div className="p-6">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                            <input type="text" defaultValue={user?.name} className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <input type="email" defaultValue={user?.email} className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setShowProfileSettings(false)}>Cancel</Button>
                            <Button variant="primary">Save Changes</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" size="sm">
                <div className="p-6">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                            <input type="password" className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                            <input type="password" className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                            <input type="password" className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                            <Button variant="primary">Update Password</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
