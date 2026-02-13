import { useCallback, useEffect } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import Button from './ui/Button';

/**
 * TutorialModal - Displays the active module tutorial
 * Features:
 * - Step-by-step guide with rich content
 * - Progress indicator
 * - Keyboard navigation (arrows, escape)
 * - Markdown-like formatting support
 */
export default function TutorialModal() {
    const {
        activeTutorial,
        currentStep,
        currentStepIndex,
        nextStep,
        prevStep,
        completeTutorial,
        closeTutorial,
    } = useTutorial();

    // Keyboard navigation
    useEffect(() => {
        if (!activeTutorial) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeTutorial();
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (currentStepIndex < activeTutorial.steps.length - 1) {
                    nextStep();
                } else {
                    completeTutorial();
                }
            }
            if (e.key === 'ArrowLeft') prevStep();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTutorial, currentStepIndex, nextStep, prevStep, completeTutorial, closeTutorial]);

    if (!activeTutorial || !currentStep) return null;

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === activeTutorial.steps.length - 1;
    const progress = ((currentStepIndex + 1) / activeTutorial.steps.length) * 100;

    // Format content with basic markdown-like styling
    const formatContent = (content) => {
        if (!content) return '';
        
        // Split into lines and process
        return content.split('\n').map((line, i) => {
            // Bold text
            line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>');
            
            // Bullet points
            if (line.startsWith('• ')) {
                return (
                    <li key={i} className="flex items-start gap-2 ml-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span dangerouslySetInnerHTML={{ __html: line.substring(2) }} />
                    </li>
                );
            }
            
            // Numbered items
            const numMatch = line.match(/^(\d+)\.\s/);
            if (numMatch) {
                return (
                    <li key={i} className="flex items-start gap-2 ml-2">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {numMatch[1]}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: line.substring(numMatch[0].length) }} />
                    </li>
                );
            }
            
            // Empty lines become spacing
            if (line.trim() === '') {
                return <div key={i} className="h-2" />;
            }
            
            // Regular paragraph
            return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />;
        });
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                onClick={closeTutorial}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Progress Bar */}
                <div className="h-1 bg-slate-100">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{activeTutorial.icon}</span>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {activeTutorial.title}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Step {currentStepIndex + 1} of {activeTutorial.steps.length}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeTutorial}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Step Content */}
                <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                        {currentStep.title}
                    </h3>
                    <div className="text-slate-600 leading-relaxed space-y-2">
                        {formatContent(currentStep.content)}
                    </div>
                </div>

                {/* Step Dots */}
                <div className="flex justify-center gap-1.5 pb-4">
                    {activeTutorial.steps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {/* Could add goToStep here */}}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                idx === currentStepIndex 
                                    ? 'w-6 bg-blue-600' 
                                    : idx < currentStepIndex
                                        ? 'bg-blue-300'
                                        : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        <kbd className="px-2 py-0.5 bg-white rounded border text-xs">←</kbd>
                        <kbd className="px-2 py-0.5 bg-white rounded border text-xs ml-1">→</kbd>
                        <span className="ml-2">to navigate</span>
                    </div>
                    <div className="flex gap-2">
                        {!isFirstStep && (
                            <Button variant="ghost" onClick={prevStep}>
                                ← Back
                            </Button>
                        )}
                        {isLastStep ? (
                            <Button onClick={completeTutorial}>
                                Complete Tutorial ✓
                            </Button>
                        ) : (
                            <Button onClick={nextStep}>
                                Next →
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
