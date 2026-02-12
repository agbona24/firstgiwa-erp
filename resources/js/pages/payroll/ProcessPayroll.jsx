import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import { useToast } from '../../contexts/ToastContext';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const mockPayrollItems = [
    { id: 1, employee_code: 'EMP-001', name: 'Musa Ibrahim', department: 'Production', basic: 250000, allowances: 95000, gross: 345000, tax: 34500, pension: 20000, other_deductions: 6250, total_deductions: 60750, net: 284250, status: 'pending' },
    { id: 2, employee_code: 'EMP-002', name: 'Aisha Bello', department: 'Production', basic: 220000, allowances: 80000, gross: 300000, tax: 28000, pension: 17600, other_deductions: 5500, total_deductions: 51100, net: 248900, status: 'pending' },
    { id: 3, employee_code: 'EMP-003', name: 'Grace Okonkwo', department: 'Admin', basic: 180000, allowances: 65000, gross: 245000, tax: 20000, pension: 14400, other_deductions: 4500, total_deductions: 38900, net: 206100, status: 'pending' },
    { id: 4, employee_code: 'EMP-004', name: 'Bola Tinubu', department: 'Logistics', basic: 200000, allowances: 75000, gross: 275000, tax: 24000, pension: 16000, other_deductions: 5000, total_deductions: 45000, net: 230000, status: 'pending' },
    { id: 5, employee_code: 'EMP-005', name: 'Amina Yusuf', department: 'Finance', basic: 300000, allowances: 110000, gross: 410000, tax: 48000, pension: 24000, other_deductions: 7500, total_deductions: 79500, net: 330500, status: 'pending' },
    { id: 6, employee_code: 'EMP-006', name: 'Chief Adebayo', department: 'Admin', basic: 500000, allowances: 200000, gross: 700000, tax: 105000, pension: 40000, other_deductions: 12500, total_deductions: 157500, net: 542500, status: 'pending' },
    { id: 7, employee_code: 'EMP-007', name: 'Fatima Sani', department: 'Sales', basic: 180000, allowances: 65000, gross: 245000, tax: 20000, pension: 14400, other_deductions: 4500, total_deductions: 38900, net: 206100, status: 'pending' },
    { id: 8, employee_code: 'EMP-008', name: 'Chidi Nwankwo', department: 'Operations', basic: 220000, allowances: 80000, gross: 300000, tax: 28000, pension: 17600, other_deductions: 5500, total_deductions: 51100, net: 248900, status: 'pending' },
];

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const statusVariants = {
    draft: 'warning',
    processing: 'info',
    approved: 'success',
    paid: 'success',
};

export default function ProcessPayroll() {
    const navigate = useNavigate();
    const toast = useToast();

    const currentMonth = new Date().getMonth();
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(2026);
    const [generated, setGenerated] = useState(false);
    const [payrollStatus, setPayrollStatus] = useState('draft');
    const [expandedRow, setExpandedRow] = useState(null);
    const [items, setItems] = useState([]);

    // Adjustments
    const [adjustments, setAdjustments] = useState([]);
    const [showAdjForm, setShowAdjForm] = useState(false);
    const [adjForm, setAdjForm] = useState({ employee_id: '', type: 'Bonus', amount: '', description: '' });

    const summary = useMemo(() => {
        if (!items.length) return { staff: 0, gross: 0, deductions: 0, net: 0 };
        return {
            staff: items.length,
            gross: items.reduce((s, i) => s + i.gross, 0),
            deductions: items.reduce((s, i) => s + i.total_deductions, 0),
            net: items.reduce((s, i) => s + i.net, 0),
        };
    }, [items]);

    const payrollRef = `PRN-${year}-${String(month + 1).padStart(2, '0')}`;

    const handleGenerate = () => {
        setItems([...mockPayrollItems]);
        setGenerated(true);
        setPayrollStatus('draft');
        setExpandedRow(null);
        setAdjustments([]);
        toast.success(`Payroll generated for ${months[month]} ${year}`);
    };

    const handleSaveDraft = () => {
        toast.success(`Payroll ${payrollRef} saved as draft`);
    };

    const handleSubmit = () => {
        setPayrollStatus('processing');
        toast.success(`Payroll ${payrollRef} submitted for approval`);
    };

    const handleApproveAndPay = () => {
        setPayrollStatus('paid');
        toast.success(`Payroll approved. ${fmt(summary.net)} disbursed to ${summary.staff} staff accounts`);
        navigate('/payroll');
    };

    const handleExportBank = () => {
        toast.success('Bank payment file generated');
    };

    const handleAddAdjustment = () => {
        if (!adjForm.employee_id || !adjForm.amount) return;
        const emp = items.find((i) => i.id === Number(adjForm.employee_id));
        setAdjustments((prev) => [
            ...prev,
            {
                id: Date.now(),
                employee_id: Number(adjForm.employee_id),
                employee_name: emp?.name || 'Unknown',
                type: adjForm.type,
                amount: Number(adjForm.amount),
                description: adjForm.description,
            },
        ]);
        setAdjForm({ employee_id: '', type: 'Bonus', amount: '', description: '' });
        setShowAdjForm(false);
        toast.success('Adjustment added');
    };

    const removeAdjustment = (id) => {
        setAdjustments((prev) => prev.filter((a) => a.id !== id));
    };

    const columns = [
        { key: 'employee_code', label: 'Employee Code', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'department', label: 'Department', sortable: true },
        { key: 'basic', label: 'Basic', render: (row) => fmt(row.basic) },
        { key: 'allowances', label: 'Allowances', render: (row) => fmt(row.allowances) },
        { key: 'gross', label: 'Gross', render: (row) => <span className="font-semibold">{fmt(row.gross)}</span> },
        { key: 'tax', label: 'Tax', render: (row) => fmt(row.tax) },
        { key: 'pension', label: 'Pension', render: (row) => fmt(row.pension) },
        { key: 'other_deductions', label: 'Other Ded.', render: (row) => fmt(row.other_deductions) },
        { key: 'net', label: 'Net Pay', render: (row) => <span className="font-bold text-blue-700">{fmt(row.net)}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Badge variant={row.status === 'pending' ? 'warning' : 'success'}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </Badge>
            ),
        },
    ];

    const renderExpandedRow = (row) => (
        <div className="bg-slate-50 p-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Pay Breakdown - {row.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-slate-500">Basic Salary</p>
                    <p className="font-medium">{fmt(row.basic)}</p>
                </div>
                <div>
                    <p className="text-slate-500">Allowances</p>
                    <p className="font-medium">{fmt(row.allowances)}</p>
                </div>
                <div>
                    <p className="text-slate-500">Gross Pay</p>
                    <p className="font-semibold text-slate-800">{fmt(row.gross)}</p>
                </div>
                <div>
                    <p className="text-slate-500">PAYE Tax</p>
                    <p className="font-medium text-red-600">-{fmt(row.tax)}</p>
                </div>
                <div>
                    <p className="text-slate-500">Pension (8%)</p>
                    <p className="font-medium text-red-600">-{fmt(row.pension)}</p>
                </div>
                <div>
                    <p className="text-slate-500">Other Deductions</p>
                    <p className="font-medium text-red-600">-{fmt(row.other_deductions)}</p>
                </div>
                <div>
                    <p className="text-slate-500">Total Deductions</p>
                    <p className="font-semibold text-red-700">{fmt(row.total_deductions)}</p>
                </div>
                <div>
                    <p className="text-slate-500">Net Pay</p>
                    <p className="font-bold text-blue-700">{fmt(row.net)}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Process Payroll</h1>
                    <p className="text-sm text-slate-500 mt-1">Generate and process monthly payroll for all staff</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/payroll')}>
                    Back
                </Button>
            </div>

            {/* Period Selection */}
            <Card>
                <CardBody>
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {months.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <Button onClick={handleGenerate}>
                            Generate Payroll
                        </Button>
                        {generated && (
                            <Badge variant={statusVariants[payrollStatus] || 'default'} className="ml-2">
                                {payrollStatus.charAt(0).toUpperCase() + payrollStatus.slice(1)}
                            </Badge>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Summary Cards */}
            {generated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardBody>
                            <p className="text-sm text-slate-500">Total Staff</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.staff}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-slate-500">Total Gross</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{fmt(summary.gross)}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-slate-500">Total Deductions</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{fmt(summary.deductions)}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-slate-500">Total Net Pay</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(summary.net)}</p>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Payroll Items Table */}
            {generated && (
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Payroll Items - {months[month]} {year}
                        </h2>
                        <DataTable
                            columns={columns}
                            data={items}
                            onRowClick={(row) => setExpandedRow(expandedRow === row.id ? null : row.id)}
                            expandedRow={expandedRow}
                            renderExpandedRow={renderExpandedRow}
                        />
                    </CardBody>
                </Card>
            )}

            {/* Adjustments Section */}
            {generated && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">Adjustments</h2>
                            <Button variant="outline" size="sm" onClick={() => setShowAdjForm(!showAdjForm)}>
                                {showAdjForm ? 'Cancel' : 'Add Adjustment'}
                            </Button>
                        </div>

                        {showAdjForm && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                                        <select
                                            value={adjForm.employee_id}
                                            onChange={(e) => setAdjForm({ ...adjForm, employee_id: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select employee</option>
                                            {items.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.employee_code} - {emp.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                        <select
                                            value={adjForm.type}
                                            onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Bonus">Bonus</option>
                                            <option value="Overtime">Overtime</option>
                                            <option value="Deduction">Deduction</option>
                                            <option value="Loan Recovery">Loan Recovery</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount ({window.getCurrencySymbol()})</label>
                                        <input
                                            type="number"
                                            value={adjForm.amount}
                                            onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={adjForm.description}
                                            onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
                                            placeholder="Reason for adjustment"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Button size="sm" onClick={handleAddAdjustment}>
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}

                        {adjustments.length > 0 ? (
                            <div className="divide-y divide-slate-200">
                                {adjustments.map((adj) => (
                                    <div key={adj.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-4">
                                            <Badge variant={adj.type === 'Deduction' || adj.type === 'Loan Recovery' ? 'danger' : 'success'}>
                                                {adj.type}
                                            </Badge>
                                            <span className="text-sm font-medium text-slate-700">{adj.employee_name}</span>
                                            <span className="text-sm text-slate-500">{adj.description}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-semibold ${adj.type === 'Deduction' || adj.type === 'Loan Recovery' ? 'text-red-600' : 'text-green-600'}`}>
                                                {adj.type === 'Deduction' || adj.type === 'Loan Recovery' ? '-' : '+'}{fmt(adj.amount)}
                                            </span>
                                            <button
                                                onClick={() => removeAdjustment(adj.id)}
                                                className="text-slate-400 hover:text-red-500 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">No adjustments added.</p>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Footer Actions */}
            {generated && (
                <div className="flex flex-wrap items-center gap-3 justify-end">
                    <Button variant="outline" onClick={handleSaveDraft}>
                        Save Draft
                    </Button>
                    <Button variant="outline" onClick={handleExportBank}>
                        Export to Bank
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={payrollStatus === 'processing' || payrollStatus === 'approved' || payrollStatus === 'paid'}
                    >
                        Submit for Approval
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleApproveAndPay}
                        disabled={payrollStatus !== 'approved'}
                    >
                        Approve &amp; Pay
                    </Button>
                </div>
            )}
        </div>
    );
}
