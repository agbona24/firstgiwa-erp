import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DateRangePicker from '../../components/ui/DateRangePicker';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import auditAPI from '../../services/auditAPI';

export default function AuditLog() {
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    
    // API data
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ actions: [], entities: [], users: [] });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    const toast = useToast();

    // Simulated current user role (for IP privacy demo)
    const currentUserRole = 'Super Admin'; // In real app, get from auth context

    // Fetch data on mount and when filters change
    useEffect(() => {
        fetchLogs();
    }, [actionFilter, userFilter, entityFilter, startDate, endDate, pagination.current_page]);

    useEffect(() => {
        fetchFilters();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current_page,
                per_page: 20,
            };
            if (actionFilter) params.action = actionFilter;
            if (userFilter) params.user_id = userFilter;
            if (entityFilter) params.entity = entityFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (searchQuery) params.search = searchQuery;

            const response = await auditAPI.getLogs(params);
            setLogs(response.data || []);
            if (response.meta) {
                setPagination({
                    current_page: response.meta.current_page,
                    last_page: response.meta.last_page,
                    total: response.meta.total
                });
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const response = await auditAPI.getFilters();
            if (response.success) {
                setFilters(response.data);
            }
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    // Transform filters for dropdowns
    const actionOptions = filters.actions.map(action => ({
        value: action,
        label: action.charAt(0) + action.slice(1).toLowerCase()
    }));

    const userOptions = filters.users.map(user => ({
        value: user.id,
        label: user.name || user.email
    }));

    const entityOptions = filters.entities.map(entity => ({
        value: entity,
        label: entity
    }));

    // Calculate stats from pagination data
    const totalLogs = pagination.total;
    const todayLogs = logs.filter(l => l.timestamp.startsWith(new Date().toISOString().split('T')[0])).length;
    const loginLogouts = logs.filter(l => l.action === 'LOGIN' || l.action === 'LOGOUT').length;
    const criticalActions = logs.filter(l => ['DELETE', 'CANCEL', 'REJECT', 'BULK_ACTION'].includes(l.action)).length;

    // Client-side search filter (API already filters by other params)
    const filteredLogs = searchQuery 
        ? logs.filter(log => {
            const search = searchQuery.toLowerCase();
            return log.user?.toLowerCase().includes(search) ||
                   log.action?.toLowerCase().includes(search) ||
                   log.entity?.toLowerCase().includes(search) ||
                   log.ref?.toLowerCase().includes(search);
        })
        : logs;

    const handleExport = async () => {
        try {
            await auditAPI.export({
                action: actionFilter,
                start_date: startDate,
                end_date: endDate
            });
            toast.success('Audit log exported to CSV');
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Failed to export audit log');
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchLogs();
    };

    const maskIP = (ip) => {
        // Mask IP for non-admin users (privacy feature)
        if (currentUserRole === 'Super Admin') {
            return ip;
        }
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.xxx.xxx`;
    };

    const getActionVariant = (action) => {
        const variantMap = {
            CREATE: 'approved',
            UPDATE: 'pending',
            DELETE: 'rejected',
            APPROVE: 'completed',
            REJECT: 'rejected',
            CANCEL: 'draft',
            LOGIN: 'approved',
            LOGOUT: 'draft',
            RESTORE: 'approved',
            EXPORT: 'gold',
            IMPORT: 'gold',
            PRINT: 'draft',
            EMAIL: 'pending',
            STATUS_CHANGE: 'pending',
            PAYMENT: 'completed',
            STOCK_ADJUSTMENT: 'pending',
            PRODUCTION: 'approved',
            BULK_ACTION: 'gold'
        };
        return variantMap[action] || 'draft';
    };

    const renderChangeDetails = (log) => {
        if (!log) return null;

        const hasChanges = log.changes && (log.changes.before || log.changes.after);

        return (
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Timestamp</p>
                        <p className="font-mono font-medium">{log.timestamp}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">User</p>
                        <p className="font-medium">{log.user_name || log.user}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Action</p>
                        <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Entity</p>
                        <p className="font-medium">{log.entity}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Reference</p>
                        <p className="font-medium text-blue-600">{log.ref}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">IP Address</p>
                        <p className="font-mono text-sm">{maskIP(log.ip)}</p>
                    </div>
                    {log.reason && (
                        <div className="col-span-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Reason</p>
                            <p className="font-medium text-slate-700">{log.reason}</p>
                        </div>
                    )}
                </div>

                {/* Change Details */}
                {hasChanges ? (
                    <div className="border-t pt-4">
                        <h4 className="font-bold text-slate-900 mb-3">Change Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Before */}
                            <div>
                                <p className="text-sm font-semibold text-red-700 mb-2">Before</p>
                                {log.changes.before ? (
                                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-80 overflow-auto">
                                        <pre className="text-xs text-slate-800 whitespace-pre-wrap">
                                            {JSON.stringify(log.changes.before, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 border border-slate-200 rounded p-3">
                                        <p className="text-xs text-slate-500 italic">No previous data (new record)</p>
                                    </div>
                                )}
                            </div>

                            {/* After */}
                            <div>
                                <p className="text-sm font-semibold text-green-700 mb-2">After</p>
                                {log.changes.after ? (
                                    <div className="bg-green-50 border border-green-200 rounded p-3 max-h-80 overflow-auto">
                                        <pre className="text-xs text-slate-800 whitespace-pre-wrap">
                                            {JSON.stringify(log.changes.after, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 border border-slate-200 rounded p-3">
                                        <p className="text-xs text-slate-500 italic">Record deleted</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="border-t pt-4">
                        <div className="bg-slate-100 border border-slate-200 rounded p-4 text-center">
                            <p className="text-sm text-slate-500">No detailed changes recorded for this action</p>
                            <p className="text-xs text-slate-400 mt-1">This may be a login/logout event or an action without data modifications</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Table columns
    const columns = [
        {
            key: 'timestamp',
            header: 'Timestamp',
            render: (value) => <span className="font-mono text-sm">{value}</span>
        },
        {
            key: 'user',
            header: 'User',
            render: (value) => <span className="text-slate-700">{value}</span>
        },
        {
            key: 'action',
            header: 'Action',
            render: (value) => {
                const variantMap = {
                    CREATE: 'approved',
                    UPDATE: 'pending',
                    DELETE: 'rejected',
                    APPROVE: 'completed',
                    REJECT: 'rejected',
                    CANCEL: 'draft',
                    LOGIN: 'approved',
                    LOGOUT: 'draft',
                    RESTORE: 'approved',
                    EXPORT: 'gold',
                    IMPORT: 'gold',
                    PRINT: 'draft',
                    EMAIL: 'pending',
                    STATUS_CHANGE: 'pending',
                    PAYMENT: 'completed',
                    STOCK_ADJUSTMENT: 'pending',
                    PRODUCTION: 'approved',
                    BULK_ACTION: 'gold'
                };
                return <Badge variant={variantMap[value] || 'draft'}>{value}</Badge>;
            }
        },
        {
            key: 'entity',
            header: 'Entity',
            render: (value) => <span className="font-medium text-slate-900">{value}</span>
        },
        {
            key: 'ref',
            header: 'Reference',
            render: (value) => <span className="font-medium text-blue-600">{value}</span>
        },
        {
            key: 'ip',
            header: 'IP Address',
            render: (value) => (
                <span className="font-mono text-xs text-slate-600" title={currentUserRole !== 'Super Admin' ? 'Full IP masked for privacy' : ''}>
                    {maskIP(value)}
                </span>
            )
        },
        {
            key: 'details',
            header: 'Details',
            sortable: false,
            render: (value, row) => (
                <button
                    onClick={() => setSelectedLog(row)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                </button>
            )
        }
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Audit Trail</h1>
                <p className="text-slate-600 mt-2">Immutable log of all system activities</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-blue-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Logs</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{totalLogs}</p>
                        <p className="text-xs text-slate-600 mt-1">All audit entries</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-green-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Today's Activity</p>
                        <p className="text-3xl font-bold text-green-700 mt-2">{todayLogs}</p>
                        <p className="text-xs text-slate-600 mt-1">Actions today</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-purple-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Login/Logout</p>
                        <p className="text-3xl font-bold text-purple-700 mt-2">{loginLogouts}</p>
                        <p className="text-xs text-slate-600 mt-1">Auth events</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-red-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Critical Actions</p>
                        <p className="text-3xl font-bold text-red-700 mt-2">{criticalActions}</p>
                        <p className="text-xs text-slate-600 mt-1">Delete/Cancel/Reject</p>
                    </CardBody>
                </Card>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="text-sm font-bold text-blue-900">Audit Trail Information</h3>
                        <p className="text-blue-800 text-sm mt-1">
                            All system activities are automatically logged and cannot be modified or deleted.
                            {currentUserRole !== 'Super Admin' && ' IP addresses are partially masked for privacy.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={handleExport}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Filtered
                    </Button>
                </div>

                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <SearchBar
                        placeholder="Search logs..."
                        onSearch={setSearchQuery}
                        className="flex-1 md:w-64"
                    />
                    <FilterDropdown
                        label="Action"
                        options={actionOptions}
                        value={actionFilter}
                        onChange={setActionFilter}
                    />
                    <FilterDropdown
                        label="User"
                        options={userOptions}
                        value={userFilter}
                        onChange={setUserFilter}
                    />
                    <FilterDropdown
                        label="Entity"
                        options={entityOptions}
                        value={entityFilter}
                        onChange={setEntityFilter}
                    />
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </div>
            </div>

            {/* Audit Log DataTable */}
            <DataTable
                columns={columns}
                data={filteredLogs}
                emptyMessage="No audit logs found"
                pageSize={20}
            />

            {/* Audit Log Details SlideOut */}
            <SlideOut
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Audit Log Details"
                size="lg"
            >
                {selectedLog && renderChangeDetails(selectedLog)}
            </SlideOut>
        </div>
    );
}
