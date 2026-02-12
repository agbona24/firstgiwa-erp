import { createContext, useContext, useState, useCallback } from 'react';

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
    // Check localStorage for tour completion
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tourComplete, setTourComplete] = useState(() => localStorage.getItem('factorypulse_tour_complete') === 'true');

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setTourActive(true);
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    }, []);

    const skipTour = useCallback(() => {
        setTourActive(false);
        setTourComplete(true);
        localStorage.setItem('factorypulse_tour_complete', 'true');
    }, []);

    const completeTour = useCallback(() => {
        setTourActive(false);
        setTourComplete(true);
        localStorage.setItem('factorypulse_tour_complete', 'true');
    }, []);

    const resetTour = useCallback(() => {
        setTourComplete(false);
        localStorage.removeItem('factorypulse_tour_complete');
    }, []);

    return (
        <OnboardingContext.Provider value={{ 
            tourActive, 
            currentStep, 
            tourComplete, 
            startTour, 
            nextStep, 
            prevStep, 
            skipTour, 
            completeTour, 
            resetTour,
            setCurrentStep 
        }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
    return ctx;
}
