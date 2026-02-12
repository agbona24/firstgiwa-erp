import { useState } from 'react';

export default function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    presets = true,
    className = ''
}) {
    const [showPresets, setShowPresets] = useState(false);

    const applyPreset = (preset) => {
        const end = new Date();
        const start = new Date();

        switch (preset) {
            case 'today':
                // Already set to today
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                end.setDate(end.getDate() - 1);
                break;
            case 'last7days':
                start.setDate(start.getDate() - 7);
                break;
            case 'last30days':
                start.setDate(start.getDate() - 30);
                break;
            case 'thisMonth':
                start.setDate(1);
                break;
            case 'lastMonth':
                start.setMonth(start.getMonth() - 1);
                start.setDate(1);
                end.setMonth(end.getMonth(), 0);
                break;
            case 'thisYear':
                start.setMonth(0);
                start.setDate(1);
                break;
            default:
                break;
        }

        onStartDateChange(start.toISOString().split('T')[0]);
        onEndDateChange(end.toISOString().split('T')[0]);
        setShowPresets(false);
    };

    const presetOptions = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'last30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'thisYear', label: 'This Year' }
    ];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">From:</label>
                <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none transition text-sm"
                />
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">To:</label>
                <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none transition text-sm"
                />
            </div>

            {presets && (
                <div className="relative">
                    <button
                        onClick={() => setShowPresets(!showPresets)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                        Quick Select
                    </button>

                    {showPresets && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                                {presetOptions.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => applyPreset(preset.value)}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {(startDate || endDate) && (
                <button
                    onClick={() => {
                        onStartDateChange('');
                        onEndDateChange('');
                    }}
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                >
                    Clear
                </button>
            )}
        </div>
    );
}
