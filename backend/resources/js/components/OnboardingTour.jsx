import { useCallback } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useOnboarding } from '../contexts/OnboardingContext';

// Tour steps configuration for react-joyride
const TOUR_STEPS = [
    {
        target: 'body',
        placement: 'center',
        title: 'Welcome to FactoryPulse! 🚀',
        content: 'Let us show you around your new business management system. This quick tour will help you get started.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard-cards"]',
        placement: 'bottom',
        title: 'Your Dashboard',
        content: 'Get a real-time overview of sales, payments, inventory, and production at a glance. These KPI cards update automatically.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar"]',
        placement: 'right',
        title: 'Navigation Menu',
        content: 'Access all modules from the sidebar: Inventory, Sales, Purchases, Production, Finance, HR and more. Click any item to explore.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="quick-actions"]',
        placement: 'bottom',
        title: 'Quick Actions ⚡',
        content: 'Use this lightning bolt icon to quickly create bookings, collect payments, record expenses, and more without navigating away.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="global-search"]',
        placement: 'bottom',
        title: 'Global Search (Ctrl+K)',
        content: 'Search for anything - pages, orders, customers, products. Press Ctrl+K from anywhere in the system for instant access.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="notifications"]',
        placement: 'bottom-end',
        title: 'Notifications 🔔',
        content: 'Stay on top of pending approvals, low stock alerts, overdue payments, and system messages. Never miss important updates.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="user-menu"]',
        placement: 'bottom-end',
        title: 'Your Profile',
        content: 'Access your profile settings, change password, switch branches, and logout from here.',
        disableBeacon: true,
    },
    {
        target: 'body',
        placement: 'center',
        title: 'POS Terminal',
        content: 'Your Point of Sale system supports quick sales, mixed payments, customer tickets, and cashier session management. Access it from Sales → POS Terminal.',
        disableBeacon: true,
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Your Business Workflow',
        content: 'Booking Officer creates orders → Cashier collects payment → Production processes orders → Accountant tracks P&L. Each role has specific permissions managed through RBAC.',
        disableBeacon: true,
    },
    {
        target: 'body',
        placement: 'center',
        title: "You're All Set! 🎉",
        content: 'Explore the system at your own pace. You can restart this tour anytime from Settings → General → "Start Tour". Need help? Check the documentation.',
        disableBeacon: true,
    },
];

// Custom tooltip component styles
const joyrideStyles = {
    options: {
        arrowColor: '#fff',
        backgroundColor: '#fff',
        overlayColor: 'rgba(15, 23, 42, 0.75)',
        primaryColor: '#2563eb',
        spotlightShadow: '0 0 15px rgba(37, 99, 235, 0.5)',
        textColor: '#1e293b',
        width: 380,
        zIndex: 10000,
    },
    tooltip: {
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    tooltipContainer: {
        textAlign: 'left',
    },
    tooltipTitle: {
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 8,
        color: '#0f172a',
    },
    tooltipContent: {
        fontSize: 14,
        lineHeight: 1.6,
        color: '#475569',
        padding: '8px 0',
    },
    buttonNext: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        padding: '10px 20px',
        outline: 'none',
    },
    buttonBack: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: 500,
        marginRight: 12,
    },
    buttonSkip: {
        color: '#94a3b8',
        fontSize: 13,
    },
    buttonClose: {
        display: 'none',
    },
    spotlight: {
        borderRadius: 8,
    },
    beacon: {
        display: 'none',
    },
    tooltipFooter: {
        marginTop: 16,
    },
};

// Custom locale for buttons
const locale = {
    back: '← Back',
    close: 'Close',
    last: 'Get Started! 🚀',
    next: 'Next →',
    open: 'Open tour',
    skip: 'Skip Tour',
};

export default function OnboardingTour() {
    const { tourActive, currentStep, skipTour, completeTour, setCurrentStep } = useOnboarding();

    const handleJoyrideCallback = useCallback((data) => {
        const { action, index, status, type } = data;

        // Handle tour completion
        if (status === STATUS.FINISHED) {
            completeTour();
            return;
        }

        // Handle skip
        if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
            skipTour();
            return;
        }

        // Handle close button
        if (action === ACTIONS.CLOSE) {
            skipTour();
            return;
        }

        // Update step index for step changes
        if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
            if (setCurrentStep) setCurrentStep(index + 1);
        }
        
        if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
            if (setCurrentStep) setCurrentStep(index - 1);
        }
    }, [completeTour, skipTour, setCurrentStep]);

    if (!tourActive) return null;

    return (
        <Joyride
            steps={TOUR_STEPS}
            run={tourActive}
            stepIndex={currentStep}
            continuous
            showProgress
            showSkipButton
            hideCloseButton
            scrollToFirstStep
            disableOverlayClose
            spotlightClicks={false}
            styles={joyrideStyles}
            locale={locale}
            callback={handleJoyrideCallback}
            floaterProps={{
                disableAnimation: true,
            }}
        />
    );
}
