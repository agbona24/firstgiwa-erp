import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import purchaseOrderAPI from '../../services/purchaseOrderAPI';
import supplierAPI from '../../services/supplierAPI';
import productAPI from '../../services/productAPI';
import warehouseAPI from '../../services/warehouseAPI';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const COUNTRIES = ['Nigeria', 'Ghana', 'Benin Republic', 'India', 'Brazil', 'China', 'USA'];
const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'];
const PAYMENT_TERMS = ['Advance', 'COD', 'Net 15', 'Net 30', 'Net 60'];

const emptyItem = { product_id: '', quantity: '', unit_price: '', tax_rate: 0 };

export default function CreatePurchaseOrder() {
    const navigate = useNavigate();
    const toast = useToast();

    // API data
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [originCountry, setOriginCountry] = useState('Nigeria');
    const [currency, setCurrency] = useState('NGN');
    const [exchangeRate, setExchangeRate] = useState('');
    const [items, setItems] = useState([{ ...emptyItem }]);
    const [shippingCost, setShippingCost] = useState('');
    const [customsDuty, setCustomsDuty] = useState('');
    const [otherCharges, setOtherCharges] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [notes, setNotes] = useState('');

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [suppliersRes, productsRes, warehousesRes] = await Promise.all([
                    supplierAPI.getAll({ per_page: 100, is_active: true }),
                    productAPI.getProducts({ per_page: 200 }),
                    warehouseAPI.getWarehouses({ is_active: true })
                ]);

                console.log('Suppliers response:', suppliersRes);
                console.log('Products response:', productsRes);
                console.log('Warehouses response:', warehousesRes);

                // Suppliers - paginated response with .data
                const supplierData = Array.isArray(suppliersRes) ? suppliersRes : (suppliersRes.data || []);
                setSuppliers(supplierData);

                // Products - paginated response with .data
                const productData = Array.isArray(productsRes) ? productsRes : (productsRes.data || []);
                setProducts(productData);

                // Warehouses - returns array directly
                const warehouseData = Array.isArray(warehousesRes) ? warehousesRes : (warehousesRes.data || []);
                setWarehouses(warehouseData);

                // Set default warehouse if only one
                if (warehouseData.length === 1) {
                    setWarehouseId(warehouseData[0].id.toString());
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isForeign = originCountry !== 'Nigeria';

    const updateItem = (index, field, value) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const lineTotal = (item) => (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + lineTotal(item), 0), [items]);

    const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [items]);

    const landedCost = useMemo(
        () => subtotal + (Number(shippingCost) || 0) + (isForeign ? Number(customsDuty) || 0 : 0) + (Number(otherCharges) || 0),
        [subtotal, shippingCost, customsDuty, otherCharges, isForeign]
    );

    const landedCostPerUnit = useMemo(() => (totalQuantity > 0 ? landedCost / totalQuantity : 0), [landedCost, totalQuantity]);

    const handleSubmit = async () => {
        // Validate required fields
        if (!supplierId) {
            toast.error('Please select a supplier');
            return;
        }
        if (!warehouseId) {
            toast.error('Please select a warehouse');
            return;
        }
        if (!orderDate) {
            toast.error('Please enter an order date');
            return;
        }

        // Validate items
        const validItems = items.filter(item => item.product_id && item.quantity && item.unit_price);
        if (validItems.length === 0) {
            toast.error('Please add at least one item with product, quantity, and price');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                supplier_id: parseInt(supplierId),
                warehouse_id: parseInt(warehouseId),
                order_date: orderDate,
                expected_delivery_date: deliveryDate || null,
                notes: notes || null,
                currency: currency,
                exchange_rate: currency !== 'NGN' ? parseFloat(exchangeRate) || 1 : 1,
                origin_country: originCountry,
                shipping_cost: parseFloat(shippingCost) || 0,
                customs_duty: isForeign ? parseFloat(customsDuty) || 0 : 0,
                other_charges: parseFloat(otherCharges) || 0,
                payment_terms: paymentTerms,
                items: validItems.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseFloat(item.quantity),
                    unit_price: parseFloat(item.unit_price),
                    tax_rate: parseFloat(item.tax_rate) || 0
                }))
            };

            const response = await purchaseOrderAPI.create(payload);

            if (response.data?.po_number) {
                toast.success(`Purchase Order ${response.data.po_number} created successfully`);
            } else {
                toast.success('Purchase Order created successfully');
            }
            navigate('/purchase-orders');
        } catch (error) {
            console.error('Error creating purchase order:', error);
            const message = error.response?.data?.message || 'Failed to create purchase order';
            const errors = error.response?.data?.errors;

            if (errors) {
                const firstError = Object.values(errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : message);
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getProductUnit = (productId) => {
        const product = products.find(p => p.id === parseInt(productId));
        return product?.unit?.abbreviation || product?.unit_of_measure || 'pcs';
    };

    const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition';
    const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Loading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/purchase-orders')}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Create Purchase Order</h1>
                </div>
            </div>

            {/* Supplier Section */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Supplier Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Supplier *</label>
                            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass}>
                                <option value="">Select supplier...</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse *</label>
                            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass}>
                                <option value="">Select warehouse...</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Order Date *</label>
                            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Expected Delivery Date</label>
                            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Origin Country</label>
                            <select value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} className={inputClass}>
                                {COUNTRIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Currency</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                                {CURRENCIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        {currency !== 'NGN' && (
                            <div>
                                <label className={labelClass}>Exchange Rate (1 {currency} = ? NGN)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1550.00"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        )}
                        {isForeign && (
                            <div className="flex items-end">
                                <Badge variant="pending">International Procurement</Badge>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Line Items Section */}
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Line Items</h2>
                        <Button size="sm" onClick={addItem}>+ Add Item</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 px-2 font-semibold text-slate-600">Product</th>
                                    <th className="text-left py-2 px-2 font-semibold text-slate-600 w-28">Quantity</th>
                                    <th className="text-left py-2 px-2 font-semibold text-slate-600 w-20">Unit</th>
                                    <th className="text-left py-2 px-2 font-semibold text-slate-600 w-36">Unit Price</th>
                                    <th className="text-right py-2 px-2 font-semibold text-slate-600 w-36">Line Total</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100">
                                        <td className="py-2 px-2">
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="">Select product...</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className={inputClass}
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-slate-600">
                                            {item.product_id ? getProductUnit(item.product_id) : '-'}
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                className={inputClass}
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-right font-medium text-slate-800">
                                            {fmt(lineTotal(item))}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-400 hover:text-red-600 transition"
                                                    title="Remove item"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-4 pt-3 border-t border-slate-200">
                        <div className="text-right">
                            <span className="text-sm text-slate-500">Subtotal:</span>
                            <span className="ml-3 text-lg font-bold text-slate-800">{fmt(subtotal)}</span>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Cost Breakdown Section */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Cost Breakdown</h2>
                    <div className="max-w-md space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Subtotal</span>
                            <span className="font-semibold text-slate-800">{fmt(subtotal)}</span>
                        </div>
                        <div>
                            <label className={labelClass}>Shipping Cost</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        {isForeign && (
                            <div>
                                <label className={labelClass}>Customs Duty</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={customsDuty}
                                    onChange={(e) => setCustomsDuty(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        )}
                        <div>
                            <label className={labelClass}>Other Charges</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={otherCharges}
                                onChange={(e) => setOtherCharges(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="pt-3 border-t-2 border-blue-200">
                            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                                <span className="text-sm font-bold text-blue-900">Landed Cost</span>
                                <span className="text-xl font-bold text-blue-900">{fmt(landedCost)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2 px-4">
                                <span className="text-xs text-slate-500">Landed Cost Per Unit</span>
                                <span className="text-sm font-semibold text-slate-700">{fmt(landedCostPerUnit)}</span>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Notes & Terms Section */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Notes & Terms</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Payment Terms</label>
                            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputClass}>
                                {PAYMENT_TERMS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Notes</label>
                            <textarea
                                rows={4}
                                placeholder="Add any additional notes or special instructions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pb-6">
                <Button variant="outline" onClick={() => navigate('/purchase-orders')} disabled={submitting}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Submit Purchase Order'}
                </Button>
            </div>
        </div>
    );
}
