import React from 'react';

/**
 * Parse error stack to extract file locations
 */
function parseErrorStack(error) {
    if (!error?.stack) return [];
    
    const locations = [];
    const lines = error.stack.split('\n');
    
    for (const line of lines) {
        // Match patterns like "at Component (file.jsx:123:45)" or "at file.jsx:123:45"
        const match = line.match(/at\s+(?:(\S+)\s+)?\(?(.+?):(\d+):(\d+)\)?/);
        if (match) {
            const [, functionName, filePath, lineNum, colNum] = match;
            
            // Only include our source files, not node_modules
            if (filePath && !filePath.includes('node_modules') && !filePath.includes('react-dom')) {
                // Extract just the filename from path
                const fileName = filePath.split('/').pop() || filePath;
                
                locations.push({
                    function: functionName || 'anonymous',
                    file: fileName,
                    fullPath: filePath,
                    line: parseInt(lineNum, 10),
                    column: parseInt(colNum, 10)
                });
            }
        }
    }
    
    return locations;
}

/**
 * Parse component stack to find the component chain
 */
function parseComponentStack(componentStack) {
    if (!componentStack) return [];
    
    const components = [];
    const lines = componentStack.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
        // Match "at ComponentName (file:line:col)" or just "at ComponentName"
        const match = line.match(/at\s+(\S+)(?:\s+\((.+?):(\d+):(\d+)\))?/);
        if (match) {
            const [, componentName, filePath, lineNum] = match;
            const fileName = filePath ? filePath.split('/').pop() : null;
            
            components.push({
                name: componentName,
                file: fileName,
                fullPath: filePath,
                line: lineNum ? parseInt(lineNum, 10) : null
            });
        }
    }
    
    return components;
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Parse the stacks for better display
        const errorLocations = parseErrorStack(error);
        const componentChain = parseComponentStack(errorInfo.componentStack);
        
        this.setState({ 
            error, 
            errorInfo,
            errorLocations,
            componentChain
        });
        
        // Console logging for developers
        console.error('❌ Error:', error.message);
        if (errorLocations.length > 0) {
            console.error('📍 Location:', `${errorLocations[0].file}:${errorLocations[0].line}`);
        }
        console.error('Full error:', error);
    }

    render() {
        if (this.state.hasError) {
            const { error, errorLocations = [], componentChain = [] } = this.state;
            const primaryLocation = errorLocations[0];
            const failedComponent = componentChain[0];
            
            return (
                <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 font-mono">
                    <div className="max-w-4xl mx-auto">
                        {/* Error Header */}
                        <div className="flex items-start gap-4 mb-6">
                            <div className="text-4xl">❌</div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-red-400 mb-2">
                                    {error?.name || 'Error'}
                                </h1>
                                <p className="text-lg text-white">
                                    {error?.message || 'An unknown error occurred'}
                                </p>
                            </div>
                        </div>

                        {/* Primary Error Location */}
                        {primaryLocation && (
                            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                                <div className="text-red-300 text-sm mb-1">Error Location:</div>
                                <div className="text-xl text-white">
                                    <span className="text-yellow-400">{primaryLocation.file}</span>
                                    <span className="text-slate-400"> : </span>
                                    <span className="text-green-400">line {primaryLocation.line}</span>
                                    <span className="text-slate-500 text-sm ml-2">
                                        (column {primaryLocation.column})
                                    </span>
                                </div>
                                {primaryLocation.function !== 'anonymous' && (
                                    <div className="text-slate-400 text-sm mt-1">
                                        in function: <span className="text-blue-400">{primaryLocation.function}()</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Failed Component */}
                        {failedComponent && (
                            <div className="bg-orange-900/30 border border-orange-500 rounded-lg p-4 mb-4">
                                <div className="text-orange-300 text-sm mb-1">Failed Component:</div>
                                <div className="text-lg">
                                    <span className="text-orange-400">&lt;{failedComponent.name} /&gt;</span>
                                    {failedComponent.file && (
                                        <span className="text-slate-400 text-sm ml-2">
                                            in {failedComponent.file}
                                            {failedComponent.line && `:${failedComponent.line}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Component Chain */}
                        {componentChain.length > 1 && (
                            <div className="bg-slate-800 rounded-lg p-4 mb-4">
                                <div className="text-slate-400 text-sm mb-2">Component Tree (where error bubbled up):</div>
                                <div className="space-y-1">
                                    {componentChain.slice(0, 8).map((comp, index) => (
                                        <div key={index} className="flex items-center text-sm">
                                            <span className="text-slate-600 w-8">{index === 0 ? '→' : '  '}</span>
                                            <span className={index === 0 ? 'text-red-400' : 'text-slate-300'}>
                                                &lt;{comp.name}&gt;
                                            </span>
                                            {comp.file && (
                                                <span className="text-slate-500 ml-2">
                                                    {comp.file}{comp.line ? `:${comp.line}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stack Trace (Collapsed) */}
                        {errorLocations.length > 1 && (
                            <details className="bg-slate-800 rounded-lg p-4 mb-4">
                                <summary className="text-slate-400 cursor-pointer hover:text-white">
                                    Full Stack Trace ({errorLocations.length} frames)
                                </summary>
                                <div className="mt-3 space-y-1 text-sm">
                                    {errorLocations.map((loc, index) => (
                                        <div key={index} className="flex">
                                            <span className="text-slate-600 w-6">{index + 1}.</span>
                                            <span className="text-blue-400">{loc.function}</span>
                                            <span className="text-slate-500 mx-2">at</span>
                                            <span className="text-yellow-400">{loc.file}</span>
                                            <span className="text-slate-500">:</span>
                                            <span className="text-green-400">{loc.line}</span>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}

                        {/* Raw Error (Collapsed) */}
                        <details className="bg-slate-800 rounded-lg p-4 mb-6">
                            <summary className="text-slate-400 cursor-pointer hover:text-white">
                                Raw Error Stack
                            </summary>
                            <pre className="mt-3 text-xs text-slate-500 overflow-auto whitespace-pre-wrap">
                                {error?.stack}
                            </pre>
                        </details>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
                            >
                                🔄 Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
                            >
                                ↻ Reload Page
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition"
                            >
                                ← Go Back
                            </button>
                            <button
                                onClick={() => {
                                    const text = `Error: ${error?.message}\nFile: ${primaryLocation?.file || 'unknown'}:${primaryLocation?.line || '?'}\n\nStack:\n${error?.stack}`;
                                    navigator.clipboard.writeText(text);
                                    alert('Copied!');
                                }}
                                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition"
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
