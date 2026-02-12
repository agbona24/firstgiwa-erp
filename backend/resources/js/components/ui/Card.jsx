export function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '', premium = false }) {
    if (premium) {
        return (
            <div className={`bg-gradient-to-r from-blue-800 to-blue-600 text-white px-6 py-4 ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <div className={`border-b-2 border-blue-100 px-6 py-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`text-xl font-bold text-slate-900 ${className}`}>
            {children}
        </h3>
    );
}

export function CardBody({ children, className = '' }) {
    return (
        <div className={`px-6 py-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }) {
    return (
        <div className={`border-t border-slate-200 px-6 py-4 flex justify-end gap-3 ${className}`}>
            {children}
        </div>
    );
}
