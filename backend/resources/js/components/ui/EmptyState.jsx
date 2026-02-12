export default function EmptyState({
    message = 'No data available',
    icon,
    action,
    actionLabel,
    onAction
}) {
    const DefaultIcon = () => (
        <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
        </svg>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
            <div className="flex flex-col items-center justify-center text-center">
                {icon || <DefaultIcon />}
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{message}</h3>
                {action && onAction && (
                    <button
                        onClick={onAction}
                        className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-semibold rounded-lg hover:from-blue-800 hover:to-blue-700 transition shadow-md"
                    >
                        {actionLabel || action}
                    </button>
                )}
            </div>
        </div>
    );
}
