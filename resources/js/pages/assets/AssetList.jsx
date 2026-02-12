import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function AssetList() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('assets');
    const [assets, setAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [assetSummary, setAssetSummary] = useState({});
    const [liabilitySummary, setLiabilitySummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('asset'); // 'asset' or 'liability'
    const [editItem, setEditItem] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        search: ''
    });

    // Form state
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, [activeTab, filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'assets') {
                const params = new URLSearchParams();
                if (filters.category) params.append('category', filters.category);
                if (filters.status) params.append('status', filters.status);
                if (filters.search) params.append('search', filters.search);
                
                const response = await api.get(`/assets?${params.toString()}`);
                setAssets(response.data.assets?.data || []);
                setAssetSummary(response.data.summary || {});
            } else {
                const params = new URLSearchParams();
                if (filters.category) params.append('category', filters.category);
                if (filters.status) params.append('status', filters.status);
                if (filters.search) params.append('search', filters.search);
                
                const response = await api.get(`/liabilities?${params.toString()}`);
                setLiabilities(response.data.liabilities?.data || []);
                setLiabilitySummary(response.data.summary || {});
            }
        } catch (error) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = (type) => {
        setModalType(type);
        setEditItem(null);
        setFormData(type === 'asset' ? {
            name: '',
            category: 'equipment',
            purchase_price: '',
            purchase_date: new Date().toISOString().split('T')[0],
            depreciation_method: 'straight_line',
            useful_life_years: 5,
            salvage_value: 0,
            location: '',
            serial_number: '',
            supplier: '',
            notes: ''
        } : {
            name: '',
            category: 'bank_loan',
            type: 'long_term',
            principal_amount: '',
            interest_rate: '',
            monthly_payment: '',
            start_date: new Date().toISOString().split('T')[0],
            due_date: '',
            next_payment_date: '',
            creditor_name: '',
            is_secured: false,
            collateral: '',
            notes: ''
        });
        setShowModal(true);
    };

    const openEditModal = (item, type) => {
        setModalType(type);
        setEditItem(item);
        setFormData({
            ...item,
            purchase_date: item.purchase_date?.split('T')[0],
            start_date: item.start_date?.split('T')[0],
            due_date: item.due_date?.split('T')[0],
            next_payment_date: item.next_payment_date?.split('T')[0],
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'asset') {
                if (editItem) {
                    await api.put(`/assets/${editItem.id}`, formData);
                    showToast('Asset updated successfully', 'success');
                } else {
                    await api.post('/assets', formData);
                    showToast('Asset created successfully', 'success');
                }
            } else {
                if (editItem) {
                    await api.put(`/liabilities/${editItem.id}`, formData);
                    showToast('Liability updated successfully', 'success');
                } else {
                    await api.post('/liabilities', formData);
                    showToast('Liability created successfully', 'success');
                }
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save', 'error');
        }
    };

    const handleDelete = async (id, type) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await api.delete(`/${type}s/${id}`);
            showToast(`${type === 'asset' ? 'Asset' : 'Liability'} deleted`, 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const runDepreciation = async () => {
        try {
            const response = await api.post('/assets/depreciation');
            showToast(response.data.message, 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to run depreciation', 'error');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-NG', { 
            style: 'currency', 
            currency: 'NGN',
            minimumFractionDigits: 0 
        }).format(value || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const assetCategories = [
        { value: 'equipment', label: 'Equipment' },
        { value: 'vehicle', label: 'Vehicle' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'building', label: 'Building' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'other', label: 'Other' }
    ];

    const liabilityCategories = [
        { value: 'bank_loan', label: 'Bank Loan' },
        { value: 'equipment_loan', label: 'Equipment Loan' },
        { value: 'vehicle_loan', label: 'Vehicle Loan' },
        { value: 'mortgage', label: 'Mortgage' },
        { value: 'credit_line', label: 'Credit Line' },
        { value: 'supplier_credit', label: 'Supplier Credit' },
        { value: 'tax_liability', label: 'Tax Liability' },
        { value: 'other', label: 'Other' }
    ];

    const getCategoryLabel = (value, type) => {
        const categories = type === 'asset' ? assetCategories : liabilityCategories;
        return categories.find(c => c.value === value)?.label || value;
    };

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            disposed: 'bg-red-100 text-red-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            paid_off: 'bg-blue-100 text-blue-800',
            defaulted: 'bg-red-100 text-red-800',
            restructured: 'bg-orange-100 text-orange-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
                {status?.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Assets & Liabilities</h1>
                    <p className="text-slate-500">Manage company assets and financial obligations</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'assets' && (
                        <button
                            onClick={runDepreciation}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            📊 Run Depreciation
                        </button>
                    )}
                    <button
                        onClick={() => openAddModal(activeTab === 'assets' ? 'asset' : 'liability')}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        + Add {activeTab === 'assets' ? 'Asset' : 'Liability'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`px-6 py-3 font-medium ${activeTab === 'assets'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    🏢 Assets
                </button>
                <button
                    onClick={() => setActiveTab('liabilities')}
                    className={`px-6 py-3 font-medium ${activeTab === 'liabilities'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    💳 Liabilities
                </button>
            </div>

            {/* Summary Cards */}
            {activeTab === 'assets' ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Total Assets</div>
                        <div className="text-2xl font-bold text-slate-800">{assetSummary.total_assets || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Active Assets</div>
                        <div className="text-2xl font-bold text-green-600">{assetSummary.active_assets || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Total Value</div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(assetSummary.total_value)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Accumulated Depreciation</div>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(assetSummary.total_depreciation)}</div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Total Outstanding</div>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(liabilitySummary.total_outstanding)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Short-Term (≤1yr)</div>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(liabilitySummary.short_term_balance)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Long-Term (&gt;1yr)</div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(liabilitySummary.long_term_balance)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-slate-500">Overdue Payments</div>
                        <div className="text-2xl font-bold text-red-600">{liabilitySummary.overdue_count || 0}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                    />
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Categories</option>
                        {(activeTab === 'assets' ? assetCategories : liabilityCategories).map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Status</option>
                        {activeTab === 'assets' ? (
                            <>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="disposed">Disposed</option>
                                <option value="maintenance">Maintenance</option>
                            </>
                        ) : (
                            <>
                                <option value="active">Active</option>
                                <option value="paid_off">Paid Off</option>
                                <option value="defaulted">Defaulted</option>
                                <option value="restructured">Restructured</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : activeTab === 'assets' ? (
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Asset</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Category</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Purchase Price</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Current Value</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Location</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                        No assets found. Add your first asset.
                                    </td>
                                </tr>
                            ) : (
                                assets.map(asset => (
                                    <tr key={asset.id} className="border-t hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{asset.name}</div>
                                            <div className="text-sm text-slate-500">{asset.asset_code}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {getCategoryLabel(asset.category, 'asset')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-800">
                                            {formatCurrency(asset.purchase_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-slate-800">{formatCurrency(asset.current_value)}</div>
                                            {asset.accumulated_depreciation > 0 && (
                                                <div className="text-xs text-orange-600">
                                                    -{formatCurrency(asset.accumulated_depreciation)} dep.
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{asset.location || '-'}</td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(asset.status)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => openEditModal(asset, 'asset')}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(asset.id, 'asset')}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Liability</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Category</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Creditor</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Principal</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Balance</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Next Payment</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liabilities.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                        No liabilities found. Add your first liability.
                                    </td>
                                </tr>
                            ) : (
                                liabilities.map(liability => (
                                    <tr key={liability.id} className="border-t hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{liability.name}</div>
                                            <div className="text-sm text-slate-500">{liability.reference}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-600">{getCategoryLabel(liability.category, 'liability')}</div>
                                            <div className="text-xs text-slate-400">{liability.type?.replace('_', ' ')}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{liability.creditor_name}</td>
                                        <td className="px-4 py-3 text-right text-slate-800">
                                            {formatCurrency(liability.principal_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-red-600">{formatCurrency(liability.current_balance)}</div>
                                            <div className="text-xs text-slate-500">
                                                {liability.remaining_percentage}% left
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className={liability.is_overdue ? 'text-red-600 font-medium' : ''}>
                                                {formatDate(liability.next_payment_date)}
                                            </div>
                                            {liability.monthly_payment && (
                                                <div className="text-xs text-slate-500">
                                                    {formatCurrency(liability.monthly_payment)}/mo
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(liability.status)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => openEditModal(liability, 'liability')}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(liability.id, 'liability')}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {editItem ? 'Edit' : 'Add'} {modalType === 'asset' ? 'Asset' : 'Liability'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Common Fields */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                    <select
                                        value={formData.category || ''}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    >
                                        {(modalType === 'asset' ? assetCategories : liabilityCategories).map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {modalType === 'asset' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.purchase_price || ''}
                                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date *</label>
                                            <input
                                                type="date"
                                                value={formData.purchase_date || ''}
                                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Depreciation Method</label>
                                            <select
                                                value={formData.depreciation_method || 'straight_line'}
                                                onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            >
                                                <option value="straight_line">Straight Line</option>
                                                <option value="declining_balance">Declining Balance</option>
                                                <option value="none">None (Land)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Useful Life (Years)</label>
                                            <input
                                                type="number"
                                                value={formData.useful_life_years || 5}
                                                onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Salvage Value</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.salvage_value || 0}
                                                onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                            <input
                                                type="text"
                                                value={formData.location || ''}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                                            <input
                                                type="text"
                                                value={formData.serial_number || ''}
                                                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                                            <input
                                                type="text"
                                                value={formData.supplier || ''}
                                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                                            <select
                                                value={formData.type || 'long_term'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                required
                                            >
                                                <option value="short_term">Short Term (≤1 year)</option>
                                                <option value="long_term">Long Term (&gt;1 year)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Principal Amount *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.principal_amount || ''}
                                                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.interest_rate || ''}
                                                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Payment</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.monthly_payment || ''}
                                                onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                                            <input
                                                type="date"
                                                value={formData.start_date || ''}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                value={formData.due_date || ''}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Next Payment Date</label>
                                            <input
                                                type="date"
                                                value={formData.next_payment_date || ''}
                                                onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Creditor Name *</label>
                                            <input
                                                type="text"
                                                value={formData.creditor_name || ''}
                                                onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_secured || false}
                                                onChange={(e) => setFormData({ ...formData, is_secured: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <label className="text-sm font-medium text-slate-700">Secured Loan</label>
                                        </div>
                                        {formData.is_secured && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Collateral</label>
                                                <input
                                                    type="text"
                                                    value={formData.collateral || ''}
                                                    onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    {editItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
