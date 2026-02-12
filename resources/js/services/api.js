import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Branch ID management for multi-branch filtering
export const getSelectedBranchId = () => {
    return localStorage.getItem('selected_branch_id') || '1';
};

// Token management
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
    }
};

// Initialize token from localStorage on load
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// Helper function to get cookie value
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

// CSRF token handling - refresh cookie for POST/PUT/PATCH/DELETE requests
api.interceptors.request.use(async (config) => {
    // For state-changing requests, ensure CSRF cookie is fresh
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
        try {
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        } catch (e) {
            // Ignore CSRF refresh errors
        }
    }
    
    // Try to get token from cookie first (more reliable after refresh), then fallback to meta tag
    let token = getCookie('XSRF-TOKEN');
    if (token) {
        // Cookie value is URL encoded, decode it
        token = decodeURIComponent(token);
        config.headers['X-XSRF-TOKEN'] = token;
    } else {
        // Fallback to meta tag
        token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
    }
    
    // Add branch_id to all requests (as header for easy server-side access)
    const branchId = getSelectedBranchId();
    if (branchId) {
        config.headers['X-Branch-ID'] = branchId;
        
        // Also add to params for GET requests
        if (config.method === 'get' && config.params) {
            config.params.branch_id = config.params.branch_id || branchId;
        }
    }
    
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log errors to console for debugging
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', {
                status: error.response.status,
                message: error.response.data?.message || error.message,
                url: error.config?.url,
                errors: error.response.data?.errors,
            });
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error: No response from server', error.config?.url);
        } else {
            // Error in request setup
            console.error('Request Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
