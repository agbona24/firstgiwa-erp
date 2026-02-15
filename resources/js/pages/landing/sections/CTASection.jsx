import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function CTASection({ headline, subtext, ctaPrimary, ctaSecondary }) {
    const { ref, isVisible } = useScrollReveal();

    return (
        <section
            ref={ref}
            className={`
                relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden
                bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
        >
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }} />
            </div>

            <div className="relative max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                    {headline}
                </h2>
                <p className="mt-6 text-lg md:text-xl text-blue-200/70 max-w-2xl mx-auto">
                    {subtext}
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to={ctaPrimary.href}
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-900 bg-gradient-to-r from-gold-400 to-gold-500 rounded-xl shadow-lg shadow-gold-500/25 hover:shadow-xl hover:shadow-gold-500/30 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        {ctaPrimary.label}
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                    <a
                        href={ctaSecondary.href}
                        onClick={(e) => {
                            if (ctaSecondary.href.startsWith('#')) {
                                e.preventDefault();
                                document.querySelector(ctaSecondary.href)?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                    >
                        {ctaSecondary.label}
                    </a>
                </div>
            </div>
        </section>
    );
}
