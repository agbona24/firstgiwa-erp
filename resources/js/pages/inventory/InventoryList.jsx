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
import { useConfirm } from '../../hooks/useConfirm';
import inventoryAPI from '../../services/inventoryAPI';
import categoryAPI from '../../services/categoryAPI';
import productAPI from '../../services/productAPI';
import warehouseAPI from '../../services/warehouseAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

// Default units of measurement (can be fetched from API if needed)
const defaultUnits = [
    { id: 1, name: 'Kilograms', abbreviation: 'kg', type: 'weight', is_active: true },
    { id: 2, name: 'Tonnes', abbreviation: 'tonnes', type: 'weight', is_active: true },
    { id: 3, name: 'Bags', abbreviation: 'bags', type: 'package', is_active: true },
    { id: 4, name: 'Litres', abbreviation: 'litres', type: 'volume', is_active: true },
    { id: 5, name: 'Pieces', abbreviation: 'pieces', type: 'count', is_active: true },
    { id: 6, name: 'Cartons', abbreviation: 'cartons', type: 'package', is_active: true },
    { id: 7, name: 'Drums', abbreviation: 'drums', type: 'package', is_active: true },
    { id: 8, name: 'Rolls', abbreviation: 'rolls', type: 'package', is_active: true },
    { id: 9, name: 'Grams', abbreviation: 'g', type: 'weight', is_active: true },
    { id: 10, name: 'Packs', abbreviation: 'packs', type: 'package', is_active: true },
    { id: 11, name: 'Sacks', abbreviation: 'sacks', type: 'package', is_active: true },
    { id: 12, name: 'Gallons', abbreviation: 'gallons', type: 'volume', is_active: true },
];

export default function InventoryList() {
    const toast = useToast();
    useConfirm();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [showProductDetail, setShowProductDetail] = useState(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showUnits, setShowUnits] = useState(false);
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [unitForm, setUnitForm] = useState({ name: '', abbreviation: '', type: 'weight' });
    const [activeTab, setActiveTab] = useState('all');
    
    // API data states
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // For dropdowns
    const [stats, setStats] = useState({ total: 0, rawMaterials: 0, finishedGoods: 0, lowStock: 0, critical: 0, totalValue: 0 });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, product: null });

    const [productForm, setProductForm] = useState({
        name: '', sku: '', category_id: '', inventory_type: 'raw_material', unit: 'kg',
        secondary_unit: '', conversion_factor: '', cost_price: '', selling_price: '',
        min_stock: '', critical_level: '', barcode: '', warehouse_id: '', opening_stock: '',
        track_inventory: true,
    });

    const [categoryForm, setCategoryForm] = useState({ name: '', code: '', parent_id: '' });

    const [adjustForm, setAdjustForm] = useState({
        product_id: '', warehouse_id: '', adjustment_type: 'count_correction', quantity_change: '', reason: '',
    });

    // Fetch categories, warehouses, and all products on mount
    useEffect(() => {
        fetchCategories();
        fetchWarehouses();
        fetchAllProducts();
        fetchStats();
    }, []);

    // Fetch inventory data from API
    useEffect(() => {
        fetchInventory();
    }, [search, statusFilter, categoryFilter, typeFilter, activeTab, pagination.current_page]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategories();
            // Handle both array and paginated responses
            const data = Array.isArray(response) ? response : (response?.data || []);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await warehouseAPI.getWarehouses();
            // Handle both array and paginated responses
            const data = Array.isArray(response) ? response : (response?.data || []);
            setWarehouses(data);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const response = await productAPI.getProducts({ per_page: 1000 }); // Get all products
            const data = Array.isArray(response) ? response : (response?.data || []);
            setAllProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await inventoryAPI.getInventory({ per_page: 1 }); // Just get totals
            // Calculate stats from all data (would need a stats endpoint ideally)
            const allData = await inventoryAPI.getInventory({ per_page: 10000 });
            const items = allData?.data || [];
            setStats({
                total: allData.total || items.length,
                rawMaterials: items.filter(i => i.product?.inventory_type === 'raw_material').length,
                finishedGoods: items.filter(i => i.product?.inventory_type === 'finished_good').length,
                lowStock: items.filter(i => {
                    const qty = i.quantity || 0;
                    const reorder = i.product?.reorder_level || 0;
                    const critical = i.product?.critical_level || 0;
                    return qty > critical && qty <= reorder;
                }).length,
                critical: items.filter(i => {
                    const qty = i.quantity || 0;
                    const critical = i.product?.critical_level || 0;
                    return qty <= critical && qty > 0;
                }).length,
                totalValue: items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.product?.cost_price || 0)), 0),
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
            };
            
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category_id = categoryFilter;
            if (activeTab === 'raw_materials') params.inventory_type = 'raw_material';
            if (activeTab === 'finished_goods') params.inventory_type = 'finished_good';

            const response = await inventoryAPI.getInventory(params);
            
            // Transform API data to match UI expectations
            const dataArray = response?.data || [];
            const transformedData = dataArray.map(item => ({
                id: item.id,
                sku: item.product?.sku || 'N/A',
                name: item.product?.name || 'Unknown',
                category: item.product?.category?.name || 'Uncategorized',
                inventory_type: item.product?.inventory_type || 'raw_material',
                stock: item.quantity || 0,
                reserved: item.reserved_quantity || 0,
                available: item.available_quantity || 0,
                min_stock: item.product?.reorder_level || 0,
                critical_level: item.product?.critical_level || 0,
                unit: item.product?.unit_of_measure || 'kg',
                secondary_unit: item.product?.secondary_unit,
                conversion_factor: item.product?.conversion_factor,
                cost_price: item.product?.cost_price || 0,
                selling_price: item.product?.selling_price || 0,
                warehouse: item.warehouse?.name || 'Unknown',
                status: getInventoryStatus(item),
                barcode: item.product?.barcode,
                batch_count: 0, // Will be updated if batches data available
            }));

            setInventory(transformedData);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
            });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine inventory status
    const getInventoryStatus = (item) => {
        const quantity = item.quantity || 0;
        const reorderLevel = item.product?.reorder_level || 0;
        const criticalLevel = item.product?.critical_level || 0;
        
        if (quantity <= 0) return 'out_of_stock';
        if (quantity <= criticalLevel) return 'critical';
        if (quantity <= reorderLevel) return 'low_stock';
        return 'in_stock';
    };

    const filtered = useMemo(() => {
        return inventory.filter(p => {
            if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.sku?.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter && p.status !== statusFilter) return false;
            if (categoryFilter && p.category !== categoryFilter) return false;
            if (typeFilter && p.inventory_type !== typeFilter) return false;
            if (activeTab === 'raw_materials' && p.inventory_type !== 'raw_material') return false;
            if (activeTab === 'finished_goods' && p.inventory_type !== 'finished_good') return false;
            return true;
        });
    }, [inventory, search, statusFilter, categoryFilter, typeFilter, activeTab]);



    const criticalProducts = inventory.filter(p => p.status === 'critical');

    const handleAddProduct = async () => {
        try {
            const openingStock = productForm.opening_stock ? parseFloat(productForm.opening_stock) : 0;
            if (!productForm.id && openingStock > 0 && !productForm.warehouse_id) {
                toast.error('Select a warehouse to set opening stock');
                return;
            }

            const data = {
                name: productForm.name,
                sku: productForm.sku,
                category_id: productForm.category_id,
                inventory_type: productForm.inventory_type,
                unit_of_measure: productForm.unit,
                secondary_unit: productForm.secondary_unit || null,
                conversion_factor: productForm.conversion_factor ? parseFloat(productForm.conversion_factor) : null,
                cost_price: parseFloat(productForm.cost_price) || 0,
                selling_price: productForm.selling_price ? parseFloat(productForm.selling_price) : null,
                reorder_level: parseInt(productForm.min_stock) || 0,
                critical_level: parseInt(productForm.critical_level) || 0,
                barcode: productForm.barcode || null,
                warehouse_id: productForm.warehouse_id || null,
                track_inventory: productForm.track_inventory,
            };

            if (productForm.id) {
                // Update existing product
                await productAPI.updateProduct(productForm.id, data);
                toast.success('Product updated successfully');
            } else {
                // Create new product
                const created = await productAPI.createProduct(data);
                const createdProduct = created?.product || created?.data?.product || created?.data || created;
                const createdProductId = createdProduct?.id;

                if (openingStock > 0 && createdProductId) {
                    await inventoryAPI.createAdjustment({
                        product_id: createdProductId,
                        warehouse_id: parseInt(productForm.warehouse_id),
                        adjustment_type: 'found',
                        quantity_change: openingStock,
                        reason: 'Opening stock',
                    });
                }
                toast.success('Product created successfully');
            }
            
            setShowAddProduct(false);
            setProductForm({ name: '', sku: '', category_id: '', inventory_type: 'raw_material', unit: 'kg', secondary_unit: '', conversion_factor: '', cost_price: '', selling_price: '', min_stock: '', critical_level: '', barcode: '', warehouse_id: '', opening_stock: '', track_inventory: true });
            fetchInventory();
            fetchAllProducts();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${productForm.id ? 'update' : 'create'} product`);
        }
    };

    const handleAddCategory = async () => {
        try {
            const data = {
                name: categoryForm.name,
                code: categoryForm.code,
                parent_id: categoryForm.parent_id || null,
            };

            await categoryAPI.createCategory(data);
            toast.success('Category created successfully');
            setShowAddCategory(false);
            setCategoryForm({ name: '', code: '', parent_id: '' });
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create category');
        }
    };

    const handleAddUnit = () => {
        toast.success('Unit of measurement created successfully');
        setShowAddUnit(false);
        setUnitForm({ name: '', abbreviation: '', type: 'weight' });
    };

    const handleAdjustment = async () => {
        try {
            await inventoryAPI.createAdjustment(adjustForm);
            toast.success('Stock adjustment submitted. Awaiting approval.');
            setShowAdjustment(false);
            setAdjustForm({ product_id: '', warehouse_id: '', adjustment_type: 'count_correction', quantity_change: '', reason: '' });
            fetchInventory(); // Refresh data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create adjustment');
        }
    };

    const handleDeleteProduct = async (product) => {
        setDeleteConfirm({ isOpen: true, product });
    };

    const confirmDelete = async () => {
        const product = deleteConfirm.product;
        if (!product) return;

        try {
            await productAPI.deleteProduct(product.id, 'Deleted by user');
            toast.success('Product deleted successfully');
            setDeleteConfirm({ isOpen: false, product: null });
            fetchInventory();
            fetchAllProducts();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete product. It may be in use by orders or formulas.');
            setDeleteConfirm({ isOpen: false, product: null });
        }
    };

    const getStockBadge = (status) => ({ in_stock: 'approved', low_stock: 'pending', critical: 'rejected', out_of_stock: 'rejected' }[status] || 'draft');
    const getStockLabel = (status) => ({ in_stock: 'In Stock', low_stock: 'Low Stock', critical: 'Critical', out_of_stock: 'Out of Stock' }[status] || status);

    const columns = [
        { key: 'sku', label: 'SKU', sortable: true, render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> },
        { key: 'name', label: 'Product', sortable: true, render: (val, row) => (
            <div>
                <div className="font-medium text-slate-900">{val}</div>
                <div className="text-xs text-slate-500">{row.category} &middot; <span className={row.inventory_type === 'raw_material' ? 'text-orange-600' : 'text-green-600'}>{row.inventory_type === 'raw_material' ? 'Raw Material' : 'Finished Good'}</span></div>
            </div>
        )},
        { key: 'stock', label: 'Total Stock', sortable: true, render: (val, row) => (
            <div>
                <span className="font-mono font-semibold">{val.toLocaleString()} {row.unit}</span>
                {row.secondary_unit && <div className="text-xs text-slate-400">{(val / row.conversion_factor).toFixed(1)} {row.secondary_unit}</div>}
            </div>
        )},
        { key: 'available', label: 'Available', sortable: true, render: (val, row) => (
            <div>
                <span className="font-mono">{val.toLocaleString()} {row.unit}</span>
                {row.reserved > 0 && <div className="text-xs text-orange-500">{row.reserved.toLocaleString()} reserved</div>}
            </div>
        )},
        { key: 'cost_price', label: 'Unit Cost', sortable: true, render: (val, row) => (
            <div>
                <span>{fmt(val)}/{row.unit}</span>
                {row.selling_price > 0 && <div className="text-xs text-green-600">Sell: {fmt(row.selling_price)}</div>}
            </div>
        )},
        { key: 'warehouse', label: 'Warehouse', render: (val) => <span className="text-sm text-slate-600">{val}</span> },
        { key: 'batch_count', label: 'Batches', render: (val) => <span className="text-sm">{val}</span> },
        { key: 'status', label: 'Status', render: (val) => <Badge variant={getStockBadge(val)}>{getStockLabel(val)}</Badge> },
    ];

    const actions = [
        { label: 'View', onClick: (row) => setShowProductDetail(row), variant: 'outline' },
        { label: 'Edit', onClick: (row) => {
            // Pre-populate form with existing data
            const product = allProducts.find(p => p.id === row.id) || {};
            setProductForm({
                name: row.name,
                sku: row.sku,
                category_id: product.category_id || '',
                inventory_type: row.inventory_type,
                unit: row.unit,
                secondary_unit: row.secondary_unit || '',
                conversion_factor: row.conversion_factor || '',
                cost_price: row.cost_price,
                selling_price: row.selling_price || '',
                min_stock: row.min_stock,
                critical_level: row.critical_level,
                barcode: row.barcode || '',
                warehouse_id: product.warehouse_id || '',
                opening_stock: '',
                track_inventory: true,
                id: row.id, // Store ID for update
            });
            setShowAddProduct(true);
        }, variant: 'ghost' },
        { label: 'Adjust', onClick: (row) => { 
            setAdjustForm({
                ...adjustForm, 
                product_id: row.id, 
                warehouse_id: warehouses[0]?.id || ''
            }); 
            setShowAdjustment(true); 
        }, variant: 'ghost' },
        { label: 'Delete', onClick: (row) => handleDeleteProduct(row), variant: 'danger' },
    ];

    // Export columns for CSV
    const exportColumns = [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Product Name' },
        { key: 'category.name', label: 'Category' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unit', label: 'Unit' },
        { key: 'unit_price', label: 'Unit Price' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'stockStatus', label: 'Stock Status' },
    ];

    const bulkActions = [
        { 
            label: 'Export Selected', 
            onClick: (sel) => exportSelectedToCSV(sel, filtered, exportColumns, 'products') 
        },
        { 
            label: 'Bulk Adjust', 
            onClick: (sel) => toast.info(`Select individual products for stock adjustment`) 
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="text-slate-600 mt-1">Products, stock levels, categories, and warehouse operations</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddProduct(true)}>+ Add Product</Button>
                    <Button variant="outline" onClick={() => setShowCategories(true)}>Categories</Button>
                    <Button variant="outline" onClick={() => setShowUnits(true)}>Units</Button>
                    <Button variant="outline" onClick={() => setShowAdjustment(true)}>Stock Adjustment</Button>
                </div>
            </div>

            {/* Critical Alert */}
            {criticalProducts.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        <div>
                            <p className="font-semibold text-red-900">{criticalProducts.length} Critical Stock Item{criticalProducts.length > 1 ? 's' : ''}</p>
                            <p className="text-sm text-red-700">{criticalProducts.map(p => p.name).join(', ')}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStatusFilter('critical')} className="border-red-600 text-red-600">View Critical</Button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Products', value: stats.total, color: 'blue' },
                    { label: 'Raw Materials', value: stats.rawMaterials, color: 'orange' },
                    { label: 'Finished Goods', value: stats.finishedGoods, color: 'green' },
                    { label: 'Low Stock', value: stats.lowStock, color: 'yellow' },
                    { label: 'Critical', value: stats.critical, color: 'red' },
                    { label: 'Total Value', value: fmt(stats.totalValue), color: 'purple' },
                ].map((s, i) => (
                    <Card key={i}><CardBody className="p-3 text-center">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className={`text-lg font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                    </CardBody></Card>
                ))}
            </div>

            {/* Tabs + Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-100 rounded-lg p-1">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'raw_materials', label: 'Raw Materials' },
                        { key: 'finished_goods', label: 'Finished Goods' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === tab.key ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <SearchBar onSearch={setSearch} placeholder="Search products..." />
                <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                    { value: 'in_stock', label: 'In Stock' },
                    { value: 'low_stock', label: 'Low Stock' },
                    { value: 'critical', label: 'Critical' },
                ]} />
                <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories.map(c => ({ value: c.id.toString(), label: c.name }))} />
            </div>

            {/* Table */}
            <DataTable columns={columns} data={filtered} actions={actions} selectable bulkActions={bulkActions} enablePagination={false} />

            {/* Server-Side Pagination */}
            {pagination.last_page > 1 && (
                <Card>
                    <CardBody className="p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-700">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
                                </span>
                                <select
                                    value={pagination.per_page}
                                    onChange={(e) => setPagination({...pagination, per_page: Number(e.target.value), current_page: 1})}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={15}>15 per page</option>
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination({...pagination, current_page: 1})}
                                    disabled={pagination.current_page === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => setPagination({...pagination, current_page: pagination.current_page - 1})}
                                    disabled={pagination.current_page === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-1.5 text-sm text-slate-700 font-medium">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => setPagination({...pagination, current_page: pagination.current_page + 1})}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setPagination({...pagination, current_page: pagination.last_page})}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Add Product SlideOut */}
            <SlideOut isOpen={showAddProduct} onClose={() => { setShowAddProduct(false); setProductForm({ name: '', sku: '', category_id: '', inventory_type: 'raw_material', unit: 'kg', secondary_unit: '', conversion_factor: '', cost_price: '', selling_price: '', min_stock: '', critical_level: '', barcode: '', warehouse_id: '', opening_stock: '', track_inventory: true }); }} title={productForm.id ? 'Edit Product' : 'Add New Product'} size="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }} className="space-y-5">
                    {/* Basic Info */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                                <input type="text" required value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Maize (Yellow Corn)" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Product Code *</label>
                                <input type="text" required value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. RM-001" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
                                <input type="text" value={productForm.barcode} onChange={(e) => setProductForm({...productForm, barcode: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Scan or enter barcode" />
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Classification</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Inventory Type *</label>
                                <select required value={productForm.inventory_type} onChange={(e) => setProductForm({...productForm, inventory_type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                    <option value="raw_material">Raw Material</option>
                                    <option value="finished_good">Finished Good</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                <div className="flex gap-2">
                                    <select required value={productForm.category_id} onChange={(e) => setProductForm({...productForm, category_id: e.target.value})} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="">Select category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => { setShowAddProduct(false); setShowCategories(true); }} className="px-3 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600" title="Manage categories">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Units */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Units of Measurement</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Unit *</label>
                                <select required value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                    {defaultUnits.filter(u => u.is_active).map(u => <option key={u.id} value={u.abbreviation}>{u.name} ({u.abbreviation})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Unit</label>
                                <select value={productForm.secondary_unit} onChange={(e) => setProductForm({...productForm, secondary_unit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                    <option value="">None</option>
                                    {defaultUnits.filter(u => u.is_active).map(u => <option key={u.id} value={u.abbreviation}>{u.name} ({u.abbreviation})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Conversion Factor</label>
                                <input type="number" value={productForm.conversion_factor} onChange={(e) => setProductForm({...productForm, conversion_factor: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. 1000 (kg per tonne)" />
                            </div>
                        </div>
                        {productForm.secondary_unit && productForm.conversion_factor && (
                            <p className="text-xs text-blue-600 mt-2">1 {productForm.secondary_unit} = {productForm.conversion_factor} {productForm.unit}</p>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Pricing</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price ({window.getCurrencySymbol()}) per {productForm.unit} *</label>
                                <input type="number" required step="0.01" min="0" value={productForm.cost_price} onChange={(e) => setProductForm({...productForm, cost_price: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price ({window.getCurrencySymbol()}) per {productForm.unit} {productForm.inventory_type === 'finished_good' ? '*' : ''}</label>
                                <input type="number" step="0.01" min="0" value={productForm.selling_price} onChange={(e) => setProductForm({...productForm, selling_price: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="0.00" />
                                {productForm.cost_price && productForm.selling_price && (
                                    <p className="text-xs text-green-600 mt-1">Margin: {((productForm.selling_price - productForm.cost_price) / productForm.cost_price * 100).toFixed(1)}%</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stock Levels */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Stock Levels</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level ({productForm.unit}) *</label>
                                <input type="number" required min="0" value={productForm.min_stock} onChange={(e) => setProductForm({...productForm, min_stock: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. 10000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Critical Level ({productForm.unit}) *</label>
                                <input type="number" required min="0" value={productForm.critical_level} onChange={(e) => setProductForm({...productForm, critical_level: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. 5000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
                                <select value={productForm.warehouse_id} onChange={(e) => setProductForm({...productForm, warehouse_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                    <option value="">Select warehouse...</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {!productForm.id && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Stock ({productForm.unit})</label>
                                <input type="number" min="0" step="0.001" value={productForm.opening_stock} onChange={(e) => setProductForm({...productForm, opening_stock: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Optional: set initial quantity" />
                                <p className="text-xs text-slate-500 mt-1">If set, an opening stock adjustment will be created for the selected warehouse.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="track" checked={productForm.track_inventory} onChange={(e) => setProductForm({...productForm, track_inventory: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                        <label htmlFor="track" className="text-sm text-slate-700">Track inventory levels for this product</label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">{productForm.id ? 'Update Product' : 'Create Product'}</Button>
                        <Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Categories SlideOut */}
            <SlideOut isOpen={showCategories} onClose={() => setShowCategories(false)} title="Product Categories" size="md">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">{categories.length} categories</p>
                        <Button size="sm" onClick={() => setShowAddCategory(true)}>+ Add Category</Button>
                    </div>

                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-slate-900">{cat.name}</div>
                                    <div className="text-xs text-slate-500">Code: {cat.code} &middot; {cat.products_count || 0} products</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={cat.is_active ? 'approved' : 'draft'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
                                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Inline Add Category */}
                    {showAddCategory && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-slate-900 mb-3">New Category</h4>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category Name *</label>
                                    <input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Grains & Cereals" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                                    <input type="text" required value={categoryForm.code} onChange={(e) => setCategoryForm({...categoryForm, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. GRN" maxLength={5} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
                                    <select value={categoryForm.parent_id} onChange={(e) => setCategoryForm({...categoryForm, parent_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="">None (Top Level)</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm">Create</Button>
                                    <Button variant="outline" size="sm" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </SlideOut>

            {/* Stock Adjustment SlideOut */}
            <SlideOut isOpen={showAdjustment} onClose={() => setShowAdjustment(false)} title="Stock Adjustment" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAdjustment(); }} className="space-y-5">
                    <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                        All stock adjustments are recorded in the audit trail and require a reason.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                        <select required value={adjustForm.product_id} onChange={(e) => setAdjustForm({...adjustForm, product_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select product...</option>
                            {allProducts.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} ({p.inventory_type === 'raw_material' ? 'Raw Material' : 'Finished Good'})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse *</label>
                        <select required value={adjustForm.warehouse_id} onChange={(e) => setAdjustForm({...adjustForm, warehouse_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select warehouse...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type *</label>
                        <select required value={adjustForm.adjustment_type} onChange={(e) => setAdjustForm({...adjustForm, adjustment_type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="count_correction">Count Correction</option>
                            <option value="loss">Loss / Spoilage</option>
                            <option value="drying">Drying Loss</option>
                            <option value="damage">Damage</option>
                            <option value="expiry">Expiry</option>
                            <option value="theft">Theft</option>
                            <option value="found">Found / Discovered</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Change *</label>
                        <div className="flex items-center gap-2">
                            <input type="number" required value={adjustForm.quantity_change} onChange={(e) => setAdjustForm({...adjustForm, quantity_change: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter positive or negative number" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Use negative for reductions (e.g. -500 for loss of 500 units)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Justification *</label>
                        <textarea required value={adjustForm.reason} onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Explain the reason for this adjustment..." />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Submit Adjustment</Button>
                        <Button variant="outline" onClick={() => setShowAdjustment(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Units of Measurement SlideOut */}
            <SlideOut isOpen={showUnits} onClose={() => setShowUnits(false)} title="Units of Measurement" size="md">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">{defaultUnits.length} units configured</p>
                        <Button size="sm" onClick={() => setShowAddUnit(true)}>+ Add Unit</Button>
                    </div>

                    <div className="space-y-1">
                        {['weight', 'volume', 'package', 'count'].map(type => {
                            const units = defaultUnits.filter(u => u.type === type);
                            if (units.length === 0) return null;
                            return (
                                <div key={type}>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mt-2">{type}</div>
                                    {units.map(unit => (
                                        <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-1">
                                            <div className="flex items-center gap-3">
                                                <span className="w-14 text-center font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm">{unit.abbreviation}</span>
                                                <div>
                                                    <div className="font-medium text-slate-900">{unit.name}</div>
                                                    <div className="text-xs text-slate-500 capitalize">{unit.type}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={unit.is_active ? 'approved' : 'draft'}>{unit.is_active ? 'Active' : 'Inactive'}</Badge>
                                                <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {showAddUnit && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-slate-900 mb-3">New Unit of Measurement</h4>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddUnit(); }} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Name *</label>
                                    <input type="text" required value={unitForm.name} onChange={(e) => setUnitForm({...unitForm, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Metric Tons" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Abbreviation *</label>
                                    <input type="text" required value={unitForm.abbreviation} onChange={(e) => setUnitForm({...unitForm, abbreviation: e.target.value.toLowerCase()})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. mt" maxLength={10} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                                    <select required value={unitForm.type} onChange={(e) => setUnitForm({...unitForm, type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="weight">Weight (kg, tonnes, grams...)</option>
                                        <option value="volume">Volume (litres, gallons...)</option>
                                        <option value="package">Package (bags, cartons, drums...)</option>
                                        <option value="count">Count (pieces, units...)</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm">Create Unit</Button>
                                    <Button variant="outline" size="sm" onClick={() => setShowAddUnit(false)}>Cancel</Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </SlideOut>

            {/* Product Detail SlideOut */}
            <SlideOut isOpen={!!showProductDetail} onClose={() => setShowProductDetail(null)} title={showProductDetail?.name || ''} size="lg">
                {showProductDetail && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><p className="text-xs text-slate-500">SKU</p><p className="font-mono font-semibold">{showProductDetail.sku}</p></div>
                            <div><p className="text-xs text-slate-500">Category</p><p className="font-medium">{showProductDetail.category}</p></div>
                            <div><p className="text-xs text-slate-500">Type</p><Badge variant={showProductDetail.inventory_type === 'raw_material' ? 'pending' : 'approved'}>{showProductDetail.inventory_type === 'raw_material' ? 'Raw Material' : 'Finished Good'}</Badge></div>
                            <div><p className="text-xs text-slate-500">Primary Unit</p><p className="font-medium">{showProductDetail.unit}</p></div>
                            <div><p className="text-xs text-slate-500">Secondary Unit</p><p className="font-medium">{showProductDetail.secondary_unit || 'N/A'}</p></div>
                            <div><p className="text-xs text-slate-500">Conversion</p><p className="font-medium">{showProductDetail.conversion_factor ? `1 ${showProductDetail.secondary_unit} = ${showProductDetail.conversion_factor} ${showProductDetail.unit}` : 'N/A'}</p></div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-xs text-slate-500">Total Stock</p>
                                <p className="text-xl font-bold text-slate-900">{showProductDetail.stock.toLocaleString()} {showProductDetail.unit}</p>
                                {showProductDetail.secondary_unit && <p className="text-xs text-slate-400">{(showProductDetail.stock / showProductDetail.conversion_factor).toFixed(1)} {showProductDetail.secondary_unit}</p>}
                            </CardBody></Card>
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-xs text-slate-500">Available</p>
                                <p className="text-xl font-bold text-green-600">{showProductDetail.available.toLocaleString()} {showProductDetail.unit}</p>
                            </CardBody></Card>
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-xs text-slate-500">Reserved</p>
                                <p className="text-xl font-bold text-orange-600">{showProductDetail.reserved.toLocaleString()} {showProductDetail.unit}</p>
                            </CardBody></Card>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-slate-500">Cost Price</p><p className="font-semibold">{fmt(showProductDetail.cost_price)} / {showProductDetail.unit}</p></div>
                            <div><p className="text-xs text-slate-500">Selling Price</p><p className="font-semibold">{showProductDetail.selling_price > 0 ? `${fmt(showProductDetail.selling_price)} / ${showProductDetail.unit}` : 'N/A (Raw Material)'}</p></div>
                            <div><p className="text-xs text-slate-500">Reorder Level</p><p className="font-medium">{showProductDetail.min_stock.toLocaleString()} {showProductDetail.unit}</p></div>
                            <div><p className="text-xs text-slate-500">Critical Level</p><p className="font-medium text-red-600">{showProductDetail.critical_level.toLocaleString()} {showProductDetail.unit}</p></div>
                            <div><p className="text-xs text-slate-500">Warehouse</p><p className="font-medium">{showProductDetail.warehouse}</p></div>
                            <div><p className="text-xs text-slate-500">Batches</p><p className="font-medium">{showProductDetail.batch_count} active batches</p></div>
                            <div><p className="text-xs text-slate-500">Total Stock Value</p><p className="font-bold text-blue-700">{fmt(showProductDetail.stock * showProductDetail.cost_price)}</p></div>
                            <div><p className="text-xs text-slate-500">Barcode</p><p className="font-mono">{showProductDetail.barcode}</p></div>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
                onConfirm={confirmDelete}
                title="Delete Product"
                message={`Are you sure you want to delete "${deleteConfirm.product?.name}"?\n\nThis will remove the product and all its inventory records. This action cannot be undone.`}
                confirmText="Delete Product"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
