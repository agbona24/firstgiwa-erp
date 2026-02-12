import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import posAPI from '../../services/posAPI';

export default function CloseRegisterModal({ isOpen, onClose, onSuccess, session }) {
    const [closingCash, setClosingCash] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [report, setReport] = useState(null);
    const toast = useToast();

    // Cash denomination counter
    const [denominations, setDenominations] = useState({
        n1000: 0,
        n500: 0,
        n200: 0,
        n100: 0,
        n50: 0,
        n20: 0,
        n10: 0,
        n5: 0,
        coins: 0,
    });

    const denominationValues = {
        n1000: 1000,
        n500: 500,
        n200: 200,
        n100: 100,
        n50: 50,
        n20: 20,
        n10: 10,
        n5: 5,
        coins: 1,
    };

    const denominationLabels = {
        n1000: '₦1,000',
        n500: '₦500',
        n200: '₦200',
        n100: '₦100',
        n50: '₦50',
        n20: '₦20',
        n10: '₦10',
        n5: '₦5',
        coins: 'Coins',
    };

    // Calculate total from denominations
    const calculateDenominationTotal = () => {
        return Object.entries(denominations).reduce((total, [key, count]) => {
            return total + (count * denominationValues[key]);
        }, 0);
    };

    // Use either manual entry or denomination count
    const effectiveClosingCash = closingCash !== '' 
        ? parseFloat(closingCash) || 0 
        : calculateDenominationTotal();

    // Calculate expected cash
    const expectedCash = session 
        ? parseFloat(session.opening_cash || 0) + parseFloat(session.cash_sales || 0)
        : 0;

    // Calculate variance
    const variance = effectiveClosingCash - expectedCash;

    const handleDenominationChange = (key, value) => {
        const count = parseInt(value) || 0;
        setDenominations(prev => ({
            ...prev,
            [key]: count >= 0 ? count : 0
        }));
        // Clear manual entry when using denominations
        setClosingCash('');
    };

    const getVarianceStatus = () => {
        if (variance > 0) return { label: 'Over', color: 'blue', icon: '↑' };
        if (variance < 0) return { label: 'Short', color: 'red', icon: '↓' };
        return { label: 'Balanced', color: 'green', icon: '✓' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (effectiveClosingCash < 0) {
            toast.error('Closing cash cannot be negative');
            return;
        }

        setLoading(true);
        try {
            const response = await posAPI.closeRegister({
                closing_cash: effectiveClosingCash,
                notes: notes || undefined,
            });

            if (response.success) {
                setReport(response.report);
                setShowReport(true);
                toast.success('Register closed successfully');
            } else {
                toast.error(response.message || 'Failed to close register');
            }
        } catch (error) {
            console.error('Error closing register:', error);
            toast.error(error.response?.data?.message || 'Failed to close register');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        setShowReport(false);
        setReport(null);
        onSuccess();
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount || 0).toLocaleString()}`;
    };

    const formatDuration = (hours) => {
        if (!hours) return '-';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    // Show report after successful close
    if (showReport && report) {
        const varianceStatus = getVarianceStatus();
        
        return (
            <Modal 
                isOpen={isOpen} 
                onClose={handleFinish}
                title="Shift Report"
                size="lg"
            >
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            End of Shift Report
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Session #{report.session_number}
                        </p>
                    </div>

                    {/* Cashier & Time Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Cashier:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {report.cashier}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Branch:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {report.branch}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Opened:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {new Date(report.opened_at).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Closed:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {new Date(report.closed_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {formatDuration(report.duration_hours)}
                            </span>
                        </div>
                    </div>

                    {/* Sales Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            Sales Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {report.total_transactions}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Sales:</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(report.total_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Cash Sales:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(report.cash_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Card Sales:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(report.card_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Transfer Sales:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(report.transfer_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Refunds:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {formatCurrency(report.total_refunds)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cash Reconciliation */}
                    <div className={`rounded-lg p-4 space-y-3 ${
                        varianceStatus.color === 'green' 
                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                            : varianceStatus.color === 'red'
                            ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                            : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                    }`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            Cash Reconciliation
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Opening Cash:</span>
                                <span className="font-medium">{formatCurrency(report.opening_cash)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">+ Cash Sales:</span>
                                <span className="font-medium">{formatCurrency(report.cash_sales)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                                <span className="text-gray-600 dark:text-gray-400">= Expected Cash:</span>
                                <span className="font-bold">{formatCurrency(report.expected_cash)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Actual Cash:</span>
                                <span className="font-bold">{formatCurrency(report.closing_cash)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-300 dark:border-gray-600 pt-2">
                                <span className="text-gray-600 dark:text-gray-400">Variance:</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant={varianceStatus.color}>
                                        {varianceStatus.icon} {varianceStatus.label}
                                    </Badge>
                                    <span className={`font-bold ${
                                        varianceStatus.color === 'green' 
                                            ? 'text-green-600' 
                                            : varianceStatus.color === 'red' 
                                            ? 'text-red-600' 
                                            : 'text-blue-600'
                                    }`}>
                                        {formatCurrency(Math.abs(report.cash_variance))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => window.print()}
                        >
                            Print Report
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleFinish}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    // Main close form
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Close Register"
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Session Info */}
                    {session && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Session:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {session.session_number}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Opened:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {new Date(session.opened_at).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Opening Cash:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(session.opening_cash)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Transactions:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {session.total_transactions || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="font-medium">End of Shift</span>
                        </div>
                        <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                            Count all cash in your drawer carefully. This action cannot be undone.
                        </p>
                    </div>

                    {/* Manual Entry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Actual Cash in Drawer
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                            <input
                                type="number"
                                value={closingCash}
                                onChange={(e) => setClosingCash(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg 
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter amount or use counter below"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Denomination Counter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cash Denomination Counter
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(denominationLabels).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                                        {label}
                                    </span>
                                    <input
                                        type="number"
                                        value={denominations[key] || ''}
                                        onChange={(e) => handleDenominationChange(key, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded 
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                                        placeholder="0"
                                        min="0"
                                    />
                                    <span className="text-xs text-gray-500 w-20 text-right">
                                        = ₦{(denominations[key] * denominationValues[key]).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expected vs Actual */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Expected Cash:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(expectedCash)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Actual Cash:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(effectiveClosingCash)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                            <span className="text-gray-600 dark:text-gray-400">Variance:</span>
                            <div className="flex items-center gap-2">
                                <Badge variant={getVarianceStatus().color}>
                                    {getVarianceStatus().icon} {getVarianceStatus().label}
                                </Badge>
                                <span className={`font-bold ${
                                    variance > 0 ? 'text-blue-600' : variance < 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {formatCurrency(Math.abs(variance))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes {variance !== 0 && <span className="text-red-500">(Explain variance)</span>}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            placeholder={variance !== 0 ? "Please explain the cash variance..." : "Any notes about the shift..."}
                            required={Math.abs(variance) > 100}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        loading={loading}
                        disabled={loading}
                    >
                        Close Register
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
