import api from './api';

const expenseAPI = {
    // Get expenses list with filters
    getAll: async (params = {}) => {
        const response = await api.get('/expenses', { params });
        return response.data;
    },

    // Get single expense
    get: async (id) => {
        const response = await api.get(`/expenses/${id}`);
        return response.data;
    },

    // Create expense
    create: async (data) => {
        const response = await api.post('/expenses', data);
        return response.data;
    },

    // Update expense
    update: async (id, data) => {
        const response = await api.put(`/expenses/${id}`, data);
        return response.data;
    },

    // Delete expense
    delete: async (id) => {
        const response = await api.delete(`/expenses/${id}`);
        return response.data;
    },

    // Approve expense
    approve: async (id, notes = '') => {
        const response = await api.post(`/expenses/${id}/approve`, { notes });
        return response.data;
    },

    // Reject expense
    reject: async (id, notes) => {
        const response = await api.post(`/expenses/${id}/reject`, { notes });
        return response.data;
    },

    // Disapprove (revert approved to pending)
    disapprove: async (id) => {
        const response = await api.post(`/expenses/${id}/disapprove`);
        return response.data;
    },

    // Get pending expenses
    getPending: async (params = {}) => {
        const response = await api.get('/expenses/pending', { params });
        return response.data;
    },

    // Get expense summary/statistics
    getSummary: async (params = {}) => {
        const response = await api.get('/expenses/summary', { params });
        return response.data;
    },

    // Get expense categories
    getCategories: async () => {
        const response = await api.get('/expenses/categories');
        return response.data;
    },

    // Create expense category
    createCategory: async (data) => {
        const response = await api.post('/expenses/categories', data);
        return response.data;
    },
};

export default expenseAPI;
