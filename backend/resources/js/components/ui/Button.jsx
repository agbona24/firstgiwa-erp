export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    type = 'button',
    className = ''
}) {
    const baseClasses = 'font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-2';

    const variantClasses = {
        primary: 'bg-gradient-to-br from-blue-800 to-blue-600 text-white hover:from-blue-700 hover:to-blue-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
        secondary: 'bg-gradient-to-br from-gold-600 to-gold-500 text-white hover:from-gold-500 hover:to-gold-400 shadow-md hover:shadow-lg hover:-translate-y-0.5',
        outline: 'bg-transparent border-2 border-blue-700 text-blue-700 hover:bg-blue-50 hover:border-blue-800',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg',
        success: 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-7 py-3.5 text-lg'
    };

    const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${disabled ? disabledClasses : ''}
                ${className}
            `}
        >
            {children}
        </button>
    );
}
