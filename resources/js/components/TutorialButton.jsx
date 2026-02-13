import { useTutorial } from '../contexts/TutorialContext';

/**
 * TutorialButton - Quick access button to start a module tutorial
 * 
 * Usage:
 * <TutorialButton moduleId="inventory" />
 * <TutorialButton moduleId="pos" label="Learn POS" />
 */
export default function TutorialButton({ 
    moduleId, 
    label = 'Tutorial',
    variant = 'default', // 'default', 'minimal', 'icon-only'
    className = '' 
}) {
    const { startTutorial, isTutorialComplete, allTutorials } = useTutorial();
    
    const tutorial = allTutorials[moduleId];
    if (!tutorial) return null;
    
    const isComplete = isTutorialComplete(moduleId);

    if (variant === 'icon-only') {
        return (
            <button
                onClick={() => startTutorial(moduleId)}
                className={`p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors ${className}`}
                title={`${tutorial.title} Tutorial`}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        );
    }

    if (variant === 'minimal') {
        return (
            <button
                onClick={() => startTutorial(moduleId)}
                className={`text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors ${className}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{label}</span>
                {isComplete && <span className="text-green-500">✓</span>}
            </button>
        );
    }

    // Default variant
    return (
        <button
            onClick={() => startTutorial(moduleId)}
            className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-blue-50 hover:bg-blue-100 text-blue-600 
                text-sm font-medium transition-colors
                ${className}
            `}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{label}</span>
            {isComplete && (
                <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </span>
            )}
        </button>
    );
}


/**
 * PageHeader - Common header with title, breadcrumb, and tutorial button
 */
export function PageHeader({ 
    title, 
    subtitle, 
    tutorialId,
    actions,
    children 
}) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                        {tutorialId && (
                            <TutorialButton moduleId={tutorialId} label="Learn" />
                        )}
                    </div>
                    {subtitle && (
                        <p className="mt-1 text-slate-600">{subtitle}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}
