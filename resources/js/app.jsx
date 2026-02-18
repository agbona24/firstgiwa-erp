import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './hooks/useConfirm';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { BranchProvider } from './contexts/BranchContext';
import { PWAProvider } from './contexts/PWAContext';
import OnboardingTour from './components/OnboardingTour';
import TutorialModal from './components/TutorialModal';
import { PWAInstallBanner, OfflineIndicator, UpdateBanner } from './components/PWAComponents';
import SetupWizard from './pages/setup/SetupWizard';
import InstallWizard from './pages/install/InstallWizard';
import ErrorBoundary from './components/ErrorBoundary';
import PermissionGuard from './components/PermissionGuard';
import TutorialCenter from './pages/TutorialCenter';
import { checkSetupStatus } from './services/setupAPI';

// Lazy-loaded landing page (not bundled with authenticated app)
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));

// Lazy-loaded Super Admin panel
const SuperAdminLayout = lazy(() => import('./components/admin/SuperAdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTenantList = lazy(() => import('./pages/admin/TenantList'));
const TenantCreate = lazy(() => import('./pages/admin/TenantCreate'));
const TenantDetail = lazy(() => import('./pages/admin/TenantDetail'));
const AdminUserListPage = lazy(() => import('./pages/admin/AdminUserList'));
const SystemHealth = lazy(() => import('./pages/admin/SystemHealth'));
const ActivityLogsPage = lazy(() => import('./pages/admin/ActivityLogs'));
const PlanList = lazy(() => import('./pages/admin/PlanList'));
const PlanForm = lazy(() => import('./pages/admin/PlanForm'));
const LandingPageEditor = lazy(() => import('./pages/admin/LandingPageEditor'));

// Module Pages
import InventoryList from './pages/inventory/InventoryList';
import PurchaseOrderList from './pages/purchase-orders/PurchaseOrderList';
import SalesOrderList from './pages/sales-orders/SalesOrderList';
import POSTerminal from './pages/pos/POSTerminal';
import SessionReports from './pages/pos/SessionReports';
import PaymentList from './pages/payments/PaymentList';
import UserList from './pages/users/UserList';
import TransactionLedger from './pages/accounting/TransactionLedger';
import AuditLog from './pages/audit/AuditLog';

// New Module Pages
import CustomerList from './pages/customers/CustomerList';
import SupplierList from './pages/suppliers/SupplierList';
import FormulaList from './pages/formulas/FormulaList';
import ProductionList from './pages/production/ProductionList';
import ProductionDashboard from './pages/production/ProductionDashboard';
import ExpenseList from './pages/expenses/ExpenseList';
import StaffList from './pages/staff/StaffList';
import PayrollList from './pages/payroll/PayrollList';
import ProfitAndLoss from './pages/accounting/ProfitAndLoss';
import Settings from './pages/settings/Settings';
import CreditFacilityList from './pages/credit-facility/CreditFacilityList';
import CreditPayments from './pages/credit-facility/CreditPayments';

// Sub-pages (create/detail workflows)
import CreateBooking from './pages/sales-orders/CreateBooking';
import CustomerLedger from './pages/customers/CustomerLedger';
import CollectPayment from './pages/payments/CollectPayment';
import CreatePurchaseOrder from './pages/purchase-orders/CreatePurchaseOrder';
import ReceiveDelivery from './pages/purchase-orders/ReceiveDelivery';
import CreateProductionRun from './pages/production/CreateProductionRun';
import EditProductionRun from './pages/production/EditProductionRun';
import CreateExpense from './pages/expenses/CreateExpense';
import StaffProfile from './pages/staff/StaffProfile';
import ProcessPayroll from './pages/payroll/ProcessPayroll';
import VATReport from './pages/accounting/VATReport';
import BalanceSheet from './pages/accounting/BalanceSheet';
import AssetList from './pages/assets/AssetList';
import Notifications from './pages/Notifications';
import { getCurrencyConfig, getCurrencySymbol, formatCurrency } from './utils/currency';

if (typeof window !== 'undefined') {
    window.getCurrencyConfig = getCurrencyConfig;
    window.getCurrencySymbol = getCurrencySymbol;
    window.formatCurrency = formatCurrency;
}

function App() {
    const { user, loading } = useAuth();
    const [appStatus, setAppStatus] = useState({ checking: true, needsInstall: false, needsSetup: false });

    useEffect(() => {
        checkAppStatus();
    }, []);

    const checkAppStatus = async () => {
        // Skip check if we're already on install or setup page
        const path = window.location.pathname;
        if (path === '/install' || path === '/setup') {
            setAppStatus({ checking: false, needsInstall: false, needsSetup: false });
            return;
        }

        // Skip check if user is already logged in — app is obviously installed
        const token = localStorage.getItem('auth_token');
        if (token) {
            setAppStatus({ checking: false, needsInstall: false, needsSetup: false });
            return;
        }

        try {
            const status = await checkSetupStatus();
            if (status.needs_install) {
                setAppStatus({ checking: false, needsInstall: true, needsSetup: false });
            } else if (!status.setup_complete) {
                setAppStatus({ checking: false, needsInstall: false, needsSetup: true });
            } else {
                setAppStatus({ checking: false, needsInstall: false, needsSetup: false });
            }
        } catch (error) {
            // Don't assume needs install on API errors — let the app proceed
            console.log('Status check failed, proceeding normally');
            setAppStatus({ checking: false, needsInstall: false, needsSetup: false });
        }
    };

    if (loading || appStatus.checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to install if APP_INSTALLED=false
    if (appStatus.needsInstall && window.location.pathname !== '/install') {
        window.location.href = '/install';
        return null;
    }

    // Redirect to setup if installed but not set up
    if (appStatus.needsSetup && window.location.pathname !== '/setup' && window.location.pathname !== '/install') {
        window.location.href = '/setup';
        return null;
    }

    return (
        <ToastProvider>
            <ConfirmProvider>
                <PWAProvider>
                <BranchProvider isAuthenticated={!!user}>
                <OnboardingProvider>
                <TutorialProvider>
                <OnboardingTour />
                <TutorialModal />
                <PWAInstallBanner />
                <OfflineIndicator />
                <UpdateBanner />
                <Routes>
                    {/* Installation Wizard */}
                    <Route path="/install" element={<InstallWizard />} />
                    
                    {/* Setup Wizard */}
                    <Route path="/setup" element={<SetupWizard />} />

                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={!user ? <Login /> : <Navigate to={user.is_system_admin ? '/admin' : '/dashboard'} replace />}
                    />
                    <Route
                        path="/signup"
                        element={!user ? <Signup /> : <Navigate to={user.is_system_admin ? '/admin' : '/dashboard'} replace />}
                    />

                    {/* Super Admin Panel */}
                    <Route path="/admin" element={
                        user?.is_system_admin ? (
                            <Suspense fallback={
                                <div className="min-h-screen flex items-center justify-center bg-slate-800">
                                    <div className="spinner w-12 h-12"></div>
                                </div>
                            }>
                                <SuperAdminLayout />
                            </Suspense>
                        ) : user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                    }>
                        <Route index element={<Suspense fallback={null}><AdminDashboard /></Suspense>} />
                        <Route path="tenants" element={<Suspense fallback={null}><AdminTenantList /></Suspense>} />
                        <Route path="tenants/create" element={<Suspense fallback={null}><TenantCreate /></Suspense>} />
                        <Route path="tenants/:id" element={<Suspense fallback={null}><TenantDetail /></Suspense>} />
                        <Route path="plans" element={<Suspense fallback={null}><PlanList /></Suspense>} />
                        <Route path="plans/create" element={<Suspense fallback={null}><PlanForm /></Suspense>} />
                        <Route path="plans/:id/edit" element={<Suspense fallback={null}><PlanForm /></Suspense>} />
                        <Route path="landing-page" element={<Suspense fallback={null}><LandingPageEditor /></Suspense>} />
                        <Route path="users" element={<Suspense fallback={null}><AdminUserListPage /></Suspense>} />
                        <Route path="system" element={<Suspense fallback={null}><SystemHealth /></Suspense>} />
                        <Route path="activity" element={<Suspense fallback={null}><ActivityLogsPage /></Suspense>} />
                    </Route>

                    {/* Protected Routes with Layout */}
                    <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
                        {/* Dashboard - accessible to all authenticated users */}
                        <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/tutorials" element={<TutorialCenter />} />

                        {/* Inventory */}
                        <Route path="/inventory" element={<PermissionGuard permissions={['inventory.view']}><ErrorBoundary><InventoryList /></ErrorBoundary></PermissionGuard>} />

                        {/* Purchase Orders */}
                        <Route path="/purchase-orders" element={<PermissionGuard permissions={['purchases.view']}><PurchaseOrderList /></PermissionGuard>} />
                        <Route path="/purchase-orders/create" element={<PermissionGuard permissions={['purchases.create']}><CreatePurchaseOrder /></PermissionGuard>} />
                        <Route path="/purchase-orders/receive" element={<PermissionGuard permissions={['purchases.create']}><ReceiveDelivery /></PermissionGuard>} />

                        {/* Sales Orders */}
                        <Route path="/sales-orders" element={<PermissionGuard permissions={['sales.view']}><SalesOrderList /></PermissionGuard>} />
                        <Route path="/sales-orders/create" element={<PermissionGuard permissions={['sales.create']}><CreateBooking /></PermissionGuard>} />

                        {/* POS */}
                        <Route path="/pos" element={<PermissionGuard permissions={['pos.access']}><POSTerminal /></PermissionGuard>} />
                        <Route path="/pos/reports" element={<PermissionGuard permissions={['pos.access']}><SessionReports /></PermissionGuard>} />

                        {/* Contacts */}
                        <Route path="/customers" element={<PermissionGuard permissions={['sales.view']}><CustomerList /></PermissionGuard>} />
                        <Route path="/customers/:id/ledger" element={<PermissionGuard permissions={['sales.view']}><CustomerLedger /></PermissionGuard>} />
                        <Route path="/suppliers" element={<PermissionGuard permissions={['purchases.view']}><SupplierList /></PermissionGuard>} />

                        {/* Production */}
                        <Route path="/formulas" element={<PermissionGuard permissions={['production.view']}><ErrorBoundary><FormulaList /></ErrorBoundary></PermissionGuard>} />
                        <Route path="/production" element={<PermissionGuard permissions={['production.view']}><ProductionList /></PermissionGuard>} />
                        <Route path="/production/dashboard" element={<PermissionGuard permissions={['production.view']}><ProductionDashboard /></PermissionGuard>} />
                        <Route path="/production/new" element={<PermissionGuard permissions={['production.create']}><CreateProductionRun /></PermissionGuard>} />
                        <Route path="/production/create" element={<PermissionGuard permissions={['production.create']}><CreateProductionRun /></PermissionGuard>} />
                        <Route path="/production/edit/:id" element={<PermissionGuard permissions={['production.create']}><EditProductionRun /></PermissionGuard>} />

                        {/* Finance */}
                        <Route path="/payments" element={<PermissionGuard permissions={['payments.view']}><PaymentList /></PermissionGuard>} />
                        <Route path="/payments/collect" element={<PermissionGuard permissions={['payments.create']}><CollectPayment /></PermissionGuard>} />
                        <Route path="/expenses" element={<PermissionGuard permissions={['expenses.view']}><ExpenseList /></PermissionGuard>} />
                        <Route path="/expenses/create" element={<PermissionGuard permissions={['expenses.create']}><CreateExpense /></PermissionGuard>} />
                        <Route path="/credit-facility" element={<PermissionGuard permissions={['payments.view']}><CreditFacilityList /></PermissionGuard>} />
                        <Route path="/credit-payments" element={<PermissionGuard permissions={['payments.view']}><CreditPayments /></PermissionGuard>} />
                        <Route path="/accounting" element={<PermissionGuard permissions={['reports.view']}><TransactionLedger /></PermissionGuard>} />
                        <Route path="/accounting/balance-sheet" element={<PermissionGuard permissions={['reports.view']}><BalanceSheet /></PermissionGuard>} />
                        <Route path="/accounting/vat-report" element={<PermissionGuard permissions={['reports.view']}><VATReport /></PermissionGuard>} />
                        <Route path="/profit-loss" element={<PermissionGuard permissions={['reports.view']}><ProfitAndLoss /></PermissionGuard>} />
                        <Route path="/vat-report" element={<PermissionGuard permissions={['reports.view']}><VATReport /></PermissionGuard>} />
                        <Route path="/assets" element={<PermissionGuard permissions={['reports.view']}><AssetList /></PermissionGuard>} />

                        {/* HR & Payroll */}
                        <Route path="/staff" element={<PermissionGuard permissions={['payroll.view']}><StaffList /></PermissionGuard>} />
                        <Route path="/staff/:id" element={<PermissionGuard permissions={['payroll.view']}><StaffProfile /></PermissionGuard>} />
                        <Route path="/payroll" element={<PermissionGuard permissions={['payroll.view']}><PayrollList /></PermissionGuard>} />
                        <Route path="/payroll/process" element={<PermissionGuard permissions={['payroll.create']}><ProcessPayroll /></PermissionGuard>} />

                        {/* Administration */}
                        <Route path="/users" element={<PermissionGuard permissions={['users.view']}><UserList /></PermissionGuard>} />
                        <Route path="/settings" element={<PermissionGuard permissions={['settings.view']}><Settings /></PermissionGuard>} />
                        <Route path="/audit" element={<PermissionGuard permissions={['audit.view']}><AuditLog /></PermissionGuard>} />
                    </Route>

                    {/* Root — Landing page for visitors, dashboard for authenticated users */}
                    <Route
                        path="/"
                        element={
                            user ? (
                                <Navigate to={user.is_system_admin ? '/admin' : '/dashboard'} replace />
                            ) : (
                                <Suspense fallback={
                                    <div className="min-h-screen flex items-center justify-center bg-white">
                                        <div className="text-center">
                                            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                                        </div>
                                    </div>
                                }>
                                    <LandingPage />
                                </Suspense>
                            )
                        }
                    />

                    {/* 404 */}
                    <Route
                        path="*"
                        element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-6xl font-bold text-blue-800">404</h1>
                                    <p className="text-xl text-slate-600 mt-4">Page not found</p>
                                </div>
                            </div>
                        }
                    />
                </Routes>
                </TutorialProvider>
                </OnboardingProvider>
                </BranchProvider>
                </PWAProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}

export default App;
