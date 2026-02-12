import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import SlideOut from '../../components/ui/SlideOut';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import formulaAPI from '../../services/formulaAPI';
import productAPI from '../../services/productAPI';
import customerAPI from '../../services/customerAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

export default function FormulaList() {
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingFormula, setEditingFormula] = useState(null);
    const [selectedFormula, setSelectedFormula] = useState(null);
    const [formulaItems, setFormulaItems] = useState([{ product_id: '', percentage: '' }]);
    const [formData, setFormData] = useState({ name: '', customer_id: '' });

    const [loading, setLoading] = useState(true);
    const [formulas, setFormulas] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, formula: null });
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState({ isOpen: false, count: 0, indices: [] });
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        fetchFormulas();
        fetchProducts();
        fetchCustomers();
    }, []);

    useEffect(() => {
        fetchFormulas();
    }, [search]);

    const fetchFormulas = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;

            const response = await formulaAPI.getFormulas(params);
            // Transform API response to match expected table format (same pattern as PurchaseOrderList)
            const rawData = response.data || [];
            const transformedFormulas = rawData.map(formula => ({
                ...formula,
                code: formula.formula_code || '',
                customer: formula.customer?.name || null,
                items: (formula.items || []).map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    percentage: item.percentage,
                    product: item.product?.name || 'Unknown Product'
                }))
            }));
            setFormulas(transformedFormulas);
        } catch (error) {
            console.error('Error fetching formulas:', error);
            toast.error('Failed to load formulas');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productAPI.getProducts({ per_page: 1000 });
            const data = Array.isArray(response) ? response : (response?.data || []);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customerAPI.getAll({ per_page: 1000 });
            const data = Array.isArray(response) ? response : (response?.data || []);
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const filtered = useMemo(() => {
        return formulas.filter(f => {
            if (search && !f.name?.toLowerCase().includes(search.toLowerCase()) && !f.code?.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [search, formulas]);

    const addItem = () => setFormulaItems([...formulaItems, { product_id: '', percentage: '' }]);
    const removeItem = (idx) => setFormulaItems(formulaItems.filter((_, i) => i !== idx));
    const updateItem = (idx, field, value) => {
        const items = [...formulaItems];
        items[idx][field] = value;
        setFormulaItems(items);
    };

    const totalPct = formulaItems.reduce((sum, i) => sum + (parseFloat(i.percentage) || 0), 0);

    const handleCreate = async () => {
        if (Math.abs(totalPct - 100) > 0.01) {
            toast.error('Percentages must total 100%');
            return;
        }

        const validItems = formulaItems.filter(i => i.product_id);
        if (!validItems.length) {
            toast.error('Please add at least one product');
            return;
        }

        try {
            await formulaAPI.createFormula({
                name: formData.name,
                customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
                items: validItems.map(i => ({
                    product_id: parseInt(i.product_id),
                    percentage: parseFloat(i.percentage),
                })),
            });

            toast.success('Formula created successfully');
            setShowCreate(false);
            setFormData({ name: '', customer_id: '' });
            setFormulaItems([{ product_id: '', percentage: '' }]);
            fetchFormulas();
        } catch (error) {
            const errors = error.response?.data?.errors;
            toast.error(
                errors
                    ? Object.values(errors).flat().join(', ')
                    : error.response?.data?.message || 'Failed to create formula'
            );
        }
    };

    const handleEdit = (formula) => {
        setEditingFormula(formula);
        setFormData({ 
            name: formula.name, 
            customer_id: formula.customer_id || '' 
        });
        setFormulaItems(
            (formula.items || []).map(item => ({
                product_id: String(item.product_id),
                percentage: String(item.percentage)
            }))
        );
        if (formula.items?.length === 0) {
            setFormulaItems([{ product_id: '', percentage: '' }]);
        }
        setShowEdit(true);
    };

    const handleUpdate = async () => {
        if (Math.abs(totalPct - 100) > 0.01) {
            toast.error('Percentages must total 100%');
            return;
        }

        const validItems = formulaItems.filter(i => i.product_id);
        if (!validItems.length) {
            toast.error('Please add at least one product');
            return;
        }

        try {
            await formulaAPI.updateFormula(editingFormula.id, {
                name: formData.name,
                customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
                items: validItems.map(i => ({
                    product_id: parseInt(i.product_id),
                    percentage: parseFloat(i.percentage),
                })),
            });

            toast.success('Formula updated successfully');
            setShowEdit(false);
            setEditingFormula(null);
            setFormData({ name: '', customer_id: '' });
            setFormulaItems([{ product_id: '', percentage: '' }]);
            fetchFormulas();
        } catch (error) {
            const errors = error.response?.data?.errors;
            toast.error(
                errors
                    ? Object.values(errors).flat().join(', ')
                    : error.response?.data?.message || 'Failed to update formula'
            );
        }
    };

    const handleDelete = async (formula) => {
        setDeleteConfirm({ isOpen: true, formula });
    };

    const confirmDelete = async () => {
        const formula = deleteConfirm.formula;
        if (!formula) return;

        try {
            await formulaAPI.deleteFormula(formula.id, 'Deleted by user');
            toast.success('Formula deleted successfully');
            setDeleteConfirm({ isOpen: false, formula: null });
            fetchFormulas();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete formula');
            setDeleteConfirm({ isOpen: false, formula: null });
        }
    };

    const handleToggleActive = async (formula) => {
        try {
            await formulaAPI.toggleActive(formula.id, !formula.is_active, formula.is_active ? 'Deactivated by user' : 'Activated by user');
            toast.success(formula.is_active ? 'Formula deactivated' : 'Formula activated');
            fetchFormulas();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update formula status');
        }
    };

    // Bulk Actions
    const exportColumns = [
        { key: 'code', label: 'Formula Code' },
        { key: 'name', label: 'Formula Name' },
        { key: 'customer', label: 'Customer' },
        { key: 'usage_count', label: 'Times Used' },
        { key: 'last_used_at', label: 'Last Used' },
        { key: 'is_active', label: 'Active' },
    ];

    const handleBulkDelete = async () => {
        const { indices } = bulkDeleteConfirm;
        let successCount = 0;
        let errorCount = 0;

        for (const idx of indices) {
            const formula = filtered[idx];
            if (formula) {
                try {
                    await formulaAPI.deleteFormula(formula.id, 'Bulk deleted by user');
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        setBulkDeleteConfirm({ isOpen: false, count: 0, indices: [] });
        if (successCount > 0) toast.success(`${successCount} formula(s) deleted successfully`);
        if (errorCount > 0) toast.error(`${errorCount} formula(s) failed to delete`);
        fetchFormulas();
    };

    const handleBulkToggleActive = async (selectedIndices, activate) => {
        let successCount = 0;
        let errorCount = 0;

        for (const idx of selectedIndices) {
            const formula = filtered[idx];
            if (formula) {
                try {
                    await formulaAPI.toggleActive(formula.id, activate, activate ? 'Bulk activated' : 'Bulk deactivated');
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        if (successCount > 0) toast.success(`${successCount} formula(s) ${activate ? 'activated' : 'deactivated'}`);
        if (errorCount > 0) toast.error(`${errorCount} formula(s) failed to update`);
        fetchFormulas();
    };

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                exportSelectedToCSV(selectedIndices, filtered, exportColumns, 'formulas');
                toast.success(`Exported ${selectedIndices.length} formulas`);
            }
        },
        {
            label: 'Activate',
            onClick: (selectedIndices) => handleBulkToggleActive(selectedIndices, true)
        },
        {
            label: 'Deactivate',
            onClick: (selectedIndices) => handleBulkToggleActive(selectedIndices, false)
        },
        {
            label: 'Delete Selected',
            onClick: (selectedIndices) => {
                setBulkDeleteConfirm({ isOpen: true, count: selectedIndices.length, indices: selectedIndices });
            }
        }
    ];

    const columns = [
        {
            key: 'code',
            label: 'Code',
            sortable: true,
            render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span>
        },
        {
            key: 'name',
            label: 'Formula Name',
            sortable: true,
            render: (val, row) => (
                <div>
                    <div className="font-medium text-slate-900">{val}</div>
                    {row.customer && <div className="text-xs text-purple-600">Custom: {row.customer}</div>}
                </div>
            )
        },
        {
            key: 'items',
            label: 'Components',
            render: (val) => {
                const items = Array.isArray(val) ? val : [];
                if (items.length === 0) return <span className="text-slate-400">No components</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {items.slice(0, 3).map((item, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                                {item.product} ({item.percentage}%)
                            </span>
                        ))}
                        {items.length > 3 && <span className="text-xs text-slate-500">+{items.length - 3} more</span>}
                    </div>
                );
            }
        },
        { key: 'usage_count', label: 'Times Used', sortable: true },
        { key: 'last_used_at', label: 'Last Used', sortable: true, render: (val) => val || '—' },
        {
            key: 'is_active',
            label: 'Status',
            render: (val) => <Badge variant={val ? 'approved' : 'draft'}>{val ? 'Active' : 'Inactive'}</Badge>
        },
    ];

    const actions = [
        { label: 'View', onClick: (row) => setSelectedFormula(row), variant: 'outline' },
        { label: 'Edit', onClick: (row) => handleEdit(row), variant: 'outline' },
        { 
            label: (row) => row.is_active ? 'Deactivate' : 'Activate', 
            onClick: (row) => handleToggleActive(row), 
            variant: 'outline' 
        },
        { label: 'Delete', onClick: (row) => handleDelete(row), variant: 'danger' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Formulas / Recipes</h1>
                    <p className="text-slate-600 mt-1">Manage product mix formulas for booking and production</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>+ New Formula</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card><CardBody className="p-4"><p className="text-sm text-slate-500">Total Formulas</p><p className="text-2xl font-bold text-blue-600">{formulas.length}</p></CardBody></Card>
                <Card><CardBody className="p-4"><p className="text-sm text-slate-500">Active</p><p className="text-2xl font-bold text-green-600">{formulas.filter(f => f.is_active).length}</p></CardBody></Card>
                <Card><CardBody className="p-4"><p className="text-sm text-slate-500">Custom (Client-specific)</p><p className="text-2xl font-bold text-purple-600">{formulas.filter(f => f.customer).length}</p></CardBody></Card>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <SearchBar onSearch={setSearch} placeholder="Search formulas..." />
            </div>

            <DataTable columns={columns} data={filtered} actions={actions} isLoading={loading} selectable bulkActions={bulkActions} />

            {/* View Formula */}
            <SlideOut isOpen={!!selectedFormula} onClose={() => setSelectedFormula(null)} title={selectedFormula?.name || ''} size="md">
                {selectedFormula && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-slate-500">Code</p><p className="font-mono font-semibold">{selectedFormula.code}</p></div>
                            <div><p className="text-xs text-slate-500">Customer</p><p className="font-medium">{selectedFormula.customer || 'General (All Customers)'}</p></div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Components</h4>
                            <div className="space-y-2">
                                {(selectedFormula.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-700">{item.product}</span>
                                                <span className="font-semibold">{item.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${item.percentage}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{(selectedFormula.items || []).reduce((sum, i) => sum + parseFloat(i.percentage || 0), 0)}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Create Formula */}
            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Formula" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Formula Name *</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Broiler Finisher Mix" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer (optional)</label>
                            <select value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">General (All Customers)</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-slate-700">Components *</label>
                            <span className={`text-sm font-semibold ${Math.abs(totalPct - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                Total: {totalPct.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            {formulaItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="">Select product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                                    </select>
                                    <input type="number" step="0.1" min="0" max="100" value={item.percentage} onChange={(e) => updateItem(idx, 'percentage', e.target.value)} className="w-24 px-3 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-center" placeholder="%" />
                                    {formulaItems.length > 1 && (
                                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Component</button>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Create Formula</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Edit Formula */}
            <SlideOut isOpen={showEdit} onClose={() => { setShowEdit(false); setEditingFormula(null); }} title={`Edit Formula: ${editingFormula?.name || ''}`} size="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Formula Name *</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Broiler Finisher Mix" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer (optional)</label>
                            <select value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">General (All Customers)</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-slate-700">Components *</label>
                            <span className={`text-sm font-semibold ${Math.abs(totalPct - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                Total: {totalPct.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            {formulaItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="">Select product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                                    </select>
                                    <input type="number" step="0.1" min="0" max="100" value={item.percentage} onChange={(e) => updateItem(idx, 'percentage', e.target.value)} className="w-24 px-3 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-center" placeholder="%" />
                                    {formulaItems.length > 1 && (
                                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Component</button>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Update Formula</Button>
                        <Button variant="outline" onClick={() => { setShowEdit(false); setEditingFormula(null); }}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, formula: null })}
                onConfirm={confirmDelete}
                title="Delete Formula"
                message={`Are you sure you want to delete "${deleteConfirm.formula?.name}"?\n\nThis action cannot be undone.`}
                confirmText="Delete Formula"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={bulkDeleteConfirm.isOpen}
                onClose={() => setBulkDeleteConfirm({ isOpen: false, count: 0, indices: [] })}
                onConfirm={handleBulkDelete}
                title="Delete Multiple Formulas"
                message={`Are you sure you want to delete ${bulkDeleteConfirm.count} formula(s)? This action cannot be undone.`}
                confirmText="Delete All"
                confirmVariant="danger"
            />
        </div>
    );
}
