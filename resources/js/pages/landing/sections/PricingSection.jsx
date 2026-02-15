import SectionWrapper from '../components/SectionWrapper';
import PricingCard from '../components/PricingCard';

export default function PricingSection({ eyebrow, headline, subtext, plans }) {
    return (
        <SectionWrapper id="pricing" className="bg-slate-50">
            <div className="text-center mb-16">
                <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 mb-3">
                    {eyebrow}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900">
                    {headline}
                </h2>
                <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                    {subtext}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
                {plans.map((plan, i) => (
                    <PricingCard key={i} {...plan} index={i} />
                ))}
            </div>
        </SectionWrapper>
    );
}
