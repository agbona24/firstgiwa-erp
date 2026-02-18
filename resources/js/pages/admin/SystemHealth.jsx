import { useState, useEffect } from 'react';
import { getSystemHealth } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function SystemHealth() {
    const { t } = useAdminTheme();
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHealth();
    }, []);

    const loadHealth = async () => {
        try {
            const res = await getSystemHealth();
            setHealth(res.data);
        } catch (err) {
            console.error('Failed to load system health:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner w-10 h-10"></div>
            </div>
        );
    }

    if (!health) {
        return <p className={t.textMuted}>Failed to load system health</p>;
    }

    const database = health?.database ?? { connected: false, driver: 'unknown' };
    const disk = health?.disk ?? { total: 0, free: 0, used: 0, usage_percent: 0 };
    const memory = health?.memory ?? { usage: 0, peak: 0 };
    const cacheDriver = health?.cache_driver ?? 'unknown';
    const queueDriver = health?.queue_driver ?? 'unknown';
    const serverTime = health?.server_time ?? new Date().toISOString();
    const phpVersion = health?.php_version ?? 'Unknown';
    const laravelVersion = health?.laravel_version ?? 'Unknown';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>System Health</h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>Server and infrastructure status</p>
                </div>
                <button onClick={loadHealth} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${t.btnSecondary}`}>
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* PHP */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <h3 className={`text-sm font-semibold ${t.textPrimary}`}>PHP</h3>
                    </div>
                    <p className={`text-2xl font-bold ${t.textPrimary}`}>{phpVersion}</p>
                </div>

                {/* Laravel */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Laravel</h3>
                    </div>
                    <p className={`text-2xl font-bold ${t.textPrimary}`}>{laravelVersion}</p>
                </div>

                {/* Database */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${database.connected ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${database.connected ? 'text-emerald-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                        </div>
                        <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Database</h3>
                    </div>
                    <p className={`text-lg font-bold capitalize ${t.textPrimary}`}>{database.driver}</p>
                    <p className={`text-xs mt-1 ${database.connected ? 'text-emerald-500' : 'text-red-500'}`}>
                        {database.connected ? 'Connected' : 'Disconnected'}
                    </p>
                </div>

                {/* Disk Usage */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Disk Usage</h3>
                    </div>
                    <p className={`text-lg font-bold ${t.textPrimary}`}>{disk.usage_percent}%</p>
                    <div className={`mt-2 w-full rounded-full h-2 ${t.progressBg}`}>
                        <div
                            className={`h-2 rounded-full ${disk.usage_percent > 90 ? 'bg-red-500' : disk.usage_percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${disk.usage_percent}%` }}
                        />
                    </div>
                    <p className={`text-xs mt-2 ${t.textMuted}`}>
                        {formatBytes(disk.used)} / {formatBytes(disk.total)}
                    </p>
                </div>

                {/* Memory */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        </div>
                        <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Memory</h3>
                    </div>
                    <p className={`text-lg font-bold ${t.textPrimary}`}>{formatBytes(memory.usage)}</p>
                    <p className={`text-xs mt-1 ${t.textMuted}`}>Peak: {formatBytes(memory.peak)}</p>
                </div>

                {/* Infrastructure */}
                <div className={`border rounded-xl p-5 ${t.cardBg}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Infrastructure</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className={t.textMuted}>Cache</span>
                            <span className={`capitalize ${t.textPrimary}`}>{cacheDriver}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={t.textMuted}>Queue</span>
                            <span className={`capitalize ${t.textPrimary}`}>{queueDriver}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={t.textMuted}>Server Time</span>
                            <span className={`text-xs ${t.textPrimary}`}>{new Date(serverTime).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
