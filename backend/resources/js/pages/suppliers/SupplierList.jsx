import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import SlideOut from '../../components/ui/SlideOut';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import supplierAPI from '../../services/supplierAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function SupplierList() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierPurchaseOrders, setSupplierPurchaseOrders] = useState([]);
    const [loadingPOs, setLoadingPOs] = useState(false);
    const [formData, setFormData] = useState({ name: '', contact_person: '', email: '', phone: '', type: 'local', country: 'Nigeria', payment_terms_days: '30', bank_name: '', account_number: '' });
    const [showEdit, setShowEdit] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, supplier: null });
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState({ isOpen: false, count: 0, indices: [] });

    // Fetch suppliers from API
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await supplierAPI.getAll();
            setSuppliers(response.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return suppliers.filter(s => {
            if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.supplier_code.toLowerCase().includes(search.toLowerCase())) return false;
            if (typeFilter && s.type !== typeFilter) return false;
            return true;
        });
    }, [suppliers, search, typeFilter]);

    const stats = useMemo(() => ({
        total: suppliers.length,
        local: suppliers.filter(s => s.type === 'local').length,
        international: suppliers.filter(s => s.type === 'international').length,
        totalOutstanding: suppliers.reduce((sum, s) => sum + parseFloat(s.outstanding_balance || 0), 0),
    }), [suppliers]);

    const handleCreate = async () => {
        try {
            await supplierAPI.create(formData);
            toast.success('Supplier created successfully');
            setShowCreate(false);
            setFormData({ name: '', contact_person: '', email: '', phone: '', type: 'local', country: 'Nigeria', payment_terms_days: '30', bank_name: '', account_number: '' });
            fetchSuppliers();
        } catch (error) {
            console.error('Error creating supplier:', error);
            toast.error(error.response?.data?.message || 'Failed to create supplier');
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name || '',
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            type: supplier.type || 'local',
            country: supplier.country || 'Nigeria',
            payment_terms_days: supplier.payment_terms_days || '30',
            bank_name: supplier.bank_name || '',
            account_number: supplier.account_number || '',
        });
        setShowEdit(true);
    };

    const handleUpdate = async () => {
        if (!editingSupplier) return;
        try {
            await supplierAPI.update(editingSupplier.id, formData);
            toast.success('Supplier updated successfully');
            setShowEdit(false);
            setEditingSupplier(null);
            setFormData({ name: '', contact_person: '', email: '', phone: '', type: 'local', country: 'Nigeria', payment_terms_days: '30', bank_name: '', account_number: '' });
            fetchSuppliers();
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast.error(error.response?.data?.message || 'Failed to update supplier');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.supplier) return;
        try {
            await supplierAPI.delete(deleteConfirm.supplier.id);
            toast.success(`${deleteConfirm.supplier.name} deleted successfully`);
            setDeleteConfirm({ isOpen: false, supplier: null });
            fetchSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast.error(error.response?.data?.message || 'Failed to delete supplier');
        }
    };

    // Bulk Actions
    const exportColumns = [
        { key: 'supplier_code', label: 'Supplier Code' },
        { key: 'name', label: 'Supplier Name' },
        { key: 'contact_person', label: 'Contact Person' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'type', label: 'Type' },
        { key: 'country', label: 'Country' },
        { key: 'payment_terms_days', label: 'Payment Terms (Days)' },
        { key: 'total_purchases', label: 'Total Purchases' },
        { key: 'outstanding_balance', label: 'Outstanding Balance' },
        { key: 'is_active', label: 'Active' },
    ];

    const handleBulkDelete = async () => {
        const { indices } = bulkDeleteConfirm;
        let successCount = 0;
        let errorCount = 0;

        for (const idx of indices) {
            const supplier = filtered[idx];
            if (supplier) {
                try {
                    await supplierAPI.delete(supplier.id);
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        setBulkDeleteConfirm({ isOpen: false, count: 0, indices: [] });
        if (successCount > 0) toast.success(`${successCount} supplier(s) deleted successfully`);
        if (errorCount > 0) toast.error(`${errorCount} supplier(s) failed to delete`);
        fetchSuppliers();
    };

    const handleBulkToggleActive = async (selectedIndices, activate) => {
        let successCount = 0;
        let errorCount = 0;

        for (const idx of selectedIndices) {
            const supplier = filtered[idx];
            if (supplier) {
                try {
                    await supplierAPI.toggleActive(supplier.id);
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        if (successCount > 0) toast.success(`${successCount} supplier(s) status toggled`);
        if (errorCount > 0) toast.error(`${errorCount} supplier(s) failed to toggle`);
        fetchSuppliers();
    };

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                exportSelectedToCSV(selectedIndices, filtered, exportColumns, 'suppliers');
                toast.success(`Exported ${selectedIndices.length} suppliers`);
            }
        },
        {
            label: 'Toggle Active',
            onClick: (selectedIndices) => handleBulkToggleActive(selectedIndices)
        },
        {
            label: 'Delete Selected',
            onClick: (selectedIndices) => {
                setBulkDeleteConfirm({ isOpen: true, count: selectedIndices.length, indices: selectedIndices });
            }
        }
    ];

    const handleViewSupplier = async (supplier) => {
        setSelectedSupplier(supplier);
        setSupplierPurchaseOrders([]);
        setLoadingPOs(true);
        try {
            const response = await supplierAPI.getPurchaseOrders(supplier.id, { per_page: 10 });
            setSupplierPurchaseOrders(response.data || []);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            toast.error('Failed to load purchase orders');
        } finally {
            setLoadingPOs(false);
        }
    };

    const columns = [
        { key: 'supplier_code', label: 'Code', sortable: true, render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> },
        { key: 'name', label: 'Supplier', sortable: true, render: (val, row) => (
            <div>
                <div className="font-medium text-slate-900">{val}</div>
                <div className="text-xs text-slate-500">{row.contact_person}</div>
            </div>
        )},
        { key: 'email', label: 'Email', render: (val) => val || '-' },
        { key: 'phone', label: 'Phone' },
        { key: 'payment_terms_days', label: 'Terms', render: (val) => `${val} days` },
        { key: 'total_purchases', label: 'Total Purchases', sortable: true, render: (val) => fmt(val || 0) },
        { key: 'outstanding_balance', label: 'Outstanding', sortable: true, render: (val) => (
            <span className={parseFloat(val) > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{fmt(val || 0)}</span>
        )},
        { key: 'is_active', label: 'Status', render: (val) => <Badge variant={val ? 'approved' : 'draft'}>{val ? 'Active' : 'Inactive'}</Badge> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
                    <p className="text-slate-600 mt-1">Manage local and international suppliers</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>+ New Supplier</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Suppliers', value: stats.total, color: 'blue' },
                    { label: 'Local', value: stats.local, color: 'green' },
                    { label: 'International', value: stats.international, color: 'purple' },
                    { label: 'Total Outstanding', value: fmt(stats.totalOutstanding), color: 'red' },
                ].map((s, i) => (
                    <Card key={i}><CardBody className="p-4">
                        <p className="text-sm text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                    </CardBody></Card>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <SearchBar onSearch={setSearch} placeholder="Search suppliers..." />
                <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={[
                    { value: 'local', label: 'Local' },
                    { value: 'international', label: 'International' },
                ]} />
            </div>

            <DataTable columns={columns} data={filtered} selectable bulkActions={bulkActions} actions={[
                { label: 'View', onClick: (row) => handleViewSupplier(row), variant: 'outline' },
                { label: 'Edit', onClick: (row) => handleEdit(row), variant: 'ghost' },
                { label: 'Delete', onClick: (row) => setDeleteConfirm({ isOpen: true, supplier: row }), variant: 'danger' },
            ]} />

            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Supplier" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Type *</label>
                            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="local">Local</option>
                                <option value="international">International</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                            <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                        <input type="number" value={formData.payment_terms_days} onChange={(e) => setFormData({...formData, payment_terms_days: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                            <input type="text" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                            <input type="text" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Create Supplier</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Supplier Detail SlideOut */}
            <SlideOut isOpen={!!selectedSupplier} onClose={() => setSelectedSupplier(null)} title={selectedSupplier?.name || ''} size="lg">
                {selectedSupplier && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><p className="text-xs text-slate-500">Supplier Code</p><p className="font-mono font-semibold">{selectedSupplier.supplier_code}</p></div>
                            <div><p className="text-xs text-slate-500">Contact Person</p><p className="font-medium">{selectedSupplier.contact_person}</p></div>
                            <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium">{selectedSupplier.phone}</p></div>
                            <div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{selectedSupplier.email}</p></div>
                            <div><p className="text-xs text-slate-500">Type</p><Badge variant={selectedSupplier.type === 'international' ? 'gold' : 'draft'}>{selectedSupplier.type}</Badge></div>
                            <div><p className="text-xs text-slate-500">Country</p><p className="font-medium">{selectedSupplier.country}</p></div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-xs text-slate-500">Total Orders</p>
                                <p className="text-xl font-bold text-slate-900">{selectedSupplier.total_orders}</p>
                            </CardBody></Card>
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-xs text-slate-500">Total Value</p>
                                <p className="text-xl font-bold text-blue-600">{fmt(selectedSupplier.total_value)}</p>
                            </CardBody></Card>
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-xs text-slate-500">Outstanding</p>
                                <p className={`text-xl font-bold ${selectedSupplier.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(selectedSupplier.outstanding)}</p>
                            </CardBody></Card>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-slate-900 mb-3">Payment & Banking</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-slate-500">Payment Terms</p><p className="font-medium">{selectedSupplier.payment_terms_days} days</p></div>
                                <div><p className="text-xs text-slate-500">Bank Name</p><p className="font-medium">{selectedSupplier.bank_name}</p></div>
                                <div><p className="text-xs text-slate-500">Account Number</p><p className="font-mono font-medium">{selectedSupplier.account_number}</p></div>
                                <div><p className="text-xs text-slate-500">Status</p><Badge variant={selectedSupplier.status === 'active' ? 'approved' : 'draft'}>{selectedSupplier.status}</Badge></div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Recent Purchase Orders</h4>
                            {loadingPOs ? (
                                <div className="text-center py-4 text-slate-500">Loading purchase orders...</div>
                            ) : supplierPurchaseOrders.length === 0 ? (
                                <div className="text-center py-4 text-slate-500">No purchase orders found</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b text-left text-slate-500"><th className="py-2">PO Number</th><th>Date</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {supplierPurchaseOrders.map((po, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-2 font-mono text-blue-700">{po.po_number}</td>
                                                <td>{po.order_date}</td>
                                                <td className="text-right font-semibold">{fmt(po.total_amount)}</td>
                                                <td><Badge variant={po.status === 'completed' ? 'approved' : po.status === 'pending' ? 'pending' : 'draft'}>{po.status}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Edit Supplier SlideOut */}
            <SlideOut isOpen={showEdit} onClose={() => { setShowEdit(false); setEditingSupplier(null); }} title={`Edit: ${editingSupplier?.name || ''}`} size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Type *</label>
                            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="local">Local</option>
                                <option value="international">International</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                            <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                        <input type="number" value={formData.payment_terms_days} onChange={(e) => setFormData({...formData, payment_terms_days: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                            <input type="text" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                            <input type="text" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Update Supplier</Button>
                        <Button variant="outline" onClick={() => { setShowEdit(false); setEditingSupplier(null); }}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, supplier: null })}
                onConfirm={handleDelete}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${deleteConfirm.supplier?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
            />

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={bulkDeleteConfirm.isOpen}
                onClose={() => setBulkDeleteConfirm({ isOpen: false, count: 0, indices: [] })}
                onConfirm={handleBulkDelete}
                title="Delete Multiple Suppliers"
                message={`Are you sure you want to delete ${bulkDeleteConfirm.count} supplier(s)? This action cannot be undone.`}
                confirmText="Delete All"
                confirmVariant="danger"
            />
        </div>
    );
}
