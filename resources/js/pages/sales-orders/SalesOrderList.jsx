import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import salesOrderAPI from '../../services/salesOrderAPI';
import productAPI from '../../services/productAPI';
import customerAPI from '../../services/customerAPI';
import documentAPI, { openPdfInNewTab, downloadPdf } from '../../services/documentAPI';
import { bankAccountsAPI, taxesAPI } from '../../services/settingsAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

export default function SalesOrderList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [showFulfillment, setShowFulfillment] = useState(false);
    const [fulfillmentOrder, setFulfillmentOrder] = useState(null);
    const [fulfillmentData, setFulfillmentData] = useState({
        fulfillment_status: '',
        tracking_number: '',
        notes: ''
    });
    const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [showItemsModal, setShowItemsModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({
        customer_id: '',
        order_type: 'direct',
        formula_id: '',
        payment_type: 'cash',
        bank_account_id: '',
        tax_id: '',
        notes: '',
        items: []
    });

    const toast = useToast();
    const confirm = useConfirm();

    const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

    // Fetch products for the dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Try to get finished goods first
                let response = await productAPI.getFinishedGoods();
                console.log('Products API response:', response.data);
                let productList = response.data?.data || response.data || [];

                // If no finished goods, get all products
                if (!Array.isArray(productList) || productList.length === 0) {
                    response = await productAPI.getProducts();
                    console.log('All products API response:', response.data);
                    productList = response.data?.data || response.data || [];
                }

                setProducts(Array.isArray(productList) ? productList : []);
                console.log('Products set:', productList);
            } catch (error) {
                console.error('Error fetching products:', error);
                // Try getting all products as fallback
                try {
                    const fallbackResponse = await productAPI.getProducts();
                    const fallbackList = fallbackResponse.data?.data || fallbackResponse.data || [];
                    setProducts(Array.isArray(fallbackList) ? fallbackList : []);
                } catch (fallbackError) {
                    console.error('Fallback fetch also failed:', fallbackError);
                    setProducts([]);
                }
            }
        };
        fetchProducts();
    }, []);

    // Fetch customers for the dropdown
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await customerAPI.getCustomers();
                setCustomers(response.data || []);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };
        fetchCustomers();
    }, []);

    // Fetch bank accounts for the dropdown
    useEffect(() => {
        const fetchBankAccounts = async () => {
            try {
                const response = await bankAccountsAPI.list();
                console.log('Bank Accounts API response:', response.data);
                // API returns { success: true, data: { bank_accounts: [...] } }
                const data = response.data?.data?.bank_accounts || response.data?.bank_accounts || response.data?.data || response.data;
                setBankAccounts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching bank accounts:', error);
                setBankAccounts([]); // Set empty array on error
            }
        };
        fetchBankAccounts();
    }, []);

    // Fetch taxes for VAT calculation
    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const response = await taxesAPI.list();
                console.log('Taxes API response:', response.data);
                // API returns { success: true, data: { taxes: [...] } }
                const data = response.data?.data?.taxes || response.data?.taxes || response.data?.data || response.data;
                setTaxes(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching taxes:', error);
                setTaxes([]); // Set empty array on error
            }
        };
        fetchTaxes();
    }, []);

    // Fetch sales orders from API
    useEffect(() => {
        fetchOrders();
    }, [searchQuery, statusFilter, startDate, endDate]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (statusFilter) params.status = statusFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await salesOrderAPI.getSalesOrders(params);
            
            // Transform API data to match UI expectations
            const transformedOrders = (response.data || []).map(order => ({
                id: order.id,
                so_number: order.order_number || order.so_number || `SO-${order.id}`,
                customer: order.customer?.name || 'Unknown',
                customerPhone: order.customer?.phone,
                customerEmail: order.customer?.email,
                date: order.order_date,
                items: order.items?.length || 0,
                total: parseFloat(order.total_amount) || 0,
                status: order.status,
                fulfillmentStatus: order.fulfillment_status || 'awaiting',
                paymentType: order.payment_type || 'cash',
                lineItems: (order.items || []).map(item => ({
                    ...item,
                    product: item.product?.name || item.product_name || 'Unknown Product',
                    quantity: item.quantity || 0,
                    price: parseFloat(item.unit_price) || 0,
                    total: parseFloat(item.line_total || item.total_amount) || (item.quantity * parseFloat(item.unit_price)) || 0
                }))
            }));

            setOrders(transformedOrders);

            // Check if URL has an order ID to auto-open
            const orderId = searchParams.get('id');
            if (orderId) {
                const orderToOpen = transformedOrders.find(o => o.id === parseInt(orderId));
                if (orderToOpen) {
                    setSelectedOrder(orderToOpen);
                    // Clear the URL param after opening
                    setSearchParams({});
                }
            }
        } catch (error) {
            console.error('Error fetching sales orders:', error);
            toast.error('Failed to load sales orders');
            // Keep existing orders on error
        } finally {
            setLoading(false);
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
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const averageValue = orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0;

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const soNumber = order.so_number || '';
        const customerName = order.customer || '';
        const matchesSearch = soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;

        // Date range filter
        let matchesDate = true;
        if (startDate || endDate) {
            const orderDate = new Date(order.date);
            if (startDate) matchesDate = matchesDate && orderDate >= new Date(startDate);
            if (endDate) matchesDate = matchesDate && orderDate <= new Date(endDate);
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
    };

    const handleCreateOrder = () => {
        setShowCreate(true);
        setSelectedCustomer(null);
        setFormData({
            customer_id: '',
            order_type: 'direct',
            formula_id: '',
            payment_type: 'cash',
            bank_account_id: '',
            notes: '',
            items: []
        });
    };

    // Handle customer selection to get credit info
    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === Number(customerId));
        setSelectedCustomer(customer || null);
        setFormData(prev => ({ ...prev, customer_id: customerId }));
    };

    // Get selected tax info
    const getSelectedTax = () => {
        if (!formData.tax_id) return null;
        const taxList = Array.isArray(taxes) ? taxes : [];
        return taxList.find(t => t.id === Number(formData.tax_id));
    };

    // Get tax rate from selected tax (0 if no tax selected)
    const getTaxRate = () => {
        const selectedTax = getSelectedTax();
        if (!selectedTax) return 0;
        const rate = parseFloat(selectedTax.rate);
        // Rate might be stored as percentage (e.g., 7.5) or decimal (e.g., 0.075)
        return rate > 1 ? rate / 100 : rate;
    };

    // Get tax name for display
    const getTaxName = () => {
        const selectedTax = getSelectedTax();
        return selectedTax?.name || 'Tax';
    };

    // Calculate customer's available credit
    const getCustomerCreditInfo = () => {
        if (!selectedCustomer) return null;
        const creditLimit = parseFloat(selectedCustomer.credit_limit || 0);
        const creditUsed = parseFloat(selectedCustomer.credit_used || 0);
        const creditAvailable = creditLimit - creditUsed;
        return {
            enabled: selectedCustomer.credit_enabled,
            blocked: selectedCustomer.credit_blocked,
            limit: creditLimit,
            used: creditUsed,
            available: creditAvailable
        };
    };

    const handleAddLineItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: 0, unit_price: 0 }]
        }));
    };

    const handleRemoveLineItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleLineItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === index) {
                    let updated = { ...item };
                    
                    // Parse quantity as number
                    if (field === 'quantity') {
                        updated.quantity = parseFloat(value) || 0;
                    } else {
                        updated[field] = value;
                    }

                    // Auto-populate unit_price when product is selected
                    if (field === 'product_id') {
                        const selectedProduct = products.find(p => p.id === Number(value));
                        if (selectedProduct && selectedProduct.selling_price) {
                            updated.unit_price = parseFloat(selectedProduct.selling_price) || 0;
                        } else {
                            updated.unit_price = 0;
                        }
                    }

                    return updated;
                }
                return item;
            })
        }));
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (Number(item.quantity) * Number(item.unit_price));
        }, 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * getTaxRate();
    };

    const calculateGrandTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleSubmitOrder = async () => {
        // Validation
        if (!formData.customer_id) {
            toast.error('Please select a customer');
            return;
        }
        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }
        if (formData.order_type === 'formula_based' && !formData.formula_id) {
            toast.error('Please select a formula');
            return;
        }
        if (formData.payment_type === 'bank_transfer' && !formData.bank_account_id) {
            toast.error('Please select a bank account');
            return;
        }
        if (formData.payment_type === 'credit') {
            const creditInfo = getCustomerCreditInfo();
            if (!creditInfo?.enabled) {
                toast.error('Customer does not have credit facility enabled');
                return;
            }
            if (creditInfo?.blocked) {
                toast.error('Customer credit is blocked');
                return;
            }
            if (creditInfo.available < calculateGrandTotal()) {
                toast.error('Order total exceeds available credit');
                return;
            }
        }

        try {
            // Prepare the data for API
            const orderData = {
                customer_id: Number(formData.customer_id),
                order_type: formData.order_type,
                payment_type: formData.payment_type,
                notes: formData.notes || '',
                items: formData.items.map(item => ({
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            // Add optional fields if present
            if (formData.formula_id) {
                orderData.formula_id = Number(formData.formula_id);
            }
            if (formData.bank_account_id) {
                orderData.bank_account_id = Number(formData.bank_account_id);
            }
            if (formData.tax_id) {
                orderData.tax_id = Number(formData.tax_id);
            }

            // Call the API
            const response = await salesOrderAPI.createSalesOrder(orderData);

            // Close the form and show success
            setShowCreate(false);
            toast.success('Sales order created successfully!');

            // Refresh the orders list
            fetchOrders();
        } catch (error) {
            console.error('Error creating sales order:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create sales order';
            toast.error(errorMessage);
        }
    };

    const handleEdit = (order) => {
        if (order.status !== 'pending') {
            toast.error('Only pending orders can be edited');
            return;
        }
        toast.info(`Editing ${order.so_number}`);
    };

    const handleCancel = async (order) => {
        if (order.status === 'completed') {
            toast.error('Completed orders cannot be cancelled');
            return;
        }

        const confirmed = await confirm({
            title: 'Cancel Sales Order',
            message: `Are you sure you want to cancel ${order.so_number}?`,
            confirmText: 'Cancel Order',
            variant: 'danger'
        });

        if (confirmed) {
            toast.success(`${order.so_number} has been cancelled`);
        }
    };

    const handleApprove = async (order) => {
        if (order.status !== 'pending') {
            toast.error('Only pending orders can be approved');
            return;
        }

        const confirmed = await confirm({
            title: 'Approve Sales Order',
            message: `Approve order ${order.so_number} for ${order.customerName}?\nTotal: ${window.formatCurrency(parseFloat(order.total))}`,
            confirmText: 'Approve',
            variant: 'primary'
        });

        if (confirmed) {
            try {
                const response = await salesOrderAPI.approveSalesOrder(order.id, 'Approved via sales order list');
                if (response.success) {
                    toast.success(`${order.so_number} has been approved`);
                    fetchOrders(); // Refresh the list
                } else {
                    toast.error(response.message || 'Failed to approve order');
                }
            } catch (error) {
                console.error('Approve error:', error);
                toast.error(error.response?.data?.message || 'Failed to approve order');
            }
        }
    };

    const handleFulfillment = (order) => {
        setFulfillmentOrder(order);
        setFulfillmentData({
            fulfillment_status: order.fulfillmentStatus || 'processing',
            tracking_number: '',
            notes: ''
        });
        setShowFulfillment(true);
    };

    const handleSubmitFulfillment = async () => {
        if (!fulfillmentOrder || !fulfillmentData.fulfillment_status) {
            toast.error('Please select a fulfillment status');
            return;
        }

        setFulfillmentLoading(true);
        try {
            const response = await salesOrderAPI.fulfillSalesOrder(fulfillmentOrder.id, fulfillmentData);
            
            if (response.success) {
                toast.success(`Order ${fulfillmentOrder.so_number} fulfillment updated to ${fulfillmentData.fulfillment_status}`);
                setShowFulfillment(false);
                setFulfillmentOrder(null);
                fetchOrders(); // Refresh the orders list
            } else {
                toast.error(response.message || 'Failed to update fulfillment');
            }
        } catch (error) {
            console.error('Fulfillment error:', error);
            toast.error(error.response?.data?.message || 'Failed to update fulfillment status');
        } finally {
            setFulfillmentLoading(false);
        }
    };

    const handleExport = () => {
        toast.success('Exported sales orders to CSV');
    };

    const handlePrint = async (order, type = 'invoice') => {
        try {
            toast.info(`Generating ${type}...`);
            switch(type) {
                case 'invoice':
                    await openPdfInNewTab(documentAPI.previewInvoice(order.id), `Invoice-${order.so_number}.pdf`);
                    break;
                case 'delivery-note':
                    await openPdfInNewTab(documentAPI.previewDeliveryNote(order.id), `DN-${order.so_number}.pdf`);
                    break;
                default:
                    await openPdfInNewTab(documentAPI.previewInvoice(order.id), `Invoice-${order.so_number}.pdf`);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const handleDownload = async (order, type = 'invoice') => {
        try {
            toast.info(`Downloading ${type}...`);
            switch(type) {
                case 'invoice':
                    await downloadPdf(documentAPI.downloadInvoice(order.id), `Invoice-${order.so_number}.pdf`);
                    break;
                case 'delivery-note':
                    await downloadPdf(documentAPI.downloadDeliveryNote(order.id), `DN-${order.so_number}.pdf`);
                    break;
                default:
                    await downloadPdf(documentAPI.downloadInvoice(order.id), `Invoice-${order.so_number}.pdf`);
            }
            toast.success(`Downloaded ${type}`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    // Bulk actions
    const exportColumns = [
        { key: 'so_number', label: 'SO Number' },
        { key: 'customer', label: 'Customer' },
        { key: 'date', label: 'Date' },
        { key: 'order_type', label: 'Type' },
        { key: 'items', label: 'Items Count' },
        { key: 'total', label: 'Total' },
        { key: 'status', label: 'Status' },
        { key: 'payment_status', label: 'Payment Status' },
    ];

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                const exportData = selectedIndices.map(idx => ({
                    ...filteredOrders[idx],
                    items: filteredOrders[idx]?.lineItems?.length || 0,
                }));
                exportSelectedToCSV(Array.from({ length: exportData.length }, (_, i) => i), exportData, exportColumns, 'sales_orders');
                toast.success(`Exported ${selectedIndices.length} orders`);
            }
        },
        {
            label: 'Approve Selected',
            onClick: async (selectedIndices) => {
                let successCount = 0;
                let errorCount = 0;
                for (const idx of selectedIndices) {
                    const order = filteredOrders[idx];
                    if (order && order.status === 'pending') {
                        try {
                            await salesOrderAPI.approve(order.id);
                            successCount++;
                        } catch (error) {
                            errorCount++;
                        }
                    }
                }
                if (successCount > 0) toast.success(`${successCount} order(s) approved`);
                if (errorCount > 0) toast.error(`${errorCount} order(s) failed to approve`);
                fetchOrders();
            }
        },
        {
            label: 'Cancel Selected',
            onClick: async (selectedIndices) => {
                const confirmed = await confirm({
                    title: 'Cancel Orders',
                    message: `Cancel ${selectedIndices.length} sales orders?`,
                    confirmText: 'Cancel Orders',
                    variant: 'danger'
                });
                if (confirmed) {
                    let successCount = 0;
                    let errorCount = 0;
                    for (const idx of selectedIndices) {
                        const order = filteredOrders[idx];
                        if (order && order.status !== 'completed' && order.status !== 'cancelled') {
                            try {
                                await salesOrderAPI.reject(order.id, 'Bulk cancelled');
                                successCount++;
                            } catch (error) {
                                errorCount++;
                            }
                        }
                    }
                    if (successCount > 0) toast.success(`${successCount} order(s) cancelled`);
                    if (errorCount > 0) toast.error(`${errorCount} order(s) failed to cancel`);
                    fetchOrders();
                }
            }
        }
    ];

    const getFulfillmentBadge = (status) => {
        const variants = {
            awaiting: 'draft',
            processing: 'pending',
            shipped: 'approved',
            delivered: 'completed'
        };
        return variants[status] || 'draft';
    };

    const getFulfillmentLabel = (status) => {
        const labels = {
            awaiting: 'Awaiting',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered'
        };
        return labels[status] || status;
    };

    // Table columns
    const columns = [
        {
            key: 'so_number',
            header: 'SO Number',
            render: (value) => <span className="font-medium text-blue-600">{value}</span>
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (value) => (
                <span className="text-slate-900 font-medium">
                    {value}
                </span>
            )
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
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowItemsModal(row);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium text-sm transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {value} items
                </button>
            )
        },
        {
            key: 'total',
            header: 'Total',
            render: (value) => <span className="font-mono font-semibold">{window.getCurrencySymbol()}{value.toLocaleString()}</span>
        },
        {
            key: 'paymentType',
            header: 'Payment',
            render: (value) => {
                const paymentLabels = {
                    cash: 'Cash',
                    credit: 'Credit',
                    transfer: 'Transfer',
                    card: 'POS/Card',
                    pos: 'POS/Card',
                    bank_transfer: 'Transfer'
                };
                const paymentVariants = {
                    cash: 'completed',
                    credit: 'pending',
                    transfer: 'approved',
                    card: 'approved',
                    pos: 'approved',
                    bank_transfer: 'approved'
                };
                return <Badge variant={paymentVariants[value] || 'draft'}>{paymentLabels[value] || value}</Badge>;
            }
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
            key: 'fulfillmentStatus',
            header: 'Fulfillment',
            render: (value) => (
                <Badge variant={getFulfillmentBadge(value)}>{getFulfillmentLabel(value)}</Badge>
            )
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
                                    onClick={() => { handleViewOrder(row); setOpenActionMenu(null); }}
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
                                
                                {/* Fulfill */}
                                {(row.status === 'approved' || (row.status === 'completed' && row.fulfillmentStatus !== 'delivered')) && (
                                    <button
                                        onClick={() => { handleFulfillment(row); setOpenActionMenu(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                        Fulfill Order
                                    </button>
                                )}
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* Print/View Invoice */}
                                <button
                                    onClick={() => { handlePrint(row, 'invoice'); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    View Invoice
                                </button>
                                
                                {/* Download Invoice */}
                                <button
                                    onClick={() => { handleDownload(row, 'invoice'); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Invoice
                                </button>
                                
                                {/* View Delivery Note */}
                                <button
                                    onClick={() => { handlePrint(row, 'delivery-note'); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    View Delivery Note
                                </button>
                                
                                {/* Download Delivery Note */}
                                <button
                                    onClick={() => { handleDownload(row, 'delivery-note'); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Download Delivery Note
                                </button>
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* Cancel - only for non-completed */}
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
                <h1 className="text-3xl font-bold text-slate-900">Sales Orders</h1>
                <p className="text-slate-600 mt-2">Manage customer orders and fulfillment</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-amber-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Pending</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{pendingOrders.length}</p>
                        <p className="text-xs text-slate-600 mt-1">{window.getCurrencySymbol()}{pendingOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-green-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Completed Orders</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{completedOrders.length}</p>
                        <p className="text-xs text-slate-600 mt-1">This month</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-blue-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Revenue</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">From completed orders</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-purple-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Average Order</p>
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
                        Create Sales Order
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
                        placeholder="Search by SO number or customer..."
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
                emptyMessage="No sales orders found"
                pageSize={10}
                enablePagination={true}
            />

            {/* Line Items Modal */}
            {showItemsModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowItemsModal(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Line Items</h3>
                                    <p className="text-blue-200 text-sm">{showItemsModal.so_number} • {showItemsModal.customer}</p>
                                </div>
                                <button
                                    onClick={() => setShowItemsModal(null)}
                                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="overflow-auto max-h-[60vh]">
                                <table className="min-w-full">
                                    <thead className="bg-slate-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Qty</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Unit Price</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {showItemsModal.lineItems?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-900">{item.product}</td>
                                                <td className="px-4 py-3 text-sm font-mono text-right">{item.quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono text-right">{fmt(item.price)}</td>
                                                <td className="px-4 py-3 text-sm font-mono font-semibold text-right">{fmt(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-slate-700 text-right">Order Total:</td>
                                            <td className="px-4 py-3 text-sm font-mono font-bold text-blue-700 text-right">{fmt(showItemsModal.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                <button
                                    onClick={() => setShowItemsModal(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-sm transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Order Detail SlideOut */}
            <SlideOut isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`SO: ${selectedOrder?.so_number || ''}`} size="lg">
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><p className="text-xs text-slate-500">SO Number</p><p className="font-mono font-semibold text-blue-700">{selectedOrder.so_number}</p></div>
                            <div><p className="text-xs text-slate-500">Customer</p><p className="font-medium">{selectedOrder.customer}</p></div>
                            <div><p className="text-xs text-slate-500">Date</p><p className="font-medium">{selectedOrder.date}</p></div>
                            <div><p className="text-xs text-slate-500">Status</p><Badge variant={selectedOrder.status === 'completed' ? 'completed' : selectedOrder.status === 'approved' ? 'approved' : 'pending'}>{selectedOrder.status}</Badge></div>
                            <div><p className="text-xs text-slate-500">Total</p><p className="font-bold text-slate-900">{fmt(selectedOrder.total)}</p></div>
                            <div><p className="text-xs text-slate-500">Fulfillment</p><Badge variant={selectedOrder.fulfillmentStatus === 'delivered' ? 'completed' : 'pending'}>{selectedOrder.fulfillmentStatus}</Badge></div>
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
                                                <td className="text-right">{fmt(item.price)}</td>
                                                <td className="text-right font-semibold">{fmt(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </SlideOut>

            {/* Fulfillment SlideOut */}
            <SlideOut 
                isOpen={showFulfillment} 
                onClose={() => { setShowFulfillment(false); setFulfillmentOrder(null); }} 
                title={`Fulfill: ${fulfillmentOrder?.so_number || ''}`} 
                size="md"
            >
                {fulfillmentOrder && (
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Customer</p>
                                    <p className="font-medium">{fulfillmentOrder.customer}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Order Total</p>
                                    <p className="font-bold text-slate-900">{fmt(fulfillmentOrder.total)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Current Status</p>
                                    <Badge variant={fulfillmentOrder.fulfillmentStatus === 'delivered' ? 'completed' : 'pending'}>
                                        {fulfillmentOrder.fulfillmentStatus}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Items</p>
                                    <p className="font-medium">{fulfillmentOrder.items} items</p>
                                </div>
                            </div>
                        </div>

                        {/* Fulfillment Status Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Update Fulfillment Status *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'processing', label: 'Processing', icon: '⚙️', description: 'Order is being prepared' },
                                    { value: 'shipped', label: 'Shipped', icon: '🚚', description: 'Order has been shipped' },
                                    { value: 'delivered', label: 'Delivered', icon: '✅', description: 'Order delivered to customer' },
                                ].map((status) => (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => setFulfillmentData(prev => ({ ...prev, fulfillment_status: status.value }))}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                                            fulfillmentData.fulfillment_status === status.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xl">{status.icon}</span>
                                            <span className="font-semibold text-slate-900">{status.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{status.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tracking Number (shown for shipped) */}
                        {fulfillmentData.fulfillment_status === 'shipped' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
                                <input
                                    type="text"
                                    value={fulfillmentData.tracking_number}
                                    onChange={(e) => setFulfillmentData(prev => ({ ...prev, tracking_number: e.target.value }))}
                                    placeholder="Enter tracking number..."
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea
                                value={fulfillmentData.notes}
                                onChange={(e) => setFulfillmentData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any notes about this fulfillment update..."
                                rows={3}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Line Items Preview */}
                        {fulfillmentOrder.lineItems && fulfillmentOrder.lineItems.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-3">Items to Fulfill</h4>
                                <div className="bg-slate-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {fulfillmentOrder.lineItems.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.product}</span>
                                            <span className="font-mono text-slate-600">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => { setShowFulfillment(false); setFulfillmentOrder(null); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                className="flex-1"
                                disabled={!fulfillmentData.fulfillment_status || fulfillmentLoading}
                                onClick={handleSubmitFulfillment}
                            >
                                {fulfillmentLoading ? 'Updating...' : 'Update Fulfillment'}
                            </Button>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Create SO SlideOut */}
            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Sales Order" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitOrder(); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                            <select required value={formData.customer_id} onChange={(e) => handleCustomerChange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select customer...</option>
                                {(customers || []).map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} {customer.credit_enabled ? '(Credit)' : '(Cash)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type *</label>
                            <select value={formData.payment_type} onChange={(e) => setFormData({...formData, payment_type: e.target.value, bank_account_id: ''})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="cash">Cash</option>
                                <option value="credit">Credit</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        {/* Credit Info Display */}
                        {formData.payment_type === 'credit' && selectedCustomer && (
                            <div className="col-span-2">
                                {(() => {
                                    const creditInfo = getCustomerCreditInfo();
                                    if (!creditInfo?.enabled) {
                                        return (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-700 font-medium">This customer does not have credit facility enabled.</p>
                                            </div>
                                        );
                                    }
                                    if (creditInfo?.blocked) {
                                        return (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-700 font-medium">This customer's credit is currently blocked.</p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-900 font-medium mb-1">Credit Information</p>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-blue-600">Limit:</span>{' '}
                                                    <span className="font-semibold">{fmt(creditInfo.limit)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-blue-600">Used:</span>{' '}
                                                    <span className="font-semibold">{fmt(creditInfo.used)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-blue-600">Available:</span>{' '}
                                                    <span className={`font-semibold ${creditInfo.available < calculateGrandTotal() ? 'text-red-600' : 'text-green-600'}`}>
                                                        {fmt(creditInfo.available)}
                                                    </span>
                                                </div>
                                            </div>
                                            {creditInfo.available < calculateGrandTotal() && (
                                                <p className="text-xs text-red-600 mt-2">Warning: Order total exceeds available credit!</p>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {/* Bank Account Selection */}
                        {formData.payment_type === 'bank_transfer' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account *</label>
                                {(!Array.isArray(bankAccounts) || bankAccounts.length === 0) ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-amber-800">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className="font-medium">No bank accounts available</span>
                                        </div>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Please add a bank account in Settings or select a different payment method.
                                        </p>
                                    </div>
                                ) : (
                                    <select required value={formData.bank_account_id} onChange={(e) => setFormData({...formData, bank_account_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="">Select bank account...</option>
                                        {bankAccounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.bank_name} - {account.account_number} ({account.account_name})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Order Type</label>
                            <select value={formData.order_type} onChange={(e) => setFormData({...formData, order_type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="direct">Direct Sale</option>
                                <option value="formula_based">Formula-Based</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tax</label>
                            <select value={formData.tax_id} onChange={(e) => setFormData({...formData, tax_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">No Tax</option>
                                {(Array.isArray(taxes) ? taxes : []).filter(t => t.is_active !== false).map(tax => (
                                    <option key={tax.id} value={tax.id}>
                                        {tax.name} ({parseFloat(tax.rate) > 1 ? tax.rate : (parseFloat(tax.rate) * 100).toFixed(1)}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formData.order_type === 'formula_based' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Formula *</label>
                                <select required value={formData.formula_id} onChange={(e) => setFormData({...formData, formula_id: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                    <option value="">Select formula...</option>
                                    <option value="1">Standard Poultry Feed Mix</option>
                                    <option value="2">Broiler Starter</option>
                                    <option value="3">Layer Feed Premium</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">Line Items</h4>
                            <button type="button" onClick={handleAddLineItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Item</button>
                        </div>
                        <div className="space-y-3">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>}
                                        <select value={item.product_id} onChange={(e) => handleLineItemChange(idx, 'product_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none">
                                            <option value="">Select...</option>
                                            {(products || []).map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} {product.unit ? `(${product.unit})` : ''} - {window.getCurrencySymbol()}{Number(product.selling_price || 0).toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Qty (bags)</label>}
                                        <input type="number" min="1" value={item.quantity || ''} onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="0" />
                                    </div>
                                    <div className="col-span-3">
                                        {idx === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price ({window.getCurrencySymbol()})</label>}
                                        <input type="text" readOnly value={item.unit_price ? fmt(item.unit_price) : window.formatCurrency(0, { minimumFractionDigits: 2 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 cursor-not-allowed" />
                                    </div>
                                    <div className="col-span-1 text-right font-mono text-sm text-slate-700 font-semibold">
                                        {item.quantity > 0 && item.unit_price > 0 ? fmt(item.quantity * item.unit_price) : '-'}
                                    </div>
                                    <div className="col-span-1">
                                        {formData.items.length > 0 && (
                                            <button type="button" onClick={() => handleRemoveLineItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {formData.items.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">No items added. Click "+ Add Item" to begin.</p>
                            )}
                        </div>
                        {formData.items.length > 0 && (
                            <div className="mt-4 pt-3 border-t space-y-1 text-right">
                                <p className="text-sm text-slate-600">Subtotal: <span className="font-semibold">{fmt(calculateSubtotal())}</span></p>
                                {formData.tax_id && (
                                    <p className="text-sm text-slate-600">{getTaxName()} ({(getTaxRate() * 100).toFixed(1)}%): <span className="font-semibold">{fmt(calculateTax())}</span></p>
                                )}
                                <p className="text-lg font-bold text-slate-900">Total: {fmt(calculateGrandTotal())}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Additional notes..." />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Create Sales Order</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>
        </div>
    );
}
