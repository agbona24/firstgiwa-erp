import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DateRangePicker from '../../components/ui/DateRangePicker';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function TransactionLedger() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ total_revenue: 0, total_expenses: 0, net_balance: 0 });
    const [categories, setCategories] = useState([]);

    const toast = useToast();

    // Fetch transactions from API
    const fetchLedger = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (categoryFilter) params.append('category', categoryFilter);
            if (typeFilter) params.append('type', typeFilter);

            const response = await api.get(`/accounting/ledger?${params.toString()}`);
            setTransactions(response.data.transactions || []);
            setSummary(response.data.summary || { total_revenue: 0, total_expenses: 0, net_balance: 0 });
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Failed to fetch ledger:', error);
            toast.error('Failed to load transaction ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [startDate, endDate, categoryFilter, typeFilter]);

    const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));

    const typeOptions = [
        { value: 'Revenue', label: 'Revenue' },
        { value: 'Expense', label: 'Expense' }
    ];

    // Calculate totals from summary
    const totalRevenue = summary.total_revenue || 0;
    const totalExpenses = summary.total_expenses || 0;
    const netBalance = summary.net_balance || 0;
    const isInDeficit = netBalance < 0;

    // Filter transactions by search
    const filteredTransactions = transactions.filter(transaction => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return transaction.reference?.toLowerCase().includes(query) ||
               transaction.description?.toLowerCase().includes(query);
    });

    const handleExport = () => {
        // Create CSV content
        const headers = ['Date', 'Reference', 'Description', 'Category', 'Type', 'Debit', 'Credit', 'Balance'];
        const rows = filteredTransactions.map(t => [
            t.date,
            t.reference,
            t.description,
            t.category,
            t.type,
            t.debit || 0,
            t.credit || 0,
            t.balance || 0
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transaction-ledger-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        toast.success('Exported transaction ledger to CSV');
    };

    // Table columns
    const columns = [
        {
            key: 'date',
            header: 'Date',
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            key: 'reference',
            header: 'Reference',
            render: (value) => <span className="font-medium text-blue-600">{value}</span>
        },
        {
            key: 'description',
            header: 'Description'
        },
        {
            key: 'category',
            header: 'Category',
            render: (value) => (
                <Badge variant={value === 'Sales Revenue' ? 'approved' : 'draft'}>
                    {value}
                </Badge>
            )
        },
        {
            key: 'debit',
            header: 'Debit',
            render: (value) => (
                <span className="font-mono text-green-700 font-semibold">
                    {value > 0 ? fmt(value) : '-'}
                </span>
            )
        },
        {
            key: 'credit',
            header: 'Credit',
            render: (value) => (
                <span className="font-mono text-red-700 font-semibold">
                    {value > 0 ? fmt(value) : '-'}
                </span>
            )
        },
        {
            key: 'balance',
            header: 'Balance',
            render: (value) => (
                <span className={`font-mono font-bold ${value < 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {fmt(value)}
                </span>
            )
        }
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Transaction Ledger</h1>
                <p className="text-slate-600 mt-2">View all financial transactions and balances</p>
            </div>

            {/* Deficit Alert */}
            {isInDeficit && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-bold text-red-900">Account in Deficit</h3>
                            <p className="text-red-800 mt-1">
                                Current balance is <span className="font-bold">{fmt(Math.abs(netBalance))}</span> in deficit.
                                Immediate action required to balance accounts.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-green-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-700 mt-2">{fmt(totalRevenue)}</p>
                        <p className="text-xs text-slate-600 mt-1">All debits</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-red-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Expenses</p>
                        <p className="text-3xl font-bold text-red-700 mt-2">{fmt(totalExpenses)}</p>
                        <p className="text-xs text-slate-600 mt-1">All credits</p>
                    </CardBody>
                </Card>
                <Card className={`border-l-4 ${isInDeficit ? 'border-red-600' : 'border-blue-600'}`}>
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Net Balance</p>
                        <p className={`text-3xl font-bold mt-2 ${isInDeficit ? 'text-red-700' : 'text-green-700'}`}>
                            {fmt(netBalance)}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">Revenue - Expenses</p>
                    </CardBody>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3 flex-wrap">
                    <Button variant="primary" onClick={handleExport}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Ledger
                    </Button>
                    <Button variant="ghost" onClick={() => window.location.href = '/accounting/profit-loss'}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        P&L Statement
                    </Button>
                    <Button variant="ghost" onClick={() => window.location.href = '/accounting/balance-sheet'}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Balance Sheet
                    </Button>
                </div>

                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <SearchBar
                        placeholder="Search by reference or description..."
                        onSearch={setSearchQuery}
                        className="flex-1 md:w-64"
                    />
                    <FilterDropdown
                        label="Category"
                        options={categoryOptions}
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                    />
                    <FilterDropdown
                        label="Type"
                        options={typeOptions}
                        value={typeFilter}
                        onChange={setTypeFilter}
                    />
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <Card>
                    <CardBody className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Loading transactions...</p>
                    </CardBody>
                </Card>
            ) : (
                /* Transactions DataTable */
                <DataTable
                    columns={columns}
                    data={filteredTransactions}
                    emptyMessage="No transactions found"
                    pageSize={20}
                />
            )}
        </div>
    );
}
