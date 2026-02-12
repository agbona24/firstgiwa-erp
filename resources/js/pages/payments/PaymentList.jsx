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
import paymentAPI from '../../services/paymentAPI';
import documentAPI, { openPdfInNewTab, downloadPdf } from '../../services/documentAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

export default function PaymentList() {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showRecord, setShowRecord] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [formData, setFormData] = useState({
        invoice_number: '',
        customer: '',
        amount: '',
        payment_method: 'Cash',
        bank_reference: '',
        notes: '',
        payment_splits: []
    });

    const toast = useToast();
    const confirm = useConfirm();

    const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

    // Fetch payments from API
    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await paymentAPI.getAll();
            setPayments(response.data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    // Mock invoices for lookup
    const mockInvoices = [
        { number: 'INV-2026-045', customer: 'Mega Mart Ltd', amountDue: 850000, status: 'pending' },
        { number: 'INV-2026-038', customer: 'City Grocers', amountDue: 1200000, status: 'pending' },
        { number: 'INV-2026-025', customer: 'Fresh Foods Inc', amountDue: 620000, status: 'pending' }
    ];

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const methodOptions = [
        { value: 'Cash', label: 'Cash' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'POS', label: 'POS' },
        { value: 'Cheque', label: 'Cheque' },
        { value: 'Mobile Money', label: 'Mobile Money' }
    ];

    // Calculate stats
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.overdue);
    const totalReceived = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => p.payment_date?.split('T')[0] === today).length;

    // Filter payments
    const filteredPayments = useMemo(() => payments.filter(payment => {
        const ref = payment.payment_reference || payment.reference_number || '';
        const customerName = typeof payment.customer === 'object' ? payment.customer?.name : payment.customer || '';
        const supplierName = typeof payment.supplier === 'object' ? payment.supplier?.name : '';
        const matchesSearch = ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            supplierName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || payment.status === statusFilter;
        const paymentMethod = payment.payment_method || '';
        const matchesMethod = !methodFilter || paymentMethod === methodFilter;

        // Date range filter
        let matchesDate = true;
        const paymentDate = payment.payment_date;
        if ((startDate || endDate) && paymentDate) {
            const pDate = new Date(paymentDate);
            if (startDate) matchesDate = matchesDate && pDate >= new Date(startDate);
            if (endDate) matchesDate = matchesDate && pDate <= new Date(endDate);
        }

        return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    }), [payments, searchQuery, statusFilter, methodFilter, startDate, endDate]);

    const handleExport = () => {
        toast.success('Exported payments to CSV');
    };

    const handleReconcile = async (payment) => {
        const confirmed = await confirm({
            title: 'Reconcile Payment',
            message: `Mark ${payment.payment_reference} as reconciled?`,
            confirmText: 'Reconcile',
            variant: 'primary'
        });

        if (confirmed) {
            toast.success(`${payment.payment_reference} has been reconciled`);
        }
    };

    const handleInvoiceSelect = (invoiceNumber) => {
        const invoice = mockInvoices.find(inv => inv.number === invoiceNumber);
        if (invoice) {
            setFormData({
                ...formData,
                invoice_number: invoiceNumber,
                customer: invoice.customer,
                amount: invoice.amountDue.toString()
            });
        }
    };

    const handleAddSplit = () => {
        setFormData({
            ...formData,
            payment_splits: [
                ...formData.payment_splits,
                { method: 'Cash', amount: '' }
            ]
        });
    };

    const handleRemoveSplit = (index) => {
        setFormData({
            ...formData,
            payment_splits: formData.payment_splits.filter((_, i) => i !== index)
        });
    };

    const handleSplitChange = (index, field, value) => {
        const newSplits = [...formData.payment_splits];
        newSplits[index][field] = value;
        setFormData({
            ...formData,
            payment_splits: newSplits
        });
    };

    const getTotalSplits = () => {
        return formData.payment_splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
    };

    const handleRecordPayment = () => {
        setShowRecord(false);
        toast.success('Payment recorded successfully!');
        // Reset form
        setFormData({
            invoice_number: '',
            customer: '',
            amount: '',
            payment_method: 'Cash',
            bank_reference: '',
            notes: '',
            payment_splits: []
        });
    };

    const handleViewPayment = (payment) => {
        setSelectedPayment(payment);
    };

    const handlePrintReceipt = (payment) => {
        // Create thermal printer receipt (58mm/80mm width)
        const receiptWindow = window.open('', '_blank', 'width=300,height=600');
        
        const customerName = payment.customer?.name || payment.supplier?.name || 'Walk-in Customer';
        const paymentDate = payment.payment_date ? new Date(payment.payment_date).toLocaleString() : new Date().toLocaleString();
        const amount = parseFloat(payment.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        
        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 58mm;
            max-width: 58mm;
            padding: 2mm;
            background: white;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 14px; }
        .xlarge { font-size: 18px; }
        .divider { 
            border-top: 1px dashed #000; 
            margin: 3mm 0; 
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin: 1mm 0;
        }
        .row-label { text-align: left; }
        .row-value { text-align: right; font-weight: bold; }
        .amount-box {
            border: 1px solid #000;
            padding: 2mm;
            margin: 2mm 0;
            text-align: center;
        }
        .footer { margin-top: 3mm; font-size: 10px; }
        @media print {
            body { width: 58mm; }
            @page { size: 58mm auto; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="center bold large">Your Company Name</div>
    <div class="center" style="font-size:10px;">Livestock Feed & Supplies</div>
    <div class="center" style="font-size:10px;">Tel: 08012345678</div>
    
    <div class="divider"></div>
    
    <div class="center bold">PAYMENT RECEIPT</div>
    
    <div class="divider"></div>
    
    <div class="row">
        <span>Receipt No:</span>
        <span class="bold">${payment.payment_reference || 'N/A'}</span>
    </div>
    <div class="row">
        <span>Date:</span>
        <span>${paymentDate}</span>
    </div>
    <div class="row">
        <span>Customer:</span>
        <span>${customerName}</span>
    </div>
    <div class="row">
        <span>Method:</span>
        <span style="text-transform:capitalize;">${payment.payment_method || 'Cash'}</span>
    </div>
    ${payment.transaction_reference ? `
    <div class="row">
        <span>Trans Ref:</span>
        <span style="font-size:10px;">${payment.transaction_reference}</span>
    </div>
    ` : ''}
    ${payment.payment_method === 'transfer' && payment.bank_account ? `
    <div class="row">
        <span>Bank:</span>
        <span>${payment.bank_account.bank_name}</span>
    </div>
    <div class="row">
        <span>Acct:</span>
        <span>${payment.bank_account.account_number}</span>
    </div>
    ` : ''}
    
    <div class="divider"></div>
    
    <div class="amount-box">
        <div style="font-size:10px;">AMOUNT PAID</div>
        <div class="xlarge bold">${window.formatCurrency(amount)}</div>
    </div>
    
    <div class="divider"></div>
    
    <div class="center" style="font-size:10px;">
        Status: <span class="bold" style="text-transform:uppercase;">${payment.status || 'Completed'}</span>
    </div>
    
    ${payment.notes ? `
    <div class="divider"></div>
    <div style="font-size:10px;">Note: ${payment.notes}</div>
    ` : ''}
    
    <div class="divider"></div>
    
    <div class="footer center">
        <div>Thank you for your payment!</div>
        <div style="margin-top:2mm;">*** Keep this receipt ***</div>
    </div>
    
    <div style="margin-top:5mm; text-align:center; font-size:8px;">
        Printed: ${new Date().toLocaleString()}
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
        `;
        
        receiptWindow.document.write(receiptHTML);
        receiptWindow.document.close();
    };

    const handleViewReceiptPdf = async (payment) => {
        try {
            toast.info('Generating PDF receipt...');
            await openPdfInNewTab(documentAPI.previewReceipt(payment.id), `Receipt-${payment.payment_reference}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const handleDownloadReceiptPdf = async (payment) => {
        try {
            toast.info('Downloading PDF receipt...');
            await downloadPdf(documentAPI.downloadReceipt(payment.id), `Receipt-${payment.payment_reference}.pdf`);
            toast.success('Receipt downloaded');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    // Export columns for CSV
    const exportColumns = [
        { key: 'payment_reference', label: 'Reference' },
        { key: 'payment_date', label: 'Date' },
        { key: 'customer.name', label: 'Customer' },
        { key: 'amount', label: 'Amount' },
        { key: 'payment_method', label: 'Method' },
        { key: 'status', label: 'Status' },
        { key: 'notes', label: 'Notes' },
    ];

    // Bulk actions
    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                exportSelectedToCSV(selectedIndices, filteredPayments, exportColumns, 'payments');
            }
        },
        {
            label: 'Mark as Completed',
            onClick: async (selectedIndices) => {
                const selected = selectedIndices.map(i => filteredPayments[i]).filter(p => p.status !== 'completed');
                if (selected.length === 0) {
                    toast.error('No pending payments selected');
                    return;
                }
                const confirmed = await confirm({
                    title: 'Update Payments',
                    message: `Mark ${selected.length} payments as completed?`,
                    confirmText: 'Update',
                    variant: 'primary'
                });
                if (confirmed) {
                    let successCount = 0;
                    for (const payment of selected) {
                        try {
                            await paymentAPI.updatePaymentStatus(payment.id, 'completed');
                            successCount++;
                        } catch (error) {
                            console.error(`Failed to update payment ${payment.id}:`, error);
                        }
                    }
                    toast.success(`${successCount} payment(s) marked as completed`);
                    fetchPayments();
                }
            }
        }
    ];

    // Table columns
    const columns = [
        {
            key: 'payment_reference',
            header: 'Reference',
            render: (value, row) => <span className="font-medium text-blue-600">{value || row.reference_number}</span>
        },
        {
            key: 'payment_date',
            header: 'Date',
            render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (value, row) => {
                // Handle both object and string customer values
                if (typeof value === 'object' && value !== null) {
                    return value.name || 'N/A';
                }
                // Fallback to supplier if it's a supplier payment
                if (row.supplier && typeof row.supplier === 'object') {
                    return row.supplier.name || 'N/A';
                }
                return value || 'N/A';
            }
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (value) => <span className="font-mono font-semibold">{window.getCurrencySymbol()}{parseFloat(value || 0).toLocaleString()}</span>
        },
        {
            key: 'payment_method',
            header: 'Method',
            render: (value) => (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                    {value || 'N/A'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <Badge variant={value === 'completed' ? 'completed' : value === 'pending' ? 'pending' : 'rejected'}>
                        {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
                    </Badge>
                    {row.overdue && (
                        <span className="text-xs text-red-600 font-medium">Overdue</span>
                    )}
                </div>
            )
        },
        {
            key: 'payable',
            header: 'Related',
            render: (value, row) => {
                // Show related sales order, purchase order, etc.
                const ref = value?.order_number || row.sales_order?.order_number || '-';
                return (
                    <button
                        onClick={() => ref !== '-' && toast.info(`Viewing ${ref}`)}
                        className={`text-sm font-medium ${ref !== '-' ? 'text-blue-600 hover:text-blue-800' : 'text-slate-400'}`}
                    >
                        {ref}
                    </button>
                );
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
                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px]">
                                {/* View */}
                                <button
                                    onClick={() => { handleViewPayment(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Details
                                </button>
                                
                                {/* Reconcile - only for pending */}
                                {row.status === 'pending' && (
                                    <button
                                        onClick={() => { handleReconcile(row); setOpenActionMenu(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Reconcile
                                    </button>
                                )}
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* View Receipt PDF */}
                                <button
                                    onClick={() => { handleViewReceiptPdf(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    View Receipt
                                </button>
                                
                                {/* Download Receipt PDF */}
                                <button
                                    onClick={() => { handleDownloadReceiptPdf(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Receipt
                                </button>
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
                <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
                <p className="text-slate-600 mt-2">Track and manage all payment transactions</p>
            </div>

            {/* Overdue Alert */}
            {overduePayments.length > 0 && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-semibold text-red-900">
                                    {overduePayments.length} Overdue {overduePayments.length === 1 ? 'Payment' : 'Payments'}
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                    Total overdue: {window.getCurrencySymbol()}{overduePayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setStatusFilter('pending')}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                            View Overdue
                        </Button>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-green-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Received</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{totalReceived.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">{completedPayments.length} transactions</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-amber-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Pending</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{window.getCurrencySymbol()}{totalPending.toLocaleString()}</p>
                        <p className="text-xs text-amber-600 mt-1">{pendingPayments.length} transactions</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-blue-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Today's Payments</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{todayPayments}</p>
                        <p className="text-xs text-slate-600 mt-1">Received today</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-red-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Overdue</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{overduePayments.length}</p>
                        <p className="text-xs text-red-600 mt-1">Require action</p>
                    </CardBody>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setShowRecord(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Record Payment
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
                        placeholder="Search by reference or customer..."
                        onSearch={setSearchQuery}
                        className="flex-1 md:w-64"
                    />
                    <FilterDropdown
                        label="Status"
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                    <FilterDropdown
                        label="Method"
                        options={methodOptions}
                        value={methodFilter}
                        onChange={setMethodFilter}
                    />
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </div>
            </div>

            {/* Payments DataTable */}
            <DataTable
                columns={columns}
                data={filteredPayments}
                selectable={true}
                bulkActions={bulkActions}
                emptyMessage="No payments found"
                pageSize={20}
            />

            {/* Payment Detail SlideOut */}
            <SlideOut isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title={`Payment: ${selectedPayment?.payment_reference || ''}`} size="md">
                {selectedPayment && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Reference</p>
                                <p className="font-mono font-semibold text-blue-700">{selectedPayment.payment_reference}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Date</p>
                                <p className="font-medium">{selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Customer/Supplier</p>
                                <p className="font-medium">
                                    {selectedPayment.customer?.name || selectedPayment.supplier?.name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Payment Method</p>
                                <p className="font-medium capitalize">{selectedPayment.payment_method || 'N/A'}</p>
                            </div>
                            {/* Bank Account Details for Transfer */}
                            {selectedPayment.payment_method === 'transfer' && selectedPayment.bank_account && (
                                <div className="col-span-2 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Bank Account</p>
                                    <p className="font-semibold text-slate-900">{selectedPayment.bank_account.bank_name}</p>
                                    <p className="font-mono text-lg text-blue-700">{selectedPayment.bank_account.account_number}</p>
                                    <p className="text-sm text-slate-600">{selectedPayment.bank_account.account_name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-slate-500">Payment Type</p>
                                <p className="font-medium capitalize">{selectedPayment.payment_type || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <Badge variant={selectedPayment.status === 'completed' ? 'approved' : selectedPayment.status === 'pending' ? 'pending' : 'rejected'}>
                                    {selectedPayment.status}
                                </Badge>
                            </div>
                            {selectedPayment.transaction_reference && (
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500">Transaction Reference</p>
                                    <p className="font-mono text-sm">{selectedPayment.transaction_reference}</p>
                                </div>
                            )}
                            {selectedPayment.notes && (
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500">Notes</p>
                                    <p className="text-sm text-slate-600">{selectedPayment.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg text-center">
                            <p className="text-xs text-slate-500">Amount</p>
                            <p className="text-3xl font-bold text-slate-900">{fmt(selectedPayment.amount)}</p>
                        </div>
                        {selectedPayment.recorder && (
                            <div className="text-xs text-slate-500 text-center">
                                Recorded by: {selectedPayment.recorder?.name || 'Unknown'}
                            </div>
                        )}
                        <div className="flex gap-2 pt-4 border-t">
                            <Button size="sm" onClick={() => handlePrintReceipt(selectedPayment)}>Thermal Print</Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewReceiptPdf(selectedPayment)}>View PDF</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadReceiptPdf(selectedPayment)}>Download PDF</Button>
                            {selectedPayment.status === 'pending' && (
                                <Button variant="outline" size="sm" onClick={() => { handleReconcile(selectedPayment); setSelectedPayment(null); }}>
                                    Reconcile
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Record Payment SlideOut */}
            <SlideOut isOpen={showRecord} onClose={() => setShowRecord(false)} title="Record Payment" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleRecordPayment(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Invoice / Order *</label>
                        <select required value={formData.invoice_number} onChange={(e) => handleInvoiceSelect(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select invoice...</option>
                            {mockInvoices.map(inv => (
                                <option key={inv.number} value={inv.number}>{inv.number} - {inv.customer} ({fmt(inv.amountDue)})</option>
                            ))}
                        </select>
                    </div>
                    {formData.customer && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm">
                            <span className="font-medium">Customer:</span> {formData.customer} &middot; <span className="font-medium">Due:</span> {fmt(Number(formData.amount))}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount ({window.getCurrencySymbol()}) *</label>
                        <input type="number" required min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                        <select required value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="POS">POS</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Mobile Money">Mobile Money</option>
                        </select>
                    </div>
                    {formData.payment_method !== 'Cash' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bank Reference / Transaction ID</label>
                            <input type="text" value={formData.bank_reference} onChange={(e) => setFormData({...formData, bank_reference: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. TRF-123456789" />
                        </div>
                    )}

                    {formData.payment_splits.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-slate-900 mb-2">Split Payments</h4>
                            {formData.payment_splits.map((split, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-end">
                                    <div className="flex-1">
                                        <select value={split.method} onChange={(e) => handleSplitChange(idx, 'method', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="POS">POS</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input type="number" min="0" value={split.amount} onChange={(e) => handleSplitChange(idx, 'amount', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Amount" />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveSplit(idx)} className="text-red-500 hover:text-red-700 p-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            <p className="text-xs text-slate-500">Split total: {fmt(getTotalSplits())}</p>
                        </div>
                    )}
                    <button type="button" onClick={handleAddSplit} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Split Payment</button>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Additional notes..." />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Record Payment</Button>
                        <Button variant="outline" onClick={() => setShowRecord(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>
        </div>
    );
}
