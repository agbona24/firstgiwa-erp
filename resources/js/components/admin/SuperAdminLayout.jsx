import { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SuperAdminSidebar from './SuperAdminSidebar';
import api, { setAuthToken } from '../../services/api';
import { AdminThemeProvider, useAdminTheme } from '../../contexts/AdminThemeContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

function ThemeToggle() {
    const { isDark, toggleTheme } = useAdminTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isDark ? 'translate-x-7 bg-slate-500' : 'translate-x-0 bg-white shadow-sm'}`}>
                {isDark ? (
                    <svg className="w-3.5 h-3.5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                ) : (
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
            </span>
        </button>
    );
}

function AdminLayoutInner() {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useAdminTheme();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const isImpersonating = sessionStorage.getItem('admin_token') !== null;

    if (!user?.is_system_admin) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleExitImpersonation = () => {
        const adminToken = sessionStorage.getItem('admin_token');
        const adminUser = JSON.parse(sessionStorage.getItem('admin_user') || 'null');

        if (adminToken && adminUser) {
            setAuthToken(adminToken);
            setUser(adminUser);
            sessionStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_user');
            navigate('/admin');
        }
    };

    const handleLogout = async () => {
        setShowProfileMenu(false);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setChangingPassword(true);
        try {
            await api.post('/change-password', passwordForm);
            setShowPasswordModal(false);
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (error) {
            setPasswordError(error?.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className={`flex h-screen overflow-hidden ${t.pageBg}`}>
            <SuperAdminSidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className={`border-b px-4 md:px-6 py-3 flex items-center justify-between ${t.headerBg}`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className={`md:hidden ${t.textSecondary}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className={`text-lg font-semibold hidden sm:block ${t.textPrimary}`}>System Administration</h1>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        <ThemeToggle />
                        <button
                            onClick={() => setShowProfileMenu((v) => !v)}
                            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100/10 transition"
                        >
                            <div className="text-right hidden sm:block">
                                <p className={`text-sm font-medium ${t.textPrimary}`}>{user?.name}</p>
                                <p className={`text-xs ${t.textMuted}`}>{user?.email}</p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl py-2 z-20 border border-slate-200">
                                    <button
                                        onClick={() => {
                                            setShowProfileSettings(true);
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        Manage Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPasswordModal(true);
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        Change Password
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Impersonation Banner */}
                {isImpersonating && (
                    <div className="bg-amber-500 px-4 py-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">
                            You are impersonating a tenant user
                        </p>
                        <button
                            onClick={handleExitImpersonation}
                            className="px-3 py-1 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Exit Impersonation
                        </button>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>

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
                        <p className="text-xs text-slate-500">Profile update endpoint is not enabled yet. Use this for quick reference.</p>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setShowProfileSettings(false)}>Close</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" size="sm">
                <div className="p-6">
                    <form className="space-y-4" onSubmit={handleChangePassword}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                value={passwordForm.current_password}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={passwordForm.password}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                minLength={8}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordForm.password_confirmation}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                minLength={8}
                                required
                            />
                        </div>
                        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setShowPasswordModal(false)} type="button">Cancel</Button>
                            <Button variant="primary" type="submit" disabled={changingPassword}>
                                {changingPassword ? 'Saving...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default function SuperAdminLayout() {
    return (
        <AdminThemeProvider>
            <AdminLayoutInner />
        </AdminThemeProvider>
    );
}
