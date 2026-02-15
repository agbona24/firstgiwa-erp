import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const rotatingWords = ['Production', 'Inventory', 'Sales', 'Finance', 'Payroll'];

export default function HeroSection({ badge, headline, subtext, ctaPrimary, ctaSecondary, trustNote }) {
    const [wordIndex, setWordIndex] = useState(0);
    const [fadeState, setFadeState] = useState('in');

    useEffect(() => {
        const interval = setInterval(() => {
            setFadeState('out');
            setTimeout(() => {
                setWordIndex((prev) => (prev + 1) % rotatingWords.length);
                setFadeState('in');
            }, 400);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
            {/* Animated background mesh */}
            <div className="absolute inset-0">
                {/* Large glow orbs */}
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-gold-500/10 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '3s' }} />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }} />

                {/* Radial fade overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-36 lg:py-40">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* Left — Copy (7 columns) */}
                    <div className="lg:col-span-7">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-slide-up">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                            </span>
                            <span className="text-sm font-medium text-blue-200">{badge}</span>
                        </div>

                        {/* Headline with rotating word */}
                        <h1 className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <span className="block text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
                                Manage Your
                            </span>
                            <span className="block text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight mt-2">
                                <span
                                    className={`inline-block bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 bg-clip-text text-transparent transition-all duration-400 ${
                                        fadeState === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
                                    }`}
                                >
                                    {rotatingWords[wordIndex]}
                                </span>
                            </span>
                            <span className="block text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mt-2">
                                Like Never Before
                            </span>
                        </h1>

                        {/* Subtext */}
                        <p className="mt-8 text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {subtext}
                        </p>

                        {/* CTAs */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <Link
                                to={ctaPrimary.href}
                                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-gradient-to-r from-gold-400 to-gold-500 rounded-xl overflow-hidden shadow-lg shadow-gold-500/25 hover:shadow-2xl hover:shadow-gold-500/40 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative">{ctaPrimary.label}</span>
                                <svg className="relative ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <a
                                href={ctaSecondary.href}
                                onClick={(e) => {
                                    if (ctaSecondary.href.startsWith('#')) {
                                        e.preventDefault();
                                        document.querySelector(ctaSecondary.href)?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white/90 border border-white/15 rounded-xl backdrop-blur-sm hover:bg-white/5 hover:border-white/25 transition-all duration-300"
                            >
                                <svg className="mr-2 w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {ctaSecondary.label}
                            </a>
                        </div>

                        {/* Trust note + avatars */}
                        <div className="mt-10 flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            {/* Stacked avatars */}
                            <div className="flex -space-x-2">
                                {['AJ', 'FA', 'CO', 'MK', 'SA'].map((initials, i) => (
                                    <div
                                        key={i}
                                        className="w-9 h-9 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{
                                            background: [
                                                'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                                'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                                'linear-gradient(135deg, #10b981, #059669)',
                                                'linear-gradient(135deg, #f59e0b, #d97706)',
                                                'linear-gradient(135deg, #ef4444, #dc2626)',
                                            ][i],
                                        }}
                                    >
                                        {initials}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex items-center gap-1 mb-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg key={star} className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500">{trustNote}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right — Dashboard Mockup (5 columns) */}
                    <div className="hidden lg:block lg:col-span-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="relative" style={{ perspective: '1500px' }}>
                            {/* Glow behind mockup */}
                            <div className="absolute -inset-8 bg-blue-500/10 rounded-3xl blur-2xl" />

                            <div
                                className="relative animate-float rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/10 overflow-hidden"
                                style={{ transform: 'rotateY(-8deg) rotateX(3deg)' }}
                            >
                                {/* Browser chrome */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-white/5">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 mx-4">
                                        <div className="bg-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            app.prodflow.com/dashboard
                                        </div>
                                    </div>
                                </div>

                                {/* Dashboard content */}
                                <div className="bg-slate-50 p-4 space-y-3">
                                    {/* Top bar */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <div className="text-xs font-bold text-slate-800">Dashboard</div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-[8px] text-white flex items-center justify-center font-bold">SA</div>
                                        </div>
                                    </div>

                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: 'Revenue', value: '\u20a612.4M', color: 'border-l-blue-600', change: '+12%', up: true },
                                            { label: 'Output', value: '8,420 kg', color: 'border-l-green-600', change: '+8%', up: true },
                                            { label: 'Receivables', value: '\u20a63.2M', color: 'border-l-orange-500', change: '14 due', up: false },
                                            { label: 'Expenses', value: '\u20a65.1M', color: 'border-l-purple-600', change: '3 pend', up: false },
                                        ].map((kpi, i) => (
                                            <div key={i} className={`bg-white rounded-lg p-2 border border-slate-100 border-l-[3px] ${kpi.color} shadow-sm`}>
                                                <div className="text-[9px] text-slate-400 font-medium">{kpi.label}</div>
                                                <div className="text-[11px] font-bold text-slate-900 mt-0.5">{kpi.value}</div>
                                                <div className={`text-[8px] font-semibold mt-0.5 ${kpi.up ? 'text-green-600' : 'text-orange-500'}`}>{kpi.change}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chart */}
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-semibold text-slate-700">Revenue Trend</div>
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[8px] text-slate-400">Revenue</span></div>
                                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[8px] text-slate-400">Profit</span></div>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-[3px] h-20">
                                            {[35, 48, 42, 58, 52, 65, 55, 72, 62, 78, 70, 85].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col gap-[2px]">
                                                    <div className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm" style={{ height: `${h}%` }} />
                                                    <div className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm" style={{ height: `${h * 0.4}%` }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick stats row */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm text-center">
                                            <div className="text-[13px] font-bold text-blue-600">24</div>
                                            <div className="text-[8px] text-slate-400">Orders Today</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm text-center">
                                            <div className="text-[13px] font-bold text-green-600">5</div>
                                            <div className="text-[8px] text-slate-400">Prod. Runs</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm text-center">
                                            <div className="text-[13px] font-bold text-amber-600">12</div>
                                            <div className="text-[8px] text-slate-400">Low Stock</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating notification card */}
                            <div className="absolute -left-12 bottom-16 bg-white rounded-xl p-3 shadow-xl border border-slate-100 animate-float w-48" style={{ animationDelay: '2s', animationDuration: '5s' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold text-slate-800">Production Complete</div>
                                        <div className="text-[9px] text-slate-400">Batch #1247 - 850kg</div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating revenue card */}
                            <div className="absolute -right-6 top-12 bg-white rounded-xl p-3 shadow-xl border border-slate-100 animate-float w-40" style={{ animationDelay: '4s', animationDuration: '7s' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold text-slate-800">Revenue +12%</div>
                                        <div className="text-[9px] text-green-600 font-medium">This month</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom gradient fade + wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
                    <path d="M0 50L60 45C120 40 240 30 360 35C480 40 600 60 720 65C840 70 960 60 1080 50C1200 40 1320 30 1380 25L1440 20V100H0V50Z" fill="#f8fafc" />
                </svg>
            </div>
        </section>
    );
}
