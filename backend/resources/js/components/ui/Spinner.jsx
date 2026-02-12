export default function Spinner({ size = 'md', color = 'blue' }) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4'
    };

    const colorClasses = {
        blue: 'border-blue-600 border-t-transparent',
        white: 'border-white border-t-transparent',
        gold: 'border-gold-600 border-t-transparent',
        slate: 'border-slate-600 border-t-transparent'
    };

    return (
        <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`} />
    );
}

export function FullPageSpinner({ message = 'Loading...' }) {
    return (
        <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
                <Spinner size="xl" color="blue" />
                <p className="mt-4 text-lg font-medium text-slate-700">{message}</p>
            </div>
        </div>
    );
}

export function InlineSpinner({ message, size = 'sm' }) {
    return (
        <div className="flex items-center gap-3">
            <Spinner size={size} />
            {message && <span className="text-sm text-slate-600">{message}</span>}
        </div>
    );
}

export function ButtonSpinner() {
    return <Spinner size="sm" color="white" />;
}
