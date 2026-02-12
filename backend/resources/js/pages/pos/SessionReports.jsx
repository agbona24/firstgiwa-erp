import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import posAPI from '../../services/posAPI';

export default function SessionReports() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [filters, setFilters] = useState({
        status: '',
        date_from: '',
        date_to: '',
        user_id: '',
    });
    const [selectedSession, setSelectedSession] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sessionDetail, setSessionDetail] = useState(null);

    // Summary stats
    const [todaySummary, setTodaySummary] = useState({
        total_sessions: 0,
        total_sales: 0,
        total_transactions: 0,
        total_variance: 0,
    });

    const toast = useToast();

    useEffect(() => {
        fetchSessions();
        fetchTodaySummary();
    }, [filters]);

    const fetchSessions = async (page = 1) => {
        try {
            setLoading(true);
            const params = { ...filters, page, per_page: 15 };
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });
            
            const response = await posAPI.getSessionHistory(params);
            if (response.success) {
                setSessions(response.data.data || []);
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    total: response.data.total,
                });
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Failed to load session history');
        } finally {
            setLoading(false);
        }
    };

    const fetchTodaySummary = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const params = { date_from: today, date_to: today, per_page: 100 };
            const response = await posAPI.getSessionHistory(params);
            
            if (response.success && response.data.data) {
                const todaySessions = response.data.data;
                setTodaySummary({
                    total_sessions: todaySessions.length,
                    total_sales: todaySessions.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0),
                    total_transactions: todaySessions.reduce((sum, s) => sum + (s.total_transactions || 0), 0),
                    total_variance: todaySessions.reduce((sum, s) => sum + parseFloat(s.cash_variance || 0), 0),
                });
            }
        } catch (error) {
            console.error('Error fetching today summary:', error);
        }
    };

    const handleViewDetail = async (session) => {
        setSelectedSession(session);
        setShowDetailModal(true);
        setDetailLoading(true);
        
        try {
            const response = await posAPI.getSessionReport(session.id);
            if (response.success) {
                setSessionDetail(response.data);
            }
        } catch (error) {
            console.error('Error fetching session detail:', error);
            toast.error('Failed to load session details');
        } finally {
            setDetailLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount || 0).toLocaleString()}`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const formatDuration = (session) => {
        if (!session.opened_at) return '-';
        const start = new Date(session.opened_at);
        const end = session.closed_at ? new Date(session.closed_at) : new Date();
        const minutes = Math.round((end - start) / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <Badge variant="info">Active</Badge>;
            case 'closed':
                return <Badge variant="success">Closed</Badge>;
            case 'reconciled':
                return <Badge variant="default">Reconciled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getVarianceBadge = (variance) => {
        if (variance === null || variance === undefined) return null;
        const v = parseFloat(variance);
        if (v > 0) return <Badge variant="info">Over ₦{Math.abs(v).toLocaleString()}</Badge>;
        if (v < 0) return <Badge variant="rejected">Short ₦{Math.abs(v).toLocaleString()}</Badge>;
        return <Badge variant="success">Balanced</Badge>;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = ['Session #', 'Cashier', 'Branch', 'Opened', 'Closed', 'Duration', 'Transactions', 'Total Sales', 'Cash Sales', 'Card Sales', 'Transfer', 'Opening Cash', 'Closing Cash', 'Variance', 'Status'];
        const rows = sessions.map(s => [
            s.session_number,
            s.user?.name || '-',
            s.branch?.name || '-',
            formatDateTime(s.opened_at),
            formatDateTime(s.closed_at),
            formatDuration(s),
            s.total_transactions || 0,
            s.total_sales || 0,
            s.cash_sales || 0,
            s.card_sales || 0,
            s.transfer_sales || 0,
            s.opening_cash || 0,
            s.closing_cash || 0,
            s.cash_variance || 0,
            s.status,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shift-reports-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported');
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Shift Reports</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">View cashier sessions and daily POS reports</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleExport}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </Button>
                    <Button variant="secondary" onClick={handlePrint}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </Button>
                </div>
            </div>

            {/* Today's Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Today's Shifts</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{todaySummary.total_sessions}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Today's Sales</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(todaySummary.total_sales)}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Today's Transactions</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{todaySummary.total_transactions}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Net Variance</p>
                                <p className={`text-2xl font-bold ${todaySummary.total_variance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {todaySummary.total_variance >= 0 ? '+' : ''}{formatCurrency(todaySummary.total_variance)}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                todaySummary.total_variance === 0 
                                    ? 'bg-green-100 dark:bg-green-900/30' 
                                    : todaySummary.total_variance > 0 
                                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                                    : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                                <svg className={`w-6 h-6 ${
                                    todaySummary.total_variance === 0 
                                        ? 'text-green-600' 
                                        : todaySummary.total_variance > 0 
                                        ? 'text-blue-600' 
                                        : 'text-red-600'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                                <option value="reconciled">Reconciled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button 
                                variant="secondary" 
                                onClick={() => setFilters({ status: '', date_from: '', date_to: '', user_id: '' })}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                        <div className="flex items-end">
                            <Button 
                                variant="primary" 
                                onClick={() => fetchSessions(1)}
                                className="w-full"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Session History</CardTitle>
                </CardHeader>
                <CardBody className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading sessions...</span>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="font-medium">No sessions found</p>
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Session</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Cashier</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Branch</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Duration</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sales</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Transactions</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Variance</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {sessions.map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                                                    {session.session_number}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {session.user?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {session.branch?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                                <div>{new Date(session.opened_at).toLocaleDateString()}</div>
                                                <div className="text-xs">
                                                    {new Date(session.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {session.closed_at && (
                                                        <> - {new Date(session.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {formatDuration(session)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                                                {formatCurrency(session.total_sales)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                                {session.total_transactions || 0}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getVarianceBadge(session.cash_variance)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(session.status)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleViewDetail(session)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} sessions)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={pagination.current_page === 1}
                                    onClick={() => fetchSessions(pagination.current_page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={pagination.current_page === pagination.last_page}
                                    onClick={() => fetchSessions(pagination.current_page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Session Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSessionDetail(null); }}
                title={`Session Details - ${selectedSession?.session_number || ''}`}
                size="xl"
            >
                {detailLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading details...</span>
                    </div>
                ) : sessionDetail ? (
                    <div className="space-y-6">
                        {/* Session Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Cashier</p>
                                <p className="font-medium text-slate-900 dark:text-white">{sessionDetail.session?.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Branch</p>
                                <p className="font-medium text-slate-900 dark:text-white">{sessionDetail.session?.branch?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Opened</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatDateTime(sessionDetail.session?.opened_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Closed</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatDateTime(sessionDetail.session?.closed_at)}</p>
                            </div>
                        </div>

                        {/* Sales Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <p className="text-xs text-green-600 dark:text-green-400">Total Sales</p>
                                <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(sessionDetail.session?.total_sales)}</p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <p className="text-xs text-blue-600 dark:text-blue-400">Cash Sales</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(sessionDetail.session?.cash_sales)}</p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                <p className="text-xs text-purple-600 dark:text-purple-400">Card/POS Sales</p>
                                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(sessionDetail.session?.card_sales)}</p>
                            </div>
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                <p className="text-xs text-amber-600 dark:text-amber-400">Transfer Sales</p>
                                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(sessionDetail.session?.transfer_sales)}</p>
                            </div>
                        </div>

                        {/* Cash Reconciliation */}
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Cash Reconciliation</h4>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Opening</p>
                                    <p className="font-medium">{formatCurrency(sessionDetail.session?.opening_cash)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">+ Cash Sales</p>
                                    <p className="font-medium">{formatCurrency(sessionDetail.session?.cash_sales)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">= Expected</p>
                                    <p className="font-medium">{formatCurrency(sessionDetail.session?.expected_cash)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Actual</p>
                                    <p className="font-medium">{formatCurrency(sessionDetail.session?.closing_cash)}</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Variance:</span>
                                <div className="flex items-center gap-2">
                                    {getVarianceBadge(sessionDetail.session?.cash_variance)}
                                </div>
                            </div>
                        </div>

                        {/* Transactions List */}
                        {sessionDetail.transactions && sessionDetail.transactions.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                                    Transactions ({sessionDetail.transactions.length})
                                </h4>
                                <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Order #</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Time</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Customer</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {sessionDetail.transactions.map(tx => (
                                                <tr key={tx.id}>
                                                    <td className="px-3 py-2 font-mono text-slate-900 dark:text-white">{tx.order_number}</td>
                                                    <td className="px-3 py-2 text-slate-500">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{tx.customer?.name || 'Walk-in'}</td>
                                                    <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(tx.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {sessionDetail.session?.notes && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Notes</h4>
                                <p className="text-slate-600 dark:text-slate-300">{sessionDetail.session.notes}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="secondary" onClick={() => window.print()}>
                                Print Report
                            </Button>
                            <Button variant="primary" onClick={() => setShowDetailModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        Failed to load session details
                    </div>
                )}
            </Modal>
        </div>
    );
}
