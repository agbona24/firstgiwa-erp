import { useState } from 'react';

export default function SearchBar({
    placeholder = 'Search...',
    onSearch,
    debounce = 300,
    className = ''
}) {
    const [value, setValue] = useState('');
    const [timeoutId, setTimeoutId] = useState(null);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            onSearch(newValue);
        }, debounce);

        setTimeoutId(newTimeoutId);
    };

    const handleClear = () => {
        setValue('');
        onSearch('');
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="block w-full pl-10 pr-10 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none transition"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
