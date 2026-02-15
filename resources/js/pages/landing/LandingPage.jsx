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

export default function LandingPage() {
    const content = defaultLandingData;

    return (
        <LandingLayout>
            <LandingNavbar
                links={content.nav.links}
                ctaPrimary={content.nav.ctaPrimary}
                ctaSecondary={content.nav.ctaSecondary}
            />
            <HeroSection {...content.hero} />
            <TrustedBySection {...content.trustedBy} />
            <FeaturesGrid features={content.features} />
            <HowItWorksSection {...content.howItWorks} />
            <DashboardPreview {...content.dashboardPreview} />
            <PricingSection {...content.pricing} />
            <TestimonialsSection testimonials={content.testimonials} />
            <CTASection {...content.cta} />
            <LandingFooter {...content.footer} />
        </LandingLayout>
    );
}
