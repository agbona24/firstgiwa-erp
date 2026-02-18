import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

function StatCard({ label, value, icon, color, linkTo, t }) {
    const colorMap = {
        blue: 'from-blue-500 to-blue-700',
        green: 'from-emerald-500 to-emerald-700',
        amber: 'from-amber-500 to-amber-700',
        red: 'from-red-500 to-red-700',
        purple: 'from-purple-500 to-purple-700',
        slate: 'from-slate-500 to-slate-700',
    };

    const card = (
        <div className={`border rounded-xl p-5 transition-colors ${t.cardBg} ${t.rowHover}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm ${t.textSecondary}`}>{label}</p>
                    <p className={`text-3xl font-bold mt-1 ${t.textPrimary}`}>{value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    if (linkTo) return <Link to={linkTo}>{card}</Link>;
    return card;
}

export default function AdminDashboard() {
    const { t } = useAdminTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setError('');
            const res = await getAdminDashboard();
            const payload = res?.data;
            const normalized = payload?.data && typeof payload.data === 'object'
                ? payload.data
                : payload;
            setData(normalized || {});
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            setData({});
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                setError('Unauthorized. Please login with a System Admin account.');
            } else {
                setError(err?.response?.data?.message || 'Failed to load dashboard data.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner w-10 h-10"></div>
            </div>
        );
    }

    const stats = data?.stats || {};

    return (
        <div className="space-y-6">
            {error && (
                <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                    {error}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Admin Dashboard</h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>Platform overview and management</p>
                </div>
                <Link
                    to="/admin/tenants/create"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + New Tenant
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard t={t} label="Total Tenants" value={stats.total_tenants || 0} color="blue" linkTo="/admin/tenants"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
                <StatCard t={t} label="Active" value={stats.active_tenants || 0} color="green"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard t={t} label="Trial" value={stats.trial_tenants || 0} color="amber"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard t={t} label="Suspended" value={stats.suspended_tenants || 0} color="red"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                />
                <StatCard t={t} label="Total Users" value={stats.total_users || 0} color="purple"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <StatCard t={t} label="New This Month" value={stats.new_tenants_this_month || 0} color="slate"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tenants by Plan */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${t.textPrimary}`}>Tenants by Plan</h3>
                    <div className="space-y-3">
                        {Object.entries(data?.tenants_by_plan || {}).map(([plan, count]) => (
                            <div key={plan} className="flex items-center justify-between">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                                    plan === 'enterprise' ? 'bg-purple-500/20 text-purple-500' :
                                    plan === 'professional' ? 'bg-blue-500/20 text-blue-500' :
                                    'bg-slate-500/20 text-slate-500'
                                }`}>{plan}</span>
                                <span className={`font-bold ${t.textPrimary}`}>{count}</span>
                            </div>
                        ))}
                        {Object.keys(data?.tenants_by_plan || {}).length === 0 && (
                            <p className={`text-sm ${t.textMuted}`}>No tenants yet</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${t.textPrimary}`}>Recent Activity</h3>
                    <div className="space-y-3">
                        {(data?.recent_activity || []).map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className={t.textSecondary}>
                                        <span className={`font-medium ${t.textPrimary}`}>{activity.user?.name}</span>
                                        {' '}
                                        <span>{activity.action.replace('.', ' ')}</span>
                                    </p>
                                    <p className={`text-xs mt-0.5 ${t.textMuted}`}>
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(data?.recent_activity || []).length === 0 && (
                            <p className={`text-sm ${t.textMuted}`}>No activity yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                <h3 className={`text-lg font-semibold mb-4 ${t.textPrimary}`}>Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <Link to="/admin/tenants/create" className="px-4 py-2 bg-blue-600/10 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-600/20 transition-colors border border-blue-600/20">
                        Create Tenant
                    </Link>
                    <Link to="/admin/tenants" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${t.pillBg} ${t.pillText}`}>
                        View All Tenants
                    </Link>
                    <Link to="/admin/system" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${t.pillBg} ${t.pillText}`}>
                        System Health
                    </Link>
                    <Link to="/admin/activity" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${t.pillBg} ${t.pillText}`}>
                        Activity Logs
                    </Link>
                </div>
            </div>
        </div>
    );
}
