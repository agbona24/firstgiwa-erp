export function Table({ children, className = '' }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className={`w-full border-collapse text-sm ${className}`}>
                {children}
            </table>
        </div>
    );
}

export function TableHead({ children, className = '' }) {
    return (
        <thead className={`bg-gradient-to-r from-blue-800 to-blue-700 text-white ${className}`}>
            {children}
        </thead>
    );
}

export function TableBody({ children, className = '' }) {
    return (
        <tbody className={className}>
            {children}
        </tbody>
    );
}

export function TableRow({ children, className = '', onClick }) {
    return (
        <tr
            className={`border-b border-slate-200 hover:bg-blue-50 transition ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </tr>
    );
}

export function TableHeader({ children, className = '' }) {
    return (
        <th className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide ${className}`}>
            {children}
        </th>
    );
}

export function TableCell({ children, className = '' }) {
    return (
        <td className={`px-4 py-3 text-slate-700 ${className}`}>
            {children}
        </td>
    );
}
