import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import SlideOut from '../../components/ui/SlideOut';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import customerAPI from '../../services/customerAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function CustomerList() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: '', contact_person: '', email: '', phone: '', customer_type: 'cash', credit_limit: '', payment_terms_days: '0', address: '' });
    const [showEdit, setShowEdit] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, customer: null });
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState({ isOpen: false, count: 0, indices: [] });

    // Fetch customers from API
    useEffect(() => {
        fetchCustomers();
    }, [search, typeFilter, statusFilter]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (typeFilter) params.customer_type = typeFilter;
            if (statusFilter === 'blocked') {
                params.credit_blocked = true;
            } else if (statusFilter === 'active') {
                params.is_active = true;
            }
            
            const response = await customerAPI.getCustomers(params);
            setCustomers(response.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        total: customers.length,
        active: customers.filter(c => c.is_active).length,
        creditCustomers: customers.filter(c => c.customer_type === 'credit' || c.customer_type === 'both').length,
        totalOutstanding: customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
    }), [customers]);

    const creditUsagePercent = (c) => {
        const used = c.outstanding_balance || 0;
        return c.credit_limit > 0 ? Math.round((used / c.credit_limit) * 100) : 0;
    };

    const handleCreate = async () => {
        try {
            await customerAPI.createCustomer(formData);
            toast.success('Customer created successfully');
            setShowCreate(false);
            setFormData({ name: '', contact_person: '', email: '', phone: '', customer_type: 'cash', credit_limit: '', payment_terms_days: '0', address: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error creating customer:', error);
            toast.error(error.response?.data?.message || 'Failed to create customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || '',
            contact_person: customer.contact_person || '',
            email: customer.email || '',
            phone: customer.phone || '',
            customer_type: customer.customer_type || 'cash',
            credit_limit: customer.credit_limit || '',
            payment_terms_days: customer.payment_terms_days || '0',
            address: customer.address || '',
        });
        setShowEdit(true);
    };

    const handleUpdate = async () => {
        if (!editingCustomer) return;
        try {
            await customerAPI.updateCustomer(editingCustomer.id, formData);
            toast.success('Customer updated successfully');
            setShowEdit(false);
            setEditingCustomer(null);
            setFormData({ name: '', contact_person: '', email: '', phone: '', customer_type: 'cash', credit_limit: '', payment_terms_days: '0', address: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error updating customer:', error);
            toast.error(error.response?.data?.message || 'Failed to update customer');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.customer) return;
        try {
            await customerAPI.deleteCustomer(deleteConfirm.customer.id);
            toast.success(`${deleteConfirm.customer.name} deleted successfully`);
            setDeleteConfirm({ isOpen: false, customer: null });
            fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    const columns = [
        { key: 'customer_code', label: 'Code', sortable: true, render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> },
        { key: 'name', label: 'Customer Name', sortable: true, render: (val, row) => (
            <div>
                <div className="font-medium text-slate-900">{val}</div>
                <div className="text-xs text-slate-500">{row.contact_person}</div>
            </div>
        )},
        { key: 'customer_type', label: 'Type', sortable: true, render: (val) => (
            <Badge variant={val === 'credit' ? 'pending' : val === 'both' ? 'approved' : 'draft'}>{val}</Badge>
        )},
        { key: 'credit_limit', label: 'Credit Limit', sortable: true, render: (val) => val > 0 ? fmt(val) : <span className="text-slate-400">N/A</span> },
        { key: 'outstanding_balance', label: 'Credit Usage', render: (val, row) => {
            if (row.credit_limit === 0) return <span className="text-slate-400">N/A</span>;
            const pct = creditUsagePercent(row);
            return (
                <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                        <span>{fmt(val || 0)}</span>
                        <span className={pct >= 90 ? 'text-red-600 font-bold' : ''}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                </div>
            );
        }},
        { key: 'outstanding_balance', label: 'Outstanding', sortable: true, render: (val) => (
            <span className={val > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{fmt(val || 0)}</span>
        )},
        { key: 'is_active', label: 'Status', render: (val, row) => (
            <Badge variant={row.credit_blocked ? 'rejected' : val ? 'approved' : 'draft'}>
                {row.credit_blocked ? 'Credit Blocked' : val ? 'Active' : 'Inactive'}
            </Badge>
        )},
    ];

    const [showCreditMgmt, setShowCreditMgmt] = useState(null);
    const [creditForm, setCreditForm] = useState({ credit_limit: '', payment_terms_days: '', reason: '' });

    const handleCreditUpdate = async () => {
        try {
            await customerAPI.updateCredit(showCreditMgmt.id, creditForm);
            toast.success(`Credit facility updated for ${showCreditMgmt.name}`);
            setShowCreditMgmt(null);
            setCreditForm({ credit_limit: '', payment_terms_days: '', reason: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error updating credit:', error);
            toast.error(error.response?.data?.message || 'Failed to update credit facility');
        }
    };

    const handleBlockToggle = async (customer) => {
        try {
            const block = !customer.credit_blocked;
            const reason = prompt(block ? 'Reason for blocking credit:' : 'Reason for unblocking credit:');
            if (!reason) return;
            
            await customerAPI.toggleCreditBlock(customer.id, block, reason);
            toast.success(block ? `Credit blocked for ${customer.name}` : `Credit unblocked for ${customer.name}`);
            fetchCustomers();
            if (selectedCustomer?.id === customer.id) {
                setSelectedCustomer(null);
            }
        } catch (error) {
            console.error('Error toggling credit block:', error);
            toast.error(error.response?.data?.message || 'Failed to update credit status');
        }
    };

    const actions = [
        { label: 'View', onClick: (row) => setSelectedCustomer(row), variant: 'outline' },
        { label: 'Edit', onClick: (row) => handleEdit(row), variant: 'ghost' },
        { label: 'Credit', onClick: (row) => { setCreditForm({ credit_limit: row.credit_limit || '', payment_terms_days: row.payment_terms_days || '', reason: '' }); setShowCreditMgmt(row); }, variant: 'ghost', show: (row) => row.customer_type !== 'cash' },
        { label: 'Delete', onClick: (row) => setDeleteConfirm({ isOpen: true, customer: row }), variant: 'danger' },
    ];

    // Bulk Actions
    const exportColumns = [
        { key: 'customer_code', label: 'Customer Code' },
        { key: 'name', label: 'Customer Name' },
        { key: 'contact_person', label: 'Contact Person' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'customer_type', label: 'Type' },
        { key: 'credit_limit', label: 'Credit Limit' },
        { key: 'outstanding_balance', label: 'Outstanding Balance' },
        { key: 'is_active', label: 'Active' },
        { key: 'credit_blocked', label: 'Credit Blocked' },
    ];

    const handleBulkDelete = async () => {
        const { indices } = bulkDeleteConfirm;
        let successCount = 0;
        let errorCount = 0;

        for (const idx of indices) {
            const customer = customers[idx];
            if (customer) {
                try {
                    await customerAPI.deleteCustomer(customer.id);
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        setBulkDeleteConfirm({ isOpen: false, count: 0, indices: [] });
        if (successCount > 0) toast.success(`${successCount} customer(s) deleted successfully`);
        if (errorCount > 0) toast.error(`${errorCount} customer(s) failed to delete`);
        fetchCustomers();
    };

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                exportSelectedToCSV(selectedIndices, customers, exportColumns, 'customers');
                toast.success(`Exported ${selectedIndices.length} customers`);
            }
        },
        {
            label: 'Delete Selected',
            onClick: (selectedIndices) => {
                setBulkDeleteConfirm({ isOpen: true, count: selectedIndices.length, indices: selectedIndices });
            }
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                    <p className="text-slate-600 mt-1">Manage customer accounts and credit</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>+ New Customer</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Customers', value: stats.total, color: 'blue' },
                    { label: 'Active', value: stats.active, color: 'green' },
                    { label: 'Credit Accounts', value: stats.creditCustomers, color: 'purple' },
                    { label: 'Total Outstanding', value: fmt(stats.totalOutstanding), color: 'red' },
                ].map((s, i) => (
                    <Card key={i}>
                        <CardBody className="p-4">
                            <p className="text-sm text-slate-500">{s.label}</p>
                            <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <SearchBar onSearch={setSearch} placeholder="Search customers..." />
                <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'credit', label: 'Credit' },
                    { value: 'both', label: 'Both' },
                ]} />
                <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                    { value: 'active', label: 'Active' },
                    { value: 'blocked', label: 'Blocked' },
                ]} />
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-2 text-slate-500">Loading customers...</p>
                </div>
            ) : (
                <DataTable columns={columns} data={customers} actions={actions} selectable bulkActions={bulkActions} />
            )}

            {/* Create SlideOut */}
            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Customer" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company / Customer Name *</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Kano Flour Mills" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person *</label>
                        <input type="text" required value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                            <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type *</label>
                        <select value={formData.customer_type} onChange={(e) => setFormData({...formData, customer_type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="cash">Cash Only</option>
                            <option value="credit">Credit</option>
                            <option value="both">Cash & Credit</option>
                        </select>
                    </div>
                    {(formData.customer_type === 'credit' || formData.customer_type === 'both') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit ({window.getCurrencySymbol()})</label>
                                <input type="number" value={formData.credit_limit} onChange={(e) => setFormData({...formData, credit_limit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                                <input type="number" value={formData.payment_terms_days} onChange={(e) => setFormData({...formData, payment_terms_days: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Create Customer</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Customer Detail + Ledger SlideOut */}
            <SlideOut isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={selectedCustomer?.name || ''} size="lg">
                {selectedCustomer && (
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><p className="text-xs text-slate-500">Customer Code</p><p className="font-mono font-semibold">{selectedCustomer.customer_code}</p></div>
                            <div><p className="text-xs text-slate-500">Contact Person</p><p className="font-medium">{selectedCustomer.contact_person}</p></div>
                            <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium">{selectedCustomer.phone}</p></div>
                            <div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{selectedCustomer.email}</p></div>
                            <div><p className="text-xs text-slate-500">Address</p><p className="font-medium">{selectedCustomer.address}</p></div>
                            <div><p className="text-xs text-slate-500">Type</p><Badge variant={selectedCustomer.customer_type === 'credit' ? 'pending' : selectedCustomer.customer_type === 'both' ? 'approved' : 'draft'}>{selectedCustomer.customer_type}</Badge></div>
                        </div>

                        {/* Credit Facility Summary */}
                        {selectedCustomer.customer_type !== 'cash' && (
                            <div className={`p-4 rounded-lg border-2 ${selectedCustomer.credit_blocked ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-slate-900">Credit Facility</h4>
                                    <div className="flex gap-2">
                                        <Badge variant={selectedCustomer.credit_blocked ? 'rejected' : 'approved'}>
                                            {selectedCustomer.credit_blocked ? 'BLOCKED' : 'ACTIVE'}
                                        </Badge>
                                        <button onClick={() => handleBlockToggle(selectedCustomer)} className={`text-xs font-medium px-2 py-1 rounded ${selectedCustomer.credit_blocked ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-red-700 bg-red-100 hover:bg-red-200'}`}>
                                            {selectedCustomer.credit_blocked ? 'Unblock' : 'Block'}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">Credit Limit</p>
                                        <p className="text-lg font-bold text-slate-900">{fmt(selectedCustomer.credit_limit)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">Available</p>
                                        <p className="text-lg font-bold text-green-600">{fmt(selectedCustomer.credit_limit - (selectedCustomer.outstanding_balance || 0))}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">Outstanding</p>
                                        <p className="text-lg font-bold text-red-600">{fmt(selectedCustomer.outstanding_balance || 0)}</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Credit utilization</span>
                                        <span className="font-semibold">{creditUsagePercent(selectedCustomer)}%</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3">
                                        <div className={`h-3 rounded-full transition-all ${creditUsagePercent(selectedCustomer) >= 90 ? 'bg-red-500' : creditUsagePercent(selectedCustomer) >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(creditUsagePercent(selectedCustomer), 100)}%` }} />
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-slate-600">
                                    Payment Terms: <span className="font-semibold">{selectedCustomer.payment_terms_days} days</span> &middot; Total Purchases: <span className="font-semibold">{fmt(selectedCustomer.total_purchases)}</span>
                                </div>
                            </div>
                        )}

                        {/* Ledger */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Transaction Ledger</h4>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Date</th><th>Reference</th><th>Type</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Balance</th></tr></thead>
                                <tbody>
                                    {[
                                        { date: '2026-01-28', ref: 'INV-2026-045', type: 'Invoice', debit: 850000, credit: 0, balance: 1800000 },
                                        { date: '2026-01-25', ref: 'PAY-2026-032', type: 'Payment', debit: 0, credit: 500000, balance: 950000 },
                                        { date: '2026-01-20', ref: 'INV-2026-038', type: 'Invoice', debit: 1200000, credit: 0, balance: 1450000 },
                                        { date: '2026-01-15', ref: 'PAY-2026-028', type: 'Payment', debit: 0, credit: 1000000, balance: 250000 },
                                        { date: '2026-01-10', ref: 'INV-2026-025', type: 'Invoice', debit: 750000, credit: 0, balance: 1250000 },
                                    ].map((t, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="py-2">{t.date}</td>
                                            <td className="font-mono text-blue-700">{t.ref}</td>
                                            <td><Badge variant={t.type === 'Invoice' ? 'pending' : 'approved'}>{t.type}</Badge></td>
                                            <td className="text-right text-red-600">{t.debit > 0 ? fmt(t.debit) : '-'}</td>
                                            <td className="text-right text-green-600">{t.credit > 0 ? fmt(t.credit) : '-'}</td>
                                            <td className="text-right font-semibold">{fmt(t.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Credit Management SlideOut */}
            <SlideOut isOpen={!!showCreditMgmt} onClose={() => setShowCreditMgmt(null)} title={`Credit Facility: ${showCreditMgmt?.name || ''}`} size="md">
                {showCreditMgmt && (
                    <div className="space-y-6">
                        {/* Current Status */}
                        <div className={`p-4 rounded-lg ${showCreditMgmt.credit_blocked ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">Current Status</p>
                                    <p className="text-sm text-slate-600">
                                        Using {fmt(showCreditMgmt.outstanding_balance || 0)} of {fmt(showCreditMgmt.credit_limit)} ({creditUsagePercent(showCreditMgmt)}%)
                                    </p>
                                </div>
                                <Badge variant={showCreditMgmt.credit_blocked ? 'rejected' : 'approved'}>
                                    {showCreditMgmt.credit_blocked ? 'BLOCKED' : 'ACTIVE'}
                                </Badge>
                            </div>
                        </div>

                        {/* Block/Unblock */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">Credit Access</p>
                                <p className="text-xs text-slate-500">
                                    {showCreditMgmt.credit_blocked
                                        ? 'Customer is blocked from making credit purchases'
                                        : 'Customer can make credit purchases within their limit'}
                                </p>
                            </div>
                            <button
                                onClick={() => { handleBlockToggle(showCreditMgmt); setShowCreditMgmt(null); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${showCreditMgmt.credit_blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                            >
                                {showCreditMgmt.credit_blocked ? 'Unblock Credit' : 'Block Credit'}
                            </button>
                        </div>

                        {/* Update Form */}
                        <form onSubmit={(e) => { e.preventDefault(); handleCreditUpdate(); }} className="space-y-4">
                            <h4 className="font-semibold text-slate-900">Update Credit Terms</h4>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit ({window.getCurrencySymbol()})</label>
                                <input type="number" min="0" value={creditForm.credit_limit} onChange={(e) => setCreditForm({...creditForm, credit_limit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                {creditForm.credit_limit && Number(creditForm.credit_limit) < (showCreditMgmt.outstanding_balance || 0) && (
                                    <p className="text-xs text-red-600 mt-1">Warning: New limit is below outstanding balance ({fmt(showCreditMgmt.outstanding_balance || 0)})</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                                <input type="number" min="0" value={creditForm.payment_terms_days} onChange={(e) => setCreditForm({...creditForm, payment_terms_days: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Change *</label>
                                <textarea required value={creditForm.reason} onChange={(e) => setCreditForm({...creditForm, reason: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Explain why this change is being made..." />
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                                All credit limit changes are recorded in the audit trail.
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <Button type="submit">Update Credit Facility</Button>
                                <Button variant="outline" onClick={() => setShowCreditMgmt(null)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                )}
            </SlideOut>

            {/* Edit Customer SlideOut */}
            <SlideOut isOpen={showEdit} onClose={() => { setShowEdit(false); setEditingCustomer(null); }} title={`Edit: ${editingCustomer?.name || ''}`} size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company / Customer Name *</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Kano Flour Mills" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person *</label>
                        <input type="text" required value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                            <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type *</label>
                        <select value={formData.customer_type} onChange={(e) => setFormData({...formData, customer_type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="cash">Cash Only</option>
                            <option value="credit">Credit</option>
                            <option value="both">Cash & Credit</option>
                        </select>
                    </div>
                    {(formData.customer_type === 'credit' || formData.customer_type === 'both') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit ({window.getCurrencySymbol()})</label>
                                <input type="number" value={formData.credit_limit} onChange={(e) => setFormData({...formData, credit_limit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                                <input type="number" value={formData.payment_terms_days} onChange={(e) => setFormData({...formData, payment_terms_days: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Update Customer</Button>
                        <Button variant="outline" onClick={() => { setShowEdit(false); setEditingCustomer(null); }}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, customer: null })}
                onConfirm={handleDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete "${deleteConfirm.customer?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
            />

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={bulkDeleteConfirm.isOpen}
                onClose={() => setBulkDeleteConfirm({ isOpen: false, count: 0, indices: [] })}
                onConfirm={handleBulkDelete}
                title="Delete Multiple Customers"
                message={`Are you sure you want to delete ${bulkDeleteConfirm.count} customer(s)? This action cannot be undone.`}
                confirmText="Delete All"
                confirmVariant="danger"
            />
        </div>
    );
}
