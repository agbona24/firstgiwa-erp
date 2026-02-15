import { useScrollReveal } from '../hooks/useScrollReveal';

export default function SectionWrapper({ id, className = '', children, dark = false }) {
    const { ref, isVisible } = useScrollReveal();

    return (
        <section
            id={id}
            ref={ref}
            className={`
                py-20 md:py-28 px-4 sm:px-6 lg:px-8
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                ${dark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                ${className}
            `}
        >
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </section>
    );
}
