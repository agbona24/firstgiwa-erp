import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import payrollAPI from '../../services/payrollAPI';
import documentAPI, { openPdfInNewTab, downloadPdf } from '../../services/documentAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function PayrollList() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [selectedRun, setSelectedRun] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    // Fetch payroll runs from API
    useEffect(() => {
        fetchPayrollRuns();
    }, []);

    const fetchPayrollRuns = async () => {
        try {
            setLoading(true);
            const response = await payrollAPI.getPayrollRuns();
            const data = Array.isArray(response) ? response : (response?.data || []);
            
            // Transform API data to match UI expectations
            const transformedRuns = data.map(run => ({
                id: run.id,
                payroll_number: run.payroll_number,
                period: run.payroll_period,
                period_start: run.period_start,
                period_end: run.period_end,
                payment_date: run.payment_date,
                status: run.status,
                staff_count: run.staff_count || 0,
                total_gross: parseFloat(run.total_gross_pay) || 0,
                total_deductions: parseFloat(run.total_deductions) || 0,
                total_net: parseFloat(run.total_net_pay) || 0,
                paid_at: run.paid_at,
                items: (run.items || []).map(item => ({
                    staff_id: item.staff_id,
                    name: item.staff_name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
                    department: item.department,
                    basic: parseFloat(item.basic_salary) || 0,
                    allowances: (parseFloat(item.housing_allowance) || 0) + (parseFloat(item.transport_allowance) || 0) + (parseFloat(item.other_earnings) || 0),
                    gross: parseFloat(item.gross_pay) || 0,
                    deductions: parseFloat(item.total_deductions) || 0,
                    net: parseFloat(item.net_pay) || 0,
                }))
            }));

            setPayrollRuns(transformedRuns);
        } catch (error) {
            console.error('Error fetching payroll runs:', error);
            toast.error('Failed to load payroll runs');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        lastPayroll: payrollRuns.find(r => r.status === 'paid')?.total_net || 0,
        processing: payrollRuns.filter(r => r.status === 'processing' || r.status === 'draft').length,
        totalStaff: payrollRuns[0]?.staff_count || 0,
        yearToDate: payrollRuns.filter(r => r.status === 'paid').reduce((s, r) => s + r.total_net, 0),
    }), [payrollRuns]);

    const handleCreate = async () => {
        try {
            await payrollAPI.createPayrollRun(formData);
            toast.success('Payroll run created successfully');
            setShowCreate(false);
            fetchPayrollRuns();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create payroll run');
        }
    };

    const handleApprove = async (run) => {
        try {
            await payrollAPI.approvePayrollRun(run.id);
            toast.success(`Payroll ${run.payroll_number} approved`);
            fetchPayrollRuns();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve payroll');
        }
    };

    const handleMarkPaid = async (run) => {
        try {
            await payrollAPI.markPayrollPaid(run.id);
            toast.success(`Payroll ${run.payroll_number} marked as paid`);
            fetchPayrollRuns();
            setSelectedRun(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark payroll as paid');
        }
    };

    const handleViewPayslip = async (payrollRunId, staffId) => {
        try {
            toast.info('Generating payslip...');
            await openPdfInNewTab(documentAPI.previewPayslip(payrollRunId, staffId), 'Payslip.pdf');
        } catch (error) {
            console.error('Error generating payslip:', error);
            toast.error('Failed to generate payslip');
        }
    };

    const handleDownloadPayslip = async (payrollRunId, staffId, staffName) => {
        try {
            toast.info('Downloading payslip...');
            await downloadPdf(documentAPI.downloadPayslip(payrollRunId, staffId), `Payslip-${staffName}.pdf`);
            toast.success('Payslip downloaded');
        } catch (error) {
            console.error('Error downloading payslip:', error);
            toast.error('Failed to download payslip');
        }
    };

    const columns = [
        { key: 'payroll_number', label: 'Run #', sortable: true, render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> },
        { key: 'period', label: 'Period', sortable: true, render: (val) => <span className="font-medium text-slate-900">{val}</span> },
        { key: 'staff_count', label: 'Staff', sortable: true },
        { key: 'total_gross', label: 'Gross Pay', render: (val) => fmt(val) },
        { key: 'total_deductions', label: 'Deductions', render: (val) => <span className="text-red-600">{fmt(val)}</span> },
        { key: 'total_net', label: 'Net Payroll', sortable: true, render: (val) => <span className="font-bold">{fmt(val)}</span> },
        { key: 'status', label: 'Status', render: (val) => {
            const v = { draft: 'draft', processing: 'pending', approved: 'approved', paid: 'completed' };
            return <Badge variant={v[val] || 'draft'}>{val}</Badge>;
        }},
    ];

    const actions = [
        { label: 'View Details', onClick: (row) => setSelectedRun(row), variant: 'outline' },
        { label: 'Approve', onClick: (row) => handleApprove(row), variant: 'primary', show: (row) => row.status === 'processing' || row.status === 'draft' },
        { label: 'Mark Paid', onClick: (row) => handleMarkPaid(row), variant: 'primary', show: (row) => row.status === 'approved' },
    ];

    // Export columns for CSV
    const exportColumns = [
        { key: 'payroll_number', label: 'Run #' },
        { key: 'period', label: 'Period' },
        { key: 'period_start', label: 'Period Start' },
        { key: 'period_end', label: 'Period End' },
        { key: 'staff_count', label: 'Staff Count' },
        { key: 'total_gross', label: 'Gross Pay' },
        { key: 'total_deductions', label: 'Deductions' },
        { key: 'total_net', label: 'Net Payroll' },
        { key: 'status', label: 'Status' },
        { key: 'payment_date', label: 'Payment Date' },
    ];

    // Bulk action handlers
    const handleBulkApprove = async (selectedIndices) => {
        const selected = selectedIndices.map(i => payrollRuns[i]).filter(r => r.status === 'draft' || r.status === 'processing');
        if (selected.length === 0) {
            toast.error('No draft/processing payroll runs selected');
            return;
        }
        let successCount = 0;
        for (const run of selected) {
            try {
                await payrollAPI.approvePayrollRun(run.id);
                successCount++;
            } catch (error) {
                console.error(`Failed to approve payroll ${run.id}:`, error);
            }
        }
        toast.success(`${successCount} payroll run(s) approved`);
        fetchPayrollRuns();
    };

    const handleBulkMarkPaid = async (selectedIndices) => {
        const selected = selectedIndices.map(i => payrollRuns[i]).filter(r => r.status === 'approved');
        if (selected.length === 0) {
            toast.error('No approved payroll runs selected');
            return;
        }
        let successCount = 0;
        for (const run of selected) {
            try {
                await payrollAPI.markPayrollPaid(run.id);
                successCount++;
            } catch (error) {
                console.error(`Failed to mark payroll ${run.id} as paid:`, error);
            }
        }
        toast.success(`${successCount} payroll run(s) marked as paid`);
        fetchPayrollRuns();
    };

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => exportSelectedToCSV(selectedIndices, payrollRuns, exportColumns, 'payroll_runs'),
        },
        {
            label: 'Approve Selected',
            onClick: handleBulkApprove,
        },
        {
            label: 'Mark Paid',
            onClick: handleBulkMarkPaid,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
                    <p className="text-slate-600 mt-1">Process and manage monthly payroll</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>+ New Payroll Run</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Last Payroll', value: fmt(stats.lastPayroll), color: 'blue' },
                    { label: 'Processing', value: stats.processing, color: 'yellow' },
                    { label: 'Total Staff', value: stats.totalStaff, color: 'green' },
                    { label: 'Year to Date', value: fmt(stats.yearToDate), color: 'purple' },
                ].map((s, i) => (
                    <Card key={i}><CardBody className="p-4">
                        <p className="text-sm text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                    </CardBody></Card>
                ))}
            </div>

            <DataTable columns={columns} data={payrollRuns} actions={actions} loading={loading} selectable bulkActions={bulkActions} />

            {/* View Run Details */}
            <SlideOut isOpen={!!selectedRun} onClose={() => setSelectedRun(null)} title={`Payroll: ${selectedRun?.period || ''}`} size="lg">
                {selectedRun && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div><p className="text-xs text-slate-500">Run Number</p><p className="font-mono font-semibold">{selectedRun.payroll_number}</p></div>
                            <div><p className="text-xs text-slate-500">Status</p><Badge variant={selectedRun.status === 'paid' ? 'completed' : 'pending'}>{selectedRun.status}</Badge></div>
                            <div><p className="text-xs text-slate-500">Staff Count</p><p className="font-medium">{selectedRun.staff_count}</p></div>
                            <div><p className="text-xs text-slate-500">Paid Date</p><p className="font-medium">{selectedRun.paid_at ? new Date(selectedRun.paid_at).toLocaleDateString() : 'Not yet'}</p></div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Card><CardBody className="p-3 text-center"><p className="text-xs text-slate-500">Gross Pay</p><p className="font-bold text-slate-900">{fmt(selectedRun.total_gross)}</p></CardBody></Card>
                            <Card><CardBody className="p-3 text-center"><p className="text-xs text-slate-500">Deductions</p><p className="font-bold text-red-600">-{fmt(selectedRun.total_deductions)}</p></CardBody></Card>
                            <Card><CardBody className="p-3 text-center"><p className="text-xs text-slate-500">Net Total</p><p className="font-bold text-blue-700">{fmt(selectedRun.total_net)}</p></CardBody></Card>
                        </div>

                        {selectedRun.items.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-3">Payroll Items ({selectedRun.items.length} staff)</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Staff</th><th>Dept</th><th className="text-right">Basic</th><th className="text-right">Allowances</th><th className="text-right">Gross</th><th className="text-right">Deductions</th><th className="text-right">Net Pay</th><th className="text-right">Payslip</th></tr></thead>
                                        <tbody>
                                            {selectedRun.items.map((item, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="py-2 font-medium">{item.name}</td>
                                                    <td className="text-slate-500">{item.department}</td>
                                                    <td className="text-right">{fmt(item.basic)}</td>
                                                    <td className="text-right text-green-600">{fmt(item.allowances)}</td>
                                                    <td className="text-right font-medium">{fmt(item.gross)}</td>
                                                    <td className="text-right text-red-600">{fmt(item.deductions)}</td>
                                                    <td className="text-right font-semibold">{fmt(item.net)}</td>
                                                    <td className="text-right">
                                                        <div className="relative group inline-block">
                                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                                PDF ▾
                                                            </button>
                                                            <div className="absolute right-0 top-full z-10 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[100px]">
                                                                <button
                                                                    onClick={() => handleViewPayslip(selectedRun.id, item.staff_id)}
                                                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadPayslip(selectedRun.id, item.staff_id, item.name)}
                                                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    Download
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </SlideOut>

            {/* Create Run */}
            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Payroll Run" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Month *</label>
                            <select required value={formData.month} onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
                            <input type="number" required value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p className="font-medium mb-1">This will:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Pull all active staff salary structures</li>
                            <li>Calculate allowances and deductions</li>
                            <li>Generate payroll items for review</li>
                            <li>Require approval before payment</li>
                        </ul>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Generate Payroll</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>
        </div>
    );
}
