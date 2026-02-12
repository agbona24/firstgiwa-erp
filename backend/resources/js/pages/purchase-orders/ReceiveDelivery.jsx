import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const mockPOs = [
    { id: 1, po_number: 'PO-2026-001', supplier: 'Agricorp Ltd', date: '2026-01-28', total: 9410000, delivery_status: 'partial', items: [
        { id: 1, product: 'Maize (Yellow Corn)', ordered: 10000, unit: 'kg', received_so_far: 6000, remaining: 4000, unit_cost: 380 },
        { id: 2, product: 'Soybean Meal', ordered: 5000, unit: 'kg', received_so_far: 5000, remaining: 0, unit_cost: 520 },
        { id: 3, product: 'Fish Meal', ordered: 2000, unit: 'kg', received_so_far: 0, remaining: 2000, unit_cost: 1200 },
    ]},
    { id: 2, po_number: 'PO-2026-002', supplier: 'Farm Direct Supplies', date: '2026-01-25', total: 4040000, delivery_status: 'pending', items: [
        { id: 4, product: 'Groundnut Oil (25L)', ordered: 80, unit: 'drums', received_so_far: 0, remaining: 80, unit_cost: 28000 },
        { id: 5, product: 'Wheat Offal', ordered: 3000, unit: 'kg', received_so_far: 0, remaining: 3000, unit_cost: 200 },
    ]},
    { id: 3, po_number: 'PO-2026-005', supplier: 'Import Solutions Ltd', date: '2026-01-15', total: 15000000, delivery_status: 'pending', items: [
        { id: 6, product: 'Fish Meal (Imported)', ordered: 10000, unit: 'kg', received_so_far: 0, remaining: 10000, unit_cost: 1500 },
    ]},
];

const todayStr = new Date().toISOString().split('T')[0];

export default function ReceiveDelivery() {
    const navigate = useNavigate();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPOId, setSelectedPOId] = useState(null);
    const [receivedQtys, setReceivedQtys] = useState({});
    const [conditions, setConditions] = useState({});
    const [deliveryDetails, setDeliveryDetails] = useState({
        delivery_date: todayStr,
        vehicle_number: '',
        driver_name: '',
        waybill_number: '',
        notes: '',
    });

    const selectedPO = mockPOs.find(po => po.id === selectedPOId);

    const filteredPOs = useMemo(() => {
        if (!searchQuery) return mockPOs;
        const q = searchQuery.toLowerCase();
        return mockPOs.filter(po =>
            po.po_number.toLowerCase().includes(q) ||
            po.supplier.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const handleSelectPO = (po) => {
        setSelectedPOId(po.id);
        const qtys = {};
        const conds = {};
        po.items.forEach(item => {
            qtys[item.id] = 0;
            conds[item.id] = 'Good';
        });
        setReceivedQtys(qtys);
        setConditions(conds);
    };

    const updateQty = (itemId, value, max) => {
        const num = Math.max(0, Math.min(Number(value) || 0, max));
        setReceivedQtys(prev => ({ ...prev, [itemId]: num }));
    };

    const updateCondition = (itemId, value) => {
        setConditions(prev => ({ ...prev, [itemId]: value }));
    };

    const updateDelivery = (field, value) => {
        setDeliveryDetails(prev => ({ ...prev, [field]: value }));
    };

    const itemsBeingReceived = useMemo(() => {
        if (!selectedPO) return [];
        return selectedPO.items.filter(item => (receivedQtys[item.id] || 0) > 0);
    }, [selectedPO, receivedQtys]);

    const batchPreviews = useMemo(() => {
        const dateStr = (deliveryDetails.delivery_date || todayStr).replace(/-/g, '');
        return itemsBeingReceived.map((item, idx) => ({
            batch_number: `BTH-${dateStr}-${String(idx + 1).padStart(3, '0')}`,
            product: item.product,
            quantity: receivedQtys[item.id],
            unit: item.unit,
            unit_cost: item.unit_cost,
        }));
    }, [itemsBeingReceived, receivedQtys, deliveryDetails.delivery_date]);

    const overallProgress = useMemo(() => {
        if (!selectedPO) return 0;
        const totalOrdered = selectedPO.items.reduce((s, i) => s + i.ordered, 0);
        const totalReceived = selectedPO.items.reduce((s, i) => s + i.received_so_far, 0);
        return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    }, [selectedPO]);

    const handleSubmit = () => {
        if (itemsBeingReceived.length === 0) {
            toast.error('Please enter a quantity for at least one item.');
            return;
        }
        const count = itemsBeingReceived.length;
        toast.success(`Delivery received. ${count} batch${count > 1 ? 'es' : ''} created. Inventory updated.`);
        navigate('/purchase-orders');
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Receive Delivery</h1>
                    <p className="text-slate-600 mt-1">Record incoming deliveries against purchase orders</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </Button>
            </div>

            {/* PO Selection */}
            {!selectedPO && (
                <div>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by PO number or supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-96 px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPOs.map(po => (
                            <Card
                                key={po.id}
                                className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                                onClick={() => handleSelectPO(po)}
                            >
                                <CardBody>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono font-semibold text-blue-600">{po.po_number}</span>
                                        <Badge variant={po.delivery_status === 'partial' ? 'pending' : 'draft'}>
                                            {po.delivery_status === 'partial' ? 'Partial' : 'Pending'}
                                        </Badge>
                                    </div>
                                    <p className="font-medium text-slate-900">{po.supplier}</p>
                                    <p className="text-sm text-slate-500 mt-1">{new Date(po.date).toLocaleDateString()}</p>
                                    <p className="text-lg font-bold text-slate-900 mt-2">{fmt(po.total)}</p>
                                    <p className="text-xs text-slate-500 mt-1">{po.items.length} item{po.items.length > 1 ? 's' : ''} &middot; {po.items.filter(i => i.remaining > 0).length} pending delivery</p>
                                </CardBody>
                            </Card>
                        ))}
                        {filteredPOs.length === 0 && (
                            <p className="text-slate-500 col-span-full text-center py-8">No matching purchase orders found.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Selected PO Details */}
            {selectedPO && (
                <div className="space-y-6">
                    {/* PO Summary */}
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-900">{selectedPO.po_number}</h2>
                                        <Badge variant={selectedPO.delivery_status === 'partial' ? 'pending' : 'draft'}>
                                            {selectedPO.delivery_status === 'partial' ? 'Partial Delivery' : 'Pending Delivery'}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-600 mt-1">{selectedPO.supplier}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Order Date</p>
                                    <p className="font-medium">{new Date(selectedPO.date).toLocaleDateString()}</p>
                                    <p className="text-lg font-bold text-slate-900 mt-1">{fmt(selectedPO.total)}</p>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                                    <span>Overall Delivery Progress</span>
                                    <span className="font-semibold">{overallProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                                        style={{ width: `${overallProgress}%` }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPOId(null)}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Change PO
                            </button>
                        </CardBody>
                    </Card>

                    {/* Items Table */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Order Items</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Ordered</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Previously Received</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Remaining</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Receive Now</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Condition</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {selectedPO.items.map(item => {
                                            const fullyReceived = item.remaining === 0;
                                            const itemProgress = Math.round((item.received_so_far / item.ordered) * 100);
                                            return (
                                                <tr key={item.id} className={fullyReceived ? 'bg-slate-50 opacity-60' : ''}>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            {fullyReceived && (
                                                                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            <span className="font-medium text-slate-900">{item.product}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-mono">
                                                        {item.ordered.toLocaleString()} {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-mono">
                                                        {item.received_so_far.toLocaleString()} {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                                                        {item.remaining.toLocaleString()} {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {fullyReceived ? (
                                                            <span className="text-sm text-green-600 font-medium">Complete</span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.remaining}
                                                                value={receivedQtys[item.id] || 0}
                                                                onChange={(e) => updateQty(item.id, e.target.value, item.remaining)}
                                                                className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-center font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {fullyReceived ? (
                                                            <span className="text-sm text-slate-400">-</span>
                                                        ) : (
                                                            <select
                                                                value={conditions[item.id] || 'Good'}
                                                                onChange={(e) => updateCondition(item.id, e.target.value)}
                                                                className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                                                            >
                                                                <option value="Good">Good</option>
                                                                <option value="Damaged">Damaged</option>
                                                                <option value="Short">Short</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 bg-slate-200 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full ${fullyReceived ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                    style={{ width: `${itemProgress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-500 font-mono">{itemProgress}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Delivery Details */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Delivery Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date *</label>
                                    <input
                                        type="date"
                                        value={deliveryDetails.delivery_date}
                                        onChange={(e) => updateDelivery('delivery_date', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={deliveryDetails.vehicle_number}
                                        onChange={(e) => updateDelivery('vehicle_number', e.target.value)}
                                        placeholder="e.g. LAG-234-XY"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                                    <input
                                        type="text"
                                        value={deliveryDetails.driver_name}
                                        onChange={(e) => updateDelivery('driver_name', e.target.value)}
                                        placeholder="Driver's full name"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Waybill Number</label>
                                    <input
                                        type="text"
                                        value={deliveryDetails.waybill_number}
                                        onChange={(e) => updateDelivery('waybill_number', e.target.value)}
                                        placeholder="Waybill/delivery note number"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Condition Remarks</label>
                                    <textarea
                                        value={deliveryDetails.notes}
                                        onChange={(e) => updateDelivery('notes', e.target.value)}
                                        rows={3}
                                        placeholder="Any observations about the delivery condition, discrepancies, etc."
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Batch Creation Preview */}
                    {batchPreviews.length > 0 && (
                        <Card className="border-l-4 border-blue-500">
                            <CardBody>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Batch Creation Preview</h3>
                                <p className="text-sm text-slate-500 mb-4">Inventory batches will be created automatically upon receipt.</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-blue-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Batch Number</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Product</th>
                                                <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">Quantity</th>
                                                <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">Unit Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {batchPreviews.map((batch, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 text-sm font-mono text-blue-600 font-semibold">{batch.batch_number}</td>
                                                    <td className="px-4 py-2 text-sm font-medium text-slate-900">{batch.product}</td>
                                                    <td className="px-4 py-2 text-sm text-right font-mono">{batch.quantity.toLocaleString()} {batch.unit}</td>
                                                    <td className="px-4 py-2 text-sm text-right font-mono">{fmt(batch.unit_cost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Receipt
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
