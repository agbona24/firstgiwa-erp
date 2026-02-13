import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useOnboarding } from '../contexts/OnboardingContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dashboardAPI from '../services/dashboardAPI';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 0 });

export default function Dashboard() {
    const { user } = useAuth();
    const { tourComplete, startTour } = useOnboarding();
    const [loading, setLoading] = useState(true);
    
    // API data states
    const [inventory, setInventory] = useState([]);
    const [kpiData, setKpiData] = useState({
        revenue: { amount: 0, change: 0, month: '' },
        production: { output: 0, avg_loss: 0 },
        receivables: { amount: 0, overdue_count: 0 },
        expenses: { amount: 0, pending_count: 0 },
    });
    const [todayStats, setTodayStats] = useState({
        date: new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        sales_count: 0,
        sales_total: 0,
        payments_collected: 0,
        pos_transactions: 0,
        tickets_pending: 0,
        production_runs: 0,
        production_output: 0,
    });
    const [salesTrendData, setSalesTrendData] = useState([]);
    const [revenueExpensesData, setRevenueExpensesData] = useState([]);
    const [productionData, setProductionData] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [creditAlerts, setCreditAlerts] = useState([]);
    const [pendingItems, setPendingItems] = useState([]);
    const [plSummary, setPlSummary] = useState({
        month: '',
        revenue: 0,
        cogs: 0,
        expenses: 0,
        payroll: 0,
        net_profit: 0,
    });

    useEffect(() => {
        if (!tourComplete) {
            const timer = setTimeout(() => startTour(), 500);
            return () => clearTimeout(timer);
        }
    }, [tourComplete, startTour]);

    // Fetch all dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [
                    inventoryRes,
                    kpiRes,
                    todayRes,
                    salesTrendRes,
                    revenueExpensesRes,
                    productionHistoryRes,
                    activitiesRes,
                    creditAlertsRes,
                    pendingItemsRes,
                    plSummaryRes,
                ] = await Promise.all([
                    dashboardAPI.getInventory().catch(() => ({ data: [] })),
                    dashboardAPI.getKpiSummary().catch(() => ({ data: {} })),
                    dashboardAPI.getTodaySnapshot().catch(() => ({ data: {} })),
                    dashboardAPI.getSalesTrend().catch(() => ({ data: [] })),
                    dashboardAPI.getRevenueExpenses().catch(() => ({ data: [] })),
                    dashboardAPI.getProductionHistory().catch(() => ({ data: [] })),
                    dashboardAPI.getRecentActivities().catch(() => ({ data: [] })),
                    dashboardAPI.getCreditAlerts().catch(() => ({ data: [] })),
                    dashboardAPI.getPendingItems().catch(() => ({ data: [] })),
                    dashboardAPI.getPlSummary().catch(() => ({ data: {} })),
                ]);
                
                setInventory(inventoryRes.data || []);
                if (kpiRes.data && kpiRes.data.revenue) setKpiData(prev => ({ ...prev, ...kpiRes.data }));
                if (todayRes.data) setTodayStats(prev => ({ ...prev, ...todayRes.data }));
                setSalesTrendData(salesTrendRes.data || []);
                setRevenueExpensesData(revenueExpensesRes.data || []);
                setProductionData(productionHistoryRes.data || []);
                setRecentActivities(activitiesRes.data || []);
                setCreditAlerts(creditAlertsRes.data || []);
                setPendingItems(pendingItemsRes.data || []);
                if (plSummaryRes.data && plSummaryRes.data.month) setPlSummary(prev => ({ ...prev, ...plSummaryRes.data }));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Computed stock status data from inventory
    const stockStatusData = [
        { name: 'In Stock', value: inventory.filter(i => parseFloat(i.quantity) > parseFloat(i.reorder_level || 0)).length, color: '#10b981' },
        { name: 'Low Stock', value: inventory.filter(i => parseFloat(i.quantity) <= parseFloat(i.reorder_level || 0) && parseFloat(i.quantity) > 0).length, color: '#f59e0b' },
        { name: 'Critical', value: inventory.filter(i => parseFloat(i.quantity) > 0 && parseFloat(i.quantity) <= 5).length, color: '#ef4444' },
        { name: 'Out of Stock', value: inventory.filter(i => parseFloat(i.quantity) === 0).length, color: '#6b7280' },
    ];

    // Computed low stock alerts from inventory
    const lowStockAlerts = inventory
        .filter(i => parseFloat(i.quantity) <= parseFloat(i.reorder_level || 10))
        .slice(0, 5)
        .map(i => ({
            id: i.id,
            product: i.product?.name || `Product ${i.product_id}`,
            current: parseFloat(i.quantity),
            threshold: parseFloat(i.reorder_level || 10),
            unit: i.product?.unit?.abbreviation || 'pcs',
            severity: parseFloat(i.quantity) === 0 ? 'out' : parseFloat(i.quantity) <= 5 ? 'critical' : 'warning'
        }));

    const modules = [
        { name: 'Inventory', path: '/inventory', description: 'Stock & warehouses', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        )},
        { name: 'Production', path: '/production', description: 'Runs & output', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        )},
        { name: 'Sales Orders', path: '/sales-orders', description: 'Bookings & invoices', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        )},
        { name: 'Purchase Orders', path: '/purchase-orders', description: 'Procurement', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        )},
        { name: 'POS System', path: '/pos', description: 'Point of sale', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
        )},
        { name: 'Customers', path: '/customers', description: 'Accounts & credit', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        )},
        { name: 'Payments', path: '/payments', description: 'Transactions', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        )},
        { name: 'Expenses', path: '/expenses', description: 'Cost tracking', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        )},
        { name: 'Formulas', path: '/formulas', description: 'Recipes & mixes', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
        )},
        { name: 'Profit & Loss', path: '/profit-loss', description: 'P&L reports', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        )},
        { name: 'Staff', path: '/staff', description: 'HR management', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
        )},
        { name: 'Payroll', path: '/payroll', description: 'Salary processing', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )},
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
                <p className="text-slate-600 mt-2">Welcome back, {user?.name}! Here's your business overview.</p>
            </div>

            {/* Top KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tour="dashboard-cards">
                <Link to="/profit-loss" className="block hover:scale-[1.02] transition-transform">
                    <Card className="border-l-4 border-blue-600 h-full">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Revenue ({kpiData.revenue?.month || ''})</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(kpiData.revenue?.amount || 0)}</p>
                                    <p className={`text-sm mt-1 font-medium ${(kpiData.revenue?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(kpiData.revenue?.change || 0) >= 0 ? '+' : ''}{kpiData.revenue?.change || 0}% vs last month
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Link>

                <Link to="/production" className="block hover:scale-[1.02] transition-transform">
                    <Card className="border-l-4 border-green-600 h-full">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Production Output</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{(kpiData.production?.output || 0).toLocaleString()} kg</p>
                                    <p className="text-sm text-slate-500 mt-1">Avg loss: {kpiData.production?.avg_loss || 0}%</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Link>

                <Link to="/customers" className="block hover:scale-[1.02] transition-transform">
                    <Card className="border-l-4 border-orange-600 h-full">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Outstanding Receivables</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(kpiData.receivables?.amount || 0)}</p>
                                    <p className="text-sm text-red-600 mt-1 font-medium">{kpiData.receivables?.overdue_count || 0} overdue</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Link>

                <Link to="/expenses" className="block hover:scale-[1.02] transition-transform">
                    <Card className="border-l-4 border-purple-600 h-full">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Expenses ({kpiData.revenue?.month || ''})</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(kpiData.expenses?.amount || 0)}</p>
                                    <p className="text-sm text-orange-600 mt-1 font-medium">{kpiData.expenses?.pending_count || 0} pending approval</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Link>
            </div>

            {/* Today's Snapshot */}
            <Card className="mb-8 border-2 border-blue-100 bg-blue-50/30">
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Today's Snapshot</h3>
                            <p className="text-xs text-slate-500">{todayStats.date}</p>
                        </div>
                        <Badge variant="approved">Live</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-blue-700">{todayStats.sales_count}</p>
                            <p className="text-xs text-slate-500 mt-1">Sales Orders</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-green-700">{fmt(todayStats.sales_total)}</p>
                            <p className="text-xs text-slate-500 mt-1">Sales Value</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-emerald-700">{fmt(todayStats.payments_collected)}</p>
                            <p className="text-xs text-slate-500 mt-1">Payments</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-indigo-700">{todayStats.pos_transactions}</p>
                            <p className="text-xs text-slate-500 mt-1">POS Sales</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-amber-700">{todayStats.tickets_pending}</p>
                            <p className="text-xs text-slate-500 mt-1">Pending Tickets</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-teal-700">{todayStats.production_runs}</p>
                            <p className="text-xs text-slate-500 mt-1">Prod. Runs</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-2xl font-bold text-teal-700">{(todayStats.production_output || 0).toLocaleString()} kg</p>
                            <p className="text-xs text-slate-500 mt-1">Output</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardBody>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Daily Sales (Last 7 Days)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={salesTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${window.formatCurrency((v/1000000).toFixed(1))}M`} />
                                <Tooltip formatter={(v) => fmt(v)} />
                                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue vs Expenses (5 Months)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={revenueExpensesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${window.formatCurrency((v/1000000).toFixed(0))}M`} />
                                <Tooltip formatter={(v) => fmt(v)} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4,4,0,0]} />
                                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4,4,0,0]} />
                                <Bar dataKey="profit" fill="#22c55e" name="Profit" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardBody>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Status</h3>
                        <div className="flex items-center gap-8">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie data={stockStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={false}>
                                        {stockStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-3">
                                {stockStatusData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-slate-600">{item.name}</span>
                                        <span className="text-sm font-bold text-slate-900 ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Production Output (Last 5 Days)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={productionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}t`} />
                                <Tooltip formatter={(v, name) => [`${v.toLocaleString()} kg`, name === 'output' ? 'Output' : 'Loss']} />
                                <Legend />
                                <Bar dataKey="output" fill="#22c55e" name="Output (kg)" radius={[4,4,0,0]} />
                                <Bar dataKey="loss" fill="#f97316" name="Loss (kg)" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            </div>

            {/* Activity + Pending Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
                            <div className="space-y-1">
                                {recentActivities.map((a) => (
                                    <div key={a.id} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-lg transition">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">
                                            {a.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900">
                                                <span className="font-semibold">{a.user}</span>{' '}{a.action}
                                            </p>
                                            <p className="text-sm text-blue-600 font-medium truncate">{a.entity}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="space-y-4">
                    {/* Pending Actions */}
                    <Card>
                        <CardBody>
                            <h4 className="text-sm font-bold text-slate-900 mb-3">Pending Actions</h4>
                            <div className="space-y-2">
                                {pendingItems.map((item, i) => (
                                    <Link key={i} to={item.path} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition">
                                        <span className="text-sm text-slate-700">{item.label}</span>
                                        <Badge variant={item.color === 'red' ? 'rejected' : item.color === 'orange' ? 'pending' : 'draft'}>{item.count}</Badge>
                                    </Link>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Low Stock Alerts */}
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-900">Low Stock Alerts</h4>
                                <Link to="/inventory" className="text-xs text-blue-600 hover:text-blue-800">View all →</Link>
                            </div>
                            <div className="space-y-2">
                                {lowStockAlerts.map((item) => (
                                    <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-lg ${item.severity === 'out' ? 'bg-red-50 border border-red-200' : item.severity === 'critical' ? 'bg-amber-50 border border-amber-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                                        <div>
                                            <span className="text-sm font-medium text-slate-800">{item.product}</span>
                                            <p className="text-xs text-slate-500">{item.current} / {item.threshold} {item.unit}</p>
                                        </div>
                                        <Badge variant={item.severity === 'out' ? 'rejected' : 'pending'}>
                                            {item.severity === 'out' ? 'Out' : item.severity === 'critical' ? 'Critical' : 'Low'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Credit Alerts */}
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-900">Credit Alerts</h4>
                                <Link to="/credit-facility" className="text-xs text-blue-600 hover:text-blue-800">Manage →</Link>
                            </div>
                            <div className="space-y-2">
                                {creditAlerts.map((c, i) => {
                                    const pct = Math.round((c.credit_used / c.credit_limit) * 100);
                                    return (
                                        <div key={i} className={`p-2.5 rounded-lg ${c.status === 'blocked' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-800">{c.customer}</span>
                                                <Badge variant={c.status === 'blocked' ? 'rejected' : 'pending'}>
                                                    {c.status === 'blocked' ? 'Blocked' : `${pct}%`}
                                                </Badge>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{fmt(c.credit_used)} / {fmt(c.credit_limit)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Quick Financial Summary */}
                    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <CardBody>
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">{plSummary.month} P&L Summary</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-400">Revenue</span><span className="font-semibold">{fmt(plSummary.revenue)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">COGS</span><span className="text-red-400">-{fmt(plSummary.cogs)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Expenses</span><span className="text-red-400">-{fmt(plSummary.expenses)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Payroll</span><span className="text-red-400">-{fmt(plSummary.payroll)}</span></div>
                                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                                    <span className="font-semibold text-slate-200">Net Profit</span>
                                    <span className={`font-bold ${plSummary.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(plSummary.net_profit)}</span>
                                </div>
                            </div>
                            <Link to="/profit-loss" className="block text-center text-xs text-blue-400 hover:text-blue-300 mt-3">View full P&L report →</Link>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Quick Access Modules */}
            <Card>
                <CardBody className="p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Quick Access</h3>
                    <p className="text-sm text-slate-500 mb-6">Jump to any module</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {modules.map((m, i) => (
                            <Link
                                key={i}
                                to={m.path}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition group"
                            >
                                <div className="text-slate-500 group-hover:text-blue-600 transition">{m.icon}</div>
                                <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{m.name}</span>
                                <span className="text-xs text-slate-400">{m.description}</span>
                            </Link>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
