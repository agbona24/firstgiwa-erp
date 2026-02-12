import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DateRangePicker from '../../components/ui/DateRangePicker';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import productionAPI from '../../services/productionAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function ProductionList() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [runs, setRuns] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRun, setSelectedRun] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    
    // Record Output state
    const [showRecordOutput, setShowRecordOutput] = useState(false);
    const [recordOutputRun, setRecordOutputRun] = useState(null);
    const [outputData, setOutputData] = useState({ actual_output: '', wastage_quantity: '', notes: '', items: [] });
    const [recordLoading, setRecordLoading] = useState(false);
    
    // Check Materials state
    const [showCheckMaterials, setShowCheckMaterials] = useState(false);
    const [checkMaterialsRun, setCheckMaterialsRun] = useState(null);
    const [materialsData, setMaterialsData] = useState(null);
    const [checkLoading, setCheckLoading] = useState(false);
    
    // Record Loss state
    const [showRecordLoss, setShowRecordLoss] = useState(false);
    const [recordLossRun, setRecordLossRun] = useState(null);
    const [lossData, setLossData] = useState({ product_id: '', quantity: '', reason: '', notes: '' });
    const [lossLoading, setLossLoading] = useState(false);

    // Fetch production runs from API
    useEffect(() => {
        fetchRuns();
    }, []);

    const fetchRuns = async () => {
        try {
            setLoading(true);
            const response = await productionAPI.getAll();
            const list = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.data?.data)
                        ? response.data.data
                        : [];
            setRuns(list);
        } catch (error) {
            console.error('Error fetching production runs:', error);
            toast.error('Failed to load production runs');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return runs.filter(r => {
            const runNumber = r.production_number || r.run_number || '';
            const formula = r.formula?.name || r.formula_name || '';
            if (search && !runNumber.toLowerCase().includes(search.toLowerCase()) && !formula.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter && r.status !== statusFilter) return false;
            return true;
        });
    }, [runs, search, statusFilter]);

    const stats = useMemo(() => {
        const completed = runs.filter(r => r.status === 'completed');
        return {
            totalRuns: runs.length,
            inProgress: runs.filter(r => r.status === 'in_progress').length,
            totalOutput: completed.reduce((s, r) => s + parseFloat(r.actual_output || 0), 0),
            avgLoss: completed.length > 0 ? (completed.reduce((s, r) => s + parseFloat(r.wastage_percentage || 0), 0) / completed.length).toFixed(1) : '0',
        };
    }, [runs]);

    const handleCreate = () => {
        window.location.href = 'http://127.0.0.1:8000/production/create';
    };

    const columns = [
        { key: 'production_number', label: 'Run #', sortable: true, render: (val, row) => <span className="font-mono text-sm font-semibold text-blue-700">{val || row.run_number}</span> },
        { key: 'production_date', label: 'Date', sortable: true, render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
        { key: 'formula', label: 'Formula', sortable: true, render: (val, row) => <span className="font-medium text-slate-900">{val?.name || row.formula_name || '-'}</span> },
        { key: 'status', label: 'Status', render: (val) => {
            const v = { completed: 'completed', in_progress: 'pending', planned: 'draft' };
            return <Badge variant={v[val] || 'draft'}>{val?.replace('_', ' ') || 'Unknown'}</Badge>;
        }},
        { key: 'target_quantity', label: 'Target (kg)', sortable: true, render: (val) => parseFloat(val || 0).toLocaleString() },
        { key: 'actual_output', label: 'Actual (kg)', render: (val, row) => row.status === 'completed' ? <span className="font-semibold">{parseFloat(val || 0).toLocaleString()}</span> : <span className="text-slate-400">-</span> },
        { key: 'wastage_percentage', label: 'Loss %', render: (val, row) => {
            if (row.status !== 'completed') return <span className="text-slate-400">-</span>;
            const lossVal = parseFloat(val || 0);
            return <span className={`font-semibold ${lossVal > 5 ? 'text-red-600' : lossVal > 3 ? 'text-yellow-600' : 'text-green-600'}`}>{lossVal}%</span>;
        }},
    ];

    const actions = [
        { label: 'View', onClick: async (row) => {
            try {
                setViewLoading(true);
                const res = await productionAPI.get(row.id);
                setSelectedRun(res.data?.data || res.data || row);
            } catch (error) {
                console.error('Failed to load production run details:', error);
                toast.error('Failed to load production run details');
            } finally {
                setViewLoading(false);
            }
        }, variant: 'outline' },
        { label: 'Print', onClick: (row) => {
            window.open(`/api/v1/documents/production-sheet/${row.id}/preview`, '_blank');
        }, variant: 'outline' },
        { label: 'Record Output', onClick: async (row) => {
            try {
                setViewLoading(true);
                const res = await productionAPI.get(row.id);
                const runData = res.data?.data || res.data || row;
                setRecordOutputRun(runData);
                
                // Initialize items from the production run
                const items = (runData.items || []).map(item => ({
                    item_id: item.id,
                    product_name: item.product?.name || 'Unknown',
                    planned_quantity: item.planned_quantity || item.quantity_required || 0,
                    quantity_used: item.actual_quantity || item.planned_quantity || 0,
                    wastage: item.wastage || 0,
                }));
                
                setOutputData({ 
                    actual_output: runData.actual_output || runData.target_quantity || '', 
                    wastage_quantity: runData.wastage_quantity || '0', 
                    notes: runData.notes || '',
                    items: items
                });
                setShowRecordOutput(true);
            } catch (error) {
                console.error('Failed to load production run:', error);
                toast.error('Failed to load production run details');
            } finally {
                setViewLoading(false);
            }
        }, variant: 'primary', show: (row) => row.status === 'in_progress' },
        { label: 'Start', onClick: async (row) => {
            try {
                await productionAPI.start(row.id);
                toast.success('Production run started');
                fetchRuns();
            } catch (error) {
                console.error('Failed to start production:', error);
                toast.error(error.response?.data?.message || 'Failed to start production');
            }
        }, variant: 'success', show: (row) => row.status === 'planned' },
        { label: 'Check Materials', onClick: async (row) => {
            try {
                setCheckLoading(true);
                setCheckMaterialsRun(row);
                const res = await productionAPI.checkMaterialsById(row.id);
                setMaterialsData(res?.data || res);
                setShowCheckMaterials(true);
            } catch (error) {
                console.error('Failed to check materials:', error);
                toast.error('Failed to check material availability');
            } finally {
                setCheckLoading(false);
            }
        }, variant: 'outline', show: (row) => row.status === 'planned' },
        { label: 'Record Loss', onClick: async (row) => {
            try {
                setViewLoading(true);
                const res = await productionAPI.get(row.id);
                const runData = res.data?.data || res.data || row;
                setRecordLossRun(runData);
                setLossData({ product_id: '', quantity: '', reason: '', notes: '' });
                setShowRecordLoss(true);
            } catch (error) {
                console.error('Failed to load production run:', error);
                toast.error('Failed to load production run details');
            } finally {
                setViewLoading(false);
            }
        }, variant: 'warning', show: (row) => row.status === 'in_progress' },
        { label: 'Edit', onClick: (row) => {
            window.location.href = `/production/edit/${row.id}`;
        }, variant: 'outline', show: (row) => row.status === 'planned' },
        { label: 'Cancel', onClick: async (row) => {
            if (!confirm('Are you sure you want to cancel this production run?')) return;
            try {
                await productionAPI.cancel(row.id, 'Cancelled by user');
                toast.success('Production run cancelled');
                fetchRuns();
            } catch (error) {
                console.error('Failed to cancel production:', error);
                toast.error(error.response?.data?.message || 'Failed to cancel production');
            }
        }, variant: 'danger', show: (row) => row.status === 'planned' || row.status === 'in_progress' },
    ];
    
    const handleRecordOutput = async () => {
        if (!recordOutputRun) return;
        
        // Calculate totals from items
        const totalUsed = outputData.items.reduce((sum, item) => sum + (parseFloat(item.quantity_used) || 0), 0);
        const totalWastage = outputData.items.reduce((sum, item) => sum + (parseFloat(item.wastage) || 0), 0);
        const actualOutput = totalUsed - totalWastage;
        
        try {
            setRecordLoading(true);
            await productionAPI.complete(recordOutputRun.id, {
                actual_output: actualOutput,
                wastage_quantity: totalWastage,
                notes: outputData.notes,
                items: outputData.items.map(item => ({
                    item_id: item.item_id,
                    quantity_used: parseFloat(item.quantity_used) || 0,
                    wastage: parseFloat(item.wastage) || 0,
                })),
            });
            toast.success('Production completed successfully');
            setShowRecordOutput(false);
            setRecordOutputRun(null);
            fetchRuns();
        } catch (error) {
            console.error('Failed to complete production:', error);
            toast.error(error.response?.data?.message || 'Failed to complete production');
        } finally {
            setRecordLoading(false);
        }
    };
    
    const updateItemQuantity = (index, field, value) => {
        setOutputData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };
    
    const handleRecordLoss = async () => {
        if (!recordLossRun || !lossData.product_id || !lossData.quantity) return;
        
        try {
            setLossLoading(true);
            await productionAPI.recordLoss(recordLossRun.id, {
                product_id: parseInt(lossData.product_id),
                quantity: parseFloat(lossData.quantity),
                reason: lossData.reason,
                notes: lossData.notes,
            });
            toast.success('Loss recorded successfully');
            setShowRecordLoss(false);
            setRecordLossRun(null);
            fetchRuns();
        } catch (error) {
            console.error('Failed to record loss:', error);
            toast.error(error.response?.data?.message || 'Failed to record loss');
        } finally {
            setLossLoading(false);
        }
    };
    
    const handleStartWithCheck = async (run) => {
        try {
            await productionAPI.start(run.id);
            toast.success('Production run started');
            setShowCheckMaterials(false);
            fetchRuns();
        } catch (error) {
            console.error('Failed to start production:', error);
            toast.error(error.response?.data?.message || 'Failed to start production');
        }
    };

    // Bulk Actions
    const exportColumns = [
        { key: 'production_number', label: 'Run Number' },
        { key: 'production_date', label: 'Date' },
        { key: 'formula', label: 'Formula' },
        { key: 'status', label: 'Status' },
        { key: 'target_quantity', label: 'Target (kg)' },
        { key: 'actual_output', label: 'Actual (kg)' },
        { key: 'wastage_percentage', label: 'Loss %' },
    ];

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                const exportData = selectedIndices.map(idx => {
                    const run = filtered[idx];
                    return {
                        ...run,
                        formula: run.formula?.name || run.formula_name || '',
                    };
                });
                exportSelectedToCSV(Array.from({ length: exportData.length }, (_, i) => i), exportData, exportColumns, 'production_runs');
                toast.success(`Exported ${selectedIndices.length} production runs`);
            }
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Production</h1>
                    <p className="text-slate-600 mt-1">Track production runs, inputs, outputs, and losses</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/production/dashboard">
                        <Button variant="outline">📊 Dashboard</Button>
                    </Link>
                    <Button onClick={handleCreate}>+ New Production Run</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Runs', value: stats.totalRuns, color: 'blue' },
                    { label: 'In Progress', value: stats.inProgress, color: 'yellow' },
                    { label: 'Total Output (kg)', value: stats.totalOutput.toLocaleString(), color: 'green' },
                    { label: 'Avg Loss %', value: `${stats.avgLoss}%`, color: parseFloat(stats.avgLoss) > 5 ? 'red' : 'green' },
                ].map((s, i) => (
                    <Card key={i}><CardBody className="p-4">
                        <p className="text-sm text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                    </CardBody></Card>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <SearchBar onSearch={setSearch} placeholder="Search runs..." />
                <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                    { value: 'planned', label: 'Planned' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                ]} />
                <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
            </div>

            <DataTable columns={columns} data={filtered} actions={actions} loading={loading} selectable bulkActions={bulkActions} />

            {/* View Run */}
            <SlideOut isOpen={!!selectedRun} onClose={() => setSelectedRun(null)} title={`Production Run: ${selectedRun?.production_number || ''}`} size="lg">
                {viewLoading && (
                    <div className="py-12 text-center text-slate-500">Loading production run details...</div>
                )}
                {!viewLoading && selectedRun && (() => {
                    const items = selectedRun.items || [];
                    const targetQty = parseFloat(selectedRun.target_quantity || 0);
                    const totalPlanned = items.reduce((s, i) => s + parseFloat(i.planned_quantity ?? i.quantity_required ?? 0), 0);
                    const totalCost = items.reduce((s, i) => s + parseFloat(i.total_cost || 0), 0);
                    const estCostPerKg = targetQty > 0 ? totalCost / targetQty : 0;

                    return (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div><p className="text-xs text-slate-500">Date</p><p className="font-semibold">{selectedRun.production_date ? new Date(selectedRun.production_date).toLocaleDateString() : '-'}</p></div>
                                <div><p className="text-xs text-slate-500">Formula</p><p className="font-semibold">{selectedRun.formula?.name || '-'}</p></div>
                                <div><p className="text-xs text-slate-500">Status</p><Badge variant={selectedRun.status === 'completed' ? 'completed' : selectedRun.status === 'in_progress' ? 'pending' : 'draft'}>{selectedRun.status?.replace('_', ' ')}</Badge></div>
                                <div><p className="text-xs text-slate-500">Created By</p><p className="font-semibold">{selectedRun.creator?.name || '-'}</p></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card><CardBody className="p-4">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Planning</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span className="font-medium text-slate-900">{selectedRun.warehouse?.name || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Branch</span><span className="font-medium text-slate-900">{selectedRun.branch?.name || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Output Product</span><span className="font-medium text-slate-900">{selectedRun.finished_product?.name || selectedRun.finishedProduct?.name || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Target Output</span><span className="font-medium text-slate-900">{targetQty.toLocaleString()} kg</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Batch #</span><span className="font-medium text-slate-900">{selectedRun.batch_number || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Expiry Date</span><span className="font-medium text-slate-900">{selectedRun.expiry_date ? new Date(selectedRun.expiry_date).toLocaleDateString() : '-'}</span></div>
                                    </div>
                                </CardBody></Card>

                                <Card><CardBody className="p-4">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Output & Loss</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Actual Output</span><span className="font-medium text-slate-900">{parseFloat(selectedRun.actual_output || 0) > 0 ? `${parseFloat(selectedRun.actual_output).toLocaleString()} kg` : '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Wastage</span><span className="font-medium text-slate-900">{parseFloat(selectedRun.wastage_quantity || 0) > 0 ? `${parseFloat(selectedRun.wastage_quantity).toLocaleString()} kg (${selectedRun.wastage_percentage || 0}%)` : '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Started</span><span className="font-medium text-slate-900">{selectedRun.start_time || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Completed</span><span className="font-medium text-slate-900">{selectedRun.end_time || '-'}</span></div>
                                    </div>
                                </CardBody></Card>
                            </div>

                            <Card>
                                <CardBody>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Input Materials</h2>
                                    {items.length === 0 ? (
                                        <div className="text-sm text-slate-500">No input materials recorded.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-slate-600">
                                                        <th className="pb-3 pr-4 font-medium">Raw Material</th>
                                                        <th className="pb-3 pr-4 font-medium text-right">Planned Qty (kg)</th>
                                                        <th className="pb-3 pr-4 font-medium text-right">Actual Used (kg)</th>
                                                        <th className="pb-3 pr-4 font-medium text-right">Variance</th>
                                                        <th className="pb-3 pr-4 font-medium text-right">Unit Cost</th>
                                                        <th className="pb-3 font-medium text-right">Line Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item, idx) => {
                                                        const planned = parseFloat(item.planned_quantity ?? item.quantity_required ?? 0);
                                                        const actual = parseFloat(item.actual_quantity ?? item.quantity_used ?? 0);
                                                        const variance = parseFloat(item.variance ?? (actual - planned));
                                                        return (
                                                            <tr key={idx} className="border-b border-slate-100">
                                                                <td className="py-3 pr-4 text-slate-900 font-medium">{item.product?.name || 'Unknown'}</td>
                                                                <td className="py-3 pr-4 text-right text-slate-700">{planned.toLocaleString()}</td>
                                                                <td className="py-3 pr-4 text-right text-slate-700">{actual > 0 ? actual.toLocaleString() : '-'}</td>
                                                                <td className={`py-3 pr-4 text-right ${variance > 0 ? 'text-orange-600' : variance < 0 ? 'text-green-600' : 'text-slate-700'}`}>
                                                                    {variance !== 0 ? variance.toLocaleString() : '-'}
                                                                </td>
                                                                <td className="py-3 pr-4 text-right text-slate-700">{fmt(item.unit_cost || 0)}</td>
                                                                <td className="py-3 text-right text-slate-900 font-medium">{fmt(item.total_cost || 0)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-slate-300">
                                                        <td className="pt-3 pr-4 font-semibold text-slate-900">Total</td>
                                                        <td className="pt-3 pr-4 text-right font-semibold text-slate-900">{totalPlanned.toLocaleString()}</td>
                                                        <td className="pt-3 pr-4"></td>
                                                        <td className="pt-3 pr-4"></td>
                                                        <td className="pt-3 pr-4"></td>
                                                        <td className="pt-3 text-right font-semibold text-slate-900">{fmt(totalCost)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Cost Summary</h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Total Raw Material Cost</span>
                                            <span className="text-lg font-semibold text-slate-900">{fmt(totalCost)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Estimated Cost Per Kg</span>
                                            <span className="text-lg font-semibold text-slate-900">{fmt(estCostPerKg)}</span>
                                        </div>
                                        {selectedRun.notes && (
                                            <div className="mt-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                                {selectedRun.notes}
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    );
                })()}
            </SlideOut>

            {/* Record Output Modal */}
            {showRecordOutput && recordOutputRun && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-900">Record Output</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {recordOutputRun.production_number || recordOutputRun.run_number} - {recordOutputRun.formula?.name || recordOutputRun.formula_name}
                            </p>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Target Quantity:</span>
                                    <span className="font-semibold text-slate-900">{parseFloat(recordOutputRun.target_quantity || 0).toLocaleString()} kg</span>
                                </div>
                            </div>
                            
                            {/* Raw Materials Used */}
                            {outputData.items && outputData.items.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Raw Materials Used *</label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="text-left py-2 px-3 font-medium text-slate-700">Material</th>
                                                    <th className="text-right py-2 px-3 font-medium text-slate-700">Planned</th>
                                                    <th className="text-right py-2 px-3 font-medium text-slate-700 w-32">Qty Used</th>
                                                    <th className="text-right py-2 px-3 font-medium text-slate-700 w-28">Wastage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {outputData.items.map((item, index) => (
                                                    <tr key={item.item_id}>
                                                        <td className="py-2 px-3 text-slate-900">{item.product_name}</td>
                                                        <td className="py-2 px-3 text-right text-slate-600">{parseFloat(item.planned_quantity).toLocaleString()}</td>
                                                        <td className="py-2 px-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.quantity_used}
                                                                onChange={(e) => updateItemQuantity(index, 'quantity_used', e.target.value)}
                                                                className="w-full border border-slate-300 rounded px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.wastage || ''}
                                                                onChange={(e) => updateItemQuantity(index, 'wastage', e.target.value)}
                                                                className="w-full border border-slate-300 rounded px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Actual Output (kg) *</label>
                                    <div className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 text-slate-900 font-semibold">
                                        {(() => {
                                            const totalUsed = outputData.items.reduce((sum, item) => sum + (parseFloat(item.quantity_used) || 0), 0);
                                            const totalWaste = outputData.items.reduce((sum, item) => sum + (parseFloat(item.wastage) || 0), 0);
                                            const actualOutput = totalUsed - totalWaste;
                                            return actualOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                        })()}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Total Qty Used - Total Wastage</p>
                                </div>
                            
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Wastage (kg)</label>
                                    <div className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 text-slate-900 font-semibold">
                                        {outputData.items.reduce((sum, item) => sum + (parseFloat(item.wastage) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Sum of all item wastages</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea
                                    value={outputData.notes}
                                    onChange={(e) => setOutputData({...outputData, notes: e.target.value})}
                                    rows={2}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Any notes about this production run..."
                                />
                            </div>
                            
                            {outputData.items.length > 0 && recordOutputRun.target_quantity && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    {(() => {
                                        const totalUsed = outputData.items.reduce((sum, item) => sum + (parseFloat(item.quantity_used) || 0), 0);
                                        const totalWaste = outputData.items.reduce((sum, item) => sum + (parseFloat(item.wastage) || 0), 0);
                                        const actualOutput = totalUsed - totalWaste;
                                        const targetQty = parseFloat(recordOutputRun.target_quantity);
                                        const variance = actualOutput - targetQty;
                                        const yieldPct = targetQty > 0 ? (actualOutput / targetQty) * 100 : 0;
                                        
                                        return (
                                            <div className="text-sm text-blue-800">
                                                <div className="flex justify-between">
                                                    <span>Variance:</span>
                                                    <span className={`font-semibold ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                                                    </span>
                                                </div>
                                                <div className="flex justify-between mt-1">
                                                    <span>Yield:</span>
                                                    <span className="font-semibold">
                                                        {yieldPct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => { setShowRecordOutput(false); setRecordOutputRun(null); }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleRecordOutput}
                                disabled={recordLoading || outputData.items.length === 0}
                            >
                                {recordLoading ? 'Saving...' : 'Complete Production'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Check Materials Modal */}
            {showCheckMaterials && checkMaterialsRun && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-900">Check Material Availability</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {checkMaterialsRun.production_number} - {checkMaterialsRun.formula?.name || 'N/A'}
                            </p>
                        </div>
                        <div className="p-6">
                            {checkLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    <p className="mt-2 text-slate-600">Checking materials...</p>
                                </div>
                            ) : materialsData ? (
                                <>
                                    <div className={`mb-4 p-4 rounded-lg ${materialsData.all_sufficient ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        {materialsData.all_sufficient ? (
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">All materials are available. Ready to start!</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">Insufficient materials! Cannot start production.</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="text-left py-2 px-3 font-medium text-slate-700">Material</th>
                                                    <th className="text-right py-2 px-3 font-medium text-slate-700">Required</th>
                                                    <th className="text-right py-2 px-3 font-medium text-slate-700">Available</th>
                                                    <th className="text-center py-2 px-3 font-medium text-slate-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {(materialsData.materials || []).map((mat, idx) => (
                                                    <tr key={idx} className={mat.sufficient ? '' : 'bg-red-50'}>
                                                        <td className="py-2 px-3 text-slate-900">{mat.product?.name || 'Unknown'}</td>
                                                        <td className="py-2 px-3 text-right">{parseFloat(mat.required).toLocaleString()}</td>
                                                        <td className="py-2 px-3 text-right font-medium">{parseFloat(mat.available).toLocaleString()}</td>
                                                        <td className="py-2 px-3 text-center">
                                                            {mat.sufficient ? (
                                                                <Badge variant="success">OK</Badge>
                                                            ) : (
                                                                <Badge variant="danger">Low</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-slate-500">No data available</p>
                            )}
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => { setShowCheckMaterials(false); setCheckMaterialsRun(null); setMaterialsData(null); }}
                            >
                                Close
                            </Button>
                            {materialsData?.all_sufficient && (
                                <Button 
                                    variant="success"
                                    onClick={() => handleStartWithCheck(checkMaterialsRun)}
                                >
                                    Start Production
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Record Loss Modal */}
            {showRecordLoss && recordLossRun && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-900">Record Production Loss</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {recordLossRun.production_number} - {recordLossRun.formula?.name || 'N/A'}
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Material *</label>
                                <select
                                    value={lossData.product_id}
                                    onChange={(e) => setLossData({...lossData, product_id: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select material...</option>
                                    {(recordLossRun.items || []).map(item => (
                                        <option key={item.id} value={item.product_id}>
                                            {item.product?.name || 'Unknown'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Lost *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={lossData.quantity}
                                    onChange={(e) => setLossData({...lossData, quantity: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter quantity"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                                <select
                                    value={lossData.reason}
                                    onChange={(e) => setLossData({...lossData, reason: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select reason...</option>
                                    <option value="spillage">Spillage</option>
                                    <option value="contamination">Contamination</option>
                                    <option value="equipment_failure">Equipment Failure</option>
                                    <option value="measurement_error">Measurement Error</option>
                                    <option value="expired">Expired Material</option>
                                    <option value="damage">Physical Damage</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea
                                    value={lossData.notes}
                                    onChange={(e) => setLossData({...lossData, notes: e.target.value})}
                                    rows={3}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Additional details about this loss..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => { setShowRecordLoss(false); setRecordLossRun(null); }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="warning"
                                onClick={handleRecordLoss}
                                disabled={lossLoading || !lossData.product_id || !lossData.quantity || !lossData.reason}
                            >
                                {lossLoading ? 'Recording...' : 'Record Loss'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
