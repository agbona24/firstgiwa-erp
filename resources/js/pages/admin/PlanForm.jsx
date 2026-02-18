import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPlan, getPlan, updatePlan } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export default function PlanForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { t } = useAdminTheme();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        name: '',
        slug: '',
        price: '',
        billing_period: 'month',
        description: '',
        max_users: '',
        max_branches: '',
        max_products: '',
        max_monthly_transactions: '',
        is_highlighted: false,
        badge: '',
        button_text: 'Get Started',
        sort_order: 0,
        features: [{ text: '', included: true }],
    });

    useEffect(() => {
        if (isEdit) loadPlan();
    }, [id]);

    const loadPlan = async () => {
        setLoading(true);
        try {
            const res = await getPlan(id);
            const plan = res?.data?.plan || res?.data;
            setForm({
                name: plan.name || '',
                slug: plan.slug || '',
                price: plan.price || '',
                billing_period: plan.billing_period || 'month',
                description: plan.description || '',
                max_users: plan.max_users || '',
                max_branches: plan.max_branches || '',
                max_products: plan.max_products || '',
                max_monthly_transactions: plan.max_monthly_transactions || '',
                is_highlighted: plan.is_highlighted || false,
                badge: plan.badge || '',
                button_text: plan.button_text || 'Get Started',
                sort_order: plan.sort_order || 0,
                features: plan.features?.length ? plan.features : [{ text: '', included: true }],
            });
        } catch (err) {
            console.error('Failed to load plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (field === 'name' && !isEdit) {
            setForm((prev) => ({
                ...prev,
                [field]: value,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            }));
        }
    };

    const handleFeatureChange = (index, field, value) => {
        const updated = [...form.features];
        updated[index] = { ...updated[index], [field]: value };
        setForm((prev) => ({ ...prev, features: updated }));
    };

    const addFeature = () => {
        setForm((prev) => ({ ...prev, features: [...prev.features, { text: '', included: true }] }));
    };

    const removeFeature = (index) => {
        setForm((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        const data = {
            ...form,
            price: parseFloat(form.price) || 0,
            max_users: form.max_users ? parseInt(form.max_users) : null,
            max_branches: form.max_branches ? parseInt(form.max_branches) : null,
            max_products: form.max_products ? parseInt(form.max_products) : null,
            max_monthly_transactions: form.max_monthly_transactions ? parseInt(form.max_monthly_transactions) : null,
            sort_order: parseInt(form.sort_order) || 0,
            features: form.features.filter((f) => f.text.trim()),
        };

        try {
            if (isEdit) {
                await updatePlan(id, data);
            } else {
                await createPlan(data);
            }
            navigate('/admin/plans');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: err.response?.data?.message || 'Failed to save plan' });
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={`p-12 text-center ${t.textSecondary}`}>Loading...</div>;
    }

    const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${t.inputBg} ${t.inputText} ${t.inputPlaceholder} ${t.inputFocus}`;
    const labelClass = `block text-sm font-medium mb-1 ${t.textLabel}`;

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>
                        {isEdit ? 'Edit Plan' : 'Create Plan'}
                    </h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>
                        {isEdit ? 'Update plan details' : 'Add a new subscription plan'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/plans')}
                    className={`px-4 py-2 rounded-lg text-sm ${t.btnSecondary}`}
                >
                    Back
                </button>
            </div>

            {errors.general && (
                <div className="p-3 rounded-lg bg-red-500/20 text-red-500 text-sm">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className={`rounded-xl border p-6 space-y-4 ${t.cardBg}`}>
                    <h2 className={`text-lg font-semibold ${t.textPrimary}`}>Basic Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Name *</label>
                            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} required />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Slug *</label>
                            <input type="text" value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} className={inputClass} required />
                            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Price *</label>
                            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Billing Period *</label>
                            <select value={form.billing_period} onChange={(e) => handleChange('billing_period', e.target.value)} className={inputClass}>
                                <option value="month">Monthly</option>
                                <option value="year">Yearly</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={2} className={inputClass} />
                    </div>
                </div>

                {/* Limits */}
                <div className={`rounded-xl border p-6 space-y-4 ${t.cardBg}`}>
                    <h2 className={`text-lg font-semibold ${t.textPrimary}`}>Limits</h2>
                    <p className={`text-xs ${t.textMuted}`}>Leave blank for unlimited</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Max Users</label>
                            <input type="number" min="1" value={form.max_users} onChange={(e) => handleChange('max_users', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Max Branches</label>
                            <input type="number" min="1" value={form.max_branches} onChange={(e) => handleChange('max_branches', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Max Products</label>
                            <input type="number" min="1" value={form.max_products} onChange={(e) => handleChange('max_products', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Max Monthly Transactions</label>
                            <input type="number" min="1" value={form.max_monthly_transactions} onChange={(e) => handleChange('max_monthly_transactions', e.target.value)} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className={`rounded-xl border p-6 space-y-4 ${t.cardBg}`}>
                    <div className="flex items-center justify-between">
                        <h2 className={`text-lg font-semibold ${t.textPrimary}`}>Features</h2>
                        <button type="button" onClick={addFeature} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            + Add Feature
                        </button>
                    </div>
                    <div className="space-y-2">
                        {form.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleFeatureChange(i, 'included', !feature.included)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                        feature.included
                                            ? 'bg-emerald-500/20 text-emerald-500'
                                            : 'bg-red-500/20 text-red-500'
                                    }`}
                                >
                                    {feature.included ? '✓' : '✗'}
                                </button>
                                <input
                                    type="text"
                                    value={feature.text}
                                    onChange={(e) => handleFeatureChange(i, 'text', e.target.value)}
                                    placeholder="Feature description"
                                    className={`flex-1 ${inputClass}`}
                                />
                                {form.features.length > 1 && (
                                    <button type="button" onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-400 text-sm">
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Display Options */}
                <div className={`rounded-xl border p-6 space-y-4 ${t.cardBg}`}>
                    <h2 className={`text-lg font-semibold ${t.textPrimary}`}>Display Options</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Badge Text</label>
                            <input type="text" value={form.badge} onChange={(e) => handleChange('badge', e.target.value)} placeholder="e.g. Most Popular" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Button Text</label>
                            <input type="text" value={form.button_text} onChange={(e) => handleChange('button_text', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Sort Order</label>
                            <input type="number" value={form.sort_order} onChange={(e) => handleChange('sort_order', e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_highlighted}
                                    onChange={(e) => handleChange('is_highlighted', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300"
                                />
                                <span className={`text-sm ${t.textPrimary}`}>Highlight this plan</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/plans')}
                        className={`px-6 py-2 rounded-lg text-sm ${t.btnSecondary}`}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
