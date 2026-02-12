import api from './api';

const productionAPI = {
    // Get production runs list with filters
    getAll: async (params = {}) => {
        const response = await api.get('/production', { params });
        return response.data;
    },

    // Get single production run
    get: async (id) => {
        const response = await api.get(`/production/${id}`);
        return response.data;
    },

    // Create production run
    create: async (data) => {
        const response = await api.post('/production', data);
        return response.data;
    },

    // Update production run
    update: async (id, data) => {
        const response = await api.put(`/production/${id}`, data);
        return response.data;
    },

    // Delete production run
    delete: async (id) => {
        const response = await api.delete(`/production/${id}`);
        return response.data;
    },

    // Start production run
    start: async (id) => {
        const response = await api.post(`/production/${id}/start`);
        return response.data;
    },

    // Complete production run
    complete: async (id, data) => {
        const response = await api.post(`/production/${id}/complete`, data);
        return response.data;
    },

    // Cancel production run
    cancel: async (id, reason) => {
        const response = await api.post(`/production/${id}/cancel`, { reason });
        return response.data;
    },

    // Record production loss
    recordLoss: async (id, data) => {
        const response = await api.post(`/production/${id}/loss`, data);
        return response.data;
    },

    // Get planned production runs
    getPlanned: async (params = {}) => {
        const response = await api.get('/production/planned', { params });
        return response.data;
    },

    // Get in-progress production runs
    getInProgress: async (params = {}) => {
        const response = await api.get('/production/in-progress', { params });
        return response.data;
    },

    // Check material availability
    checkMaterials: async (formulaId, quantity) => {
        const response = await api.get('/production/check-materials', {
            params: { formula_id: formulaId, quantity }
        });
        return response.data;
    },

    // Check material availability for a specific production run
    checkMaterialsById: async (runId) => {
        const response = await api.get(`/production/${runId}/check-materials`);
        return response.data;
    },

    // Get production summary/statistics
    getSummary: async (params = {}) => {
        const response = await api.get('/production/summary', { params });
        return response.data;
    },
};

export default productionAPI;
