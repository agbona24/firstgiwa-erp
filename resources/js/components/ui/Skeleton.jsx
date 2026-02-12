export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-blue-900 to-blue-800">
                        <tr>
                            {[...Array(columns)].map((_, idx) => (
                                <th key={idx} className="px-6 py-4">
                                    <div className="h-4 bg-blue-700 rounded w-24 animate-pulse"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {[...Array(rows)].map((_, rowIdx) => (
                            <tr key={rowIdx}>
                                {[...Array(columns)].map((_, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4">
                                        <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }}></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
            <div className="animate-pulse space-y-3">
                <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                <div className="h-10 bg-blue-200 rounded w-3/4"></div>
                <div className="h-3 bg-blue-200 rounded w-1/4"></div>
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-6">
            {[...Array(4)].map((_, idx) => (
                <div key={idx} className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-10 bg-slate-200 rounded w-full"></div>
                </div>
            ))}
        </div>
    );
}

export default function Skeleton({ className = '', width = '100%', height = '1rem' }) {
    return (
        <div
            className={`bg-slate-200 rounded animate-pulse ${className}`}
            style={{ width, height }}
        />
    );
}
