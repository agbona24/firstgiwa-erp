import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import DateRangePicker from '../../components/ui/DateRangePicker';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const customer = {
    id: 1,
    name: 'Mega Mart Ltd',
    customer_type: 'credit',
    credit_limit: 5000000,
    credit_used: 2150000,
    contact_person: 'Alhaji Sani Mohammed',
    phone: '0803-123-4567',
    email: 'orders@megamart.com',
};

const mockLedger = [
    { id: 1, date: '2026-01-30', reference: 'INV-2026-045', type: 'invoice', description: 'Sales Order SO-2026-101 - Poultry Feed 5,000kg', debit: 850000, credit: 0, balance: 2150000 },
    { id: 2, date: '2026-01-28', reference: 'PAY-2026-089', type: 'payment', description: 'Bank Transfer - GTBank', debit: 0, credit: 500000, balance: 1300000 },
    { id: 3, date: '2026-01-25', reference: 'INV-2026-038', type: 'invoice', description: 'Sales Order SO-2026-095 - Layer Feed 3,000kg', debit: 620000, credit: 0, balance: 1800000 },
    { id: 4, date: '2026-01-22', reference: 'CN-2026-003', type: 'credit_note', description: 'Return - damaged bags (50kg x 3)', debit: 0, credit: 126000, balance: 1180000 },
    { id: 5, date: '2026-01-20', reference: 'PAY-2026-078', type: 'payment', description: 'Cash Payment', debit: 0, credit: 400000, balance: 1306000 },
    { id: 6, date: '2026-01-18', reference: 'INV-2026-032', type: 'invoice', description: 'Sales Order SO-2026-088 - Feed Mix 8,000kg', debit: 1200000, credit: 0, balance: 1706000 },
    { id: 7, date: '2026-01-15', reference: 'PAY-2026-065', type: 'payment', description: 'POS Payment - Card', debit: 0, credit: 300000, balance: 506000 },
    { id: 8, date: '2026-01-12', reference: 'INV-2026-025', type: 'invoice', description: 'Sales Order SO-2026-075 - Starter Feed 2,000kg', debit: 450000, credit: 0, balance: 806000 },
    { id: 9, date: '2026-01-10', reference: 'PAY-2026-055', type: 'payment', description: 'Bank Transfer - Access Bank', debit: 0, credit: 356000, balance: 356000 },
    { id: 10, date: '2026-01-08', reference: 'INV-2026-018', type: 'invoice', description: 'Sales Order SO-2026-060 - Premium Mix 1,500kg', debit: 356000, credit: 0, balance: 356000 },
];

const typeFilterOptions = [
    { label: 'All Types', value: '' },
    { label: 'Invoice', value: 'invoice' },
    { label: 'Payment', value: 'payment' },
    { label: 'Credit Note', value: 'credit_note' },
];

const typeBadgeVariant = {
    invoice: 'pending',
    payment: 'completed',
    credit_note: 'draft',
};

const typeLabel = {
    invoice: 'Invoice',
    payment: 'Payment',
    credit_note: 'Credit Note',
};

export default function CustomerLedger() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [typeFilter, setTypeFilter] = useState('');

    const filteredLedger = useMemo(() => {
        let entries = [...mockLedger];

        if (typeFilter) {
            entries = entries.filter((e) => e.type === typeFilter);
        }

        if (dateRange.from) {
            entries = entries.filter((e) => e.date >= dateRange.from);
        }
        if (dateRange.to) {
            entries = entries.filter((e) => e.date <= dateRange.to);
        }

        return entries;
    }, [typeFilter, dateRange]);

    const totals = useMemo(() => {
        const totalDebits = filteredLedger.reduce((sum, e) => sum + e.debit, 0);
        const totalCredits = filteredLedger.reduce((sum, e) => sum + e.credit, 0);
        return { totalDebits, totalCredits, net: totalDebits - totalCredits };
    }, [filteredLedger]);

    const availableCredit = customer.credit_limit - customer.credit_used;
    const utilization = (customer.credit_used / customer.credit_limit) * 100;
    const utilizationColor =
        utilization >= 100 ? 'bg-red-500' : utilization >= 80 ? 'bg-amber-500' : 'bg-green-500';

    const outstandingInvoices = mockLedger.filter((e) => e.type === 'invoice').length;

    const handleExport = () => {
        alert('Ledger exported');
    };

    const columns = [
        {
            key: 'date',
            label: 'Date',
            sortable: true,
            render: (row) => (
                <span className="text-slate-700">{row.date}</span>
            ),
        },
        {
            key: 'reference',
            label: 'Reference',
            render: (row) => (
                <span className="font-mono text-blue-600">{row.reference}</span>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => (
                <Badge variant={typeBadgeVariant[row.type]}>{typeLabel[row.type]}</Badge>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (row) => (
                <span className="text-slate-600">{row.description}</span>
            ),
        },
        {
            key: 'debit',
            label: 'Debit',
            render: (row) =>
                row.debit > 0 ? (
                    <span className="text-red-600 font-medium">{fmt(row.debit)}</span>
                ) : (
                    <span className="text-slate-300">—</span>
                ),
        },
        {
            key: 'credit',
            label: 'Credit',
            render: (row) =>
                row.credit > 0 ? (
                    <span className="text-green-600 font-medium">{fmt(row.credit)}</span>
                ) : (
                    <span className="text-slate-300">—</span>
                ),
        },
        {
            key: 'balance',
            label: 'Running Balance',
            render: (row) => (
                <span className="font-semibold text-slate-800">{fmt(row.balance)}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/customers')}>
                        &larr; Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
                        <p className="text-sm text-slate-500">
                            {customer.contact_person} &middot; {customer.phone}
                        </p>
                    </div>
                    <Badge variant="info">{customer.customer_type}</Badge>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    Export Ledger
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <p className="text-sm text-slate-500">Credit Limit</p>
                        <p className="text-xl font-bold text-slate-900">{fmt(customer.credit_limit)}</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <p className="text-sm text-slate-500">Credit Used</p>
                        <p className="text-xl font-bold text-slate-900">{fmt(customer.credit_used)}</p>
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                            <div
                                className={`${utilizationColor} h-2 rounded-full transition-all`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{utilization.toFixed(1)}% utilization</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <p className="text-sm text-slate-500">Available Credit</p>
                        <p className="text-xl font-bold text-green-600">{fmt(availableCredit)}</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <p className="text-sm text-slate-500">Outstanding Invoices</p>
                        <p className="text-xl font-bold text-slate-900">{outstandingInvoices}</p>
                    </CardBody>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 flex-wrap">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {typeFilterOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Ledger Table */}
            <Card>
                <CardBody className="p-0">
                    <DataTable columns={columns} data={filteredLedger} />
                </CardBody>
            </Card>

            {/* Summary Footer */}
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-8">
                            <div>
                                <p className="text-sm text-slate-500">Total Debits</p>
                                <p className="text-lg font-bold text-red-600">{fmt(totals.totalDebits)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Credits</p>
                                <p className="text-lg font-bold text-green-600">{fmt(totals.totalCredits)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Net Balance</p>
                            <p className="text-xl font-bold text-slate-900">{fmt(totals.net)}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
