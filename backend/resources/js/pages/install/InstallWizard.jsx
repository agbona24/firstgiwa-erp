import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import {
    checkInstallStatus,
    checkRequirements,
    testDatabaseConnection,
    saveDatabaseConfig,
    runMigrations,
    completeInstallation,
} from '../../services/installAPI';

const STEPS = [
    { key: 'welcome', label: 'Welcome', icon: '🚀' },
    { key: 'requirements', label: 'Requirements', icon: '⚙️' },
    { key: 'database', label: 'Database', icon: '🗄️' },
    { key: 'migration', label: 'Migration', icon: '📦' },
    { key: 'complete', label: 'Complete', icon: '✅' },
];

const inputClass = 'w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

function CheckIcon({ passed }) {
    return passed ? (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function LoadingSpinner({ size = 'md' }) {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    return (
        <svg className={`animate-spin ${sizeClass}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

// Step Components
function WelcomeStep({ onNext }) {
    return (
        <div className="text-center py-8">
            <div className="text-6xl mb-6">🏭</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Welcome to FactoryPulse
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
                Thank you for choosing FactoryPulse for your business management needs. 
                This wizard will guide you through the installation process.
            </p>
            
            <div className="bg-blue-50 rounded-xl p-6 mb-8 max-w-md mx-auto text-left">
                <h3 className="font-semibold text-blue-900 mb-3">What we'll set up:</h3>
                <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                        <span className="text-blue-500">✓</span> Check system requirements
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-blue-500">✓</span> Configure database connection
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-blue-500">✓</span> Create database tables
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-blue-500">✓</span> Set up initial data
                    </li>
                </ul>
            </div>

            <Button size="lg" onClick={onNext}>
                Start Installation →
            </Button>
        </div>
    );
}

function RequirementsStep({ onNext, onBack }) {
    const [loading, setLoading] = useState(true);
    const [requirements, setRequirements] = useState(null);
    const [allPassed, setAllPassed] = useState(false);

    useEffect(() => {
        loadRequirements();
    }, []);

    const loadRequirements = async () => {
        setLoading(true);
        try {
            const data = await checkRequirements();
            setRequirements(data.requirements);
            setAllPassed(data.all_passed);
        } catch (error) {
            console.error('Failed to check requirements:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-16">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-slate-600">Checking system requirements...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">System Requirements</h2>
                <p className="text-slate-600">Please ensure your server meets the following requirements.</p>
            </div>

            {/* PHP Version */}
            <Card>
                <CardBody className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">PHP Version</h3>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium">PHP {requirements?.php?.current}</p>
                            <p className="text-sm text-slate-500">Required: PHP {requirements?.php?.required}+</p>
                        </div>
                        <CheckIcon passed={requirements?.php?.passed} />
                    </div>
                </CardBody>
            </Card>

            {/* PHP Extensions */}
            <Card>
                <CardBody className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">PHP Extensions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {requirements?.extensions?.map((ext) => (
                            <div key={ext.extension} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium">{ext.name}</span>
                                <CheckIcon passed={ext.passed} />
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Folder Permissions */}
            <Card>
                <CardBody className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Folder Permissions</h3>
                    <div className="space-y-2">
                        {requirements?.permissions?.map((perm) => (
                            <div key={perm.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{perm.name}</p>
                                    <p className="text-xs text-slate-500">{perm.permission}</p>
                                </div>
                                <CheckIcon passed={perm.passed} />
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Status Message */}
            {allPassed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-800 font-medium">All requirements passed! You can proceed to the next step.</p>
                </div>
            ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">Some requirements are not met. Please fix the issues above before continuing.</p>
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>← Back</Button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={loadRequirements}>Refresh</Button>
                    <Button onClick={onNext} disabled={!allPassed}>Continue →</Button>
                </div>
            </div>
        </div>
    );
}

function DatabaseStep({ onNext, onBack }) {
    const [dbConfig, setDbConfig] = useState({
        db_connection: 'sqlite',
        db_host: '127.0.0.1',
        db_port: '3306',
        db_database: 'database.sqlite',
        db_username: 'root',
        db_password: '',
        app_name: 'FactoryPulse',
        app_url: window.location.origin,
    });
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [error, setError] = useState(null);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        setError(null);
        try {
            const result = await testDatabaseConnection(dbConfig);
            setTestResult(result);
        } catch (err) {
            setError(err.response?.data?.message || 'Connection test failed');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await saveDatabaseConfig(dbConfig);
            onNext();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const isSqlite = dbConfig.db_connection === 'sqlite';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Database Configuration</h2>
                <p className="text-slate-600">Configure your database connection settings.</p>
            </div>

            <Card>
                <CardBody className="p-6 space-y-4">
                    {/* Database Type */}
                    <div>
                        <label className={labelClass}>Database Type</label>
                        <select
                            value={dbConfig.db_connection}
                            onChange={(e) => {
                                const conn = e.target.value;
                                setDbConfig({
                                    ...dbConfig,
                                    db_connection: conn,
                                    db_port: conn === 'mysql' ? '3306' : conn === 'pgsql' ? '5432' : '',
                                    db_database: conn === 'sqlite' ? 'database.sqlite' : '',
                                });
                                setTestResult(null);
                            }}
                            className={inputClass}
                        >
                            <option value="sqlite">SQLite (Recommended for small businesses)</option>
                            <option value="mysql">MySQL / MariaDB</option>
                            <option value="pgsql">PostgreSQL</option>
                        </select>
                        {isSqlite && (
                            <p className="text-sm text-slate-500 mt-1">
                                SQLite is a file-based database, perfect for single-server deployments.
                            </p>
                        )}
                    </div>

                    {/* SQLite Database Name */}
                    {isSqlite && (
                        <div>
                            <label className={labelClass}>Database File Name</label>
                            <input
                                type="text"
                                value={dbConfig.db_database}
                                onChange={(e) => setDbConfig({ ...dbConfig, db_database: e.target.value })}
                                className={inputClass}
                                placeholder="database.sqlite"
                            />
                        </div>
                    )}

                    {/* MySQL/PostgreSQL Settings */}
                    {!isSqlite && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Host</label>
                                    <input
                                        type="text"
                                        value={dbConfig.db_host}
                                        onChange={(e) => setDbConfig({ ...dbConfig, db_host: e.target.value })}
                                        className={inputClass}
                                        placeholder="127.0.0.1 or localhost"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Port</label>
                                    <input
                                        type="text"
                                        value={dbConfig.db_port}
                                        onChange={(e) => setDbConfig({ ...dbConfig, db_port: e.target.value })}
                                        className={inputClass}
                                        placeholder={dbConfig.db_connection === 'mysql' ? '3306' : '5432'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Database Name</label>
                                <input
                                    type="text"
                                    value={dbConfig.db_database}
                                    onChange={(e) => setDbConfig({ ...dbConfig, db_database: e.target.value })}
                                    className={inputClass}
                                    placeholder="factorypulse"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Username</label>
                                    <input
                                        type="text"
                                        value={dbConfig.db_username}
                                        onChange={(e) => setDbConfig({ ...dbConfig, db_username: e.target.value })}
                                        className={inputClass}
                                        placeholder="root"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Password</label>
                                    <input
                                        type="password"
                                        value={dbConfig.db_password}
                                        onChange={(e) => setDbConfig({ ...dbConfig, db_password: e.target.value })}
                                        className={inputClass}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* App Settings */}
                    <div className="pt-4 border-t border-slate-200">
                        <h4 className="font-semibold text-slate-800 mb-3">Application Settings</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Application Name</label>
                                <input
                                    type="text"
                                    value={dbConfig.app_name}
                                    onChange={(e) => setDbConfig({ ...dbConfig, app_name: e.target.value })}
                                    className={inputClass}
                                    placeholder="FactoryPulse"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Application URL</label>
                                <input
                                    type="url"
                                    value={dbConfig.app_url}
                                    onChange={(e) => setDbConfig({ ...dbConfig, app_url: e.target.value })}
                                    className={inputClass}
                                    placeholder="https://erp.yourcompany.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="flex items-center gap-4 pt-4">
                        <Button variant="outline" onClick={handleTest} disabled={testing}>
                            {testing ? <><LoadingSpinner size="sm" /> Testing...</> : 'Test Connection'}
                        </Button>
                        {testResult?.success && (
                            <span className="text-green-600 flex items-center gap-2">
                                <CheckIcon passed={true} /> Connection successful!
                            </span>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
                            {error}
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>← Back</Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <><LoadingSpinner size="sm" /> Saving...</> : 'Save & Continue →'}
                </Button>
            </div>
        </div>
    );
}

function MigrationStep({ onNext, onBack }) {
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    const handleMigrate = async () => {
        setStatus('running');
        setOutput('');
        setError(null);
        try {
            const result = await runMigrations();
            setOutput(result.output || 'Migrations completed successfully.');
            setStatus('success');
        } catch (err) {
            setError(err.response?.data?.message || 'Migration failed');
            setStatus('error');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Database Migration</h2>
                <p className="text-slate-600">Create database tables and set up initial data.</p>
            </div>

            <Card>
                <CardBody className="p-6">
                    {status === 'idle' && (
                        <div className="text-center py-8">
                            <div className="text-5xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Create Database Tables</h3>
                            <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                This will create all required database tables and set up default roles and permissions.
                            </p>
                            <Button size="lg" onClick={handleMigrate}>
                                Run Migrations
                            </Button>
                        </div>
                    )}

                    {status === 'running' && (
                        <div className="text-center py-8">
                            <LoadingSpinner size="lg" />
                            <h3 className="text-xl font-semibold text-slate-800 mt-4 mb-2">Running Migrations...</h3>
                            <p className="text-slate-600">Please wait while we set up your database.</p>
                            <div className="mt-4 text-sm text-slate-500 animate-pulse">
                                Creating tables... Setting up roles... Initializing data...
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-green-800 mb-2">Migration Successful!</h3>
                            <p className="text-slate-600 mb-4">All database tables have been created successfully.</p>
                            
                            {output && (
                                <details className="text-left bg-slate-50 rounded-lg p-4 mt-4">
                                    <summary className="cursor-pointer text-sm font-medium text-slate-700">View Details</summary>
                                    <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-40">
                                        {output}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-red-800 mb-2">Migration Failed</h3>
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button variant="outline" onClick={handleMigrate}>Try Again</Button>
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={status === 'running'}>← Back</Button>
                <Button onClick={onNext} disabled={status !== 'success'}>Continue →</Button>
            </div>
        </div>
    );
}

function CompleteStep() {
    const navigate = useNavigate();
    const [completing, setCompleting] = useState(false);

    const handleComplete = async () => {
        setCompleting(true);
        try {
            await completeInstallation();
            // Clear install wizard session data
            sessionStorage.removeItem('install_wizard_step');
            sessionStorage.removeItem('install_wizard_started');
            // Redirect to setup wizard for business configuration
            navigate('/setup');
        } catch (error) {
            console.error('Completion failed:', error);
            // Clear session data and still redirect even if optimization fails
            sessionStorage.removeItem('install_wizard_step');
            sessionStorage.removeItem('install_wizard_started');
            navigate('/setup');
        }
    };

    return (
        <div className="text-center py-8">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Installation Complete!
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
                The system has been installed successfully. Now let's set up your business details,
                create your admin account, and configure your preferences.
            </p>
            
            <div className="bg-green-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
                <h3 className="font-semibold text-green-900 mb-3">✓ Installation Summary</h3>
                <ul className="space-y-2 text-green-800 text-left">
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Database configured
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Tables created
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Roles & permissions set up
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> System ready
                    </li>
                </ul>
            </div>

            <Button size="lg" onClick={handleComplete} disabled={completing}>
                {completing ? (
                    <><LoadingSpinner size="sm" /> Finalizing...</>
                ) : (
                    'Continue to Business Setup →'
                )}
            </Button>
        </div>
    );
}

// Main Install Wizard Component
export default function InstallWizard() {
    const navigate = useNavigate();
    
    // Restore step from sessionStorage to survive hot reloads
    const [currentStep, setCurrentStep] = useState(() => {
        const saved = sessionStorage.getItem('install_wizard_step');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [checkingStatus, setCheckingStatus] = useState(true);
    
    // Skip status check if user has already started wizard (persisted in sessionStorage)
    const [skipStatusCheck, setSkipStatusCheck] = useState(() => {
        return sessionStorage.getItem('install_wizard_started') === 'true';
    });

    useEffect(() => {
        // Only check status on initial load, not after user has started the wizard
        if (!skipStatusCheck) {
            checkIfInstalled();
        } else {
            setCheckingStatus(false);
        }
    }, [skipStatusCheck]);

    const checkIfInstalled = async () => {
        try {
            const status = await checkInstallStatus();
            if (status.installed) {
                // Already installed, redirect to setup or dashboard
                // But only if user hasn't started the wizard in this session
                if (!sessionStorage.getItem('install_wizard_started')) {
                    navigate('/setup');
                    return;
                }
            }
        } catch (error) {
            // If API fails, probably not installed yet, continue with wizard
            console.log('Install status check failed, continuing with installation');
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            const nextStep = currentStep + 1;
            // Persist progress to sessionStorage
            sessionStorage.setItem('install_wizard_step', nextStep.toString());
            sessionStorage.setItem('install_wizard_started', 'true');
            setSkipStatusCheck(true);
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-slate-600">Checking installation status...</p>
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch (STEPS[currentStep].key) {
            case 'welcome':
                return <WelcomeStep onNext={handleNext} />;
            case 'requirements':
                return <RequirementsStep onNext={handleNext} onBack={handleBack} />;
            case 'database':
                return <DatabaseStep onNext={handleNext} onBack={handleBack} />;
            case 'migration':
                return <MigrationStep onNext={handleNext} onBack={handleBack} />;
            case 'complete':
                return <CompleteStep />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            <span className="text-blue-600">Factory</span>Pulse
                        </h1>
                        <p className="text-sm text-slate-500">Installation Wizard</p>
                    </div>
                    <Badge variant="info">Step {currentStep + 1} of {STEPS.length}</Badge>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.key} className="flex items-center">
                                <div className={`
                                    flex items-center justify-center w-10 h-10 rounded-full text-lg
                                    ${index < currentStep 
                                        ? 'bg-green-500 text-white' 
                                        : index === currentStep 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-slate-200 text-slate-500'
                                    }
                                `}>
                                    {index < currentStep ? '✓' : step.icon}
                                </div>
                                <span className={`
                                    ml-2 text-sm font-medium hidden sm:inline
                                    ${index === currentStep ? 'text-blue-600' : 'text-slate-500'}
                                `}>
                                    {step.label}
                                </span>
                                {index < STEPS.length - 1 && (
                                    <div className={`
                                        w-8 md:w-16 h-1 mx-2 md:mx-4 rounded
                                        ${index < currentStep ? 'bg-green-500' : 'bg-slate-200'}
                                    `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <Card>
                    <CardBody className="p-8">
                        {renderStep()}
                    </CardBody>
                </Card>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-sm text-slate-500">
                FactoryPulse © {new Date().getFullYear()} — Real-Time Manufacturing ERP
            </footer>
        </div>
    );
}
