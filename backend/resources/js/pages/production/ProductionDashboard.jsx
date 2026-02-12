import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import productionAPI from '../../services/productionAPI';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function ProductionDashboard() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [inProgressRuns, setInProgressRuns] = useState([]);
    const [plannedRuns, setPlannedRuns] = useState([]);
    const [recentCompleted, setRecentCompleted] = useState([]);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, allRuns] = await Promise.all([
                productionAPI.getSummary(dateRange),
                productionAPI.getAll(),
            ]);
            
            setSummary(summaryRes?.data || summaryRes);
            
            const runs = allRuns?.data || allRuns || [];
            setInProgressRuns(runs.filter(r => r.status === 'in_progress').slice(0, 5));
            setPlannedRuns(runs.filter(r => r.status === 'planned').slice(0, 5));
            setRecentCompleted(runs.filter(r => r.status === 'completed').slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load production dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            planned: 'secondary',
            in_progress: 'warning',
            completed: 'success',
            cancelled: 'danger',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status?.replace('_', ' ')}</Badge>;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Production Dashboard</h1>
                    <p className="text-slate-600">Overview of production activities</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={dateRange.start_date}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                        type="date"
                        value={dateRange.end_date}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <Link to="/production/new">
                        <Button>+ New Production</Button>
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Runs</p>
                                <p className="text-3xl font-bold mt-1">{summary?.total_runs || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-blue-100 text-xs mt-2">This period</p>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Completed</p>
                                <p className="text-3xl font-bold mt-1">{summary?.completed_runs || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-green-100 text-xs mt-2">{summary?.total_runs > 0 ? Math.round((summary?.completed_runs / summary?.total_runs) * 100) : 0}% completion rate</p>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Total Output</p>
                                <p className="text-3xl font-bold mt-1">{parseFloat(summary?.total_output || 0).toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-purple-100 text-xs mt-2">kg produced</p>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm">Avg Efficiency</p>
                                <p className="text-3xl font-bold mt-1">{parseFloat(summary?.average_efficiency || 0).toFixed(1)}%</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-amber-100 text-xs mt-2">Wastage: {parseFloat(summary?.total_wastage || 0).toLocaleString()} kg</p>
                    </CardBody>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{summary?.in_progress_count || 0}</p>
                            <p className="text-slate-600 text-sm">In Progress</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{summary?.planned_count || 0}</p>
                            <p className="text-slate-600 text-sm">Planned</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{parseFloat(summary?.total_wastage || 0).toLocaleString()}</p>
                            <p className="text-slate-600 text-sm">Total Wastage (kg)</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Production Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* In Progress */}
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">In Progress</h2>
                            <Link to="/production?status=in_progress" className="text-sm text-blue-600 hover:underline">View All</Link>
                        </div>
                        {inProgressRuns.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">No production runs in progress</p>
                        ) : (
                            <div className="space-y-3">
                                {inProgressRuns.map(run => (
                                    <Link key={run.id} to={`/production`} className="block p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-900">{run.production_number}</p>
                                                <p className="text-sm text-slate-600">{run.formula?.name || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900">{parseFloat(run.target_quantity).toLocaleString()} kg</p>
                                                <p className="text-xs text-slate-500">Started: {run.start_time || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Planned */}
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Planned</h2>
                            <Link to="/production?status=planned" className="text-sm text-blue-600 hover:underline">View All</Link>
                        </div>
                        {plannedRuns.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">No planned production runs</p>
                        ) : (
                            <div className="space-y-3">
                                {plannedRuns.map(run => (
                                    <Link key={run.id} to={`/production`} className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-900">{run.production_number}</p>
                                                <p className="text-sm text-slate-600">{run.formula?.name || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900">{parseFloat(run.target_quantity).toLocaleString()} kg</p>
                                                <p className="text-xs text-slate-500">{new Date(run.production_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Recent Completed */}
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Recently Completed</h2>
                        <Link to="/production?status=completed" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>
                    {recentCompleted.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">No completed production runs</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-2 px-3 font-medium text-slate-600">Run #</th>
                                        <th className="text-left py-2 px-3 font-medium text-slate-600">Formula</th>
                                        <th className="text-right py-2 px-3 font-medium text-slate-600">Target</th>
                                        <th className="text-right py-2 px-3 font-medium text-slate-600">Actual</th>
                                        <th className="text-right py-2 px-3 font-medium text-slate-600">Efficiency</th>
                                        <th className="text-right py-2 px-3 font-medium text-slate-600">Wastage</th>
                                        <th className="text-left py-2 px-3 font-medium text-slate-600">Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentCompleted.map(run => {
                                        const efficiency = run.target_quantity > 0 
                                            ? ((run.actual_output / run.target_quantity) * 100).toFixed(1) 
                                            : 0;
                                        return (
                                            <tr key={run.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-2 px-3 font-medium text-slate-900">{run.production_number}</td>
                                                <td className="py-2 px-3 text-slate-600">{run.formula?.name || 'N/A'}</td>
                                                <td className="py-2 px-3 text-right">{parseFloat(run.target_quantity).toLocaleString()} kg</td>
                                                <td className="py-2 px-3 text-right font-medium">{parseFloat(run.actual_output).toLocaleString()} kg</td>
                                                <td className="py-2 px-3 text-right">
                                                    <span className={`font-medium ${efficiency >= 95 ? 'text-green-600' : efficiency >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {efficiency}%
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right text-slate-600">{parseFloat(run.wastage_quantity || 0).toLocaleString()} kg</td>
                                                <td className="py-2 px-3 text-slate-500">{run.completed_at ? new Date(run.completed_at).toLocaleDateString() : 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
