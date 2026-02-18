import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getTenant, updateTenant, suspendTenant, activateTenant, impersonateTenant, getTenantUsers } from '../../services/adminAPI';
import { setAuthToken } from '../../services/api';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-600',
    suspended: 'bg-red-500/20 text-red-600',
    trial: 'bg-amber-500/20 text-amber-600',
    cancelled: 'bg-slate-500/20 text-slate-500',
};

export default function TenantDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const { t } = useAdminTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [editForm, setEditForm] = useState({});
    const [suspendReason, setSuspendReason] = useState('');
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('');
    const [usersPagination, setUsersPagination] = useState({});
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        loadTenant();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
    }, [activeTab, userSearch, userStatusFilter]);

    useEffect(() => {
        if (activeTab === 'settings' && plans.length === 0) {
            import('../../services/adminAPI').then(({ getPlans }) => {
                getPlans({ per_page: 100 }).then((res) => {
                    const payload = res?.data;
                    const pageData = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
                    setPlans(Array.isArray(pageData?.data) ? pageData.data : []);
                }).catch(() => {});
            });
        }
    }, [activeTab]);

    const loadTenant = async () => {
        try {
            const res = await getTenant(id);
            setData(res.data);
            setEditForm({
                name: res.data.tenant.name,
                email: res.data.tenant.email,
                phone: res.data.tenant.phone || '',
                plan: res.data.tenant.plan,
                notes: res.data.tenant.notes || '',
            });
        } catch (err) {
            console.error('Failed to load tenant:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async (page = 1) => {
        setUsersLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (userSearch) params.search = userSearch;
            if (userStatusFilter) params.status = userStatusFilter;
            const res = await getTenantUsers(id, params);
            const payload = res?.data;
            const pageData = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
            const list = Array.isArray(pageData?.data) ? pageData.data : [];
            setUsers(list);
            setUsersPagination({
                current_page: pageData?.current_page || 1,
                last_page: pageData?.last_page || 1,
                total: pageData?.total || list.length,
            });
        } catch (err) {
            console.error('Failed to load users:', err);
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleUpdate = async () => {
        setActionLoading(true);
        try {
            await updateTenant(id, editForm);
            loadTenant();
        } catch (err) {
            console.error('Failed to update tenant:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!suspendReason.trim()) return;
        setActionLoading(true);
        try {
            await suspendTenant(id, suspendReason);
            setShowSuspendModal(false);
            setSuspendReason('');
            loadTenant();
        } catch (err) {
            console.error('Failed to suspend tenant:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async () => {
        setActionLoading(true);
        try {
            await activateTenant(id);
            loadTenant();
        } catch (err) {
            console.error('Failed to activate tenant:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleImpersonate = async () => {
        setActionLoading(true);
        try {
            const currentToken = localStorage.getItem('auth_token');
            sessionStorage.setItem('admin_token', currentToken);
            sessionStorage.setItem('admin_user', JSON.stringify(user));

            const res = await impersonateTenant(id);

            setAuthToken(res.data.token);
            setUser(res.data.user);

            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to impersonate:', err);
            sessionStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_user');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner w-10 h-10"></div>
            </div>
        );
    }

    if (!data) {
        return <p className={t.textMuted}>Tenant not found</p>;
    }

    const tenant = data.tenant;
    const tabs = ['overview', 'users', 'branches', 'activity', 'settings'];
    const inputCls = `w-full px-4 py-2 border rounded-lg text-sm ${t.inputBg} ${t.inputText} ${t.inputFocus}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={() => navigate('/admin/tenants')}
                        className={`text-sm mb-2 flex items-center gap-1 ${t.textMuted} hover:${t.textSecondary}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Tenants
                    </button>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>{tenant.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${statusColors[tenant.status]}`}>
                            {tenant.status}
                        </span>
                        <span className={`text-sm ${t.textMuted}`}>{tenant.email}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {tenant.status === 'active' && (
                        <button
                            onClick={() => setShowSuspendModal(true)}
                            className="px-3 py-2 text-sm bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 border border-red-500/30 transition-colors"
                        >
                            Suspend
                        </button>
                    )}
                    {tenant.status === 'suspended' && (
                        <button
                            onClick={handleActivate}
                            disabled={actionLoading}
                            className="px-3 py-2 text-sm bg-emerald-500/20 text-emerald-600 rounded-lg hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
                        >
                            Activate
                        </button>
                    )}
                    <button
                        onClick={handleImpersonate}
                        disabled={actionLoading}
                        className="px-3 py-2 text-sm bg-amber-500/20 text-amber-600 rounded-lg hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
                    >
                        Impersonate
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 border-b ${t.tableBorder}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                            activeTab === tab
                                ? t.tabActive
                                : t.tabInactive
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`border rounded-xl p-5 space-y-4 ${t.cardBg}`}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.textSecondary}`}>Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className={t.textMuted}>Plan</span><span className={`capitalize ${t.textPrimary}`}>{tenant.plan}</span></div>
                            <div className="flex justify-between"><span className={t.textMuted}>Domain</span><span className={t.textPrimary}>{tenant.domain || '-'}</span></div>
                            <div className="flex justify-between"><span className={t.textMuted}>Subdomain</span><span className={t.textPrimary}>{tenant.subdomain || '-'}</span></div>
                            <div className="flex justify-between"><span className={t.textMuted}>Phone</span><span className={t.textPrimary}>{tenant.phone || '-'}</span></div>
                            <div className="flex justify-between"><span className={t.textMuted}>Address</span><span className={t.textPrimary}>{tenant.address || '-'}</span></div>
                            <div className="flex justify-between"><span className={t.textMuted}>Created</span><span className={t.textPrimary}>{new Date(tenant.created_at).toLocaleDateString()}</span></div>
                        </div>
                    </div>
                    <div className={`border rounded-xl p-5 space-y-4 ${t.cardBg}`}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.textSecondary}`}>Usage</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className={t.textMuted}>Users</span><span className={t.textPrimary}>{tenant.users_count || 0}</span></div>
                            <div className="flex justify-between"><span className={t.textMuted}>Branches</span><span className={t.textPrimary}>{tenant.branches_count || 0}</span></div>
                        </div>
                        {tenant.suspended_at && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-600 text-xs font-semibold">Suspended</p>
                                <p className="text-red-500 text-sm mt-1">{tenant.suspended_reason}</p>
                                <p className="text-red-400/60 text-xs mt-1">{new Date(tenant.suspended_at).toLocaleString()}</p>
                            </div>
                        )}
                        {tenant.notes && (
                            <div className={`mt-4 p-3 rounded-lg ${t.progressBg}`}>
                                <p className={`text-xs font-semibold ${t.textMuted}`}>Admin Notes</p>
                                <p className={`text-sm mt-1 ${t.textSecondary}`}>{tenant.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Search & Filter */}
                    <div className={`rounded-xl border p-4 flex gap-3 ${t.cardBg}`}>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${t.inputBg} ${t.inputText} ${t.inputPlaceholder} ${t.inputFocus}`}
                        />
                        <select
                            value={userStatusFilter}
                            onChange={(e) => setUserStatusFilter(e.target.value)}
                            className={`px-3 py-2 rounded-lg border text-sm ${t.inputBg} ${t.inputText} ${t.inputFocus}`}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    {/* Table */}
                    <div className={`border rounded-xl overflow-hidden ${t.cardBg}`}>
                        {usersLoading ? (
                            <div className={`p-12 text-center ${t.textSecondary}`}>Loading...</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`border-b ${t.tableBorder}`}>
                                        <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Name</th>
                                        <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Email</th>
                                        <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Roles</th>
                                        <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Status</th>
                                        <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Last Login</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${t.tableDivide}`}>
                                    {users.map((u) => (
                                        <tr key={u.id} className={t.rowHover}>
                                            <td className={`px-5 py-3 font-medium ${t.textPrimary}`}>{u.name}</td>
                                            <td className={`px-5 py-3 ${t.textSecondary}`}>{u.email}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(u.roles || []).map(r => (
                                                        <span key={r.id} className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-600 rounded-full">{r.name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-500'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3 text-xs ${t.textMuted}`}>
                                                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan={5} className={`px-5 py-8 text-center ${t.textMuted}`}>No users found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination */}
                    {usersPagination.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <p className={`text-sm ${t.textSecondary}`}>{usersPagination.total} user{usersPagination.total !== 1 ? 's' : ''}</p>
                            <div className="flex gap-2">
                                {Array.from({ length: usersPagination.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => loadUsers(page)}
                                        className={`px-3 py-1 rounded text-sm ${page === usersPagination.current_page ? 'bg-blue-600 text-white' : t.btnSecondary}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'branches' && (
                <div className={`border rounded-xl overflow-hidden ${t.cardBg}`}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`border-b ${t.tableBorder}`}>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Name</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Type</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Status</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Main</th>
                            </tr>
                        </thead>
                        <tbody className={t.tableDivide}>
                            {(tenant.branches || []).map((b) => (
                                <tr key={b.id} className={t.rowHover}>
                                    <td className={`px-5 py-3 font-medium ${t.textPrimary}`}>{b.name}</td>
                                    <td className={`px-5 py-3 capitalize ${t.textSecondary}`}>{b.type}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${b.is_active ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-500'}`}>
                                            {b.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className={`px-5 py-3 ${t.textSecondary}`}>{b.is_main_branch ? 'Yes' : '-'}</td>
                                </tr>
                            ))}
                            {(tenant.branches || []).length === 0 && (
                                <tr><td colSpan={4} className={`px-5 py-8 text-center ${t.textMuted}`}>No branches</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className={`border rounded-xl p-5 space-y-3 ${t.cardBg}`}>
                    {(data.activity || []).map((a) => (
                        <div key={a.id} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <div>
                                <p className={t.textSecondary}>
                                    <span className={`font-medium ${t.textPrimary}`}>{a.user?.name}</span>{' '}
                                    <span className={t.textMuted}>{a.action.replace('.', ' ')}</span>
                                </p>
                                {a.metadata && (
                                    <p className={`text-xs mt-0.5 ${t.textMuted}`}>
                                        {JSON.stringify(a.metadata)}
                                    </p>
                                )}
                                <p className={`text-xs mt-0.5 ${t.textMuted}`}>{new Date(a.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    {(data.activity || []).length === 0 && (
                        <p className={`text-sm ${t.textMuted}`}>No activity recorded</p>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className={`border rounded-xl p-6 space-y-5 ${t.cardBg}`}>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.textSecondary}`}>Edit Tenant</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Name</label>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Email</label>
                            <input type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Phone</label>
                            <input type="text" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Plan</label>
                            <select value={editForm.plan} onChange={(e) => setEditForm(prev => ({ ...prev, plan: e.target.value }))} className={inputCls}>
                                {plans.length > 0 ? (
                                    plans.map((p) => (
                                        <option key={p.id} value={p.slug}>{p.name}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm mb-1 ${t.textLabel}`}>Admin Notes</label>
                        <textarea value={editForm.notes} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleUpdate} disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {actionLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* Suspend Modal */}
            {showSuspendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 ${t.overlay}`} onClick={() => setShowSuspendModal(false)} />
                    <div className={`relative border rounded-xl p-6 w-full max-w-md ${t.modalBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${t.textPrimary}`}>Suspend Tenant</h3>
                        <p className={`text-sm mb-4 ${t.textSecondary}`}>
                            This will deactivate <strong className={t.textPrimary}>{tenant.name}</strong> and prevent all users from accessing the platform.
                        </p>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Reason for suspension..."
                            rows={3}
                            className={`${inputCls} resize-none mb-4 focus:border-red-500`}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowSuspendModal(false)} className={`px-4 py-2 text-sm ${t.btnGhost}`}>
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspend}
                                disabled={!suspendReason.trim() || actionLoading}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? 'Suspending...' : 'Suspend Tenant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
