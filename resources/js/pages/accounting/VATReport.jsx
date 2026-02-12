import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const years = [2024, 2025, 2026];

export default function VATReport() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filed, setFiled] = useState(false);
    const [data, setData] = useState(null);

    const fetchVATReport = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/accounting/vat-report?month=${selectedMonth + 1}&year=${selectedYear}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch VAT report:', error);
            toast.error('Failed to load VAT report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVATReport();
        setFiled(false);
    }, [selectedMonth, selectedYear]);

    const summary = data?.summary || {};
    const outputVat = data?.output_vat || [];
    const inputVat = data?.input_vat || [];

    const outputTotal = summary.output_vat_total || 0;
    const outputTaxableTotal = summary.output_taxable_total || 0;
    const inputTotal = summary.input_vat_total || 0;
    const inputTaxableTotal = summary.input_taxable_total || 0;
    const netVAT = summary.net_vat_payable || 0;
    const vatRate = summary.vat_rate || 7.5;

    const outputColumns = [
        { key: 'date', label: 'Date' },
        { key: 'reference', label: 'Invoice #' },
        { key: 'customer', label: 'Customer' },
        { key: 'taxable_amount', label: 'Taxable Amount', render: (row) => fmt(row.taxable_amount) },
        { key: 'vat_rate', label: 'Rate', render: (row) => `${row.vat_rate}%` },
        { key: 'vat_amount', label: 'VAT Amount', render: (row) => fmt(row.vat_amount) },
    ];

    const inputColumns = [
        { key: 'date', label: 'Date' },
        { key: 'reference', label: 'Reference' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'taxable_amount', label: 'Taxable Amount', render: (row) => fmt(row.taxable_amount) },
        { key: 'vat_rate', label: 'Rate', render: (row) => `${row.vat_rate}%` },
        { key: 'vat_amount', label: 'VAT Amount', render: (row) => fmt(row.vat_amount) },
    ];

    const handleMarkFiled = () => {
        setFiled(true);
        toast.success(`VAT return marked as filed for ${months[selectedMonth]} ${selectedYear}`);
    };

    const handleExport = () => {
        const headers = ['Type', 'Date', 'Reference', 'Party', 'Taxable Amount', 'VAT Rate', 'VAT Amount'];
        const outputRows = outputVat.map(r => ['Output', r.date, r.reference, r.customer, r.taxable_amount, r.vat_rate, r.vat_amount]);
        const inputRows = inputVat.map(r => ['Input', r.date, r.reference, r.supplier, r.taxable_amount, r.vat_rate, r.vat_amount]);
        
        const csvContent = [headers, ...outputRows, ...inputRows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vat-report-${months[selectedMonth]}-${selectedYear}.csv`;
        a.click();
        
        toast.success('VAT report exported to CSV');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading VAT Report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Tax & VAT Report</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-green-500">
                    <CardBody className="p-4">
                        <p className="text-xs text-slate-500">Output VAT (Sales)</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">{fmt(outputTotal)}</p>
                        <p className="text-xs text-slate-400 mt-1">{vatRate}% of {fmt(outputTaxableTotal)}</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-red-500">
                    <CardBody className="p-4">
                        <p className="text-xs text-slate-500">Input VAT (Purchases)</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">{fmt(inputTotal)}</p>
                        <p className="text-xs text-slate-400 mt-1">{vatRate}% of {fmt(inputTaxableTotal)}</p>
                    </CardBody>
                </Card>
                <Card className={`border-l-4 ${netVAT >= 0 ? 'border-blue-500' : 'border-purple-500'}`}>
                    <CardBody className="p-4">
                        <p className="text-xs text-slate-500">{netVAT >= 0 ? 'VAT Payable' : 'VAT Refundable'}</p>
                        <p className={`text-2xl font-bold mt-1 ${netVAT >= 0 ? 'text-blue-700' : 'text-purple-700'}`}>
                            {fmt(Math.abs(netVAT))}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Output - Input VAT</p>
                    </CardBody>
                </Card>
                <Card className={`border-l-4 ${filed ? 'border-green-500' : 'border-amber-500'}`}>
                    <CardBody className="p-4">
                        <p className="text-xs text-slate-500">Filing Status</p>
                        <div className="mt-1">
                            <Badge variant={filed ? 'approved' : 'warning'}>
                                {filed ? 'Filed' : 'Not Filed'}
                            </Badge>
                        </div>
                        {!filed && (
                            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleMarkFiled}>
                                Mark as Filed
                            </Button>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Output VAT Table */}
            <Card>
                <CardBody className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Output VAT (Sales) - {outputVat.length} transactions
                    </h3>
                    {outputVat.length > 0 ? (
                        <DataTable columns={outputColumns} data={outputVat} enablePagination={false} />
                    ) : (
                        <p className="text-slate-500 text-center py-4">No sales transactions for this period</p>
                    )}
                    <div className="flex justify-end mt-4 pt-3 border-t">
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Total Taxable: <span className="font-semibold">{fmt(outputTaxableTotal)}</span></p>
                            <p className="text-lg font-bold text-green-700">Total VAT: {fmt(outputTotal)}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Input VAT Table */}
            <Card>
                <CardBody className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        Input VAT (Purchases & Expenses) - {inputVat.length} transactions
                    </h3>
                    {inputVat.length > 0 ? (
                        <DataTable columns={inputColumns} data={inputVat} enablePagination={false} />
                    ) : (
                        <p className="text-slate-500 text-center py-4">No purchase/expense transactions for this period</p>
                    )}
                    <div className="flex justify-end mt-4 pt-3 border-t">
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Total Taxable: <span className="font-semibold">{fmt(inputTaxableTotal)}</span></p>
                            <p className="text-lg font-bold text-red-700">Total VAT: {fmt(inputTotal)}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Net VAT Summary */}
            <Card className={netVAT >= 0 ? 'bg-blue-50' : 'bg-purple-50'}>
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                                Net VAT {netVAT >= 0 ? 'Payable' : 'Refundable'} for {months[selectedMonth]} {selectedYear}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Output VAT ({fmt(outputTotal)}) - Input VAT ({fmt(inputTotal)})
                            </p>
                        </div>
                        <p className={`text-3xl font-bold ${netVAT >= 0 ? 'text-blue-700' : 'text-purple-700'}`}>
                            {fmt(Math.abs(netVAT))}
                        </p>
                    </div>
                    {netVAT > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> This amount is due to FIRS by the 21st of the following month.
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
