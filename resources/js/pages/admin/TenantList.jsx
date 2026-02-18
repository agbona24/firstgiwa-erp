import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTenants } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-600',
    suspended: 'bg-red-500/20 text-red-600',
    trial: 'bg-amber-500/20 text-amber-600',
    cancelled: 'bg-slate-500/20 text-slate-500',
};

const planColors = {
    starter: 'bg-slate-500/20 text-slate-500',
    professional: 'bg-blue-500/20 text-blue-600',
    enterprise: 'bg-purple-500/20 text-purple-600',
};

export default function TenantList() {
    const navigate = useNavigate();
    const { t } = useAdminTheme();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [pagination, setPagination] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        loadTenants();
    }, [search, statusFilter, planFilter]);

    const loadTenants = async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { page, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (planFilter) params.plan = planFilter;

            const res = await getTenants(params);
            const payload = res?.data;
            const pageData = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
            const list = Array.isArray(pageData?.data)
                ? pageData.data
                : Array.isArray(payload?.tenants)
                    ? payload.tenants
                    : [];

            setTenants(list);
            setPagination({
                current_page: pageData?.current_page || 1,
                last_page: pageData?.last_page || 1,
                total: pageData?.total || list.length,
            });
        } catch (err) {
            console.error('Failed to load tenants:', err);
            setTenants([]);
            setPagination({ current_page: 1, last_page: 1, total: 0 });
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                setError('Unauthorized. Please login with a System Admin account.');
            } else {
                setError(err?.response?.data?.message || 'Failed to load tenants.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputCls = `px-4 py-2 border rounded-lg text-sm ${t.inputBg} ${t.inputText} ${t.inputPlaceholder} ${t.inputFocus}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Tenants</h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>{pagination.total || 0} total tenants</p>
                </div>
                <Link
                    to="/admin/tenants/create"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + New Tenant
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input type="text" placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} w-64`} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={inputCls}>
                    <option value="">All Plans</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>

            {/* Table */}
            <div className={`border rounded-xl overflow-hidden ${t.cardBg}`}>
                {error && (
                    <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
                        {error}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`border-b ${t.tableBorder}`}>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider ${t.textTableHead}`}>Tenant</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider ${t.textTableHead}`}>Plan</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider ${t.textTableHead}`}>Status</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider ${t.textTableHead}`}>Users</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider ${t.textTableHead}`}>Created</th>
                            </tr>
                        </thead>
                        <tbody className={t.tableDivide}>
                            {loading ? (
                                <tr><td colSpan={5} className={`px-5 py-8 text-center ${t.textMuted}`}><div className="spinner w-8 h-8 mx-auto"></div></td></tr>
                            ) : (!tenants || tenants.length === 0) ? (
                                <tr><td colSpan={5} className={`px-5 py-8 text-center ${t.textMuted}`}>No tenants found</td></tr>
                            ) : tenants.map((tenant) => (
                                <tr key={tenant.id} onClick={() => navigate(`/admin/tenants/${tenant.id}`)} className={`cursor-pointer transition-colors ${t.rowHover}`}>
                                    <td className="px-5 py-3">
                                        <p className={`font-medium ${t.textPrimary}`}>{tenant.name}</p>
                                        <p className={`text-xs ${t.textMuted}`}>{tenant.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${planColors[tenant.plan] || 'bg-slate-500/20 text-slate-500'}`}>{tenant.plan}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${statusColors[tenant.status] || 'bg-slate-500/20 text-slate-500'}`}>{tenant.status}</span>
                                    </td>
                                    <td className={`px-5 py-3 ${t.textSecondary}`}>{tenant.users_count || 0}</td>
                                    <td className={`px-5 py-3 text-xs ${t.textMuted}`}>{new Date(tenant.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.last_page > 1 && (
                    <div className={`border-t px-5 py-3 flex items-center justify-between ${t.tableBorder}`}>
                        <p className={`text-xs ${t.textMuted}`}>Page {pagination.current_page} of {pagination.last_page}</p>
                        <div className="flex gap-2">
                            <button onClick={() => loadTenants(pagination.current_page - 1)} disabled={pagination.current_page === 1} className={`px-3 py-1 text-xs rounded-lg disabled:opacity-50 ${t.btnSecondary}`}>Previous</button>
                            <button onClick={() => loadTenants(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className={`px-3 py-1 text-xs rounded-lg disabled:opacity-50 ${t.btnSecondary}`}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
