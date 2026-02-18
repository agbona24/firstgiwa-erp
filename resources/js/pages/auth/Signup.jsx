import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { setAuthToken } from '../../services/api';
import axios from 'axios';

export default function Signup() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        company_name: '',
        email: '',
        phone: '',
        plan: searchParams.get('plan') || 'starter',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        axios.get('/api/v1/plans').then((res) => {
            if (Array.isArray(res.data)) setPlans(res.data);
        }).catch(() => {});
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const updated = { ...prev, [field]: value };
            // Auto-fill admin email from company email if admin email is empty
            if (field === 'email' && !prev.admin_email) {
                updated.admin_email = value;
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors({});

        if (form.admin_password !== form.password_confirmation) {
            setErrors({ password_confirmation: ['Passwords do not match'] });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/v1/register', {
                company_name: form.company_name,
                email: form.email,
                phone: form.phone || undefined,
                plan: form.plan,
                admin_name: form.admin_name,
                admin_email: form.admin_email,
                admin_password: form.admin_password,
            });

            if (res.data.success) {
                setAuthToken(res.data.token);
                setUser(res.data.user);
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-slate-900 placeholder-slate-400";
    const labelClass = "block text-sm font-medium text-slate-700 mb-2";
    const errorClass = "text-red-500 text-xs mt-1";

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Dark branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">FactoryPulse</h2>
                            <p className="text-blue-400 text-sm font-medium">Manufacturing ERP</p>
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        <span className="text-white">Start Your</span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Free Trial
                        </span>
                        <br />
                        <span className="text-white">Today</span>
                    </h1>

                    <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-md">
                        Get your manufacturing operations running in minutes. No credit card required.
                    </p>

                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-slate-300">14-day free trial, no credit card needed</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-slate-300">Full access to all features during trial</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-slate-300">Cancel anytime, no questions asked</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Signup form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-8 bg-white overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-slate-900">FactoryPulse</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
                    <p className="text-slate-500 mb-6">Get started with your free trial</p>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Plan Selection */}
                        <div>
                            <label className={labelClass}>Select a plan</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(plans.length > 0 ? plans : [
                                    { slug: 'starter', name: 'Starter', price: 29, billing_period: 'month' },
                                    { slug: 'professional', name: 'Professional', price: 79, billing_period: 'month' },
                                    { slug: 'enterprise', name: 'Enterprise', price: 199, billing_period: 'month' },
                                ]).map((p) => (
                                    <button
                                        key={p.slug}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, plan: p.slug }))}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                                            form.plan === p.slug
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <p className="text-sm font-semibold">{p.name}</p>
                                        <p className="text-xs mt-0.5 opacity-75">
                                            ${Number(p.price).toFixed(0)}/{p.billing_period === 'year' ? 'yr' : 'mo'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Company Info */}
                        <div>
                            <label className={labelClass}>Company name</label>
                            <input
                                type="text"
                                required
                                value={form.company_name}
                                onChange={(e) => handleChange('company_name', e.target.value)}
                                className={inputClass}
                                placeholder="Acme Manufacturing Ltd"
                            />
                            {errors.company_name && <p className={errorClass}>{errors.company_name[0]}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Company email</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={inputClass}
                                    placeholder="info@company.com"
                                />
                                {errors.email && <p className={errorClass}>{errors.email[0]}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Phone <span className="text-slate-400">(optional)</span></label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className={inputClass}
                                    placeholder="+234 800 000 0000"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-white text-slate-400">Admin account</span>
                            </div>
                        </div>

                        {/* Admin Info */}
                        <div>
                            <label className={labelClass}>Your full name</label>
                            <input
                                type="text"
                                required
                                value={form.admin_name}
                                onChange={(e) => handleChange('admin_name', e.target.value)}
                                className={inputClass}
                                placeholder="John Doe"
                            />
                            {errors.admin_name && <p className={errorClass}>{errors.admin_name[0]}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Your email</label>
                            <input
                                type="email"
                                required
                                value={form.admin_email}
                                onChange={(e) => handleChange('admin_email', e.target.value)}
                                className={inputClass}
                                placeholder="john@company.com"
                            />
                            {errors.admin_email && <p className={errorClass}>{errors.admin_email[0]}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        value={form.admin_password}
                                        onChange={(e) => handleChange('admin_password', e.target.value)}
                                        className={inputClass}
                                        placeholder="Min 8 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-3.878-3.878" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.admin_password && <p className={errorClass}>{errors.admin_password[0]}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Confirm password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={form.password_confirmation}
                                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                    className={inputClass}
                                    placeholder="Confirm password"
                                />
                                {errors.password_confirmation && <p className={errorClass}>{errors.password_confirmation[0]}</p>}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-100 transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating your account...
                                </span>
                            ) : 'Start Free Trial'}
                        </button>

                        <p className="text-center text-xs text-slate-400">
                            By signing up, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </form>

                    {/* Already have account */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 transition">
                                Log in
                            </Link>
                        </p>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        &copy; {new Date().getFullYear()} FactoryPulse System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
