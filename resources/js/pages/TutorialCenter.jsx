import { useTutorial, MODULE_TUTORIALS } from '../contexts/TutorialContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';

/**
 * TutorialCenter - Learning hub for all module tutorials
 * Features:
 * - Grid view of all available tutorials
 * - Completion tracking with progress indicators
 * - Quick restart of the main onboarding tour
 * - Estimated time for each tutorial
 */
export default function TutorialCenter() {
    const { startTutorial, isTutorialComplete, getCompletionStats, resetAllProgress } = useTutorial();
    const { startTour, resetTour } = useOnboarding();
    const stats = getCompletionStats();

    // Group tutorials by category
    const tutorialGroups = {
        'Getting Started': ['dashboard'],
        'Sales & POS': ['pos', 'salesOrders', 'customers', 'payments'],
        'Operations': ['inventory', 'production', 'expenses'],
        'Administration': ['staff', 'reports', 'settings'],
    };

    const handleRestartMainTour = () => {
        resetTour();
        startTour();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                            <span className="text-4xl">🎓</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Tutorial Center</h1>
                            <p className="text-blue-100">Learn how to use FactoryPulse like a pro</p>
                        </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="mt-8 bg-white/10 backdrop-blur rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Your Learning Progress</span>
                            <span className="text-sm">{stats.completed} of {stats.total} completed</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${stats.percentage}%` }}
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button 
                                variant="outline"
                                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                                onClick={handleRestartMainTour}
                            >
                                🔄 Restart Welcome Tour
                            </Button>
                            {stats.completed > 0 && (
                                <Button 
                                    variant="ghost"
                                    className="text-white/80 hover:text-white"
                                    onClick={resetAllProgress}
                                >
                                    Reset Progress
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tutorial Grid */}
            <div className="max-w-6xl mx-auto px-6 -mt-6">
                {Object.entries(tutorialGroups).map(([category, moduleIds]) => (
                    <div key={category} className="mb-10">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {category}
                            <span className="text-sm font-normal text-slate-500">
                                ({moduleIds.filter(id => isTutorialComplete(id)).length}/{moduleIds.length})
                            </span>
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {moduleIds.map(moduleId => {
                                const tutorial = MODULE_TUTORIALS[moduleId];
                                if (!tutorial) return null;
                                
                                const isComplete = isTutorialComplete(moduleId);
                                
                                return (
                                    <Card 
                                        key={moduleId}
                                        className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                                            isComplete ? 'ring-2 ring-green-500/20 bg-green-50/50' : ''
                                        }`}
                                        onClick={() => startTutorial(moduleId)}
                                    >
                                        <CardBody className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                                        isComplete 
                                                            ? 'bg-green-100' 
                                                            : 'bg-blue-50 group-hover:bg-blue-100'
                                                    } transition-colors`}>
                                                        {isComplete ? '✅' : tutorial.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {tutorial.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                                            <span>⏱️ {tutorial.duration}</span>
                                                            <span>•</span>
                                                            <span>{tutorial.steps.length} steps</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                                                {tutorial.description}
                                            </p>

                                            <div className="mt-4 flex items-center justify-between">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                    isComplete 
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {isComplete ? '✓ Completed' : 'Not started'}
                                                </span>
                                                <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isComplete ? 'Review →' : 'Start →'}
                                                </span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Tips Section */}
            <div className="max-w-6xl mx-auto px-6">
                <Card>
                    <CardBody className="p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">💡 Quick Tips</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">⌨️</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900">Keyboard Shortcuts</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Ctrl+K</kbd> for global search anywhere in the app.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">⚡</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900">Quick Actions</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Click the lightning bolt in the header for instant access to common tasks.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">🔔</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900">Stay Updated</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Check notifications for low stock alerts, pending approvals, and messages.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
