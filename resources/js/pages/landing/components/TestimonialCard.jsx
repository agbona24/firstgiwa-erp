import { useScrollReveal } from '../hooks/useScrollReveal';

export default function TestimonialCard({ quote, author, role, company, initials, index = 0 }) {
    const { ref, isVisible } = useScrollReveal();

    return (
        <div
            ref={ref}
            className={`
                relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm
                hover:shadow-lg transition-all duration-500 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            {/* Decorative quote mark */}
            <svg className="absolute top-4 right-6 w-12 h-12 text-gold-500/15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            {/* Quote */}
            <p className="text-slate-600 leading-relaxed italic relative z-10">
                &ldquo;{quote}&rdquo;
            </p>

            {/* Author */}
            <div className="mt-6 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {initials}
                </div>
                <div>
                    <div className="font-semibold text-slate-900 text-sm">{author}</div>
                    <div className="text-xs text-slate-500">{role}, {company}</div>
                </div>
            </div>
        </div>
    );
}
