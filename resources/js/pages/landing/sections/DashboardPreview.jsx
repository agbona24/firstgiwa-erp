import SectionWrapper from '../components/SectionWrapper';

export default function DashboardPreview({ eyebrow, title, subtitle }) {
    return (
        <SectionWrapper id="dashboard-preview" className="bg-gradient-to-b from-white to-slate-50">
            <div className="text-center mb-12">
                <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 mb-3">
                    {eyebrow}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900">
                    {title}
                </h2>
                <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                    {subtitle}
                </p>
            </div>

            {/* Browser frame */}
            <div className="max-w-5xl mx-auto">
                <div className="animate-float rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden bg-white">
                    {/* Chrome bar */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 mx-8">
                            <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-slate-400 text-center border border-slate-200 flex items-center justify-center gap-2">
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                app.factorypulse.com/dashboard
                            </div>
                        </div>
                    </div>

                    {/* Dashboard content */}
                    <div className="p-6 bg-slate-50">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="h-4 bg-slate-800 rounded w-40 mb-2" />
                                <div className="h-3 bg-slate-300 rounded w-56" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-blue-600 rounded-lg w-24" />
                                <div className="h-8 bg-white border border-slate-200 rounded-lg w-20" />
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Revenue', value: '\u20a612.4M', color: 'border-l-blue-600', badge: '+12.5%', badgeColor: 'bg-green-100 text-green-700' },
                                { label: 'Production', value: '8,420 kg', color: 'border-l-green-600', badge: '+8.2%', badgeColor: 'bg-green-100 text-green-700' },
                                { label: 'Receivables', value: '\u20a63.2M', color: 'border-l-orange-500', badge: '14 overdue', badgeColor: 'bg-red-100 text-red-700' },
                                { label: 'Expenses', value: '\u20a65.1M', color: 'border-l-purple-600', badge: '3 pending', badgeColor: 'bg-orange-100 text-orange-700' },
                            ].map((kpi, i) => (
                                <div key={i} className={`bg-white rounded-xl p-4 border border-slate-100 shadow-sm border-l-4 ${kpi.color}`}>
                                    <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
                                    <div className="text-xl font-bold text-slate-900">{kpi.value}</div>
                                    <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${kpi.badgeColor}`}>{kpi.badge}</span>
                                </div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Bar chart */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <div className="text-xs font-semibold text-slate-700 mb-3">Sales Trend</div>
                                <div className="flex items-end gap-2 h-28">
                                    {[45, 62, 55, 78, 65, 82, 70, 90, 75, 88, 95, 85].map((h, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm opacity-80" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                            {/* Donut chart placeholder */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <div className="text-xs font-semibold text-slate-700 mb-3">Inventory Distribution</div>
                                <div className="flex items-center justify-center h-28">
                                    <div className="relative w-24 h-24">
                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray="140 251" />
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="12" strokeDasharray="65 251" strokeDashoffset="-140" />
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="46 251" strokeDashoffset="-205" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-slate-700">1,247</span>
                                        </div>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Raw Materials</div>
                                        <div className="flex items-center gap-2 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-green-600" /> Finished</div>
                                        <div className="flex items-center gap-2 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> WIP</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
}
