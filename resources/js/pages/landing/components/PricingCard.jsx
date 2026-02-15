import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function PricingCard({ name, price, period, description, features, highlighted, badge, buttonText, index = 0 }) {
    const { ref, isVisible } = useScrollReveal();

    return (
        <div
            ref={ref}
            className={`
                relative rounded-2xl p-8 transition-all duration-500 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
                ${highlighted
                    ? 'bg-white border-2 border-blue-600 shadow-2xl shadow-blue-600/10 scale-[1.02] md:scale-105 z-10'
                    : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1'
                }
            `}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            {/* Badge */}
            {badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-md">
                        {badge}
                    </span>
                </div>
            )}

            {/* Plan name */}
            <h3 className="text-xl font-bold text-slate-900">{name}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>

            {/* Price */}
            <div className="mt-6 mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-slate-900">${price}</span>
                    <span className="text-slate-500 font-medium">/{period}</span>
                </div>
            </div>

            {/* CTA Button */}
            <Link
                to="/setup"
                className={`
                    block w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300
                    ${highlighted
                        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:-translate-y-0.5'
                        : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:-translate-y-0.5'
                    }
                `}
            >
                {buttonText}
            </Link>

            {/* Features */}
            <ul className="mt-8 space-y-3">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        )}
                        <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
