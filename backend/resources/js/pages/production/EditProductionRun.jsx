import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import productionAPI from '../../services/productionAPI';
import formulaAPI from '../../services/formulaAPI';
import warehouseAPI from '../../services/warehouseAPI';
import inventoryAPI from '../../services/inventoryAPI';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function EditProductionRun() {
    const navigate = useNavigate();
    const { id } = useParams();
    const toast = useToast();

    const [formulas, setFormulas] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [inventoryByProduct, setInventoryByProduct] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [run, setRun] = useState(null);

    const [selectedFormulaId, setSelectedFormulaId] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [productionDate, setProductionDate] = useState('');
    const [targetOutput, setTargetOutput] = useState('');
    const [batchNumber, setBatchNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [notes, setNotes] = useState('');

    // Load production run and related data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [runRes, formulasRes, warehousesRes] = await Promise.all([
                    productionAPI.get(id),
                    formulaAPI.getFormulas(),
                    warehouseAPI.getWarehouses()
                ]);
                
                const runData = runRes.data?.data || runRes.data || runRes;
                setRun(runData);
                
                // Check if run can be edited
                if (runData.status !== 'planned') {
                    toast.error('Only planned production runs can be edited');
                    navigate('/production');
                    return;
                }
                
                const formulasList = formulasRes.data || formulasRes || [];
                const warehousesList = Array.isArray(warehousesRes) ? warehousesRes : (warehousesRes.data || []);
                const activeFormulas = Array.isArray(formulasList) 
                    ? formulasList.filter(f => f.is_active !== false)
                    : [];
                
                setFormulas(activeFormulas);
                setWarehouses(warehousesList);
                
                // Pre-fill form with existing data
                setSelectedFormulaId(String(runData.formula_id || ''));
                setSelectedWarehouseId(String(runData.warehouse_id || ''));
                setProductionDate(runData.production_date?.split('T')[0] || '');
                setTargetOutput(String(runData.target_quantity || ''));
                setBatchNumber(runData.batch_number || '');
                setExpiryDate(runData.expiry_date?.split('T')[0] || '');
                setNotes(runData.notes || '');
                
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load production run');
                navigate('/production');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    // Load inventory for selected warehouse
    useEffect(() => {
        const loadInventory = async () => {
            if (!selectedWarehouseId) {
                setInventoryByProduct({});
                return;
            }
            try {
                const res = await inventoryAPI.getInventory({
                    warehouse_id: Number(selectedWarehouseId),
                    per_page: 10000,
                });
                const items = res?.data || [];
                const map = {};
                items.forEach((inv) => {
                    const productId = inv.product_id || inv.product?.id;
                    if (!productId) return;
                    const qty = inv.available_quantity ?? inv.quantity ?? 0;
                    map[productId] = qty;
                });
                setInventoryByProduct(map);
            } catch (error) {
                console.error('Error loading inventory:', error);
                setInventoryByProduct({});
            }
        };
        loadInventory();
    }, [selectedWarehouseId]);

    const selectedFormula = useMemo(
        () => formulas.find((f) => f.id === Number(selectedFormulaId)) || null,
        [selectedFormulaId, formulas]
    );

    const inputLines = useMemo(() => {
        if (!selectedFormula || !targetOutput) return [];
        const target = Number(targetOutput);
        return (selectedFormula.items || []).map((item) => {
            const plannedQty = (target * item.percentage) / 100;
            const unitPrice = item.product?.cost_price || 0;
            const lineCost = plannedQty * unitPrice;
            const productId = item.product_id || item.product?.id;
            const availableStock = productId ? (inventoryByProduct[productId] ?? 0) : 0;
            const sufficient = availableStock >= plannedQty;
            return { 
                ...item, 
                product_name: item.product?.name || 'Unknown',
                unit_price: unitPrice,
                available_stock: availableStock,
                plannedQty, 
                lineCost, 
                sufficient 
            };
        });
    }, [selectedFormula, targetOutput, inventoryByProduct]);

    const insufficientCount = useMemo(() => inputLines.filter((l) => !l.sufficient).length, [inputLines]);
    const totalPlannedInput = useMemo(() => inputLines.reduce((s, l) => s + l.plannedQty, 0), [inputLines]);
    const totalEstimatedCost = useMemo(() => inputLines.reduce((s, l) => s + l.lineCost, 0), [inputLines]);
    const costPerKg = useMemo(
        () => (targetOutput && totalEstimatedCost ? totalEstimatedCost / Number(targetOutput) : 0),
        [totalEstimatedCost, targetOutput]
    );

    const handleSubmit = async () => {
        if (!targetOutput) {
            toast.error('Please enter target output');
            return;
        }

        try {
            setSubmitting(true);
            await productionAPI.update(id, {
                production_date: productionDate,
                target_quantity: Number(targetOutput),
                batch_number: batchNumber || null,
                expiry_date: expiryDate || null,
                notes: notes || null,
            });
            toast.success('Production run updated successfully');
            navigate('/production');
        } catch (error) {
            console.error('Error updating production run:', error);
            const message = error.response?.data?.message || 'Failed to update production run';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-48"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/production')}>
                        ← Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Edit Production Run</h1>
                        <p className="text-slate-600">{run?.production_number}</p>
                    </div>
                </div>
                <Badge variant="secondary">Planned</Badge>
            </div>

            {/* Planning Section */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Production Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Formula</label>
                            <select
                                value={selectedFormulaId}
                                disabled
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-slate-100 cursor-not-allowed"
                            >
                                <option value="">Select a formula...</option>
                                {formulas.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Formula cannot be changed after creation</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Production Date</label>
                            <input
                                type="date"
                                value={productionDate}
                                onChange={(e) => setProductionDate(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Output (kg) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={targetOutput}
                                onChange={(e) => setTargetOutput(e.target.value)}
                                placeholder="e.g. 5000"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
                            <select
                                value={selectedWarehouseId}
                                disabled
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-slate-100 cursor-not-allowed"
                            >
                                <option value="">Select a warehouse...</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Warehouse cannot be changed after creation</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                            <input
                                type="text"
                                value={batchNumber}
                                onChange={(e) => setBatchNumber(e.target.value)}
                                placeholder="e.g. BATCH-2026-001"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Any additional notes..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Inputs Table */}
            {inputLines.length > 0 && (
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Input Materials (Recalculated)</h2>

                        {insufficientCount > 0 && (
                            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span>⚠</span>
                                        <span>Insufficient stock for {insufficientCount} item{insufficientCount > 1 ? 's' : ''}.</span>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => navigate('/inventory')}
                                        className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-100"
                                    >
                                        Add Stock →
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-600">
                                        <th className="pb-3 pr-4 font-medium">Raw Material</th>
                                        <th className="pb-3 pr-4 font-medium text-right">Percentage</th>
                                        <th className="pb-3 pr-4 font-medium text-right">Planned Qty (kg)</th>
                                        <th className="pb-3 pr-4 font-medium text-right">Available Stock</th>
                                        <th className="pb-3 pr-4 font-medium text-center">Status</th>
                                        <th className="pb-3 pr-4 font-medium text-right">Unit Cost</th>
                                        <th className="pb-3 font-medium text-right">Line Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inputLines.map((line, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-3 pr-4 text-slate-900 font-medium">{line.product_name}</td>
                                            <td className="py-3 pr-4 text-right text-slate-700">{line.percentage}%</td>
                                            <td className="py-3 pr-4 text-right text-slate-700">{Number(line.plannedQty).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 pr-4 text-right text-slate-700">{Number(line.available_stock).toLocaleString('en-NG')}</td>
                                            <td className="py-3 pr-4 text-center">
                                                {line.sufficient ? (
                                                    <Badge variant="success">OK</Badge>
                                                ) : (
                                                    <Badge variant="danger">Low</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-right text-slate-700">{fmt(line.unit_price)}</td>
                                            <td className="py-3 text-right text-slate-900 font-medium">{fmt(line.lineCost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-300">
                                        <td className="pt-3 pr-4 font-semibold text-slate-900">Total</td>
                                        <td className="pt-3 pr-4"></td>
                                        <td className="pt-3 pr-4 text-right font-semibold text-slate-900">{Number(totalPlannedInput).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                                        <td className="pt-3 pr-4" colSpan={3}></td>
                                        <td className="pt-3 text-right font-semibold text-slate-900">{fmt(totalEstimatedCost)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Cost Summary */}
            {inputLines.length > 0 && (
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Cost Summary</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Total Raw Material Cost</span>
                                <span className="text-lg font-semibold text-slate-900">{fmt(totalEstimatedCost)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Estimated Cost Per Kg</span>
                                <span className="text-lg font-semibold text-slate-900">{fmt(costPerKg)}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => navigate('/production')}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!targetOutput || submitting}
                >
                    {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
