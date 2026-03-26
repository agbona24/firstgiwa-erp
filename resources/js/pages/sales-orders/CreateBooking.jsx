import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { bankAccountsAPI, taxesAPI, saleChargesAPI } from '../../services/settingsAPI';
import customerAPI from '../../services/customerAPI';
import formulaAPI from '../../services/formulaAPI';
import salesOrderAPI from '../../services/salesOrderAPI';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const STEPS = [
    { label: 'Customer & Order Type' },
    { label: 'Items' },
    { label: 'Review & Submit' },
];

export default function CreateBooking() {
    const navigate = useNavigate();
    const toast = useToast();

    const [step, setStep] = useState(0);
    const [customerId, setCustomerId] = useState('');
    const [orderType, setOrderType] = useState('direct');
    const [paymentType, setPaymentType] = useState('cash');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [formulaId, setFormulaId] = useState('');
    const [totalQty, setTotalQty] = useState('');
    const [directItems, setDirectItems] = useState([{ product: '', quantity: '', unit: 'KG', unit_price: '' }]);
    const [fdoOfficer, setFdoOfficer] = useState('');
    const [serviceCharges, setServiceCharges] = useState([]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Data from API
    const [customers, setCustomers] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [availableCharges, setAvailableCharges] = useState([]);
    const [selectedDeliveryCharges, setSelectedDeliveryCharges] = useState([]); // from Settings
    const [loadingData, setLoadingData] = useState(true);

    // Fetch customers, bank accounts, taxes, and formulas on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                const [customersRes, bankAccountsRes, taxesRes, formulasRes, chargesRes] = await Promise.all([
                    customerAPI.getCustomers({ per_page: 1000 }).catch(() => ({ data: [] })),
                    bankAccountsAPI.list().catch(() => ({ data: { bank_accounts: [] } })),
                    taxesAPI.list().catch(() => ({ data: { taxes: [] } })),
                    formulaAPI.getFormulas({ per_page: 100, is_active: true }).catch(() => ({ data: [] })),
                    saleChargesAPI.list({ context: 'sales_order', active_only: true }).catch(() => ({ data: { data: { charges: [] } } })),
                ]);
                
                console.log('Customers response:', customersRes);
                const customersList = Array.isArray(customersRes) ? customersRes : customersRes?.data || [];
                setCustomers(customersList);
                
                console.log('Bank accounts response:', bankAccountsRes);
                // API returns axios response: { data: { success, data: { bank_accounts: [...] } } }
                const bankAccountsList = bankAccountsRes?.data?.data?.bank_accounts || bankAccountsRes?.data?.bank_accounts || [];
                setBankAccounts(bankAccountsList);
                
                const taxesList = taxesRes?.data?.data?.taxes || taxesRes?.data?.taxes || [];
                setTaxes(taxesList.filter(t => t.is_active));

                const chargesList = chargesRes?.data?.data?.charges || [];
                setAvailableCharges(Array.isArray(chargesList) ? chargesList : []);
                
                console.log('Formulas response:', formulasRes);
                const formulasList = Array.isArray(formulasRes) ? formulasRes : formulasRes?.data || [];
                setFormulas(formulasList);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const selectedCustomer = useMemo(() => customers.find(c => c.id === Number(customerId)), [customerId, customers]);
    const selectedFormula = useMemo(() => formulas.find(f => f.id === Number(formulaId)), [formulaId, formulas]);
    const selectedBankAccount = useMemo(() => bankAccounts.find(b => b.id === Number(selectedBankAccountId)), [selectedBankAccountId, bankAccounts]);

    const creditAvailable = selectedCustomer ? (selectedCustomer.credit_limit || 0) - (selectedCustomer.credit_used || 0) : 0;
    const creditUtilization = selectedCustomer && selectedCustomer.credit_limit > 0
        ? ((selectedCustomer.credit_used || 0) / selectedCustomer.credit_limit) * 100
        : 0;
    const walletBalance = parseFloat(selectedCustomer?.wallet_balance) || 0;

    const canSelectCredit = selectedCustomer && ['credit', 'both'].includes(selectedCustomer.customer_type) && !selectedCustomer.credit_blocked;

    // Compute line items from formula
    const formulaLineItems = useMemo(() => {
        if (orderType !== 'formula' || !selectedFormula || !totalQty || Number(totalQty) <= 0) return [];
        const qty = Number(totalQty);
        const items = selectedFormula.items || [];
        return items.map(item => {
            const itemQty = (parseFloat(item.percentage) / 100) * qty;
            const unitPrice = parseFloat(item.product?.selling_price || item.unit_price || 0);
            return {
                product: item.product?.name || item.product || 'Unknown Product',
                percentage: parseFloat(item.percentage),
                quantity: itemQty,
                unit: item.product?.unit?.abbreviation || 'KG',
                unit_price: unitPrice,
                line_total: itemQty * unitPrice,
            };
        });
    }, [orderType, selectedFormula, totalQty]);

    // Compute direct line items
    const directLineItems = useMemo(() => {
        if (orderType !== 'direct') return [];
        return directItems.filter(i => i.product && Number(i.quantity) > 0 && Number(i.unit_price) > 0).map(i => ({
            product: i.product,
            quantity: Number(i.quantity),
            unit: i.unit,
            unit_price: Number(i.unit_price),
            line_total: Number(i.quantity) * Number(i.unit_price),
        }));
    }, [orderType, directItems]);

    const lineItems = orderType === 'formula' ? formulaLineItems : directLineItems;

    const subtotal = useMemo(() => lineItems.reduce((sum, i) => sum + i.line_total, 0), [lineItems]);
    const serviceChargesTotal = useMemo(() => serviceCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0), [serviceCharges]);
    const deliveryChargesTotal = useMemo(() => selectedDeliveryCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0), [selectedDeliveryCharges]);

    // Calculate tax from settings
    const taxDetails = useMemo(() => {
        const activeTaxes = taxes.filter(t => t.is_active);
        let totalTax = 0;
        const breakdown = activeTaxes.map(tax => {
            const taxAmount = subtotal * (parseFloat(tax.rate) / 100);
            totalTax += taxAmount;
            return { name: tax.name, rate: parseFloat(tax.rate), amount: taxAmount };
        });
        return { breakdown, total: totalTax };
    }, [subtotal, taxes]);

    const grandTotal = subtotal + serviceChargesTotal + deliveryChargesTotal + taxDetails.total;

    const exceedsCredit = paymentType === 'credit' && selectedCustomer && grandTotal > creditAvailable;

    function addServiceCharge() {
        setServiceCharges([...serviceCharges, { name: '', quantity: '', amount: '' }]);
    }
    function removeServiceCharge(idx) {
        setServiceCharges(serviceCharges.filter((_, i) => i !== idx));
    }
    function updateServiceCharge(idx, field, value) {
        setServiceCharges(serviceCharges.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    }

    // Step validation - require bank account selection when bank_transfer is chosen
    const canProceedStep0 = selectedCustomer && 
        (paymentType !== 'credit' || canSelectCredit) &&
        (paymentType !== 'bank_transfer' || selectedBankAccountId) &&
        (paymentType !== 'wallet' || walletBalance > 0);
    const canProceedStep1 = lineItems.length > 0;

    function addDirectItem() {
        setDirectItems([...directItems, { product: '', quantity: '', unit: 'KG', unit_price: '' }]);
    }

    function removeDirectItem(idx) {
        setDirectItems(directItems.filter((_, i) => i !== idx));
    }

    function updateDirectItem(idx, field, value) {
        setDirectItems(directItems.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    }

    async function handleSubmit() {
        setSubmitting(true);
        try {
            // Build payload based on order type
            const payload = {
                customer_id: parseInt(customerId),
                payment_type: paymentType,
                order_date: new Date().toISOString().split('T')[0],
                notes: notes || null,
            };

            // Add bank account if bank transfer
            if (paymentType === 'bank_transfer' && selectedBankAccountId) {
                payload.bank_account_id = parseInt(selectedBankAccountId);
            }

            if (orderType === 'formula' && formulaId) {
                // Formula-based order
                payload.formula_id = parseInt(formulaId);
                payload.total_quantity = parseFloat(totalQty);
            } else {
                // Direct order - send line items
                payload.items = directLineItems.map(item => ({
                    product_id: item.product_id || null,
                    product_name: item.product, // For custom products
                    quantity: parseFloat(item.quantity),
                    unit_price: parseFloat(item.unit_price),
                }));
            }

            // Service charges (CRUSHING, PELLETING, etc.)
            if (serviceCharges.length > 0) {
                payload.service_charges = serviceCharges
                    .filter(c => c.name && Number(c.amount) > 0)
                    .map(c => ({
                        name: c.name,
                        quantity: parseFloat(c.quantity) || 0,
                        amount: parseFloat(c.amount),
                    }));
            }

            // Delivery charges from Settings
            if (selectedDeliveryCharges.length > 0) {
                payload.charges = selectedDeliveryCharges.map(c => ({
                    sale_charge_id: c.id,
                    charge_name: c.name,
                    charge_amount: parseFloat(c.amount) || 0,
                    add_to_credit: !!c.add_to_credit,
                }));
            }

            if (fdoOfficer) payload.fdo_officer = fdoOfficer;

            console.log('Submitting sales order:', payload);
            const response = await salesOrderAPI.createSalesOrder(payload);
            
            const orderNum = response.data?.order_number || response.order_number || 'New Order';
            toast.success(`Sales order ${orderNum} created successfully`);
            navigate('/sales-orders');
        } catch (error) {
            console.error('Error creating sales order:', error);
            const message = error.response?.data?.message || 'Failed to create sales order';
            const errors = error.response?.data?.errors;
            
            if (errors) {
                const firstError = Object.values(errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : message);
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    }

    // --- Render helpers ---

    function renderProgressBar() {
        return (
            <div className="flex items-center gap-2 mb-8">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1">
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                            ${i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-700 text-white ring-4 ring-blue-200' : 'bg-slate-200 text-slate-500'}
                        `}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-sm font-medium hidden sm:inline ${i <= step ? 'text-slate-900' : 'text-slate-400'}`}>
                            {s.label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 ${i < step ? 'bg-blue-500' : 'bg-slate-200'}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    function renderStep0() {
        return (
            <Card>
                <CardBody>
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Customer & Order Type</h2>

                    {/* Customer dropdown */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Customer</label>
                        {loadingData ? (
                            <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-400">
                                Loading customers...
                            </div>
                        ) : (
                            <select
                                value={customerId}
                                onChange={(e) => { setCustomerId(e.target.value); setPaymentType('cash'); setSelectedBankAccountId(''); }}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">-- Select Customer --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Credit info */}
                    {selectedCustomer && (selectedCustomer.credit_limit || 0) > 0 && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-700">Credit Facility</span>
                                {selectedCustomer.credit_blocked && (
                                    <Badge variant="danger">Blocked</Badge>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                <div>
                                    <span className="text-slate-500">Limit</span>
                                    <p className="font-bold text-slate-900">{fmt(selectedCustomer.credit_limit || 0)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Used</span>
                                    <p className="font-bold text-slate-900">{fmt(selectedCustomer.credit_used || 0)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Available</span>
                                    <p className={`font-bold ${creditAvailable > 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(creditAvailable)}</p>
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${creditUtilization >= 90 ? 'bg-red-500' : creditUtilization >= 70 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{creditUtilization.toFixed(1)}% utilised</p>
                        </div>
                    )}

                    {/* FDO Officer */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">F.D.O (Field Dispatch Officer)</label>
                        <input
                            type="text"
                            value={fdoOfficer}
                            onChange={(e) => setFdoOfficer(e.target.value)}
                            placeholder="Officer name (optional)"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Order type */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Order Type</label>
                        <div className="flex gap-4">
                            {[{ value: 'direct', label: 'Direct (add items manually)' }, { value: 'formula', label: 'Formula-Based (select formula)' }].map(opt => (
                                <label key={opt.value} className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all flex-1
                                    ${orderType === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <input
                                        type="radio"
                                        name="orderType"
                                        value={opt.value}
                                        checked={orderType === opt.value}
                                        onChange={(e) => setOrderType(e.target.value)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                        {/* Order type preview hint */}
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600">
                                {orderType === 'direct' ? (
                                    <>📝 <span className="font-medium">Direct Order:</span> In the next step, you'll manually add products with quantities and prices.</>
                                ) : (
                                    <>📋 <span className="font-medium">Formula-Based:</span> In the next step, you'll select a formula and enter total quantity. Items will be calculated automatically.</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Payment type */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { value: 'cash', label: 'Cash' },
                                { value: 'credit', label: 'Credit' },
                                { value: 'bank_transfer', label: 'Bank Transfer' },
                                { value: 'wallet', label: 'Wallet' },
                            ].map(opt => {
                                const disabled = (opt.value === 'credit' && !canSelectCredit) ||
                                    (opt.value === 'wallet' && walletBalance <= 0);
                                return (
                                    <label key={opt.value} className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                                        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : paymentType === opt.value ? 'border-blue-600 bg-blue-50 cursor-pointer' : 'border-slate-200 hover:border-slate-300 cursor-pointer'}`}>
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value={opt.value}
                                            checked={paymentType === opt.value}
                                            onChange={(e) => {
                                                setPaymentType(e.target.value);
                                                if (e.target.value !== 'bank_transfer') {
                                                    setSelectedBankAccountId('');
                                                }
                                            }}
                                            disabled={disabled}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                                        {opt.value === 'credit' && disabled && selectedCustomer && (
                                            <span className="text-xs text-slate-400 ml-1">
                                                ({selectedCustomer.credit_blocked ? 'blocked' : 'cash-only'})
                                            </span>
                                        )}
                                        {opt.value === 'wallet' && disabled && selectedCustomer && (
                                            <span className="text-xs text-slate-400 ml-1">(empty)</span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Credit facility info when credit is selected */}
                    {paymentType === 'credit' && selectedCustomer && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-800">Credit Facility Status</span>
                                {creditAvailable > 0 ? (
                                    <Badge variant="approved">Available</Badge>
                                ) : (
                                    <Badge variant="danger">Exhausted</Badge>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-600">Limit</span>
                                    <p className="font-bold text-blue-900">{fmt(selectedCustomer.credit_limit || 0)}</p>
                                </div>
                                <div>
                                    <span className="text-blue-600">Used</span>
                                    <p className="font-bold text-blue-900">{fmt(selectedCustomer.credit_used || 0)}</p>
                                </div>
                                <div>
                                    <span className="text-blue-600">Available</span>
                                    <p className={`font-bold ${creditAvailable > 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(creditAvailable)}</p>
                                </div>
                            </div>
                            {creditAvailable <= 0 && (
                                <p className="mt-2 text-sm text-red-600 font-medium">
                                    ⚠️ This customer has exhausted their credit facility.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Wallet info when wallet is selected */}
                    {paymentType === 'wallet' && selectedCustomer && (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-green-800">Wallet Payment</span>
                                <Badge variant={walletBalance > 0 ? 'approved' : 'rejected'}>{walletBalance > 0 ? 'Has Balance' : 'Empty'}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-green-600">Wallet Balance</span>
                                    <p className="font-bold text-green-900">{fmt(walletBalance)}</p>
                                </div>
                                <div>
                                    <span className="text-green-600">Order Total</span>
                                    <p className="font-bold text-slate-900">{fmt(grandTotal)}</p>
                                </div>
                                <div>
                                    <span className="text-green-600">{walletBalance < grandTotal ? 'Shortfall' : 'Remaining'}</span>
                                    <p className={`font-bold ${walletBalance < grandTotal ? 'text-amber-600' : 'text-green-700'}`}>{fmt(Math.abs(walletBalance - grandTotal))}</p>
                                </div>
                            </div>
                            {walletBalance < grandTotal && canSelectCredit && (
                                <p className="mt-2 text-xs text-amber-700">Wallet covers {fmt(walletBalance)}, remaining {fmt(grandTotal - walletBalance)} will be charged to credit facility.</p>
                            )}
                            {walletBalance < grandTotal && !canSelectCredit && (
                                <p className="mt-2 text-xs text-red-700">⚠️ Wallet balance is insufficient and no credit facility is available.</p>
                            )}
                        </div>
                    )}

                    {/* Bank account selection when bank transfer is selected */}
                    {paymentType === 'bank_transfer' && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Bank Account</label>
                            {bankAccounts.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span className="font-medium">No bank accounts available</span>
                                    </div>
                                    <p className="mt-1 text-xs">Please add a bank account in Settings → Bank Accounts before using bank transfer.</p>
                                </div>
                            ) : (
                                <select
                                    value={selectedBankAccountId}
                                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="">-- Select Bank Account --</option>
                                    {bankAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.bank_name} - {account.account_number} ({account.account_name})
                                            {account.is_default ? ' ★ Default' : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {selectedBankAccount && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-slate-500">Bank:</span>
                                            <span className="ml-2 font-medium text-slate-800">{selectedBankAccount.bank_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Account No:</span>
                                            <span className="ml-2 font-mono font-medium text-slate-800">{selectedBankAccount.account_number}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-slate-500">Account Name:</span>
                                            <span className="ml-2 font-medium text-slate-800">{selectedBankAccount.account_name}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-end mt-8">
                        <Button onClick={() => setStep(1)} disabled={!canProceedStep0}>
                            Next: Items
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }

    function renderStep1() {
        return (
            <Card>
                <CardBody>
                    <h2 className="text-lg font-bold text-slate-900 mb-6">
                        {orderType === 'formula' ? 'Formula-Based Items' : 'Add Items'}
                    </h2>

                    {orderType === 'formula' ? (
                        <>
                            {/* Formula selector */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Formula</label>
                                    <select
                                        value={formulaId}
                                        onChange={(e) => setFormulaId(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">-- Select Formula --</option>
                                        {formulas.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Total Quantity (KG)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={totalQty}
                                        onChange={(e) => setTotalQty(e.target.value)}
                                        placeholder="e.g. 5000"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Formula breakdown table */}
                            {formulaLineItems.length > 0 && (
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="text-left px-4 py-3 font-semibold text-slate-700">Ingredient</th>
                                                <th className="text-right px-4 py-3 font-semibold text-slate-700">%</th>
                                                <th className="text-right px-4 py-3 font-semibold text-slate-700">Qty (KG)</th>
                                                <th className="text-right px-4 py-3 font-semibold text-slate-700">Unit Price</th>
                                                <th className="text-right px-4 py-3 font-semibold text-slate-700">Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formulaLineItems.map((item, i) => (
                                                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-slate-900 font-medium">{item.product}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{item.percentage}%</td>
                                                    <td className="px-4 py-3 text-right text-slate-900">{item.quantity.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{fmt(item.unit_price)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(item.line_total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Direct items */}
                            <div className="space-y-3 mb-4">
                                {directItems.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                                        <div className="col-span-4">
                                            {idx === 0 && <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>}
                                            <input
                                                type="text"
                                                value={item.product}
                                                onChange={(e) => updateDirectItem(idx, 'product', e.target.value)}
                                                placeholder="Product name"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            {idx === 0 && <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>}
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(e) => updateDirectItem(idx, 'quantity', e.target.value)}
                                                placeholder="0"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            {idx === 0 && <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>}
                                            <select
                                                value={item.unit}
                                                onChange={(e) => updateDirectItem(idx, 'unit', e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            >
                                                <option value="KG">KG</option>
                                                <option value="Bags">Bags</option>
                                                <option value="Tonnes">Tonnes</option>
                                                <option value="Litres">Litres</option>
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            {idx === 0 && <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price ({window.getCurrencySymbol()})</label>}
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => updateDirectItem(idx, 'unit_price', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            {directItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDirectItem(idx)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={addDirectItem}>
                                + Add Item
                            </Button>
                        </>
                    )}

                    {/* Running subtotal */}
                    {lineItems.length > 0 && (
                        <div className="mt-6">
                            {/* Service Charges (CRUSHING, PELLETING, etc.) */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-700">Service Charges <span className="font-normal text-slate-400">(CRUSHING, PELLETING, etc.)</span></label>
                                    <button type="button" onClick={addServiceCharge} className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-300 rounded px-2 py-1">+ Add Charge</button>
                                </div>
                                {serviceCharges.length > 0 && (
                                    <div className="space-y-2">
                                        {serviceCharges.map((charge, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                                <div className="col-span-5">
                                                    {idx === 0 && <label className="block text-xs text-slate-500 mb-1">Service Name</label>}
                                                    <input type="text" value={charge.name} onChange={(e) => updateServiceCharge(idx, 'name', e.target.value)} placeholder="e.g. CRUSHING" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div className="col-span-3">
                                                    {idx === 0 && <label className="block text-xs text-slate-500 mb-1">Quantity</label>}
                                                    <input type="number" min="0" value={charge.quantity} onChange={(e) => updateServiceCharge(idx, 'quantity', e.target.value)} placeholder="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div className="col-span-3">
                                                    {idx === 0 && <label className="block text-xs text-slate-500 mb-1">Amount ({window.getCurrencySymbol?.() || '₦'})</label>}
                                                    <input type="number" min="0" value={charge.amount} onChange={(e) => updateServiceCharge(idx, 'amount', e.target.value)} placeholder="0.00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <button type="button" onClick={() => removeServiceCharge(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-6 py-3 text-right space-y-1">
                                    <div className="text-sm text-slate-500">Materials: <span className="font-semibold text-slate-700">{fmt(subtotal)}</span></div>
                                    {serviceChargesTotal > 0 && <div className="text-sm text-slate-500">Services: <span className="font-semibold text-slate-700">{fmt(serviceChargesTotal)}</span></div>}
                                    {deliveryChargesTotal > 0 && <div className="text-sm text-slate-500">Delivery charges: <span className="font-semibold text-orange-700">{fmt(deliveryChargesTotal)}</span></div>}
                                    <div className="border-t pt-1 mt-1">
                                        <span className="text-sm text-slate-500">Total</span>
                                        <p className="text-xl font-bold text-slate-900">{fmt(subtotal + serviceChargesTotal + deliveryChargesTotal)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery / Transport Charges from Settings */}
                            {availableCharges.length > 0 && (
                                <div className="mt-4 border border-slate-200 rounded-lg p-4">
                                    <div className="text-sm font-semibold text-slate-700 mb-3">Delivery / Transport Charges</div>
                                    <div className="space-y-2">
                                        {availableCharges.map(charge => {
                                            const selected = selectedDeliveryCharges.find(c => c.id === charge.id);
                                            const defaultAmt = charge.amount_type === 'percentage'
                                                ? ((subtotal) * parseFloat(charge.default_amount)) / 100
                                                : parseFloat(charge.default_amount);
                                            return (
                                                <div key={charge.id} className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id={`dcharge-${charge.id}`}
                                                        checked={!!selected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedDeliveryCharges(prev => [...prev, {
                                                                    id: charge.id,
                                                                    name: charge.name,
                                                                    amount: defaultAmt,
                                                                    add_to_credit: !!charge.add_to_credit,
                                                                    allow_override: charge.allow_override !== false,
                                                                }]);
                                                            } else {
                                                                setSelectedDeliveryCharges(prev => prev.filter(c => c.id !== charge.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-orange-600 border-slate-300 rounded flex-shrink-0"
                                                    />
                                                    <label htmlFor={`dcharge-${charge.id}`} className="text-sm text-slate-700 flex-1 cursor-pointer">
                                                        {charge.name}
                                                        {charge.add_to_credit && <span className="ml-1 text-xs text-blue-600">(adds to credit on delivery)</span>}
                                                    </label>
                                                    {selected ? (
                                                        charge.allow_override !== false ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={selected.amount}
                                                                onChange={(e) => setSelectedDeliveryCharges(prev => prev.map(c => c.id === charge.id ? { ...c, amount: e.target.value } : c))}
                                                                className="w-28 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-mono w-28 text-right text-slate-700 font-semibold">{fmt(parseFloat(selected.amount) || 0)} 🔒</span>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-mono w-28 text-right">
                                                            {charge.amount_type === 'percentage' ? `${charge.default_amount}%` : fmt(defaultAmt)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Credit warning */}
                    {exceedsCredit && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                            This order ({fmt(subtotal)}) exceeds the customer's available credit of {fmt(creditAvailable)}.
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <Button variant="ghost" onClick={() => setStep(0)}>
                            Back
                        </Button>
                        <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                            Next: Review
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }

    function renderStep2() {
        return (
            <div className="space-y-6">
                {/* Summary card */}
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Customer</span>
                                <p className="font-semibold text-slate-900">{selectedCustomer?.name}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Order Type</span>
                                <p className="font-semibold text-slate-900 capitalize">{orderType === 'formula' ? 'Formula-Based' : 'Direct'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Payment Type</span>
                                <p className="font-semibold text-slate-900 capitalize">{paymentType}</p>
                            </div>
                            {fdoOfficer && (
                                <div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">F.D.O</span>
                                    <p className="font-semibold text-slate-900">{fdoOfficer}</p>
                                </div>
                            )}
                            {orderType === 'formula' && selectedFormula && (
                                <div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">Formula</span>
                                    <p className="font-semibold text-slate-900">{selectedFormula.name}</p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Items table */}
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Line Items</h2>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-700">#</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Product</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-700">Qty</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Unit</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-700">Unit Price</th>
                                        <th className="text-right px-4 py-3 font-semibold text-slate-700">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                                            <td className="px-4 py-3 text-slate-900 font-medium">{item.product}</td>
                                            <td className="px-4 py-3 text-right text-slate-900">
                                                {Number(item.quantity).toLocaleString('en-NG', { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{item.unit || 'KG'}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{fmt(item.unit_price)}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(item.line_total)}</td>
                                        </tr>
                                    ))}
                                    {serviceCharges.filter(c => c.name && Number(c.amount) > 0).map((charge, i) => (
                                        <tr key={`sc-${i}`} className="border-b border-slate-100 bg-amber-50">
                                            <td className="px-4 py-3 text-slate-400">{lineItems.length + i + 1}</td>
                                            <td className="px-4 py-3 text-slate-900 font-semibold">{charge.name} <span className="text-xs text-amber-600 font-normal ml-1">(service)</span></td>
                                            <td className="px-4 py-3 text-right text-slate-900">{charge.quantity || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">—</td>
                                            <td className="px-4 py-3 text-right text-slate-500">—</td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(charge.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-4 flex justify-end">
                            <div className="w-72 space-y-2">
                                <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Materials</span>
                                            <span className="font-semibold text-slate-900">{fmt(subtotal)}</span>
                                        </div>
                                        {serviceChargesTotal > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Service Charges</span>
                                                <span className="font-semibold text-slate-900">{fmt(serviceChargesTotal)}</span>
                                            </div>
                                        )}
                                        {deliveryChargesTotal > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Delivery Charges</span>
                                                <span className="font-semibold text-orange-700">{fmt(deliveryChargesTotal)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Taxes</span>
                                            <span className="text-slate-400 italic">Applied at invoice stage</span>
                                        </div>
                                                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                                            <span className="font-bold text-slate-900">Grand Total</span>
                                            <span className="font-bold text-lg text-blue-700">{fmt(subtotal + serviceChargesTotal + deliveryChargesTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                        {/* Credit warning */}
                        {exceedsCredit && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                                Warning: This order ({fmt(subtotal)}) exceeds the customer's available credit of {fmt(creditAvailable)}.
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Notes */}
                <Card>
                    <CardBody>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Optional notes for this order..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </CardBody>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                        Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || exceedsCredit}>
                        {submitting ? 'Submitting...' : 'Submit Sales Order'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Create Sales Order</h1>
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </div>

            {/* Progress bar */}
            {renderProgressBar()}

            {/* Step content */}
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
        </div>
    );
}
