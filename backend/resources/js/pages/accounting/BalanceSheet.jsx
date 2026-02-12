import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function BalanceSheet() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchBalanceSheet = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/accounting/balance-sheet?as_of_date=${asOfDate}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch balance sheet:', error);
            toast.error('Failed to load balance sheet');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalanceSheet();
    }, [asOfDate]);

    const handleExport = () => {
        if (!data) return;
        
        const lines = [
            `Balance Sheet as of ${asOfDate}`,
            '',
            'ASSETS',
            'Current Assets',
            `  Cash & Cash Equivalents,${data.assets?.current_assets?.cash_and_equivalents || 0}`,
            `  Accounts Receivable,${data.assets?.current_assets?.accounts_receivable || 0}`,
            `  Inventory,${data.assets?.current_assets?.inventory || 0}`,
            `  Total Current Assets,${data.assets?.current_assets?.total || 0}`,
            '',
            'Fixed Assets',
            `  Property & Equipment,${data.assets?.fixed_assets?.property_equipment || 0}`,
            `  Total Fixed Assets,${data.assets?.fixed_assets?.total || 0}`,
            '',
            `TOTAL ASSETS,${data.assets?.total_assets || 0}`,
            '',
            'LIABILITIES',
            'Current Liabilities',
            `  Accounts Payable,${data.liabilities?.current_liabilities?.accounts_payable || 0}`,
            `  VAT Payable,${data.liabilities?.current_liabilities?.vat_payable || 0}`,
            `  Accrued Expenses,${data.liabilities?.current_liabilities?.accrued_expenses || 0}`,
            `  Total Current Liabilities,${data.liabilities?.current_liabilities?.total || 0}`,
            '',
            `TOTAL LIABILITIES,${data.liabilities?.total_liabilities || 0}`,
            '',
            'EQUITY',
            `  Opening Capital,${data.equity?.opening_capital || 0}`,
            `  Retained Earnings,${data.equity?.retained_earnings || 0}`,
            `TOTAL EQUITY,${data.equity?.total_equity || 0}`,
            '',
            `TOTAL LIABILITIES & EQUITY,${data.total_liabilities_and_equity || 0}`,
        ];
        
        const csvContent = lines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance-sheet-${asOfDate}.csv`;
        a.click();
        
        toast.success('Balance sheet exported to CSV');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading Balance Sheet...</p>
                </div>
            </div>
        );
    }

    const assets = data?.assets || {};
    const liabilities = data?.liabilities || {};
    const equity = data?.equity || {};
    const isBalanced = data?.is_balanced;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
                    <p className="text-slate-600">Financial position statement</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600">As of:</label>
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = '/accounting'}>
                        Back to Ledger
                    </Button>
                </div>
            </div>

            {/* Balance Check Alert */}
            {!isBalanced && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-amber-800 font-medium">
                            Balance sheet is not in balance. Assets ≠ Liabilities + Equity
                        </p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-t-4 border-blue-500">
                    <CardBody className="p-4 text-center">
                        <p className="text-sm text-slate-500">Total Assets</p>
                        <p className="text-3xl font-bold text-blue-700 mt-2">{fmt(assets.total_assets)}</p>
                    </CardBody>
                </Card>
                <Card className="border-t-4 border-red-500">
                    <CardBody className="p-4 text-center">
                        <p className="text-sm text-slate-500">Total Liabilities</p>
                        <p className="text-3xl font-bold text-red-700 mt-2">{fmt(liabilities.total_liabilities)}</p>
                    </CardBody>
                </Card>
                <Card className="border-t-4 border-green-500">
                    <CardBody className="p-4 text-center">
                        <p className="text-sm text-slate-500">Total Equity</p>
                        <p className={`text-3xl font-bold mt-2 ${equity.total_equity >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {fmt(equity.total_equity)}
                        </p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ASSETS */}
                <Card>
                    <CardBody className="p-6">
                        <h2 className="text-xl font-bold text-blue-800 mb-6 pb-3 border-b-2 border-blue-200">
                            ASSETS
                        </h2>

                        {/* Current Assets */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Current Assets</h3>
                            <div className="space-y-3 pl-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Cash & Cash Equivalents</span>
                                    <span className="font-mono font-medium">{fmt(assets.current_assets?.cash_and_equivalents)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Accounts Receivable</span>
                                    <span className="font-mono font-medium">{fmt(assets.current_assets?.accounts_receivable)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Inventory</span>
                                    <span className="font-mono font-medium">{fmt(assets.current_assets?.inventory)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-semibold">
                                    <span>Total Current Assets</span>
                                    <span className="font-mono">{fmt(assets.current_assets?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Assets */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Fixed Assets</h3>
                            <div className="space-y-3 pl-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Property & Equipment</span>
                                    <span className="font-mono font-medium">{fmt(assets.fixed_assets?.property_equipment)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-semibold">
                                    <span>Total Fixed Assets</span>
                                    <span className="font-mono">{fmt(assets.fixed_assets?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Assets */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between text-xl font-bold">
                                <span className="text-blue-800">TOTAL ASSETS</span>
                                <span className="font-mono text-blue-700">{fmt(assets.total_assets)}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* LIABILITIES & EQUITY */}
                <Card>
                    <CardBody className="p-6">
                        <h2 className="text-xl font-bold text-red-800 mb-6 pb-3 border-b-2 border-red-200">
                            LIABILITIES & EQUITY
                        </h2>

                        {/* Current Liabilities */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Current Liabilities</h3>
                            <div className="space-y-3 pl-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Accounts Payable</span>
                                    <span className="font-mono font-medium">{fmt(liabilities.current_liabilities?.accounts_payable)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">VAT Payable</span>
                                    <span className="font-mono font-medium">{fmt(liabilities.current_liabilities?.vat_payable)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Accrued Expenses</span>
                                    <span className="font-mono font-medium">{fmt(liabilities.current_liabilities?.accrued_expenses)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-semibold">
                                    <span>Total Current Liabilities</span>
                                    <span className="font-mono">{fmt(liabilities.current_liabilities?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Liabilities */}
                        <div className="p-4 bg-red-50 rounded-lg mb-6">
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-red-800">TOTAL LIABILITIES</span>
                                <span className="font-mono text-red-700">{fmt(liabilities.total_liabilities)}</span>
                            </div>
                        </div>

                        {/* Equity */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-green-700 mb-3">Equity</h3>
                            <div className="space-y-3 pl-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Opening Capital</span>
                                    <span className="font-mono font-medium">{fmt(equity.opening_capital)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Retained Earnings</span>
                                    <span className={`font-mono font-medium ${equity.retained_earnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {fmt(equity.retained_earnings)}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-semibold">
                                    <span>Total Equity</span>
                                    <span className="font-mono">{fmt(equity.total_equity)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Liabilities & Equity */}
                        <div className="p-4 bg-slate-900 rounded-lg">
                            <div className="flex justify-between text-xl font-bold">
                                <span className="text-white">TOTAL LIABILITIES & EQUITY</span>
                                <span className="font-mono text-green-400">{fmt(data?.total_liabilities_and_equity)}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Balance Check */}
            <Card className={isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <CardBody className="p-4">
                    <div className="flex items-center justify-center gap-4">
                        {isBalanced ? (
                            <>
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="font-bold text-green-800">Balance Sheet is Balanced</p>
                                    <p className="text-sm text-green-600">Assets = Liabilities + Equity</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="font-bold text-red-800">Balance Sheet is NOT Balanced</p>
                                    <p className="text-sm text-red-600">
                                        Difference: {fmt(Math.abs(assets.total_assets - data?.total_liabilities_and_equity))}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
