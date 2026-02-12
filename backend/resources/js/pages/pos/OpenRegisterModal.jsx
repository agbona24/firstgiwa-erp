import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import posAPI from '../../services/posAPI';

export default function OpenRegisterModal({ isOpen, onClose, onSuccess }) {
    const [openingCash, setOpeningCash] = useState('');
    const [terminalId, setTerminalId] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
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
    const effectiveOpeningCash = openingCash !== '' 
        ? parseFloat(openingCash) || 0 
        : calculateDenominationTotal();

    const handleDenominationChange = (key, value) => {
        const count = parseInt(value) || 0;
        setDenominations(prev => ({
            ...prev,
            [key]: count >= 0 ? count : 0
        }));
        // Clear manual entry when using denominations
        setOpeningCash('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (effectiveOpeningCash < 0) {
            toast.error('Opening cash cannot be negative');
            return;
        }

        setLoading(true);
        try {
            const response = await posAPI.openRegister({
                opening_cash: effectiveOpeningCash,
                terminal_id: terminalId || undefined,
                notes: notes || undefined,
            });

            if (response.success) {
                toast.success('Register opened successfully');
                onSuccess(response.data);
            } else {
                toast.error(response.message || 'Failed to open register');
            }
        } catch (error) {
            console.error('Error opening register:', error);
            toast.error(error.response?.data?.message || 'Failed to open register');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setOpeningCash('');
        setDenominations({
            n1000: 0, n500: 0, n200: 0, n100: 0,
            n50: 0, n20: 0, n10: 0, n5: 0, coins: 0,
        });
        setTerminalId('');
        setNotes('');
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Open Register"
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Start of Shift</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                            Count your cash drawer and enter the opening balance to begin your shift.
                        </p>
                    </div>

                    {/* Manual Entry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Opening Cash Balance
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                            <input
                                type="number"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
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
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cash Denomination Counter (Optional)
                            </label>
                            <button 
                                type="button"
                                onClick={handleReset}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Reset All
                            </button>
                        </div>
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
                        
                        {/* Denomination Total */}
                        {calculateDenominationTotal() > 0 && (
                            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Denomination Total:
                                </span>
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                    ₦{calculateDenominationTotal().toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Terminal ID (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Terminal ID (Optional)
                        </label>
                        <input
                            type="text"
                            value={terminalId}
                            onChange={(e) => setTerminalId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="e.g., POS-001, Register-A"
                        />
                    </div>

                    {/* Notes (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            placeholder="Any notes about the opening..."
                        />
                    </div>

                    {/* Summary */}
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-green-800 dark:text-green-200">
                                Opening Balance:
                            </span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ₦{effectiveOpeningCash.toLocaleString()}
                            </span>
                        </div>
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
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                    >
                        Open Register
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
