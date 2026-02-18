import SectionWrapper from '../components/SectionWrapper';
import TestimonialCard from '../components/TestimonialCard';

export default function TestimonialsSection({ testimonials, eyebrow, headline }) {
    return (
        <SectionWrapper id="testimonials">
            <div className="text-center mb-16">
                <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 mb-3">
                    {eyebrow || 'WHAT OUR CUSTOMERS SAY'}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900">
                    {headline || 'Trusted by Factory Leaders'}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {testimonials.map((testimonial, i) => (
                    <TestimonialCard key={i} {...testimonial} index={i} />
                ))}
            </div>
        </SectionWrapper>
    );
}
