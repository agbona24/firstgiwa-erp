import { useState, useEffect } from 'react';
import LandingLayout from './LandingLayout';
import { defaultLandingData } from './landingData';
import LandingNavbar from './sections/LandingNavbar';
import HeroSection from './sections/HeroSection';
import TrustedBySection from './sections/TrustedBySection';
import FeaturesGrid from './sections/FeaturesGrid';
import HowItWorksSection from './sections/HowItWorksSection';
import DashboardPreview from './sections/DashboardPreview';
import PricingSection from './sections/PricingSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CTASection from './sections/CTASection';
import LandingFooter from './sections/LandingFooter';
import axios from 'axios';

function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
            result[key] = deepMerge(target[key], source[key]);
        } else if (source[key] !== undefined && source[key] !== null) {
            result[key] = source[key];
        }
    }
    return result;
}

export default function LandingPage() {
    const [content, setContent] = useState(defaultLandingData);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [cmsRes, plansRes] = await Promise.all([
                    axios.get('/api/v1/landing-content').catch(() => null),
                    axios.get('/api/v1/plans').catch(() => null),
                ]);

                let merged = { ...defaultLandingData };

                // Merge CMS content
                if (cmsRes?.data && typeof cmsRes.data === 'object') {
                    const cms = cmsRes.data;
                    merged = deepMerge(merged, cms);
                }

                // Override pricing plans from Plans API
                if (plansRes?.data && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
                    const apiPlans = plansRes.data.map((plan) => ({
                        name: plan.name,
                        price: `$${Number(plan.price).toFixed(0)}`,
                        period: plan.billing_period === 'year' ? '/year' : '/month',
                        features: (plan.features || []).map((f) => ({
                            text: f.text,
                            included: f.included,
                        })),
                        highlighted: plan.is_highlighted || false,
                        badge: plan.badge || null,
                        buttonText: plan.button_text || 'Get Started',
                        buttonHref: '#pricing',
                    }));
                    merged = {
                        ...merged,
                        pricing: { ...merged.pricing, plans: apiPlans },
                    };
                }

                setContent(merged);
            } catch (err) {
                // Fallback to defaults silently
            }
        };

        fetchContent();
    }, []);

    return (
        <LandingLayout>
            <LandingNavbar
                links={content.nav.links}
                ctaPrimary={content.nav.ctaPrimary}
                ctaSecondary={content.nav.ctaSecondary}
            />
            <HeroSection {...content.hero} />
            <TrustedBySection {...content.trustedBy} />
            <FeaturesGrid features={content.features} eyebrow={content.featuresSection?.eyebrow} headline={content.featuresSection?.headline} subtext={content.featuresSection?.subtext} />
            <HowItWorksSection {...content.howItWorks} />
            <DashboardPreview {...content.dashboardPreview} />
            <PricingSection {...content.pricing} />
            <TestimonialsSection testimonials={content.testimonials} eyebrow={content.testimonialsSection?.eyebrow} headline={content.testimonialsSection?.headline} />
            <CTASection {...content.cta} />
            <LandingFooter {...content.footer} />
        </LandingLayout>
    );
}
