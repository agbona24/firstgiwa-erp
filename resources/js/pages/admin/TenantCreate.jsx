import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTenant, getPlans } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export default function TenantCreate() {
    const navigate = useNavigate();
    const { isDark, t } = useAdminTheme();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [availablePlans, setAvailablePlans] = useState([]);

    useEffect(() => {
        getPlans({ per_page: 100 }).then((res) => {
            const payload = res?.data;
            const pageData = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
            const list = Array.isArray(pageData?.data) ? pageData.data : [];
            setAvailablePlans(list);
        }).catch(() => {});
    }, []);
    const [form, setForm] = useState({
        name: '', slug: '', email: '', phone: '', address: '',
        plan: 'starter', admin_name: '', admin_email: '',
    });

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (field === 'name' && !form.slug) {
            setForm(prev => ({
                ...prev, [field]: value,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await createTenant(form);
            navigate('/admin/tenants');
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = `w-full px-4 py-2 border rounded-lg text-sm ${t.inputBg} ${t.inputText} ${t.inputFocus}`;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Create Tenant</h1>
                <p className={`text-sm mt-1 ${t.textSecondary}`}>Set up a new organization on the platform</p>
            </div>

            <form onSubmit={handleSubmit} className={`border rounded-xl p-6 space-y-6 ${t.cardBg}`}>
                {/* Company Info */}
                <div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${t.textSecondary}`}>Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Company Name *</label>
                            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputCls} required />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Slug</label>
                            <input type="text" value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))} className={inputCls} placeholder="auto-generated" />
                            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>}
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Company Email *</label>
                            <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className={inputCls} required />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Phone</label>
                            <input type="text" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} className={inputCls} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className={`block text-sm mb-1 ${t.textLabel}`}>Address</label>
                        <textarea value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                    </div>
                </div>

                {/* Plan Selection */}
                <div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${t.textSecondary}`}>Plan</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {(availablePlans.length > 0
                            ? availablePlans.map((p) => ({ slug: p.slug, name: p.name, price: `$${Number(p.price).toFixed(0)}/${p.billing_period === 'year' ? 'yr' : 'mo'}` }))
                            : [
                                { slug: 'starter', name: 'Starter', price: '$29/mo' },
                                { slug: 'professional', name: 'Professional', price: '$79/mo' },
                                { slug: 'enterprise', name: 'Enterprise', price: '$199/mo' },
                            ]
                        ).map((plan) => (
                            <button
                                key={plan.slug}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, plan: plan.slug }))}
                                className={`p-4 rounded-xl border text-center transition-all ${
                                    form.plan === plan.slug
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                                        : `${t.cardBg} ${t.textSecondary}`
                                }`}
                            >
                                <p className="text-sm font-semibold">{plan.name}</p>
                                <p className={`text-xs mt-1 ${t.textMuted}`}>{plan.price}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Admin User */}
                <div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${t.textSecondary}`}>Admin User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Admin Name *</label>
                            <input type="text" value={form.admin_name} onChange={(e) => setForm(prev => ({ ...prev, admin_name: e.target.value }))} className={inputCls} required />
                            {errors.admin_name && <p className="text-red-500 text-xs mt-1">{errors.admin_name[0]}</p>}
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 ${t.textLabel}`}>Admin Email *</label>
                            <input type="email" value={form.admin_email} onChange={(e) => setForm(prev => ({ ...prev, admin_email: e.target.value }))} className={inputCls} required />
                            {errors.admin_email && <p className="text-red-500 text-xs mt-1">{errors.admin_email[0]}</p>}
                        </div>
                    </div>
                    <p className={`text-xs mt-2 ${t.textMuted}`}>Default password will be "password". The admin should change it on first login.</p>
                </div>

                {/* Actions */}
                <div className={`flex items-center justify-end gap-3 pt-4 border-t ${t.tableBorder}`}>
                    <button type="button" onClick={() => navigate('/admin/tenants')} className={`px-4 py-2 text-sm ${t.btnGhost}`}>Cancel</button>
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {saving ? 'Creating...' : 'Create Tenant'}
                    </button>
                </div>
            </form>
        </div>
    );
}
