import { useState, useRef, useEffect } from 'react';

export default function FilterDropdown({
    label = 'Filter',
    options = [],
    value,
    onChange,
    multiSelect = false,
    icon
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(multiSelect ? [] : value || '');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = (optionValue) => {
        if (multiSelect) {
            const newSelected = selected.includes(optionValue)
                ? selected.filter(v => v !== optionValue)
                : [...selected, optionValue];
            setSelected(newSelected);
            onChange(newSelected);
        } else {
            setSelected(optionValue);
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        const cleared = multiSelect ? [] : '';
        setSelected(cleared);
        onChange(cleared);
    };

    const getDisplayText = () => {
        if (multiSelect) {
            if (selected.length === 0) return label;
            if (selected.length === 1) {
                const option = options.find(opt => opt.value === selected[0]);
                return option?.label || selected[0];
            }
            return `${selected.length} selected`;
        }
        if (!selected) return label;
        const option = options.find(opt => opt.value === selected);
        return option?.label || selected;
    };

    const hasSelection = multiSelect ? selected.length > 0 : !!selected;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition ${
                    hasSelection
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
            >
                {icon && <span className="text-slate-500">{icon}</span>}
                <span className="text-sm font-medium">{getDisplayText()}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 max-h-80 overflow-y-auto">
                    {hasSelection && (
                        <button
                            onClick={handleClear}
                            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 font-medium"
                        >
                            Clear selection
                        </button>
                    )}
                    {hasSelection && <div className="border-t border-slate-200 my-2" />}
                    {options.map((option) => {
                        const isSelected = multiSelect
                            ? selected.includes(option.value)
                            : selected === option.value;

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleToggle(option.value)}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-blue-50 text-blue-900 font-medium'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {multiSelect && (
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                )}
                                <span className="flex-1">{option.label}</span>
                                {!multiSelect && isSelected && (
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
