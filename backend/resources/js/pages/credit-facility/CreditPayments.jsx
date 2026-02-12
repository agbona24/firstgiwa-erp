import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import customerAPI, { creditAnalyticsAPI } from '../../services/customerAPI';
import { bankAccountsAPI } from '../../services/settingsAPI';

export default function CreditPayments() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerTransactions, setCustomerTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_method: 'cash',
        bank_account_id: '',
        reference: '',
        notes: '',
        transaction_ids: []
    });
    const [saving, setSaving] = useState(false);
    const [recentPayments, setRecentPayments] = useState([]);
    
    const toast = useToast();
    const confirm = useConfirm();

    const fmt = (n) => window.formatCurrency(parseFloat(n || 0), { minimumFractionDigits: 2 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [customersRes, banksRes] = await Promise.all([
                customerAPI.getCustomers({ per_page: 100 }),
                bankAccountsAPI.list()
            ]);
            
            console.log('Bank accounts full response:', banksRes);
            
            // Filter customers with outstanding balance
            const allCustomers = customersRes.data || [];
            const creditCustomers = allCustomers.filter(c => 
                parseFloat(c.outstanding_balance) > 0 || parseFloat(c.credit_limit) > 0
            );
            setCustomers(creditCustomers);
            
            // banksRes is axios response, .data is API response { success, data: { bank_accounts } }
            const banks = banksRes.data?.data?.bank_accounts || banksRes.data?.bank_accounts || [];
            console.log('Parsed bank accounts:', banks);
            setBankAccounts(banks);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setPaymentData({
            amount: '',
            payment_method: 'cash',
            bank_account_id: '',
            reference: '',
            notes: '',
            transaction_ids: []
        });
        setLoadingTransactions(true);
        
        try {
            const analytics = await customerAPI.getCreditAnalytics(customer.id);
            // Get pending/partial transactions
            const pendingTxns = (analytics.data?.recent_transactions || []).filter(
                t => ['pending', 'partial', 'overdue'].includes(t.status)
            );
            setCustomerTransactions(pendingTxns);
        } catch (error) {
            console.error('Error loading transactions:', error);
            setCustomerTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
        
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async () => {
        if (!selectedCustomer) return;
        
        const amount = parseFloat(paymentData.amount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        if (amount > parseFloat(selectedCustomer.outstanding_balance)) {
            toast.error('Payment amount exceeds outstanding balance');
            return;
        }

        if (paymentData.payment_method === 'transfer' && !paymentData.bank_account_id) {
            toast.error('Please select a bank account for transfer');
            return;
        }

        setSaving(true);
        try {
            const response = await creditAnalyticsAPI.recordCustomerPayment({
                customer_id: selectedCustomer.id,
                amount: amount,
                payment_method: paymentData.payment_method,
                bank_account_id: paymentData.bank_account_id || null,
                reference: paymentData.reference,
                notes: paymentData.notes,
                transaction_ids: paymentData.transaction_ids
            });

            if (response.success) {
                toast.success(`Payment of ${fmt(amount)} recorded for ${selectedCustomer.name}`);
                setShowPaymentModal(false);
                setSelectedCustomer(null);
                fetchData(); // Refresh customer list
            } else {
                toast.error(response.message || 'Failed to record payment');
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    const toggleTransaction = (txnId) => {
        const currentIds = [...paymentData.transaction_ids];
        const index = currentIds.indexOf(txnId);
        if (index > -1) {
            currentIds.splice(index, 1);
        } else {
            currentIds.push(txnId);
        }
        setPaymentData({ ...paymentData, transaction_ids: currentIds });
    };

    // Filter customers based on search
    const filteredCustomers = customers.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.customer_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Summary stats
    const totalOutstanding = customers.reduce((sum, c) => sum + parseFloat(c.outstanding_balance || 0), 0);
    const customersWithDebt = customers.filter(c => parseFloat(c.outstanding_balance) > 0).length;

    const columns = [
        {
            key: 'name',
            header: 'Customer',
            render: (value, row) => (
                <div>
                    <p className="font-medium text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{row.customer_code} • {row.phone}</p>
                </div>
            )
        },
        {
            key: 'credit_limit',
            header: 'Credit Limit',
            render: (value) => fmt(value)
        },
        {
            key: 'outstanding_balance',
            header: 'Outstanding',
            render: (value) => (
                <span className={parseFloat(value) > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {fmt(value)}
                </span>
            )
        },
        {
            key: 'available',
            header: 'Available',
            render: (_, row) => {
                const available = parseFloat(row.credit_limit || 0) - parseFloat(row.outstanding_balance || 0);
                return <span className="text-green-600">{fmt(available)}</span>;
            }
        },
        {
            key: 'payment_terms_days',
            header: 'Terms',
            render: (value) => `${value || 30} days`
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleSelectCustomer(row)}
                        disabled={parseFloat(row.outstanding_balance) <= 0}
                    >
                        Record Payment
                    </Button>
                </div>
            )
        }
    ];

    const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
    const labelClass = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Credit Payments</h1>
                    <p className="text-slate-500 mt-1">Record payments from customers against their credit balance</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="p-4">
                        <p className="text-sm text-slate-500">Total Outstanding</p>
                        <p className="text-2xl font-bold text-red-600">{fmt(totalOutstanding)}</p>
                        <p className="text-xs text-slate-400 mt-1">Across all customers</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <p className="text-sm text-slate-500">Customers with Balance</p>
                        <p className="text-2xl font-bold text-slate-900">{customersWithDebt}</p>
                        <p className="text-xs text-slate-400 mt-1">Requiring payment</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <p className="text-sm text-slate-500">Avg Outstanding</p>
                        <p className="text-2xl font-bold text-amber-600">
                            {fmt(customersWithDebt > 0 ? totalOutstanding / customersWithDebt : 0)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Per customer</p>
                    </CardBody>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardBody className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <SearchBar
                                placeholder="Search by customer name, code or phone..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Customer Table */}
            <Card>
                <CardBody className="p-0">
                    <DataTable
                        columns={columns}
                        data={filteredCustomers}
                        loading={loading}
                        emptyMessage="No customers with credit facility found"
                    />
                </CardBody>
            </Card>

            {/* Payment Modal */}
            <Modal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)}
                title={`Record Payment - ${selectedCustomer?.name || ''}`}
                size="lg"
            >
                {selectedCustomer && (
                    <div className="space-y-4">
                        {/* Customer Info */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-slate-500">Outstanding Balance</p>
                                    <p className="text-xl font-bold text-red-600">
                                        {fmt(selectedCustomer.outstanding_balance)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Credit Limit</p>
                                    <p className="text-xl font-bold text-slate-900">
                                        {fmt(selectedCustomer.credit_limit)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Available After Payment</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {fmt(parseFloat(selectedCustomer.credit_limit) - parseFloat(selectedCustomer.outstanding_balance) + parseFloat(paymentData.amount || 0))}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Outstanding Transactions */}
                        {loadingTransactions ? (
                            <div className="text-center py-4 text-slate-500">Loading transactions...</div>
                        ) : customerTransactions.length > 0 && (
                            <div>
                                <label className={labelClass}>Apply to Transactions (optional)</label>
                                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                                    {customerTransactions.map((txn) => (
                                        <label
                                            key={txn.id}
                                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${
                                                paymentData.transaction_ids.includes(txn.id) ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={paymentData.transaction_ids.includes(txn.id)}
                                                onChange={() => toggleTransaction(txn.id)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{txn.reference_number}</p>
                                                <p className="text-xs text-slate-500">
                                                    Due: {new Date(txn.due_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-sm">{fmt(txn.balance_remaining)}</p>
                                                <Badge variant={txn.status === 'overdue' ? 'rejected' : 'pending'}>
                                                    {txn.status}
                                                </Badge>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Amount */}
                        <div>
                            <label className={labelClass}>Payment Amount *</label>
                            <input
                                type="number"
                                min="0"
                                max={selectedCustomer.outstanding_balance}
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                placeholder="Enter payment amount"
                                className={inputClass}
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentData({ ...paymentData, amount: selectedCustomer.outstanding_balance })}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Pay Full Balance
                                </button>
                                {paymentData.transaction_ids.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const selectedTotal = customerTransactions
                                                .filter(t => paymentData.transaction_ids.includes(t.id))
                                                .reduce((sum, t) => sum + parseFloat(t.balance_remaining), 0);
                                            setPaymentData({ ...paymentData, amount: selectedTotal.toString() });
                                        }}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Pay Selected ({fmt(customerTransactions
                                            .filter(t => paymentData.transaction_ids.includes(t.id))
                                            .reduce((sum, t) => sum + parseFloat(t.balance_remaining), 0))})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className={labelClass}>Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['cash', 'transfer', 'pos'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentData({ ...paymentData, payment_method: method })}
                                        className={`px-3 py-2 rounded-lg font-medium capitalize text-sm ${
                                            paymentData.payment_method === method
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {method === 'pos' ? 'POS/Card' : method === 'transfer' ? 'Transfer' : 'Cash'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bank Account for Transfer */}
                        {paymentData.payment_method === 'transfer' && (
                            <div>
                                <label className={labelClass}>Bank Account</label>
                                <select
                                    value={paymentData.bank_account_id}
                                    onChange={(e) => setPaymentData({ ...paymentData, bank_account_id: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Select bank account</option>
                                    {bankAccounts.length > 0 ? bankAccounts.map(bank => (
                                        <option key={bank.id} value={bank.id}>
                                            {bank.bank_name} - {bank.account_name} ({bank.account_number})
                                        </option>
                                    )) : <option disabled>No bank accounts available</option>}
                                </select>
                            </div>
                        )}

                        {/* Reference */}
                        <div>
                            <label className={labelClass}>Reference / Receipt No.</label>
                            <input
                                type="text"
                                value={paymentData.reference}
                                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                placeholder="e.g., Receipt #12345"
                                className={inputClass}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={labelClass}>Notes</label>
                            <textarea
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                placeholder="Optional notes about this payment"
                                rows={2}
                                className={inputClass}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setShowPaymentModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleRecordPayment} 
                                className="flex-1"
                                disabled={saving || !paymentData.amount}
                            >
                                {saving ? 'Recording...' : `Record Payment ${paymentData.amount ? fmt(paymentData.amount) : ''}`}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
