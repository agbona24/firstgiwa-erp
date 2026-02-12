import './bootstrap';
import '../css/app.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handlers to catch unhandled errors
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global Error:', { message, source, lineno, colno, error });
    return false;
};

window.onunhandledrejection = function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
};

const root = createRoot(document.getElementById('app'));

root.render(
    <StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </StrictMode>
);
