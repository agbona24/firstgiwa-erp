import { useState, useEffect } from 'react';
import { getActivityLogs } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export default function ActivityLogs() {
    const { t } = useAdminTheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [actionFilter, setActionFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        loadLogs();
    }, [actionFilter, fromDate, toDate]);

    const loadLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (actionFilter) params.action = actionFilter;
            if (fromDate) params.from = fromDate;
            if (toDate) params.to = toDate;

            const res = await getActivityLogs(params);
            const payload = res?.data;
            const normalizedLogs = Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.logs)
                    ? payload.logs
                    : [];

            setLogs(normalizedLogs);
            setPagination({
                current_page: payload?.current_page || 1,
                last_page: payload?.last_page || 1,
                total: payload?.total || normalizedLogs.length,
            });
        } catch (err) {
            console.error('Failed to load activity logs:', err);
            setLogs([]);
            setPagination({ current_page: 1, last_page: 1, total: 0 });
        } finally {
            setLoading(false);
        }
    };

    const actionTypes = [
        'tenant.created', 'tenant.updated', 'tenant.suspended', 'tenant.activated',
        'tenant.cancelled', 'tenant.impersonated', 'admin.created', 'admin.removed',
    ];

    const inputCls = `px-4 py-2 border rounded-lg text-sm ${t.inputBg} ${t.inputText} ${t.inputFocus}`;
    const logList = Array.isArray(logs) ? logs : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Activity Logs</h1>
                <p className={`text-sm mt-1 ${t.textSecondary}`}>{pagination.total || 0} total events</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={inputCls}>
                    <option value="">All Actions</option>
                    {actionTypes.map((type) => (
                        <option key={type} value={type}>{type.replace('.', ' ')}</option>
                    ))}
                </select>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} placeholder="From" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} placeholder="To" />
                {(actionFilter || fromDate || toDate) && (
                    <button
                        onClick={() => { setActionFilter(''); setFromDate(''); setToDate(''); }}
                        className={`px-3 py-2 text-sm ${t.btnGhost}`}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className={`border rounded-xl overflow-hidden ${t.cardBg}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`border-b ${t.tableBorder}`}>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Admin</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Action</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Details</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>IP</th>
                                <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Date</th>
                            </tr>
                        </thead>
                        <tbody className={t.tableDivide}>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className={`px-5 py-8 text-center ${t.textMuted}`}>
                                        <div className="spinner w-8 h-8 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : logList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={`px-5 py-8 text-center ${t.textMuted}`}>No activity logs found</td>
                                </tr>
                            ) : logList.map((log) => (
                                <tr key={log.id} className={t.rowHover}>
                                    <td className="px-5 py-3">
                                        <p className={`font-medium ${t.textPrimary}`}>{log.user?.name || 'System'}</p>
                                        <p className={`text-xs ${t.textMuted}`}>{log.user?.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                            (log.action || '').includes('created') ? 'bg-emerald-500/20 text-emerald-600' :
                                            (log.action || '').includes('suspended') ? 'bg-red-500/20 text-red-600' :
                                            (log.action || '').includes('activated') ? 'bg-blue-500/20 text-blue-600' :
                                            (log.action || '').includes('impersonated') ? 'bg-amber-500/20 text-amber-600' :
                                            'bg-slate-500/20 text-slate-500'
                                        }`}>
                                            {(log.action || 'unknown').replace('.', ' ')}
                                        </span>
                                    </td>
                                    <td className={`px-5 py-3 text-xs max-w-xs truncate ${t.textSecondary}`}>
                                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                    </td>
                                    <td className={`px-5 py-3 text-xs ${t.textMuted}`}>{log.ip_address || '-'}</td>
                                    <td className={`px-5 py-3 text-xs ${t.textSecondary}`}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.last_page > 1 && (
                    <div className={`border-t px-5 py-3 flex items-center justify-between ${t.tableBorder}`}>
                        <p className={`text-xs ${t.textMuted}`}>Page {pagination.current_page} of {pagination.last_page}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadLogs(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className={`px-3 py-1 text-xs rounded-lg disabled:opacity-50 ${t.btnSecondary}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => loadLogs(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className={`px-3 py-1 text-xs rounded-lg disabled:opacity-50 ${t.btnSecondary}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
