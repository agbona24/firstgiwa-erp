import api from './api';

/**
 * Audit Log API service
 */
const auditAPI = {
    /**
     * Get audit logs with filtering
     * @param {Object} params - Query parameters
     * @param {string} params.action - Filter by action (CREATE, UPDATE, DELETE, etc.)
     * @param {number} params.user_id - Filter by user ID
     * @param {string} params.entity - Filter by entity type
     * @param {string} params.start_date - Start date (YYYY-MM-DD)
     * @param {string} params.end_date - End date (YYYY-MM-DD)
     * @param {string} params.search - Search term
     * @param {number} params.page - Page number
     * @param {number} params.per_page - Items per page
     * @returns {Promise}
     */
    getLogs: async (params = {}) => {
        const response = await api.get('/audit-logs', { params });
        return response.data;
    },

    /**
     * Get single audit log
     * @param {number} id - Audit log ID
     * @returns {Promise}
     */
    getLog: async (id) => {
        const response = await api.get(`/audit-logs/${id}`);
        return response.data;
    },

    /**
     * Get available filters (actions, entities, users)
     * @returns {Promise}
     */
    getFilters: async () => {
        const response = await api.get('/audit-logs/filters');
        return response.data;
    },

    /**
     * Export audit logs as CSV
     * @param {Object} params - Filter parameters
     * @returns {Promise}
     */
    export: async (params = {}) => {
        const response = await api.get('/audit-logs/export', { 
            params,
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    },
};

export default auditAPI;
