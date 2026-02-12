export default function SlideOut({ isOpen, onClose, title, children, size = 'md' }) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide Out Panel */}
            <div className="fixed inset-y-0 right-0 flex max-w-full">
                <div
                    className={`relative w-screen ${sizeClasses[size]} bg-white shadow-2xl transform transition-transform duration-300 translate-x-0`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ animation: 'slideInRight 0.3s ease-out' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
