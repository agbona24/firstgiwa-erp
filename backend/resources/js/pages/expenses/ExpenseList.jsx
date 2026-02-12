import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DateRangePicker from '../../components/ui/DateRangePicker';
import SlideOut from '../../components/ui/SlideOut';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import expenseAPI from '../../services/expenseAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function ExpenseList() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [bulkRejectConfirm, setBulkRejectConfirm] = useState(null);
    const [formData, setFormData] = useState({ expense_category_id: '', title: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });

    // Fetch data from API
    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await expenseAPI.getAll();
            console.log('Expenses API response:', response);
            // Laravel pagination returns { data: [...], current_page, etc }
            const expenseData = Array.isArray(response) ? response : (response.data || []);
            console.log('Expense data:', expenseData);
            setExpenses(expenseData);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await expenseAPI.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const filtered = useMemo(() => {
        console.log('Filtering expenses:', expenses.length, 'items');
        return expenses.filter(e => {
            if (search && !e.expense_number?.toLowerCase().includes(search.toLowerCase()) && !e.title?.toLowerCase().includes(search.toLowerCase())) return false;
            if (categoryFilter && e.expense_category_id !== parseInt(categoryFilter)) return false;
            if (statusFilter && e.status !== statusFilter) return false;
            return true;
        });
    }, [expenses, search, categoryFilter, statusFilter]);

    const stats = useMemo(() => {
        console.log('Computing stats from:', expenses.length, 'expenses');
        return {
            totalThisMonth: expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
            pending: expenses.filter(e => e.status === 'pending').length,
            approved: expenses.filter(e => e.status === 'approved' || e.status === 'paid').reduce((s, e) => s + parseFloat(e.amount || 0), 0),
            paid: expenses.filter(e => e.status === 'paid').reduce((s, e) => s + parseFloat(e.amount || 0), 0),
        };
    }, [expenses]);

    const handleCreate = async () => {
        try {
            // Only send fields the backend accepts
            await expenseAPI.create({
                expense_category_id: formData.expense_category_id,
                title: formData.title,
                description: formData.description || null,
                amount: parseFloat(formData.amount),
                expense_date: formData.expense_date,
            });
            toast.success('Expense submitted');
            setShowCreate(false);
            setFormData({ expense_category_id: '', title: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });
            fetchExpenses();
        } catch (error) {
            console.error('Error creating expense:', error);
            // Show validation errors if present
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                toast.error(error.response?.data?.message || 'Failed to create expense');
            }
        }
    };

    const handleView = (expense) => {
        setSelectedExpense(expense);
    };

    const handleApprove = async (expense) => {
        try {
            await expenseAPI.approve(expense.id);
            toast.success(`Expense ${expense.expense_number || expense.id} approved`);
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to approve expense');
        }
    };

    const handleDisapprove = async (expense) => {
        try {
            await expenseAPI.disapprove(expense.id);
            toast.success(`Expense ${expense.expense_number || expense.id} reverted to pending`);
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to disapprove expense');
        }
    };

    // Export columns for CSV
    const exportColumns = [
        { key: 'expense_number', label: 'Expense #' },
        { key: 'expense_date', label: 'Date' },
        { key: 'title', label: 'Title' },
        { key: 'category.name', label: 'Category' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'creator.name', label: 'Submitted By' },
    ];

    // Bulk action handlers
    const handleBulkApprove = async (selectedIndices) => {
        const selected = selectedIndices.map(i => filtered[i]).filter(e => e.status === 'pending');
        if (selected.length === 0) {
            toast.error('No pending expenses selected');
            return;
        }
        let successCount = 0;
        for (const expense of selected) {
            try {
                await expenseAPI.approve(expense.id);
                successCount++;
            } catch (error) {
                console.error(`Failed to approve expense ${expense.id}:`, error);
            }
        }
        toast.success(`${successCount} expense(s) approved`);
        fetchExpenses();
    };

    const handleBulkReject = async (selectedIndices) => {
        const selected = selectedIndices.map(i => filtered[i]).filter(e => e.status === 'pending');
        if (selected.length === 0) {
            toast.error('No pending expenses selected');
            return;
        }
        setBulkRejectConfirm({ selectedIndices, count: selected.length });
    };

    const confirmBulkReject = async () => {
        const selected = bulkRejectConfirm.selectedIndices.map(i => filtered[i]).filter(e => e.status === 'pending');
        let successCount = 0;
        for (const expense of selected) {
            try {
                await expenseAPI.reject(expense.id);
                successCount++;
            } catch (error) {
                console.error(`Failed to reject expense ${expense.id}:`, error);
            }
        }
        toast.success(`${successCount} expense(s) rejected`);
        setBulkRejectConfirm(null);
        fetchExpenses();
    };

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => exportSelectedToCSV(selectedIndices, filtered, exportColumns, 'expenses'),
        },
        {
            label: 'Approve Selected',
            onClick: handleBulkApprove,
        },
        {
            label: 'Reject Selected',
            onClick: handleBulkReject,
            variant: 'danger',
        },
    ];

    const columns = [
        { key: 'expense_number', label: 'Ref #', sortable: true, render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> },
        { key: 'expense_date', label: 'Date', sortable: true, render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
        { key: 'title', label: 'Expense', render: (val, row) => (
            <div>
                <div className="font-medium text-slate-900 truncate max-w-xs">{val}</div>
                <div className="text-xs text-slate-500">{row.category?.name || 'Uncategorized'}</div>
            </div>
        )},
        { key: 'amount', label: 'Amount', sortable: true, render: (val) => <span className="font-semibold">{fmt(val || 0)}</span> },
        { key: 'status', label: 'Status', render: (val) => {
            const v = { draft: 'draft', pending: 'pending', approved: 'approved', paid: 'completed', rejected: 'rejected' };
            return <Badge variant={v[val] || 'draft'}>{val?.replace('_', ' ') || 'Draft'}</Badge>;
        }},
        { key: 'creator', label: 'Submitted By', render: (val, row) => row.creator?.name || '-' },
    ];

    const actions = [
        { label: 'View', onClick: handleView, variant: 'ghost' },
        { label: 'Approve', onClick: handleApprove, variant: 'primary', show: (row) => row.status === 'pending' },
        { label: 'Disapprove', onClick: handleDisapprove, variant: 'warning', show: (row) => row.status === 'approved' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
                    <p className="text-slate-600 mt-1">Track and manage company expenses ({expenses.length} total, {filtered.length} filtered)</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>+ New Expense</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total This Month', value: fmt(stats.totalThisMonth), color: 'blue' },
                    { label: 'Pending Approval', value: stats.pending, color: 'yellow' },
                    { label: 'Approved Total', value: fmt(stats.approved), color: 'green' },
                    { label: 'Paid Out', value: fmt(stats.paid), color: 'purple' },
                ].map((s, i) => (
                    <Card key={i}><CardBody className="p-4">
                        <p className="text-sm text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                    </CardBody></Card>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <SearchBar onSearch={setSearch} placeholder="Search expenses..." />
                <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories.map(c => ({ value: c.id.toString(), label: c.name }))} />
                <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'rejected', label: 'Rejected' },
                ]} />
                <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
            </div>

            <DataTable columns={columns} data={filtered} actions={actions} isLoading={loading} selectable bulkActions={bulkActions} />

            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Expense" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date *</label>
                        <input type="date" required value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                        <select required value={formData.expense_category_id} onChange={(e) => setFormData({...formData, expense_category_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select category...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                        <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Office Supplies Purchase" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Additional details (optional)..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount ({window.getCurrencySymbol()}) *</label>
                        <input type="number" required min="0.01" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="0.00" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Submit Expense</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* View Expense SlideOut */}
            <SlideOut isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Details" size="lg">
                {selectedExpense && (
                    <div className="space-y-6">
                        {/* Header with status badge */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedExpense.expense_number || 'N/A'}</h3>
                                <p className="text-sm text-slate-500">{selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                            </div>
                            <Badge variant={
                                selectedExpense.status === 'approved' ? 'approved' : 
                                selectedExpense.status === 'pending' ? 'pending' : 
                                selectedExpense.status === 'paid' ? 'completed' : 
                                selectedExpense.status === 'rejected' ? 'rejected' : 'draft'
                            }>
                                {selectedExpense.status?.replace('_', ' ') || 'Draft'}
                            </Badge>
                        </div>

                        {/* Amount highlight */}
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                            <p className="text-3xl font-bold text-blue-700 mt-1">{fmt(selectedExpense.amount || 0)}</p>
                        </div>

                        {/* Basic Info Section */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded"></span>
                                Basic Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Title</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.title || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.category?.name || 'Uncategorized'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Expense Date</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Branch</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.branch?.name || '-'}</p>
                                </div>
                            </div>
                            {selectedExpense.description && (
                                <div className="mt-4">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Description</p>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap bg-white p-2 rounded border border-slate-200">{selectedExpense.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Vendor & Receipt Section */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-green-500 rounded"></span>
                                Vendor & Receipt Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Vendor Name</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.vendor_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Receipt Number</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.receipt_number || '-'}</p>
                                </div>
                            </div>
                            {selectedExpense.receipt_url && (
                                <div className="mt-4">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Receipt</p>
                                    <a href={selectedExpense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                                        📎 View Receipt Attachment
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Payment Section */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-purple-500 rounded"></span>
                                Payment Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Payment Method</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1 capitalize">{selectedExpense.payment_method?.replace('_', ' ') || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Payment Reference</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.payment_reference || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recurring Info */}
                        {selectedExpense.is_recurring && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                                    🔄 Recurring Expense
                                </h4>
                                <p className="text-sm text-amber-600">
                                    Frequency: <span className="font-medium capitalize">{selectedExpense.recurring_frequency || 'Not specified'}</span>
                                </p>
                            </div>
                        )}

                        {/* Submission & Approval Section */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded"></span>
                                Submission & Approval
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted By</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.creator?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted At</p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.created_at ? new Date(selectedExpense.created_at).toLocaleString() : '-'}</p>
                                </div>
                                {selectedExpense.approved_by && (
                                    <>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Approved By</p>
                                            <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.approver?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Approved At</p>
                                            <p className="text-sm font-medium text-slate-900 mt-1">{selectedExpense.approved_at ? new Date(selectedExpense.approved_at).toLocaleString() : '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Rejection Reason */}
                        {selectedExpense.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                    ❌ Rejection Details
                                </h4>
                                <p className="text-sm text-red-700">{selectedExpense.rejection_reason}</p>
                            </div>
                        )}

                        {/* Action buttons for pending expenses */}
                        {selectedExpense.status === 'pending' && (
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <Button 
                                    onClick={async () => {
                                        await handleApprove(selectedExpense);
                                        setSelectedExpense(null);
                                    }}
                                    className="flex-1"
                                >
                                    ✓ Approve
                                </Button>
                                <Button 
                                    variant="danger" 
                                    onClick={async () => {
                                        try {
                                            await expenseAPI.reject(selectedExpense.id);
                                            toast.success(`Expense ${selectedExpense.expense_number || selectedExpense.id} rejected`);
                                            setSelectedExpense(null);
                                            fetchExpenses();
                                        } catch (error) {
                                            toast.error('Failed to reject expense');
                                        }
                                    }}
                                    className="flex-1"
                                >
                                    ✗ Reject
                                </Button>
                            </div>
                        )}

                        {/* Action button for approved expenses */}
                        {selectedExpense.status === 'approved' && (
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <Button 
                                    variant="warning"
                                    onClick={async () => {
                                        await handleDisapprove(selectedExpense);
                                        setSelectedExpense(null);
                                    }}
                                    className="flex-1"
                                >
                                    Revert to Pending
                                </Button>
                            </div>
                        )}

                        {/* Close button for non-actionable statuses */}
                        {(selectedExpense.status === 'paid' || selectedExpense.status === 'rejected') && (
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSelectedExpense(null)}
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </SlideOut>

            {/* Bulk Reject Confirmation Modal */}
            <ConfirmModal
                isOpen={!!bulkRejectConfirm}
                onClose={() => setBulkRejectConfirm(null)}
                onConfirm={confirmBulkReject}
                title="Reject Expenses"
                message={`Are you sure you want to reject ${bulkRejectConfirm?.count || 0} expense(s)?`}
                confirmLabel="Reject"
                variant="danger"
            />
        </div>
    );
}
