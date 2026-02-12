import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function ProfitAndLoss() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [view, setView] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const toast = useToast();

    const fetchProfitLoss = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const response = await api.get(`/accounting/profit-loss?${params.toString()}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch P&L:', error);
            toast.error('Failed to load Profit & Loss statement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfitLoss();
    }, [startDate, endDate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading Profit & Loss...</p>
                </div>
            </div>
        );
    }

    const currentMonth = data?.current_month || {};
    const monthlyData = data?.monthly_trend || [];
    const margins = data?.margins || {};

    const netProfitMargin = margins.net_margin || 0;
    const grossMargin = margins.gross_margin || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Profit & Loss</h1>
                    <p className="text-slate-600 mt-1">Revenue, costs, and profitability analysis</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 border rounded text-sm"
                        placeholder="Start Date"
                    />
                    <span className="text-slate-400">to</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 border rounded text-sm"
                        placeholder="End Date"
                    />
                    <Button variant={view === 'monthly' ? 'primary' : 'outline'} size="sm" onClick={() => setView('monthly')}>Monthly</Button>
                    <Button variant={view === 'details' ? 'primary' : 'outline'} size="sm" onClick={() => setView('details')}>Details</Button>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/accounting'}>Back to Ledger</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card><CardBody className="p-4">
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{fmt(currentMonth.revenue?.total)}</p>
                    <p className="text-xs text-slate-400 mt-1">{data?.period?.label || 'Current Period'}</p>
                </CardBody></Card>
                <Card><CardBody className="p-4">
                    <p className="text-xs text-slate-500">COGS</p>
                    <p className="text-xl font-bold text-orange-600 mt-1">{fmt(currentMonth.cogs?.total)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {currentMonth.revenue?.total > 0 
                            ? `${((currentMonth.cogs?.total / currentMonth.revenue?.total) * 100).toFixed(0)}% of revenue`
                            : 'N/A'}
                    </p>
                </CardBody></Card>
                <Card><CardBody className="p-4">
                    <p className="text-xs text-slate-500">Gross Profit</p>
                    <p className="text-xl font-bold text-green-600 mt-1">{fmt(currentMonth.gross_profit)}</p>
                    <p className="text-xs text-slate-400 mt-1">{grossMargin}% margin</p>
                </CardBody></Card>
                <Card><CardBody className="p-4">
                    <p className="text-xs text-slate-500">Operating Expenses</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{fmt((currentMonth.operating_expenses?.total || 0) + (currentMonth.payroll?.total || 0))}</p>
                    <p className="text-xs text-slate-400 mt-1">Expenses + Payroll</p>
                </CardBody></Card>
                <Card className="bg-slate-900"><CardBody className="p-4">
                    <p className="text-xs text-slate-400">Net Profit</p>
                    <p className={`text-xl font-bold mt-1 ${currentMonth.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmt(currentMonth.net_profit)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Revenue - COGS - Expenses</p>
                </CardBody></Card>
            </div>

            {/* Chart */}
            {view === 'monthly' && monthlyData.length > 0 && (
                <Card>
                    <CardBody className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Monthly Trend (Last 6 Months)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `${window.formatCurrency((value / 1000000).toFixed(1))}M`} />
                                    <Tooltip 
                                        formatter={(value) => fmt(value)}
                                        labelStyle={{ color: '#1e293b' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" />
                                    <Bar dataKey="cogs" name="COGS" fill="#f97316" />
                                    <Bar dataKey="profit" name="Net Profit" fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Detailed P&L Statement */}
            {view === 'details' && (
                <Card>
                    <CardBody className="p-6">
                        <h3 className="font-bold text-xl text-slate-800 mb-6 pb-3 border-b">
                            Profit & Loss Statement - {data?.period?.label || 'Current Period'}
                        </h3>

                        {/* Revenue Section */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-slate-700 mb-3 text-green-700">REVENUE</h4>
                            <div className="space-y-2 pl-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Sales Revenue</span>
                                    <span className="font-mono">{fmt(currentMonth.revenue?.sales_revenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Other Income</span>
                                    <span className="font-mono">{fmt(currentMonth.revenue?.other_income)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Total Revenue</span>
                                    <span className="font-mono text-green-700">{fmt(currentMonth.revenue?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* COGS Section */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-slate-700 mb-3 text-orange-700">COST OF GOODS SOLD</h4>
                            <div className="space-y-2 pl-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Raw Materials (Purchases)</span>
                                    <span className="font-mono">{fmt(currentMonth.cogs?.raw_materials)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Production Labor</span>
                                    <span className="font-mono">{fmt(currentMonth.cogs?.production_labor)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Production Overhead</span>
                                    <span className="font-mono">{fmt(currentMonth.cogs?.production_overhead)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Total COGS</span>
                                    <span className="font-mono text-orange-700">{fmt(currentMonth.cogs?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Gross Profit */}
                        <div className="mb-6 p-4 bg-green-50 rounded-lg">
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-green-800">GROSS PROFIT</span>
                                <span className="font-mono text-green-700">{fmt(currentMonth.gross_profit)}</span>
                            </div>
                            <p className="text-sm text-green-600 mt-1">Gross Margin: {grossMargin}%</p>
                        </div>

                        {/* Operating Expenses */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-slate-700 mb-3 text-red-700">OPERATING EXPENSES</h4>
                            <div className="space-y-2 pl-4">
                                {currentMonth.operating_expenses?.breakdown && 
                                    Object.entries(currentMonth.operating_expenses.breakdown).map(([category, amount]) => (
                                        <div key={category} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{category}</span>
                                            <span className="font-mono">{fmt(amount)}</span>
                                        </div>
                                    ))
                                }
                                <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Total Operating Expenses</span>
                                    <span className="font-mono text-red-700">{fmt(currentMonth.operating_expenses?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payroll */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-slate-700 mb-3 text-purple-700">PAYROLL</h4>
                            <div className="space-y-2 pl-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Salaries & Wages</span>
                                    <span className="font-mono">{fmt(currentMonth.payroll?.salaries)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Total Payroll</span>
                                    <span className="font-mono text-purple-700">{fmt(currentMonth.payroll?.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Operating Profit */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-blue-800">OPERATING PROFIT</span>
                                <span className={`font-mono ${currentMonth.operating_profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                    {fmt(currentMonth.operating_profit)}
                                </span>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">Operating Margin: {margins.operating_margin}%</p>
                        </div>

                        {/* Net Profit */}
                        <div className="p-4 bg-slate-900 rounded-lg">
                            <div className="flex justify-between font-bold text-xl">
                                <span className="text-white">NET PROFIT</span>
                                <span className={`font-mono ${currentMonth.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {fmt(currentMonth.net_profit)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">Net Margin: {netProfitMargin}%</p>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Monthly Breakdown Table */}
            {view === 'monthly' && monthlyData.length > 0 && (
                <Card>
                    <CardBody className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Monthly Breakdown</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Month</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Revenue</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">COGS</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Expenses</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Payroll</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Net Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {monthlyData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.month}</td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-green-600">{fmt(row.revenue)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-orange-600">{fmt(row.cogs)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-red-600">{fmt(row.expenses)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-purple-600">{fmt(row.payroll)}</td>
                                            <td className={`px-4 py-3 text-sm text-right font-mono font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {fmt(row.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
