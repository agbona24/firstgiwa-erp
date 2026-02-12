export default function Badge({ children, variant = 'primary', className = '' }) {
    const variantClasses = {
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
        gold: 'bg-gold-100 text-gold-800',
        // Status-specific variants
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        completed: 'bg-blue-100 text-blue-800',
        draft: 'bg-slate-100 text-slate-700'
    };

    return (
        <span className={`
            inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
            ${variantClasses[variant]}
            ${className}
        `}>
            {children}
        </span>
    );
}
