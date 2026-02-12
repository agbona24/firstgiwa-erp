import api from './api';

const paymentAPI = {
    // Get payments list with filters
    getAll: async (params = {}) => {
        const response = await api.get('/payments', { params });
        return response.data;
    },

    // Get single payment
    get: async (id) => {
        const response = await api.get(`/payments/${id}`);
        return response.data;
    },

    // Create payment
    create: async (data) => {
        const response = await api.post('/payments', data);
        return response.data;
    },

    // Update payment
    update: async (id, data) => {
        const response = await api.put(`/payments/${id}`, data);
        return response.data;
    },

    // Delete payment
    delete: async (id) => {
        const response = await api.delete(`/payments/${id}`);
        return response.data;
    },

    // Reconcile payment
    reconcile: async (id, data) => {
        const response = await api.post(`/payments/${id}/reconcile`, data);
        return response.data;
    },

    // Reverse/void payment
    reverse: async (id, reason) => {
        const response = await api.post(`/payments/${id}/reverse`, { reason });
        return response.data;
    },

    // Get customer receivables
    getReceivables: async (params = {}) => {
        const response = await api.get('/payments/receivables', { params });
        return response.data;
    },

    // Get supplier payables
    getPayables: async (params = {}) => {
        const response = await api.get('/payments/payables', { params });
        return response.data;
    },

    // Get overdue payments
    getOverdue: async (params = {}) => {
        const response = await api.get('/payments/overdue', { params });
        return response.data;
    },

    // Get payment summary/statistics
    getSummary: async (params = {}) => {
        const response = await api.get('/payments/summary', { params });
        return response.data;
    },
};

export default paymentAPI;
