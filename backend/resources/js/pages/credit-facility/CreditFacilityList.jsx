import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import customerAPI, { creditAnalyticsAPI } from '../../services/customerAPI';
import { creditFacilityTypesAPI } from '../../services/settingsAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

export default function CreditFacilityList() {
    const toast = useToast();
    const [customers, setCustomers] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]);
    const [facilityTypes, setFacilityTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssign, setShowAssign] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAnalytics, setCustomerAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, payments

    const [form, setForm] = useState({
        customer_id: '',
        facility_type_id: '',
        credit_limit: '',
        payment_terms_days: 30,
    });

    const [selectedFacilityType, setSelectedFacilityType] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [customersRes, typesRes] = await Promise.all([
                customerAPI.getCustomers({ per_page: 1000 }), // Get all customers
                creditFacilityTypesAPI.getAll()
            ]);
            
            // Handle paginated response - customers are in .data property
            const customerList = customersRes?.data || customersRes || [];
            console.log('Customers loaded:', customerList.length, customerList);
            setAllCustomers(customerList);
            
            // Filter to only show customers with credit type or credit limit > 0
            // Note: customer types can be credit, wholesale, retail, distributor, walk-in
            const creditCustomers = customerList.filter(c => 
                c.customer_type === 'credit' || 
                c.customer_type === 'wholesale' ||
                c.customer_type === 'distributor' ||
                parseFloat(c.credit_limit) > 0
            );
            setCustomers(creditCustomers);

            // Get active facility types
            const types = typesRes.data?.data || typesRes.data || [];
            setFacilityTypes(types.filter(t => t.is_active));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Handle facility type selection
    const handleFacilityTypeChange = (typeId) => {
        const selected = facilityTypes.find(t => t.id === parseInt(typeId));
        setSelectedFacilityType(selected);
        
        if (selected) {
            // Convert payment terms to days for storage
            let termsInDays = selected.payment_terms;
            if (selected.payment_terms_unit === 'weeks') {
                termsInDays = selected.payment_terms * 7;
            } else if (selected.payment_terms_unit === 'months') {
                termsInDays = selected.payment_terms * 30;
            }
            
            setForm(prev => ({
                ...prev,
                facility_type_id: typeId,
                credit_limit: selected.default_limit,
                payment_terms_days: termsInDays,
            }));
        } else {
            setForm(prev => ({
                ...prev,
                facility_type_id: '',
                credit_limit: '',
                payment_terms_days: 30,
            }));
            setSelectedFacilityType(null);
        }
    };

    const getCustomerStatus = (customer) => {
        if (customer.credit_blocked) return 'blocked';
        const utilization = customer.credit_limit > 0 
            ? (parseFloat(customer.outstanding_balance) / parseFloat(customer.credit_limit)) * 100 
            : 0;
        if (utilization >= 90) return 'warning';
        return 'active';
    };

    const handleView = async (customer) => {
        setSelectedCustomer({ ...customer });
        setActiveTab('overview');
        setCustomerAnalytics(null);
        setShowDetail(true);
        
        // Fetch credit analytics
        try {
            setLoadingAnalytics(true);
            const analytics = await customerAPI.getCreditAnalytics(customer.id);
            console.log('Credit analytics loaded:', analytics);
            setCustomerAnalytics(analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Analytics will be null, show basic info
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleRecalculateScore = async () => {
        if (!selectedCustomer) return;
        try {
            setLoadingAnalytics(true);
            const score = await customerAPI.recalculateCreditScore(selectedCustomer.id);
            setCustomerAnalytics(prev => prev ? { ...prev, credit_score: score } : null);
            toast.success('Credit score recalculated');
        } catch (error) {
            toast.error('Failed to recalculate score');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleApplyRecommendations = async () => {
        if (!selectedCustomer || !customerAnalytics?.credit_score) return;
        try {
            const result = await customerAPI.applyCreditRecommendations(selectedCustomer.id);
            toast.success('Recommendations applied successfully');
            fetchData();
            // Update selected customer
            setSelectedCustomer(prev => ({
                ...prev,
                credit_limit: result.data.new_limit,
                payment_terms_days: result.data.new_terms,
            }));
        } catch (error) {
            toast.error('Failed to apply recommendations');
        }
    };

    const handleToggleStatus = async (customer) => {
        try {
            const newBlocked = !customer.credit_blocked;
            await customerAPI.toggleCreditBlock(
                customer.id, 
                newBlocked, 
                newBlocked ? 'Credit blocked by admin' : 'Credit unblocked by admin'
            );
            toast.success(`Credit ${newBlocked ? 'blocked' : 'unblocked'} for ${customer.name}`);
            fetchData();
            setShowDetail(false);
        } catch (error) {
            console.error('Error toggling credit status:', error);
            toast.error('Failed to update credit status');
        }
    };

    const handleAssign = async () => {
        if (!form.customer_id || !form.credit_limit) {
            toast.error('Please select a customer and set a credit limit');
            return;
        }

        try {
            setSaving(true);
            await customerAPI.updateCredit(form.customer_id, {
                credit_limit: parseFloat(form.credit_limit),
                payment_terms_days: parseInt(form.payment_terms_days) || 30,
                facility_type_id: form.facility_type_id || null,
            });
            toast.success('Credit facility assigned successfully');
            setShowAssign(false);
            setForm({ customer_id: '', facility_type_id: '', credit_limit: '', payment_terms_days: 30 });
            setSelectedFacilityType(null);
            fetchData();
        } catch (error) {
            console.error('Error assigning credit:', error);
            toast.error('Failed to assign credit facility');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCredit = async () => {
        if (!selectedCustomer) return;
        
        try {
            setSaving(true);
            await customerAPI.updateCredit(selectedCustomer.id, {
                credit_limit: parseFloat(selectedCustomer.credit_limit),
                payment_terms_days: parseInt(selectedCustomer.payment_terms_days) || 30,
            });
            toast.success('Credit facility updated successfully');
            fetchData();
        } catch (error) {
            console.error('Error updating credit:', error);
            toast.error('Failed to update credit facility');
        } finally {
            setSaving(false);
        }
    };

    // Filter customers based on status
    const filtered = filterStatus === 'all' 
        ? customers 
        : customers.filter(c => getCustomerStatus(c) === filterStatus);

    // Calculate stats
    const totalLimit = customers.reduce((s, c) => s + parseFloat(c.credit_limit || 0), 0);
    const totalUsed = customers.reduce((s, c) => s + parseFloat(c.outstanding_balance || 0), 0);
    const activeCount = customers.filter(c => getCustomerStatus(c) === 'active').length;
    const warningCount = customers.filter(c => getCustomerStatus(c) === 'warning').length;
    const blockedCount = customers.filter(c => getCustomerStatus(c) === 'blocked').length;

    const columns = [
        { 
            key: 'name', 
            header: 'Customer', 
            sortable: true,
            render: (value, row) => (
                <div>
                    <span className="font-medium text-slate-900">{value}</span>
                    <span className="text-xs text-slate-500 ml-2">{row.customer_code}</span>
                </div>
            )
        },
        { 
            key: 'customer_type', 
            header: 'Type', 
            render: (v) => (
                <Badge variant={v === 'credit' ? 'approved' : 'draft'}>
                    {v === 'credit' ? 'Credit' : 'Cash'}
                </Badge>
            )
        },
        { 
            key: 'credit_limit', 
            header: 'Credit Limit', 
            sortable: true, 
            render: (v) => <span className="font-medium">{fmt(v)}</span> 
        },
        { 
            key: 'outstanding_balance', 
            header: 'Utilization', 
            render: (_, row) => {
                const limit = parseFloat(row.credit_limit) || 0;
                const used = parseFloat(row.outstanding_balance) || 0;
                const pct = limit > 0 ? (used / limit * 100) : 0;
                return (
                    <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{fmt(used)}</span>
                            <span className={pct >= 90 ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                                {pct.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full ${
                                    pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                }`} 
                                style={{ width: `${Math.min(pct, 100)}%` }} 
                            />
                        </div>
                    </div>
                );
            }
        },
        { 
            key: 'payment_terms_days', 
            header: 'Terms', 
            render: (v) => `${v || 0} days` 
        },
        { 
            key: 'status', 
            header: 'Status', 
            render: (_, row) => {
                const status = getCustomerStatus(row);
                return (
                    <Badge variant={status === 'active' ? 'approved' : status === 'warning' ? 'pending' : 'rejected'}>
                        {status === 'active' ? 'Active' : status === 'warning' ? 'Near Limit' : 'Blocked'}
                    </Badge>
                );
            }
        },
    ];

    const actions = [
        { label: 'View', onClick: handleView },
        { 
            label: (row) => row.credit_blocked ? 'Unblock' : 'Block', 
            onClick: handleToggleStatus, 
            variant: (row) => row.credit_blocked ? 'warning' : 'danger'
        },
    ];

    // Export columns for CSV
    const exportColumns = [
        { key: 'name', label: 'Customer Name' },
        { key: 'customer_type', label: 'Type' },
        { key: 'credit_limit', label: 'Credit Limit' },
        { key: 'outstanding_balance', label: 'Outstanding Balance' },
        { key: 'payment_terms_days', label: 'Payment Terms (Days)' },
        { key: 'credit_blocked', label: 'Blocked' },
    ];

    // Bulk action handlers
    const handleBulkBlock = async (selectedIndices) => {
        const selected = selectedIndices.map(i => filtered[i]).filter(c => !c.credit_blocked);
        if (selected.length === 0) {
            toast.error('No active facilities selected');
            return;
        }
        let successCount = 0;
        for (const customer of selected) {
            try {
                await customerAPI.toggleCreditBlock(customer.id, true, 'Bulk blocked by admin');
                successCount++;
            } catch (error) {
                console.error(`Failed to block ${customer.id}:`, error);
            }
        }
        toast.success(`${successCount} credit facilities blocked`);
        fetchData();
    };

    const handleBulkUnblock = async (selectedIndices) => {
        const selected = selectedIndices.map(i => filtered[i]).filter(c => c.credit_blocked);
        if (selected.length === 0) {
            toast.error('No blocked facilities selected');
            return;
        }
        let successCount = 0;
        for (const customer of selected) {
            try {
                await customerAPI.toggleCreditBlock(customer.id, false, 'Bulk unblocked by admin');
                successCount++;
            } catch (error) {
                console.error(`Failed to unblock ${customer.id}:`, error);
            }
        }
        toast.success(`${successCount} credit facilities unblocked`);
        fetchData();
    };

    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => exportSelectedToCSV(selectedIndices, filtered, exportColumns, 'credit_facilities'),
        },
        {
            label: 'Block Selected',
            onClick: handleBulkBlock,
            variant: 'danger',
        },
        {
            label: 'Unblock Selected',
            onClick: handleBulkUnblock,
        },
    ];

    const inputClass = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm';
    const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Credit Facility</h1>
                    <p className="text-slate-600 mt-1">Assign and manage customer credit facilities</p>
                </div>
                <Button onClick={() => setShowAssign(true)}>+ Assign Credit Facility</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardBody className="p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total Credit Extended</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalLimit)}</p>
                </CardBody></Card>
                <Card><CardBody className="p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total Utilized</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalUsed)}</p>
                    <p className="text-xs text-slate-400">{totalLimit > 0 ? (totalUsed / totalLimit * 100).toFixed(1) : 0}% of total</p>
                </CardBody></Card>
                <Card><CardBody className="p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Active Facilities</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
                </CardBody></Card>
                <Card><CardBody className="p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Blocked</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{blockedCount}</p>
                </CardBody></Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'All', count: customers.length },
                    { key: 'active', label: 'Active', count: activeCount },
                    { key: 'warning', label: 'Near Limit', count: warningCount },
                    { key: 'blocked', label: 'Blocked', count: blockedCount },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filterStatus === tab.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Table */}
            <Card>
                <CardBody className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No credit facilities found. Assign credit to customers to see them here.
                        </div>
                    ) : (
                        <DataTable columns={columns} data={filtered} actions={actions} selectable bulkActions={bulkActions} />
                    )}
                </CardBody>
            </Card>

            {/* Assign Credit Facility SlideOut */}
            <SlideOut isOpen={showAssign} onClose={() => { setShowAssign(false); setSelectedFacilityType(null); }} title="Assign Credit Facility" size="lg">
                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        Select a customer and choose a credit facility type. The credit limit and terms will be pre-filled based on the facility type.
                    </div>

                    {/* Select Customer */}
                    <div>
                        <label className={labelClass}>Select Customer *</label>
                        <select 
                            value={form.customer_id} 
                            onChange={(e) => setForm({...form, customer_id: e.target.value})} 
                            className={inputClass}
                        >
                            <option value="">-- Choose a customer --</option>
                            {allCustomers
                                .filter(c => c.customer_type !== 'walk-in')
                                .map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} — {c.customer_code}
                                        {parseFloat(c.credit_limit) > 0 ? ` (Current: ${fmt(c.credit_limit)})` : ''}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Select Credit Facility Type */}
                    <div>
                        <label className={labelClass}>Credit Facility Type *</label>
                        <select 
                            value={form.facility_type_id} 
                            onChange={(e) => handleFacilityTypeChange(e.target.value)} 
                            className={inputClass}
                        >
                            <option value="">-- Choose a facility type --</option>
                            {facilityTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} ({type.code}) — {fmt(type.default_limit)}, {type.payment_terms} {type.payment_terms_unit || 'days'}
                                </option>
                            ))}
                        </select>
                        {facilityTypes.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                                No facility types defined. Go to Settings → Credit Facility to create some.
                            </p>
                        )}
                    </div>

                    {/* Show Facility Type Details */}
                    {selectedFacilityType && (
                        <Card className="border-2 border-blue-200">
                            <CardBody className="p-4 bg-blue-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-slate-800">{selectedFacilityType.name}</h4>
                                    <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{selectedFacilityType.code}</span>
                                </div>
                                {selectedFacilityType.description && (
                                    <p className="text-sm text-slate-600 mb-3">{selectedFacilityType.description}</p>
                                )}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Default Credit Limit</p>
                                        <p className="text-lg font-bold text-green-600">{fmt(selectedFacilityType.default_limit)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Maximum Limit</p>
                                        <p className="text-lg font-bold text-slate-800">{fmt(selectedFacilityType.max_limit)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Payment Terms</p>
                                        <p className="text-lg font-bold text-blue-600">{selectedFacilityType.payment_terms} {selectedFacilityType.payment_terms_unit || 'days'}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Interest Rate</p>
                                        <p className="text-lg font-bold text-amber-600">
                                            {parseFloat(selectedFacilityType.interest_rate) > 0 ? `${selectedFacilityType.interest_rate}%` : 'None'}
                                        </p>
                                    </div>
                                </div>
                                {selectedFacilityType.grace_period > 0 && (
                                    <div className="mt-3 text-sm text-slate-600">
                                        <span className="text-slate-500">Grace Period:</span> {selectedFacilityType.grace_period} {selectedFacilityType.grace_period_unit || 'days'} after due date
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* Adjustable Credit Limit (can override default) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Credit Limit * {selectedFacilityType && <span className="text-slate-400 font-normal">(adjustable)</span>}</label>
                            <input 
                                type="number" 
                                min="0" 
                                max={selectedFacilityType?.max_limit || undefined}
                                value={form.credit_limit} 
                                onChange={(e) => setForm({...form, credit_limit: e.target.value})} 
                                className={inputClass}
                                placeholder="e.g. 1000000"
                            />
                            {selectedFacilityType && parseFloat(form.credit_limit) > parseFloat(selectedFacilityType.max_limit) && (
                                <p className="text-xs text-red-500 mt-1">
                                    Exceeds max limit of {fmt(selectedFacilityType.max_limit)}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>Payment Terms (days)</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="365" 
                                value={form.payment_terms_days} 
                                onChange={(e) => setForm({...form, payment_terms_days: e.target.value})} 
                                className={inputClass}
                                readOnly={!!selectedFacilityType}
                            />
                            {selectedFacilityType && (
                                <p className="text-xs text-slate-400 mt-1">Based on facility type</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button 
                            onClick={handleAssign} 
                            disabled={saving || !form.customer_id || !form.credit_limit || (selectedFacilityType && parseFloat(form.credit_limit) > parseFloat(selectedFacilityType.max_limit))}
                        >
                            {saving ? 'Saving...' : 'Assign Facility'}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowAssign(false); setSelectedFacilityType(null); }}>Cancel</Button>
                    </div>
                </div>
            </SlideOut>

            {/* Detail SlideOut */}
            <SlideOut isOpen={showDetail} onClose={() => setShowDetail(false)} title="Credit Facility Details" size="lg">
                {selectedCustomer && (
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                                <p className="text-sm text-slate-500">{selectedCustomer.customer_code} • {selectedCustomer.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {customerAnalytics?.credit_score && (
                                    <Badge variant={
                                        customerAnalytics.credit_score.risk_level === 'low' ? 'approved' :
                                        customerAnalytics.credit_score.risk_level === 'medium' ? 'pending' :
                                        customerAnalytics.credit_score.risk_level === 'high' ? 'pending' : 'rejected'
                                    }>
                                        {customerAnalytics.credit_score.risk_level?.toUpperCase()} RISK
                                    </Badge>
                                )}
                                <Badge variant={getCustomerStatus(selectedCustomer) === 'active' ? 'approved' : getCustomerStatus(selectedCustomer) === 'warning' ? 'pending' : 'rejected'}>
                                    {getCustomerStatus(selectedCustomer) === 'active' ? 'Active' : getCustomerStatus(selectedCustomer) === 'warning' ? 'Near Limit' : 'Blocked'}
                                </Badge>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="border-b border-slate-200">
                            <nav className="flex space-x-4">
                                {['overview', 'transactions', 'payments', 'settings'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === tab
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {loadingAnalytics ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-slate-500">Loading analytics...</span>
                            </div>
                        ) : (
                            <>
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Credit Score */}
                                        {customerAnalytics?.credit_score ? (
                                            <Card><CardBody className="p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-semibold text-slate-800">Credit Score</h4>
                                                    <Button variant="outline" size="sm" onClick={handleRecalculateScore} disabled={saving}>
                                                        Recalculate
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    {/* Score Gauge */}
                                                    <div className="relative w-32 h-32">
                                                        <svg className="w-32 h-32 transform -rotate-90">
                                                            <circle
                                                                cx="64" cy="64" r="56"
                                                                stroke="#e2e8f0" strokeWidth="12" fill="none"
                                                            />
                                                            <circle
                                                                cx="64" cy="64" r="56"
                                                                stroke={
                                                                    customerAnalytics.credit_score.credit_score >= 80 ? '#22c55e' :
                                                                    customerAnalytics.credit_score.credit_score >= 60 ? '#eab308' :
                                                                    customerAnalytics.credit_score.credit_score >= 40 ? '#f97316' : '#ef4444'
                                                                }
                                                                strokeWidth="12" fill="none"
                                                                strokeDasharray={`${(customerAnalytics.credit_score.credit_score / 100) * 352} 352`}
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <span className="text-3xl font-bold text-slate-900">
                                                                    {customerAnalytics.credit_score.credit_score}
                                                                </span>
                                                                <p className="text-xs text-slate-500">/ 100</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Score Details */}
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-slate-500">On-Time Rate</p>
                                                            <p className="text-lg font-semibold text-slate-900">
                                                                {parseFloat(customerAnalytics.credit_score.on_time_payment_rate || 0).toFixed(1)}%
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500">Avg Days to Pay</p>
                                                            <p className="text-lg font-semibold text-slate-900">
                                                                {parseFloat(customerAnalytics.credit_score.average_days_to_pay || 0).toFixed(0)} days
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500">Recommended Limit</p>
                                                            <p className="text-lg font-semibold text-green-600">
                                                                {fmt(customerAnalytics.credit_score.recommended_limit)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500">Recommended Terms</p>
                                                            <p className="text-lg font-semibold text-slate-900">
                                                                {customerAnalytics.credit_score.recommended_terms_days || 30} days
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {customerAnalytics.credit_score.recommendations && (
                                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-sm text-blue-800">
                                                            <strong>Recommendation:</strong> {customerAnalytics.credit_score.recommendations}
                                                        </p>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="mt-2"
                                                            onClick={handleApplyRecommendations}
                                                            disabled={saving}
                                                        >
                                                            Apply Recommendations
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardBody></Card>
                                        ) : (
                                            <Card><CardBody className="p-4 text-center text-slate-500">
                                                <p>No credit score data available.</p>
                                                <Button variant="outline" size="sm" className="mt-2" onClick={handleRecalculateScore}>
                                                    Calculate Score
                                                </Button>
                                            </CardBody></Card>
                                        )}

                                        {/* Utilization */}
                                        <Card><CardBody className="p-4">
                                            <h4 className="font-semibold text-slate-800 mb-3">Credit Utilization</h4>
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">Limit</p>
                                                    <p className="text-lg font-bold text-slate-900">{fmt(selectedCustomer.credit_limit)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">Outstanding</p>
                                                    <p className="text-lg font-bold text-blue-600">{fmt(selectedCustomer.outstanding_balance)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">Available</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {fmt(parseFloat(selectedCustomer.credit_limit) - parseFloat(selectedCustomer.outstanding_balance))}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3">
                                                {(() => {
                                                    const limit = parseFloat(selectedCustomer.credit_limit) || 0;
                                                    const used = parseFloat(selectedCustomer.outstanding_balance) || 0;
                                                    const pct = limit > 0 ? (used / limit * 100) : 0;
                                                    return (
                                                        <div 
                                                            className={`h-3 rounded-full ${
                                                                pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                                            }`} 
                                                            style={{ width: `${Math.min(pct, 100)}%` }} 
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        </CardBody></Card>

                                        {/* Payment Summary with Details */}
                                        {customerAnalytics?.summary && (
                                            <Card><CardBody className="p-4">
                                                <h4 className="font-semibold text-slate-800 mb-4">Payment Summary</h4>
                                                
                                                {/* Summary Cards */}
                                                <div className="grid grid-cols-5 gap-3 mb-4">
                                                    <div className="text-center p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                                                        <p className="text-2xl font-bold text-slate-900">
                                                            {customerAnalytics.summary.total_transactions || 0}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium">Total</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                                                        <p className="text-2xl font-bold text-green-600">
                                                            {customerAnalytics.summary.paid_transactions || 0}
                                                        </p>
                                                        <p className="text-xs text-green-600 font-medium">Paid</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {customerAnalytics.summary.partial_transactions || 0}
                                                        </p>
                                                        <p className="text-xs text-blue-600 font-medium">Partial</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                                                        <p className="text-2xl font-bold text-amber-600">
                                                            {customerAnalytics.summary.pending_transactions || 0}
                                                        </p>
                                                        <p className="text-xs text-amber-600 font-medium">Pending</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-red-50 rounded-lg border-2 border-red-200">
                                                        <p className="text-2xl font-bold text-red-600">
                                                            {customerAnalytics.summary.overdue_transactions || 0}
                                                        </p>
                                                        <p className="text-xs text-red-600 font-medium">Overdue</p>
                                                    </div>
                                                </div>

                                                {/* Detailed Breakdown */}
                                                {customerAnalytics?.recent_transactions?.length > 0 && (
                                                    <div className="border-t pt-4">
                                                        <p className="text-sm font-medium text-slate-700 mb-3">Transaction Breakdown:</p>
                                                        <div className="space-y-2">
                                                            {customerAnalytics.recent_transactions.map((txn) => {
                                                                const amount = parseFloat(txn.amount) || 0;
                                                                const balance = parseFloat(txn.balance_remaining) || 0;
                                                                const paid = parseFloat(txn.paid_amount) || (amount - balance);
                                                                const status = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';
                                                                
                                                                const statusConfig = {
                                                                    paid: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✓', label: 'Fully Paid' },
                                                                    partial: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '◐', label: 'Partial Payment' },
                                                                    pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '○', label: 'Awaiting Payment' },
                                                                    overdue: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '!', label: 'Overdue' }
                                                                };
                                                                const config = statusConfig[status];
                                                                
                                                                return (
                                                                    <div key={txn.id} className={`flex items-center justify-between p-3 rounded-lg ${config.bg} border ${config.border}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`text-lg ${config.text}`}>{config.icon}</span>
                                                                            <div>
                                                                                <p className="font-medium text-slate-800">{txn.reference_number}</p>
                                                                                <p className="text-xs text-slate-500">
                                                                                    {new Date(txn.transaction_date).toLocaleDateString()}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm text-slate-600">
                                                                                <span className="text-green-600 font-medium">{fmt(paid)}</span>
                                                                                <span className="text-slate-400"> / </span>
                                                                                <span>{fmt(amount)}</span>
                                                                            </p>
                                                                            <p className={`text-xs font-medium ${config.text}`}>
                                                                                {config.label}
                                                                                {balance > 0 && (
                                                                                    <span className="text-slate-500 ml-1">
                                                                                        (Bal: {fmt(balance)})
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        {/* Totals */}
                                                        <div className="mt-4 pt-3 border-t border-slate-200">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Total Credit Used:</span>
                                                                <span className="font-semibold text-slate-800">
                                                                    {fmt(customerAnalytics.summary.total_credit_used || 0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-sm mt-1">
                                                                <span className="text-slate-600">Total Paid:</span>
                                                                <span className="font-semibold text-green-600">
                                                                    {fmt(customerAnalytics.summary.total_paid || 0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-sm mt-1">
                                                                <span className="text-slate-600">Outstanding Balance:</span>
                                                                <span className={`font-semibold ${(customerAnalytics.summary.current_balance || 0) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                                                    {fmt(customerAnalytics.summary.current_balance || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardBody></Card>
                                        )}
                                    </div>
                                )}

                                {/* Transactions Tab */}
                                {activeTab === 'transactions' && (
                                    <div className="space-y-4">
                                        <Card><CardBody className="p-0">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Paid</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Balance</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {customerAnalytics?.recent_transactions?.length > 0 ? (
                                                        customerAnalytics.recent_transactions.map((txn) => {
                                                            const amount = parseFloat(txn.amount) || 0;
                                                            const balance = parseFloat(txn.balance_remaining) || 0;
                                                            const paid = parseFloat(txn.paid_amount) || (amount - balance);
                                                            return (
                                                                <tr key={txn.id} className="hover:bg-slate-50">
                                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                                        {txn.reference_number}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-slate-500">
                                                                        {new Date(txn.transaction_date).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-right text-slate-900">
                                                                        {fmt(amount)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-right text-green-600">
                                                                        {fmt(paid)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                                                                        {fmt(balance)}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <Badge variant={
                                                                            txn.status === 'paid' ? 'approved' :
                                                                            txn.status === 'overdue' ? 'rejected' :
                                                                            txn.status === 'partial' ? 'warning' : 
                                                                            txn.status === 'pending' ? 'pending' : 'default'
                                                                        }>
                                                                            {txn.status?.charAt(0).toUpperCase() + txn.status?.slice(1) || 'Unknown'}
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                                                No credit transactions found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </CardBody></Card>
                                    </div>
                                )}

                                {/* Payments Tab */}
                                {activeTab === 'payments' && (
                                    <div className="space-y-4">
                                        <Card><CardBody className="p-0">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {customerAnalytics?.recent_payments?.length > 0 ? (
                                                        customerAnalytics.recent_payments.map((payment, idx) => (
                                                            <tr key={payment.id || idx} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 text-sm text-slate-500">
                                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                                    {payment.reference || 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                                                                    {fmt(payment.amount)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-500 capitalize">
                                                                    {payment.payment_method || 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-500">
                                                                    {payment.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                                No payments recorded yet
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </CardBody></Card>
                                    </div>
                                )}

                                {/* Settings Tab */}
                                {activeTab === 'settings' && (
                                    <div className="space-y-6">
                                        {/* Edit Terms */}
                                        <Card><CardBody className="p-4">
                                            <h4 className="font-semibold text-slate-800 mb-3">Facility Terms</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>Credit Limit</label>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        value={selectedCustomer.credit_limit} 
                                                        onChange={(e) => setSelectedCustomer({
                                                            ...selectedCustomer, 
                                                            credit_limit: e.target.value
                                                        })} 
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Payment Terms (days)</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="365" 
                                                        value={selectedCustomer.payment_terms_days || 0} 
                                                        onChange={(e) => setSelectedCustomer({
                                                            ...selectedCustomer, 
                                                            payment_terms_days: e.target.value
                                                        })} 
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <Button onClick={handleUpdateCredit} disabled={saving}>
                                                    {saving ? 'Saving...' : 'Update Terms'}
                                                </Button>
                                            </div>
                                        </CardBody></Card>

                                        {/* Customer Info */}
                                        <Card><CardBody className="p-4">
                                            <h4 className="font-semibold text-slate-800 mb-3">Customer Info</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Customer ID:</span> 
                                                    <span className="font-medium ml-2">{selectedCustomer.customer_code || `CUST-${String(selectedCustomer.id).padStart(3, '0')}`}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Customer Type:</span> 
                                                    <span className="font-medium ml-2 capitalize">{selectedCustomer.customer_type}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Total Purchases:</span> 
                                                    <span className="font-medium ml-2">{fmt(selectedCustomer.total_purchases)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Credit Purchases:</span> 
                                                    <span className="font-medium ml-2 text-blue-600">{fmt(selectedCustomer.credit_purchases)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Others (Cash/POS):</span> 
                                                    <span className="font-medium ml-2 text-green-600">{fmt(selectedCustomer.other_purchases)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Email:</span> 
                                                    <span className="font-medium ml-2">{selectedCustomer.email || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Address:</span> 
                                                    <span className="font-medium ml-2">{selectedCustomer.address || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </CardBody></Card>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button 
                                variant={selectedCustomer.credit_blocked ? 'primary' : 'danger'} 
                                onClick={() => handleToggleStatus(selectedCustomer)}
                            >
                                {selectedCustomer.credit_blocked ? 'Unblock Credit' : 'Block Credit'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </SlideOut>
        </div>
    );
}
