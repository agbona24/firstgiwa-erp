import SectionWrapper from '../components/SectionWrapper';
import FeatureCard from '../components/FeatureCard';

export default function FeaturesGrid({ features, eyebrow, headline, subtext }) {
    return (
        <SectionWrapper id="features">
            <div className="text-center mb-16">
                <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 mb-3">
                    {eyebrow || 'EVERYTHING YOU NEED'}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900">
                    {headline || 'One Platform. Complete Control.'}
                </h2>
                <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                    {subtext || 'From raw materials to finished goods, from the factory floor to the balance sheet — FactoryPulse covers every aspect of your manufacturing operations.'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, i) => (
                    <FeatureCard key={i} {...feature} index={i} />
                ))}
            </div>
        </SectionWrapper>
    );
}
