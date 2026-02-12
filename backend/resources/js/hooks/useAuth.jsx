import { createContext, useContext, useState, useEffect } from 'react';
import authAPI from '../services/authAPI';
import { setAuthToken } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        // Check if we have a token
        const token = localStorage.getItem('auth_token');
        console.log('🔐 checkAuth called, token exists:', !!token, token ? token.substring(0, 20) + '...' : 'none');
        
        if (!token) {
            console.log('❌ No token found in localStorage');
            setUser(null);
            setLoading(false);
            return;
        }
        
        try {
            console.log('📡 Calling /api/v1/me...');
            const userData = await authAPI.me();
            console.log('✅ User data received:', userData);
            setUser(userData);
        } catch (error) {
            console.error('❌ Auth check failed:', error.response?.status, error.response?.data, error.message);
            // Only clear auth if token is actually invalid (401/403)
            // Don't clear on network errors or other issues
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('🚪 Clearing auth due to 401/403');
                setUser(null);
                setAuthToken(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        let response;
        if (credentials.login_method === 'pin') {
            response = await authAPI.loginWithPin(credentials.pin);
        } else {
            response = await authAPI.login(credentials.email, credentials.password);
        }
        setUser(response.user);
        return response;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear user state and token
            setUser(null);
            setAuthToken(null);
            // Redirect to login
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
