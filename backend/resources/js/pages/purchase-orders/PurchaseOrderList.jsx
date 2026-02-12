import { useState, useEffect, useMemo } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DateRangePicker from '../../components/ui/DateRangePicker';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import purchaseOrderAPI from '../../services/purchaseOrderAPI';
import supplierAPI from '../../services/supplierAPI';
import productAPI from '../../services/productAPI';
import warehouseAPI from '../../services/warehouseAPI';
import documentAPI, { openPdfInNewTab, downloadPdf } from '../../services/documentAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

export default function PurchaseOrderList() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [formData, setFormData] = useState({ 
        supplier_id: '', 
        warehouse_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '', 
        notes: '', 
        items: [{ product_id: '', quantity: '', unit_price: '' }] 
    });

    const toast = useToast();
    const confirm = useConfirm();

    // Fetch orders and dropdown data from API
    useEffect(() => {
        fetchOrders();
        fetchSuppliers();
        fetchProducts();
        fetchWarehouses();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await purchaseOrderAPI.getAll();
            // Transform API response to match expected table format
            const rawOrders = response.data || [];
            const transformedOrders = rawOrders.map(order => ({
                ...order,
                supplier_id: order.supplier_id,
                warehouse_id: order.warehouse_id,
                supplier: order.supplier?.name || 'Unknown Supplier',
                date: order.order_date,
                items: order.items?.length || 0,
                total: parseFloat(order.total_amount) || 0,
                lineItems: (order.items || []).map(item => ({
                    product_id: item.product_id,
                    product: item.product?.name || 'Unknown Product',
                    quantity: item.quantity_ordered || item.quantity || 0,
                    price: parseFloat(item.unit_price) || 0,
                    total: parseFloat(item.total_amount) || 0
                }))
            }));
            setOrders(transformedOrders);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            toast.error('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await supplierAPI.getAll({ per_page: 1000 });
            console.log('Suppliers API response:', response);
            const data = Array.isArray(response) ? response : (response?.data || []);
            console.log('Suppliers data:', data);
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productAPI.getProducts({ per_page: 1000 });
            console.log('Products API response:', response);
            const data = Array.isArray(response) ? response : (response?.data || []);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await warehouseAPI.getWarehouses();
            console.log('Warehouses API response:', response);
            const data = Array.isArray(response) ? response : (response?.data || []);
            setWarehouses(data);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    // Calculate stats
    const pendingValue = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + parseFloat(o.total_amount || o.total || 0), 0);
    const thisMonthValue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || o.total || 0), 0);
    const approvedValue = orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + parseFloat(o.total_amount || o.total || 0), 0);
    const averageValue = orders.length > 0 ? thisMonthValue / orders.length : 0;

    // Filter orders
    const filteredOrders = useMemo(() => orders.filter(order => {
        const poNumber = order.po_number || order.reference_number || '';
        const supplier = order.supplier?.name || order.supplier_name || '';
        const matchesSearch = poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            supplier.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;

        // Date range filter
        let matchesDate = true;
        const orderDate = order.order_date || order.date;
        if ((startDate || endDate) && orderDate) {
            const oDate = new Date(orderDate);
            if (startDate) matchesDate = matchesDate && oDate >= new Date(startDate);
            if (endDate) matchesDate = matchesDate && oDate <= new Date(endDate);
        }

        return matchesSearch && matchesStatus && matchesDate;
    }), [orders, searchQuery, statusFilter, startDate, endDate]);

    const handleCreate = async () => {
        // Validate required fields
        if (!formData.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }
        if (!formData.warehouse_id) {
            toast.error('Please select a warehouse');
            return;
        }
        if (!formData.order_date) {
            toast.error('Please enter an order date');
            return;
        }
        if (!formData.items.length || !formData.items[0].product_id) {
            toast.error('Please add at least one line item');
            return;
        }

        try {
            const payload = {
                supplier_id: parseInt(formData.supplier_id),
                warehouse_id: parseInt(formData.warehouse_id),
                order_date: formData.order_date,
                expected_delivery_date: formData.expected_delivery_date || null,
                notes: formData.notes || null,
                items: formData.items.filter(item => item.product_id).map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseFloat(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0,
                }))
            };
            
            console.log('Sending payload:', payload);
            
            await purchaseOrderAPI.create(payload);
            toast.success('Purchase order created successfully');
            setShowCreate(false);
            setFormData({ 
                supplier_id: '', 
                warehouse_id: '',
                order_date: new Date().toISOString().split('T')[0],
                expected_delivery_date: '', 
                notes: '', 
                items: [{ product_id: '', quantity: '', unit_price: '' }] 
            });
            fetchOrders();
        } catch (error) {
            console.error('Error creating purchase order:', error);
            console.error('Error response:', error.response?.data);
            const errors = error.response?.data?.errors;
            if (errors) {
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error(errorMessages);
            } else {
                toast.error(error.response?.data?.message || 'Failed to create purchase order');
            }
        }
    };

    const addLineItem = () => setFormData({...formData, items: [...formData.items, { product_id: '', quantity: '', unit_price: '' }]});
    const removeLineItem = (idx) => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)});
    const updateLineItem = (idx, field, value) => {
        const items = [...formData.items];
        items[idx] = {...items[idx], [field]: value};
        setFormData({...formData, items});
    };

    const [showEdit, setShowEdit] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    const handleEdit = (order) => {
        if (order.status !== 'pending' && order.status !== 'draft') {
            toast.error('Only pending or draft orders can be edited');
            return;
        }
        // Find original order data to get supplier_id and warehouse_id
        setEditingOrder(order);
        setFormData({
            supplier_id: order.supplier_id || '',
            warehouse_id: order.warehouse_id || '',
            order_date: order.date || order.order_date || new Date().toISOString().split('T')[0],
            expected_delivery_date: order.expected_delivery_date || '',
            notes: order.notes || '',
            items: order.lineItems?.length > 0
                ? order.lineItems.map(item => ({
                    product_id: item.product_id || '',
                    quantity: item.quantity || '',
                    unit_price: item.price || item.unit_price || ''
                }))
                : [{ product_id: '', quantity: '', unit_price: '' }]
        });
        setShowEdit(true);
    };

    const handleUpdate = async () => {
        if (!editingOrder) return;

        try {
            const payload = {
                supplier_id: parseInt(formData.supplier_id),
                warehouse_id: parseInt(formData.warehouse_id),
                expected_delivery_date: formData.expected_delivery_date || null,
                notes: formData.notes || null,
                items: formData.items.filter(item => item.product_id).map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseFloat(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0,
                }))
            };

            await purchaseOrderAPI.update(editingOrder.id, payload);
            toast.success('Purchase order updated successfully');
            setShowEdit(false);
            setEditingOrder(null);
            setFormData({
                supplier_id: '',
                warehouse_id: '',
                order_date: new Date().toISOString().split('T')[0],
                expected_delivery_date: '',
                notes: '',
                items: [{ product_id: '', quantity: '', unit_price: '' }]
            });
            fetchOrders();
        } catch (error) {
            console.error('Error updating purchase order:', error);
            toast.error(error.response?.data?.message || 'Failed to update purchase order');
        }
    };

    const handleCancel = async (order) => {
        if (order.status === 'completed' || order.status === 'cancelled') {
            toast.error('This order cannot be cancelled');
            return;
        }

        const confirmed = await confirm({
            title: 'Cancel Purchase Order',
            message: `Are you sure you want to cancel ${order.po_number}? This action cannot be undone.`,
            confirmText: 'Cancel Order',
            variant: 'danger'
        });

        if (confirmed) {
            try {
                await purchaseOrderAPI.cancel(order.id, 'Cancelled by user');
                toast.success(`${order.po_number} has been cancelled`);
                fetchOrders();
            } catch (error) {
                console.error('Error cancelling order:', error);
                toast.error(error.response?.data?.message || 'Failed to cancel order');
            }
        }
    };

    const handleApprove = async (order) => {
        if (order.status !== 'pending') {
            toast.error('Only pending orders can be approved');
            return;
        }

        const confirmed = await confirm({
            title: 'Approve Purchase Order',
            message: `Approve ${order.po_number} for ${window.formatCurrency(order.total || 0)}?`,
            confirmText: 'Approve',
            variant: 'primary'
        });

        if (confirmed) {
            try {
                await purchaseOrderAPI.approve(order.id);
                toast.success(`${order.po_number} has been approved`);
                fetchOrders();
            } catch (error) {
                console.error('Error approving order:', error);
                toast.error(error.response?.data?.message || 'Failed to approve order');
            }
        }
    };

    const handleExport = () => {
        toast.success('Exported purchase orders to CSV');
    };

    const handlePrint = (order) => {
        // Open PDF in new window for printing
        const printUrl = `/api/v1/purchase-orders/${order.id}/pdf/preview`;
        const printWindow = window.open(printUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const handleDownloadPdf = async (order) => {
        try {
            toast.info(`Generating PDF for ${order.po_number}...`);
            const response = await purchaseOrderAPI.downloadPdf(order.id);
            
            // Create blob from response
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `PO-${order.po_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            toast.success(`Downloaded PDF for ${order.po_number}`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    const handleViewGRN = async (order) => {
        try {
            toast.info('Generating GRN...');
            await openPdfInNewTab(documentAPI.previewGRN(order.id), `GRN-${order.po_number}.pdf`);
        } catch (error) {
            console.error('Error generating GRN:', error);
            toast.error('Failed to generate GRN');
        }
    };

    const handleDownloadGRN = async (order) => {
        try {
            toast.info('Downloading GRN...');
            await downloadPdf(documentAPI.downloadGRN(order.id), `GRN-${order.po_number}.pdf`);
            toast.success('GRN downloaded');
        } catch (error) {
            console.error('Error downloading GRN:', error);
            toast.error('Failed to download GRN');
        }
    };

    const handleSendEmail = async (order) => {
        // Check if supplier has email
        const supplierData = suppliers.find(s => s.id === order.supplier_id);
        if (!supplierData?.email) {
            toast.error('Supplier does not have an email address configured');
            return;
        }

        const confirmed = await confirm({
            title: 'Send Purchase Order via Email',
            message: `Send ${order.po_number} to ${supplierData.email}? The supplier will receive the PO as a PDF attachment.`,
            confirmText: 'Send Email',
            variant: 'primary'
        });

        if (confirmed) {
            try {
                toast.info(`Sending email to ${supplierData.email}...`);
                await purchaseOrderAPI.sendEmail(order.id);
                toast.success(`Purchase order sent to ${supplierData.email}`);
            } catch (error) {
                console.error('Error sending email:', error);
                toast.error(error.response?.data?.message || 'Failed to send email');
            }
        }
    };

    // Export columns for CSV
    const exportColumns = [
        { key: 'po_number', label: 'PO Number' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'order_date', label: 'Order Date' },
        { key: 'expected_date', label: 'Expected Date' },
        { key: 'total_amount', label: 'Total Amount' },
        { key: 'status', label: 'Status' },
    ];

    // Bulk actions
    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                exportSelectedToCSV(selectedIndices, filteredOrders, exportColumns, 'purchase_orders');
            }
        },
        {
            label: 'Approve Selected',
            onClick: async (selectedIndices) => {
                const selected = selectedIndices.map(i => filteredOrders[i]).filter(o => o.status === 'draft' || o.status === 'pending');
                if (selected.length === 0) {
                    toast.error('No pending/draft orders selected');
                    return;
                }
                const confirmed = await confirm({
                    title: 'Approve Orders',
                    message: `Approve ${selected.length} purchase order(s)?`,
                    confirmText: 'Approve',
                    variant: 'primary'
                });
                if (confirmed) {
                    let successCount = 0;
                    for (const order of selected) {
                        try {
                            await purchaseOrderAPI.approve(order.id);
                            successCount++;
                        } catch (error) {
                            console.error(`Failed to approve PO ${order.id}:`, error);
                        }
                    }
                    toast.success(`${successCount} order(s) approved`);
                    fetchOrders();
                }
            }
        },
        {
            label: 'Cancel Selected',
            onClick: async (selectedIndices) => {
                const selected = selectedIndices.map(i => filteredOrders[i]).filter(o => o.status !== 'received' && o.status !== 'cancelled');
                if (selected.length === 0) {
                    toast.error('No cancellable orders selected');
                    return;
                }
                const confirmed = await confirm({
                    title: 'Cancel Orders',
                    message: `Cancel ${selected.length} purchase order(s)?`,
                    confirmText: 'Cancel',
                    variant: 'danger'
                });
                if (confirmed) {
                    let successCount = 0;
                    for (const order of selected) {
                        try {
                            await purchaseOrderAPI.cancel(order.id);
                            successCount++;
                        } catch (error) {
                            console.error(`Failed to cancel PO ${order.id}:`, error);
                        }
                    }
                    toast.success(`${successCount} order(s) cancelled`);
                    fetchOrders();
                }
            },
            variant: 'danger'
        }
    ];

    // Table columns
    const columns = [
        {
            key: 'po_number',
            header: 'PO Number',
            render: (value) => <span className="font-medium text-blue-600">{value}</span>
        },
        {
            key: 'supplier',
            header: 'Supplier'
        },
        {
            key: 'date',
            header: 'Date',
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            key: 'items',
            header: 'Items',
            render: (value, row) => (
                <button
                    onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {value} items {expandedRow === row.id ? '▼' : '▶'}
                </button>
            )
        },
        {
            key: 'total',
            header: 'Total',
            render: (value) => <span className="font-mono font-semibold">{window.getCurrencySymbol()}{value.toLocaleString()}</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (value) => {
                const variantMap = {
                    draft: 'draft',
                    pending: 'pending',
                    approved: 'approved',
                    completed: 'completed',
                    cancelled: 'rejected'
                };
                return <Badge variant={variantMap[value] || 'draft'}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (value, row) => (
                <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenu(openActionMenu === row.id ? null : row.id);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm flex items-center gap-1"
                    >
                        Actions
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openActionMenu === row.id && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenActionMenu(null)}></div>
                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px]">
                                {/* View */}
                                <button
                                    onClick={() => { setSelectedOrder(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Details
                                </button>
                                
                                {/* Edit - only for pending */}
                                {row.status === 'pending' && (
                                    <button
                                        onClick={() => { handleEdit(row); setOpenActionMenu(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Edit Order
                                    </button>
                                )}
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* Approve - only for pending */}
                                {row.status === 'pending' && (
                                    <button
                                        onClick={() => { handleApprove(row); setOpenActionMenu(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Approve
                                    </button>
                                )}
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* View PO PDF */}
                                <button
                                    onClick={() => { handlePrint(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    View PO
                                </button>
                                
                                {/* Download PO PDF */}
                                <button
                                    onClick={() => { handleDownloadPdf(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download PO
                                </button>
                                
                                {/* GRN - only for received/completed */}
                                {(row.status === 'received' || row.status === 'completed') && (
                                    <>
                                        <button
                                            onClick={() => { handleViewGRN(row); setOpenActionMenu(null); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                            View GRN
                                        </button>
                                        <button
                                            onClick={() => { handleDownloadGRN(row); setOpenActionMenu(null); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            Download GRN
                                        </button>
                                    </>
                                )}
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* Email to Supplier */}
                                <button
                                    onClick={() => { handleSendEmail(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Email Supplier
                                </button>
                                
                                {/* Cancel - only for non-completed/cancelled */}
                                {row.status !== 'completed' && row.status !== 'cancelled' && (
                                    <button
                                        onClick={() => { handleCancel(row); setOpenActionMenu(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
                <p className="text-slate-600 mt-2">Manage supplier orders and procurement</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-amber-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Pending Value</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{pendingValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-600 mt-1">{orders.filter(o => o.status === 'pending').length} orders</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-blue-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total This Month</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{thisMonthValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-600 mt-1">{orders.length} orders</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-green-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Approved</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{approvedValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-600 mt-1">{orders.filter(o => o.status === 'approved').length} orders</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-purple-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Average Order Value</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{averageValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-600 mt-1">Per order</p>
                    </CardBody>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setShowCreate(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Purchase Order
                    </Button>
                    <Button variant="ghost" onClick={handleExport}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export All
                    </Button>
                </div>

                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <SearchBar
                        placeholder="Search by PO number or supplier..."
                        onSearch={setSearchQuery}
                        className="flex-1 md:w-64"
                    />
                    <FilterDropdown
                        label="Status"
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </div>
            </div>

            {/* Orders DataTable */}
            <DataTable
                columns={columns}
                data={filteredOrders}
                selectable={true}
                bulkActions={bulkActions}
                emptyMessage="No purchase orders found"
                pageSize={20}
            />

            {/* Expanded Row Details */}
            {expandedRow && (
                <Card className="mt-4">
                    <CardBody>
                        <h3 className="font-bold text-slate-900 mb-4">Line Items - {orders.find(o => o.id === expandedRow)?.po_number}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Product</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Quantity</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Unit Price</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {orders.find(o => o.id === expandedRow)?.lineItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 text-sm">{item.product}</td>
                                            <td className="px-4 py-2 text-sm font-mono">{item.quantity}</td>
                                            <td className="px-4 py-2 text-sm font-mono">{window.getCurrencySymbol()}{item.price.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-sm font-mono font-semibold">{window.getCurrencySymbol()}{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Create PO SlideOut */}
            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Purchase Order" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                            <select required value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select supplier...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse *</label>
                            <select required value={formData.warehouse_id} onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select warehouse...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Order Date *</label>
                            <input type="date" required value={formData.order_date} onChange={(e) => setFormData({...formData, order_date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                            <input type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">Line Items</h4>
                            <button type="button" onClick={addLineItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Item</button>
                        </div>
                        <div className="space-y-3">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>}
                                        <select required value={item.product_id} onChange={(e) => updateLineItem(idx, 'product_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none">
                                            <option value="">Select...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>}
                                        <input type="number" required min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="0" />
                                    </div>
                                    <div className="col-span-3">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price ({window.getCurrencySymbol()})</label>}
                                        <input type="number" required min="0" step="0.01" value={item.unit_price} onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="0.00" />
                                    </div>
                                    <div className="col-span-1 text-right font-mono text-sm text-slate-600">
                                        {item.quantity && item.unit_price ? `${window.formatCurrency(item.quantity * item.unit_price)}` : '-'}
                                    </div>
                                    <div className="col-span-1">
                                        {formData.items.length > 1 && (
                                            <button type="button" onClick={() => removeLineItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {formData.items.some(i => i.quantity && i.unit_price) && (
                            <div className="flex justify-end mt-3 pt-3 border-t">
                                <span className="font-semibold text-slate-900">Total: {window.getCurrencySymbol()}{formData.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Additional notes..." />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Create Purchase Order</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Edit PO SlideOut */}
            <SlideOut isOpen={showEdit} onClose={() => { setShowEdit(false); setEditingOrder(null); }} title={`Edit: ${editingOrder?.po_number || ''}`} size="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                            <select required value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select supplier...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse *</label>
                            <select required value={formData.warehouse_id} onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select warehouse...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                            <input type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">Line Items</h4>
                            <button type="button" onClick={addLineItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Item</button>
                        </div>
                        <div className="space-y-3">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>}
                                        <select required value={item.product_id} onChange={(e) => updateLineItem(idx, 'product_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none">
                                            <option value="">Select...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>}
                                        <input type="number" required min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="0" />
                                    </div>
                                    <div className="col-span-3">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price ({window.getCurrencySymbol()})</label>}
                                        <input type="number" required min="0" step="0.01" value={item.unit_price} onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="0.00" />
                                    </div>
                                    <div className="col-span-1 text-right font-mono text-sm text-slate-600">
                                        {item.quantity && item.unit_price ? `${window.formatCurrency(item.quantity * item.unit_price)}` : '-'}
                                    </div>
                                    <div className="col-span-1">
                                        {formData.items.length > 1 && (
                                            <button type="button" onClick={() => removeLineItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {formData.items.some(i => i.quantity && i.unit_price) && (
                            <div className="flex justify-end mt-3 pt-3 border-t">
                                <span className="font-semibold text-slate-900">Total: {window.getCurrencySymbol()}{formData.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Additional notes..." />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Update Purchase Order</Button>
                        <Button variant="outline" onClick={() => { setShowEdit(false); setEditingOrder(null); }}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Order Detail SlideOut */}
            <SlideOut isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`PO: ${selectedOrder?.po_number || ''}`} size="lg">
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><p className="text-xs text-slate-500">PO Number</p><p className="font-mono font-semibold text-blue-700">{selectedOrder.po_number}</p></div>
                            <div><p className="text-xs text-slate-500">Supplier</p><p className="font-medium">{selectedOrder.supplier}</p></div>
                            <div><p className="text-xs text-slate-500">Date</p><p className="font-medium">{selectedOrder.date}</p></div>
                            <div><p className="text-xs text-slate-500">Status</p><Badge variant={selectedOrder.status === 'completed' ? 'completed' : selectedOrder.status === 'approved' ? 'approved' : 'pending'}>{selectedOrder.status}</Badge></div>
                            <div><p className="text-xs text-slate-500">Items</p><p className="font-medium">{selectedOrder.items} items</p></div>
                            <div><p className="text-xs text-slate-500">Total</p><p className="font-bold text-slate-900">{window.getCurrencySymbol()}{selectedOrder.total.toLocaleString()}</p></div>
                        </div>
                        {selectedOrder.lineItems.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-3">Line Items</h4>
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Product</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Total</th></tr></thead>
                                    <tbody>
                                        {selectedOrder.lineItems.map((item, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-2 font-medium">{item.product}</td>
                                                <td className="text-right font-mono">{item.quantity}</td>
                                                <td className="text-right">{window.getCurrencySymbol()}{item.price.toLocaleString()}</td>
                                                <td className="text-right font-semibold">{window.getCurrencySymbol()}{item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="flex gap-2 pt-4 border-t">
                            {selectedOrder.status === 'pending' && <Button size="sm" onClick={() => { handleApprove(selectedOrder); setSelectedOrder(null); }}>Approve</Button>}
                            {selectedOrder.status !== 'completed' && <Button variant="outline" size="sm" onClick={() => { handleCancel(selectedOrder); setSelectedOrder(null); }}>Cancel Order</Button>}
                        </div>
                    </div>
                )}
            </SlideOut>
        </div>
    );
}
