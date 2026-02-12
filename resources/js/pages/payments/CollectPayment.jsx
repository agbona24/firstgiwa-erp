import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const mockInvoices = [
    { id: 1, invoice_number: 'INV-2026-045', so_number: 'SO-2026-101', customer: 'Mega Mart Ltd', date: '2026-01-30', total: 850000, paid: 0, balance: 850000, status: 'unpaid' },
    { id: 2, invoice_number: 'INV-2026-038', so_number: 'SO-2026-095', customer: 'Mega Mart Ltd', date: '2026-01-25', total: 620000, paid: 200000, balance: 420000, status: 'partial' },
    { id: 3, invoice_number: 'INV-2026-032', so_number: 'SO-2026-088', customer: 'City Grocers', date: '2026-01-18', total: 1200000, paid: 0, balance: 1200000, status: 'unpaid' },
    { id: 4, invoice_number: 'INV-2026-025', so_number: 'SO-2026-075', customer: 'Kano Flour Mills', date: '2026-01-12', total: 450000, paid: 150000, balance: 300000, status: 'partial' },
    { id: 5, invoice_number: 'INV-2026-018', so_number: 'SO-2026-060', customer: 'Fresh Foods Inc', date: '2026-01-08', total: 356000, paid: 0, balance: 356000, status: 'unpaid' },
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'POS/Card', 'Cheque'];
const BANKS = ['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank'];

export default function CollectPayment() {
    const navigate = useNavigate();
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Cash');
    const [bank, setBank] = useState('');
    const [terminalId, setTerminalId] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [chequeBank, setChequeBank] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [notes, setNotes] = useState('');
    const [mixedEnabled, setMixedEnabled] = useState(false);
    const [splits, setSplits] = useState([{ method: 'Cash', amount: '' }]);

    // Filter invoices by search
    const filteredInvoices = search.trim()
        ? mockInvoices.filter(inv =>
            inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
            inv.customer.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const handleSelectInvoice = (inv) => {
        setSelectedInvoice(inv);
        setAmount(inv.balance.toString());
        setMethod('Cash');
        setBank('');
        setTerminalId('');
        setChequeNumber('');
        setChequeBank('');
        setChequeDate('');
        setNotes('');
        setMixedEnabled(false);
        setSplits([{ method: 'Cash', amount: '' }]);
    };

    // Mixed payment helpers
    const addSplit = () => setSplits([...splits, { method: 'Cash', amount: '' }]);
    const removeSplit = (idx) => setSplits(splits.filter((_, i) => i !== idx));
    const updateSplit = (idx, field, value) => {
        const next = [...splits];
        next[idx] = { ...next[idx], [field]: value };
        setSplits(next);
    };
    const splitsTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
    const payAmount = parseFloat(amount) || 0;
    const splitsBalanced = mixedEnabled && Math.abs(splitsTotal - payAmount) < 0.01 && payAmount > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        if (payAmount <= 0) {
            toast.error('Payment amount must be greater than zero');
            return;
        }
        if (payAmount > selectedInvoice.balance) {
            toast.error(`Amount cannot exceed balance of ${fmt(selectedInvoice.balance)}`);
            return;
        }
        if (mixedEnabled && !splitsBalanced) {
            toast.error('Split payments must total the payment amount');
            return;
        }

        const receiptNum = 'RCP-2026-' + String(Math.floor(Math.random() * 900) + 100);
        toast.success(`Payment of ${fmt(payAmount)} recorded. Receipt: ${receiptNum}`);
        navigate('/payments');
    };

    const receiptNum = 'RCP-2026-XXX';

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Collect Payment</h1>
                    <p className="text-slate-600 mt-1">Record payments against approved invoices</p>
                </div>
                <Button variant="ghost" onClick={() => navigate('/payments')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </Button>
            </div>

            {/* Invoice Lookup */}
            <Card className="mb-6">
                <CardBody>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Find Invoice</label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by invoice number or customer name..."
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    {filteredInvoices.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {filteredInvoices.map(inv => (
                                <button
                                    key={inv.id}
                                    type="button"
                                    onClick={() => handleSelectInvoice(inv)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                        selectedInvoice?.id === inv.id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-mono font-semibold text-blue-700">{inv.invoice_number}</span>
                                            <span className="mx-2 text-slate-400">|</span>
                                            <span className="font-medium text-slate-800">{inv.customer}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={inv.status === 'unpaid' ? 'error' : 'warning'}>
                                                {inv.status}
                                            </Badge>
                                            <span className="font-mono font-bold text-slate-900">{fmt(inv.balance)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        SO: {inv.so_number} &middot; Date: {inv.date} &middot; Total: {fmt(inv.total)} &middot; Paid: {fmt(inv.paid)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {search.trim() && filteredInvoices.length === 0 && (
                        <p className="mt-3 text-sm text-slate-500">No matching invoices found.</p>
                    )}
                </CardBody>
            </Card>

            {/* Selected Invoice Details & Payment Form */}
            {selectedInvoice && (
                <form onSubmit={handleSubmit}>
                    {/* Invoice Details */}
                    <Card className="mb-6">
                        <CardBody>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Invoice Details</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                                    <p className="font-semibold text-slate-900">{selectedInvoice.customer}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Invoice #</p>
                                    <p className="font-mono font-semibold text-blue-700">{selectedInvoice.invoice_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Sales Order</p>
                                    <p className="font-mono text-slate-700">{selectedInvoice.so_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                                    <p className="text-slate-700">{selectedInvoice.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Invoice Total</p>
                                    <p className="font-mono font-semibold">{fmt(selectedInvoice.total)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Already Paid</p>
                                    <p className="font-mono text-green-700">{fmt(selectedInvoice.paid)}</p>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Balance Due</p>
                                <p className="text-3xl font-bold text-blue-800">{fmt(selectedInvoice.balance)}</p>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Payment Form */}
                    <Card className="mb-6">
                        <CardBody className="space-y-6">
                            <h2 className="text-lg font-bold text-slate-900">Payment Details</h2>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Pay *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{window.getCurrencySymbol()}</span>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        max={selectedInvoice.balance}
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono text-lg"
                                    />
                                </div>
                                {payAmount > 0 && payAmount < selectedInvoice.balance && (
                                    <p className="text-xs text-amber-600 mt-1">Partial payment - remaining balance will be {fmt(selectedInvoice.balance - payAmount)}</p>
                                )}
                            </div>

                            {/* Payment Method - Radio Cards */}
                            {!mixedEnabled && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method *</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {PAYMENT_METHODS.map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setMethod(m)}
                                                className={`p-3 rounded-lg border-2 text-center text-sm font-semibold transition-all ${
                                                    method === m
                                                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                                                        : 'border-slate-200 text-slate-700 hover:border-blue-300'
                                                }`}
                                            >
                                                {m === 'Cash' && (
                                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                )}
                                                {m === 'Bank Transfer' && (
                                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                )}
                                                {m === 'POS/Card' && (
                                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                )}
                                                {m === 'Cheque' && (
                                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                )}
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Conditional fields for single payment */}
                            {!mixedEnabled && method === 'Bank Transfer' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank *</label>
                                    <select
                                        required
                                        value={bank}
                                        onChange={(e) => setBank(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Select bank...</option>
                                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            )}

                            {!mixedEnabled && method === 'POS/Card' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Terminal ID *</label>
                                    <input
                                        type="text"
                                        required
                                        value={terminalId}
                                        onChange={(e) => setTerminalId(e.target.value)}
                                        placeholder="e.g. POS-TERM-001"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            )}

                            {!mixedEnabled && method === 'Cheque' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={chequeNumber}
                                            onChange={(e) => setChequeNumber(e.target.value)}
                                            placeholder="e.g. 000123"
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Bank *</label>
                                        <select
                                            required
                                            value={chequeBank}
                                            onChange={(e) => setChequeBank(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">Select bank...</option>
                                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={chequeDate}
                                            onChange={(e) => setChequeDate(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Mixed Payment Toggle */}
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setMixedEnabled(!mixedEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        mixedEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        mixedEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                                <span className="text-sm font-medium text-slate-700">Mixed / Split Payment</span>
                            </div>

                            {/* Mixed Payment UI */}
                            {mixedEnabled && (
                                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                                    <h3 className="text-sm font-semibold text-slate-800">Payment Splits</h3>
                                    {splits.map((sp, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <select
                                                value={sp.method}
                                                onChange={(e) => updateSplit(idx, 'method', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{window.getCurrencySymbol()}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={sp.amount}
                                                    onChange={(e) => updateSplit(idx, 'amount', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                            {splits.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSplit(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addSplit}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                        + Add Split
                                    </button>
                                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${
                                        splitsBalanced
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                    }`}>
                                        {splitsBalanced ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        )}
                                        <span>Split total: {fmt(splitsTotal)} / {fmt(payAmount)}</span>
                                        {!splitsBalanced && splitsTotal !== payAmount && (
                                            <span className="ml-auto text-xs">
                                                {splitsTotal < payAmount ? `${fmt(payAmount - splitsTotal)} remaining` : `${fmt(splitsTotal - payAmount)} over`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reference / Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reference / Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Additional notes or reference numbers..."
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <Button
                                    type="submit"
                                    disabled={
                                        payAmount <= 0 ||
                                        payAmount > selectedInvoice.balance ||
                                        (mixedEnabled && !splitsBalanced)
                                    }
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Record Payment
                                </Button>
                                <Button variant="outline" onClick={() => { setSelectedInvoice(null); setSearch(''); }}>
                                    Cancel
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Receipt Preview */}
                    <Card className="mb-6">
                        <CardBody>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Receipt Preview</h2>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
                                <div className="text-center mb-4">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Payment Receipt</p>
                                    <p className="font-mono font-bold text-lg text-slate-800 mt-1">{receiptNum}</p>
                                </div>
                                <div className="border-t border-slate-300 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Customer</span>
                                        <span className="font-medium text-slate-800">{selectedInvoice.customer}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Invoice</span>
                                        <span className="font-mono text-slate-800">{selectedInvoice.invoice_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Date</span>
                                        <span className="text-slate-800">{new Date().toLocaleDateString('en-NG')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Method</span>
                                        <span className="text-slate-800">
                                            {mixedEnabled ? `Mixed (${splits.length} splits)` : method}
                                        </span>
                                    </div>
                                    {!mixedEnabled && method === 'Bank Transfer' && bank && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Bank</span>
                                            <span className="text-slate-800">{bank}</span>
                                        </div>
                                    )}
                                    {!mixedEnabled && method === 'POS/Card' && terminalId && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Terminal</span>
                                            <span className="text-slate-800">{terminalId}</span>
                                        </div>
                                    )}
                                    {!mixedEnabled && method === 'Cheque' && chequeNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Cheque #</span>
                                            <span className="text-slate-800">{chequeNumber}</span>
                                        </div>
                                    )}
                                    {mixedEnabled && splits.map((sp, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-slate-500">Split {idx + 1}: {sp.method}</span>
                                            <span className="font-mono text-slate-800">{fmt(parseFloat(sp.amount) || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t-2 border-slate-400 mt-4 pt-4 flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Amount Paid</span>
                                    <span className="text-2xl font-bold text-blue-800">{fmt(payAmount)}</span>
                                </div>
                                {notes && (
                                    <div className="mt-3 text-xs text-slate-500">
                                        <span className="font-medium">Notes:</span> {notes}
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </form>
            )}
        </div>
    );
}
