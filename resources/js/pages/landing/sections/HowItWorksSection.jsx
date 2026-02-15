import SectionWrapper from '../components/SectionWrapper';

export default function HowItWorksSection({ eyebrow, headline, steps }) {
    return (
        <SectionWrapper id="how-it-works" dark>
            <div className="text-center mb-16">
                <p className="text-xs font-semibold tracking-[0.2em] text-blue-400 mb-3">
                    {eyebrow}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    {headline}
                </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-4 relative">
                {/* Connecting line (desktop) */}
                <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 opacity-30" />

                {steps.map((step, i) => (
                    <div key={i} className="relative text-center px-6">
                        {/* Step number */}
                        <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl rotate-3" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl w-full h-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <span className="text-2xl font-extrabold text-white">{step.step}</span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                        <p className="text-blue-200/70 leading-relaxed">{step.description}</p>

                        {/* Arrow (between steps on desktop) */}
                        {i < steps.length - 1 && (
                            <div className="hidden md:block absolute top-14 -right-2 text-blue-500/40">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}
