import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const demoAccounts = [
    { label: 'Admin', email: 'admin@demo.com', password: 'password' },
    { label: 'Accountant', email: 'accountant@demo.com', password: 'password' },
    { label: 'Cashier', email: 'cashier@demo.com', password: 'password' },
    { label: 'Auditor', email: 'auditor@demo.com', password: 'password' },
];

export default function Login() {
    const { login } = useAuth();
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'pin'
    const [formData, setFormData] = useState({ email: '', password: '', pin: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (loginMethod === 'pin') {
                await login({ pin: formData.pin, login_method: 'pin' });
            } else {
                await login({ email: formData.email, password: formData.password });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = (account) => {
        setLoginMethod('password');
        setFormData({ email: account.email, password: account.password, pin: '' });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Dark branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                {/* Decorative grid pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
                {/* Decorative gradient orbs */}
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center px-16">
                    {/* Logo */}
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

                    {/* Hero text */}
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        <span className="text-white">Enterprise-Grade</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                            Compliance & Audit
                        </span>
                        <br />
                        <span className="text-white">Management</span>
                    </h1>

                    <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-md">
                        Streamline your accounting, logistics, and compliance operations with real-time tracking and complete audit trails.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span className="text-slate-300">Role-based access control with separation of duties</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-slate-300">Complete transaction audit trail</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-slate-300">Real-time POS and inventory management</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo (hidden on lg) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-slate-900">FactoryPulse</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
                    <p className="text-slate-500 mb-8">Sign in to access your dashboard</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Login Method Toggle */}
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => setLoginMethod('password')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${loginMethod === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Email & Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginMethod('pin')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${loginMethod === 'pin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                PIN Code
                            </button>
                        </div>

                        {loginMethod === 'password' ? (
                        <>
                        {/* Email - only shown for password login */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-slate-900 placeholder-slate-400"
                                    placeholder="you@company.com"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-slate-900 placeholder-slate-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-3.878-3.878" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        </>
                        ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Enter your 4-digit PIN</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]{4}"
                                maxLength={4}
                                required
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-slate-900 placeholder-slate-400 text-center text-2xl font-mono tracking-[0.5em]"
                                placeholder="• • • •"
                            />
                        </div>
                        )}

                        {/* Remember + Forgot - only for password login */}
                        {loginMethod === 'password' && (
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                <span className="text-sm text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-orange-500 hover:text-orange-600 font-medium transition">
                                Forgot password?
                            </a>
                        </div>
                        )}

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
                                    Signing in...
                                </span>
                            ) : loginMethod === 'pin' ? 'Sign in with PIN' : 'Sign in'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-slate-500">Demo accounts</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-5">
                            {demoAccounts.map((account) => (
                                <button
                                    key={account.label}
                                    type="button"
                                    onClick={() => handleDemoLogin(account)}
                                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                                >
                                    {account.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-8">
                        &copy; {new Date().getFullYear()} FactoryPulse System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
