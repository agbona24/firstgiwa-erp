import api, { setAuthToken } from './api';

const authAPI = {
    /**
     * Login user with email + password
     */
    login: async (email, password) => {
        // First get CSRF token
        await api.get('/sanctum/csrf-cookie', { baseURL: '/' });
        
        const response = await api.post('/login', { email, password, login_method: 'password' });
        
        // Store the token
        if (response.data.token) {
            console.log('🔑 Storing token:', response.data.token.substring(0, 20) + '...');
            setAuthToken(response.data.token);
        } else {
            console.warn('⚠️ No token in login response:', response.data);
        }
        
        return response.data;
    },

    /**
     * Login user with PIN only (no email needed)
     */
    loginWithPin: async (pin) => {
        await api.get('/sanctum/csrf-cookie', { baseURL: '/' });
        
        const response = await api.post('/login', { pin, login_method: 'pin' });
        
        if (response.data.token) {
            setAuthToken(response.data.token);
        }
        
        return response.data;
    },

    /**
     * Logout user
     */
    logout: async () => {
        const response = await api.post('/logout');
        
        // Clear the token
        setAuthToken(null);
        
        return response.data;
    },

    /**
     * Get current user
     */
    me: async () => {
        const response = await api.get('/me');
        return response.data.user;
    },
};

export default authAPI;
