import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';
import expenseAPI from '../../services/expenseAPI';
import { bankAccountsAPI } from '../../services/settingsAPI';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card' },
    { value: 'cheque', label: 'Cheque' },
];

export default function CreateExpense() {
    const navigate = useNavigate();
    const toast = useToast();

    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        expense_date: today,
        expense_category_id: '',
        title: '',
        description: '',
        amount: '',
        payment_method: '',
        bank_account_id: '',
        payment_reference: '',
        vendor_name: '',
        receipt_number: '',
        is_recurring: false,
        recurring_frequency: '',
    });

    const [categories, setCategories] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [categoriesRes, banksRes] = await Promise.all([
                expenseAPI.getCategories(),
                bankAccountsAPI.list().catch(() => ({ data: [] }))
            ]);
            console.log('Categories response:', categoriesRes);
            console.log('Banks response:', banksRes);
            
            // Handle categories - API returns { data: [...] }
            const cats = categoriesRes?.data || [];
            setCategories(Array.isArray(cats) ? cats : []);
            
            // Handle bank accounts - API returns { data: { bank_accounts: [...] } }
            let banks = [];
            if (banksRes?.data?.data?.bank_accounts) {
                banks = banksRes.data.data.bank_accounts;
            } else if (banksRes?.data?.bank_accounts) {
                banks = banksRes.data.bank_accounts;
            } else if (banksRes?.data && Array.isArray(banksRes.data)) {
                banks = banksRes.data;
            }
            console.log('Parsed banks:', banks);
            setBankAccounts(Array.isArray(banks) ? banks : []);
        } catch (error) {
            console.error('Failed to load form data:', error);
            toast.error('Failed to load form data');
        } finally {
            setLoadingData(false);
        }
    };

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const amount = parseFloat(form.amount) || 0;
    
    // Get selected category to check approval threshold
    const selectedCategory = categories.find(c => c.id === parseInt(form.expense_category_id));
    const approvalThreshold = selectedCategory?.approval_threshold || 50000;
    const requiresApproval = selectedCategory?.requires_approval && amount > approvalThreshold;

    const validateForm = () => {
        if (!form.expense_category_id) {
            toast.error('Please select a category');
            return false;
        }
        if (!form.title.trim()) {
            toast.error('Please enter a title');
            return false;
        }
        if (!form.amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return false;
        }
        if (!form.expense_date) {
            toast.error('Please select a date');
            return false;
        }
        return true;
    };

    const handleSubmit = async (asDraft = false) => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            
            const payload = {
                expense_category_id: parseInt(form.expense_category_id),
                title: form.title,
                description: form.description || null,
                expense_date: form.expense_date,
                amount: parseFloat(form.amount),
                payment_method: form.payment_method || null,
                payment_reference: form.payment_reference || null,
                vendor_name: form.vendor_name || null,
                receipt_number: form.receipt_number || null,
                is_recurring: form.is_recurring,
                recurring_frequency: form.is_recurring ? form.recurring_frequency : null,
            };

            const response = await expenseAPI.create(payload);
            
            const isAutoApproved = response.data?.status === 'approved';
            
            if (isAutoApproved) {
                toast.success(`Expense ${response.data?.expense_number || ''} created and auto-approved`);
            } else {
                toast.success(`Expense ${response.data?.expense_number || ''} submitted for approval`);
            }
            
            navigate('/expenses');
        } catch (error) {
            console.error('Failed to create expense:', error);
            const message = error.response?.data?.message || 'Failed to create expense';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
    const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';
    const selectClass = `${inputClass} bg-white`;

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')}>
                        ← Back
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Record Expense</h1>
                </div>
            </div>

            {/* Expense Details */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Expense Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Expense Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.expense_date}
                                onChange={e => update('expense_date', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                            <select
                                value={form.expense_category_id}
                                onChange={e => update('expense_category_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Select category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Title / Expense Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="E.g., Office supplies, Electricity bill"
                                value={form.title}
                                onChange={e => update('title', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Amount ({window.getCurrencySymbol()}) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => update('amount', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Vendor / Paid To</label>
                            <input
                                type="text"
                                placeholder="Vendor or payee name"
                                value={form.vendor_name}
                                onChange={e => update('vendor_name', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea
                                rows={3}
                                placeholder="Describe the expense..."
                                value={form.description}
                                onChange={e => update('description', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-lg font-bold text-slate-900">
                                Total: {fmt(amount)}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Payment Info */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Payment Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Payment Method</label>
                            <select
                                value={form.payment_method}
                                onChange={e => update('payment_method', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Select method</option>
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        {form.payment_method === 'bank_transfer' && (
                            <div>
                                <label className={labelClass}>Bank Account</label>
                                <select
                                    value={form.bank_account_id}
                                    onChange={e => update('bank_account_id', e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Select bank account</option>
                                    {bankAccounts.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.bank_name} - {b.account_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {form.payment_method === 'cheque' && (
                            <div>
                                <label className={labelClass}>Cheque Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter cheque number"
                                    value={form.payment_reference}
                                    onChange={e => update('payment_reference', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        )}
                        <div>
                            <label className={labelClass}>Receipt / Reference Number</label>
                            <input
                                type="text"
                                placeholder="Receipt or reference #"
                                value={form.receipt_number}
                                onChange={e => update('receipt_number', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Recurring */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Recurring Options</h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_recurring}
                                onChange={e => update('is_recurring', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">This is a recurring expense</span>
                        </label>
                        {form.is_recurring && (
                            <div className="max-w-xs">
                                <label className={labelClass}>Frequency</label>
                                <select
                                    value={form.recurring_frequency}
                                    onChange={e => update('recurring_frequency', e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Select frequency</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Approval Info */}
            <Card className={requiresApproval ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}>
                <CardBody>
                    <h2 className={`text-lg font-semibold mb-2 ${requiresApproval ? 'text-amber-800' : 'text-green-800'}`}>
                        Approval Information
                    </h2>
                    {amount > 0 ? (
                        requiresApproval ? (
                            <p className="text-sm text-amber-700">
                                This expense requires approval (above {fmt(approvalThreshold)} threshold for {selectedCategory?.name || 'this category'})
                            </p>
                        ) : (
                            <p className="text-sm text-green-700">
                                This expense will be auto-approved (below {fmt(approvalThreshold)} threshold)
                            </p>
                        )
                    ) : (
                        <p className="text-sm text-slate-600">
                            Enter an amount to see approval requirements
                        </p>
                    )}
                </CardBody>
            </Card>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pb-6">
                <Button variant="ghost" onClick={() => navigate('/expenses')} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={() => handleSubmit(false)} disabled={loading}>
                    {loading ? 'Submitting...' : requiresApproval ? 'Submit for Approval' : 'Create Expense'}
                </Button>
            </div>
        </div>
    );
}
