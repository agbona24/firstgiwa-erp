import { useState, useEffect, useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function StatsCounter({ value, suffix = '', label }) {
    const { ref, isVisible } = useScrollReveal();
    const [count, setCount] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;

        const duration = 2000;
        const start = performance.now();
        const isDecimal = value % 1 !== 0;

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * value;

            setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, value]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-5xl font-extrabold text-slate-900">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="mt-1.5 text-sm font-medium text-slate-500 uppercase tracking-wide">
                {label}
            </div>
        </div>
    );
}
