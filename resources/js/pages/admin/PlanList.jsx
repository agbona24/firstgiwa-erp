import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPlans, togglePlanActive, deletePlan } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export default function PlanList() {
    const navigate = useNavigate();
    const { t } = useAdminTheme();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        loadPlans();
    }, [search]);

    const loadPlans = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (search) params.search = search;
            const res = await getPlans(params);
            const payload = res?.data;
            const pageData = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
            const list = Array.isArray(pageData?.data) ? pageData.data : [];
            setPlans(list);
            setPagination({
                current_page: pageData?.current_page || 1,
                last_page: pageData?.last_page || 1,
                total: pageData?.total || list.length,
            });
        } catch (err) {
            console.error('Failed to load plans:', err);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await togglePlanActive(id);
            loadPlans(pagination.current_page);
        } catch (err) {
            console.error('Failed to toggle plan:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deactivate this plan?')) return;
        try {
            await deletePlan(id);
            loadPlans(pagination.current_page);
        } catch (err) {
            console.error('Failed to delete plan:', err);
        }
    };

    const formatPrice = (price, period) => {
        return `$${Number(price).toFixed(0)}/${period === 'year' ? 'yr' : 'mo'}`;
    };

    const formatLimit = (val) => {
        if (!val || val >= 999999) return 'Unlimited';
        return val.toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Plans</h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>Manage subscription plans</p>
                </div>
                <button
                    onClick={() => navigate('/admin/plans/create')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    + New Plan
                </button>
            </div>

            {/* Search */}
            <div className={`rounded-xl border p-4 ${t.cardBg}`}>
                <input
                    type="text"
                    placeholder="Search plans..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${t.inputBg} ${t.inputText} ${t.inputPlaceholder} ${t.inputFocus}`}
                />
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${t.cardBg}`}>
                {loading ? (
                    <div className={`p-12 text-center ${t.textSecondary}`}>Loading...</div>
                ) : plans.length === 0 ? (
                    <div className={`p-12 text-center ${t.textSecondary}`}>No plans found</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${t.tableBorder}`}>
                                {['Name', 'Price', 'Limits', 'Status', 'Actions'].map((h) => (
                                    <th key={h} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${t.textTableHead}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${t.tableDivide}`}>
                            {plans.map((plan) => (
                                <tr key={plan.id} className={t.rowHover}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium text-sm ${t.textPrimary}`}>{plan.name}</span>
                                            {plan.badge && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-500">
                                                    {plan.badge}
                                                </span>
                                            )}
                                            {plan.is_highlighted && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-600">
                                                    Featured
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-0.5 ${t.textMuted}`}>{plan.slug}</p>
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-medium ${t.textPrimary}`}>
                                        {formatPrice(plan.price, plan.billing_period)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className={`text-xs space-y-0.5 ${t.textSecondary}`}>
                                            <p>Users: {formatLimit(plan.max_users)}</p>
                                            <p>Branches: {formatLimit(plan.max_branches)}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            plan.is_active
                                                ? 'bg-emerald-500/20 text-emerald-600'
                                                : 'bg-slate-500/20 text-slate-500'
                                        }`}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}
                                                className={`text-xs px-2 py-1 rounded ${t.btnSecondary}`}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggle(plan.id)}
                                                className={`text-xs px-2 py-1 rounded ${t.btnSecondary}`}
                                            >
                                                {plan.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className={`text-sm ${t.textSecondary}`}>
                        {pagination.total} plan{pagination.total !== 1 ? 's' : ''} total
                    </p>
                    <div className="flex gap-2">
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => loadPlans(page)}
                                className={`px-3 py-1 rounded text-sm ${
                                    page === pagination.current_page
                                        ? 'bg-blue-600 text-white'
                                        : t.btnSecondary
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
