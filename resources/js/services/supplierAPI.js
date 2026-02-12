import api from './api';

const supplierAPI = {
    // Get suppliers list with filters
    getAll: async (params = {}) => {
        const response = await api.get('/suppliers', { params });
        return response.data;
    },

    // Get single supplier
    get: async (id) => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data;
    },

    // Create supplier
    create: async (data) => {
        const response = await api.post('/suppliers', data);
        return response.data;
    },

    // Update supplier
    update: async (id, data) => {
        const response = await api.put(`/suppliers/${id}`, data);
        return response.data;
    },

    // Delete supplier
    delete: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    },

    // Get supplier purchase orders
    getPurchaseOrders: async (id, params = {}) => {
        const response = await api.get(`/suppliers/${id}/purchase-orders`, { params });
        return response.data;
    },

    // Get supplier payments
    getPayments: async (id, params = {}) => {
        const response = await api.get(`/suppliers/${id}/payments`, { params });
        return response.data;
    },

    // Get supplier statement
    getStatement: async (id, params = {}) => {
        const response = await api.get(`/suppliers/${id}/statement`, { params });
        return response.data;
    },

    // Toggle supplier active status
    toggleActive: async (id) => {
        const response = await api.post(`/suppliers/${id}/toggle-active`);
        return response.data;
    },
};

export default supplierAPI;
