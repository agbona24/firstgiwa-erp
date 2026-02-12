import api from './api';

const purchaseOrderAPI = {
    // Get purchase orders list with filters
    getAll: async (params = {}) => {
        const response = await api.get('/purchase-orders', { params });
        return response.data;
    },

    // Get single purchase order
    get: async (id) => {
        const response = await api.get(`/purchase-orders/${id}`);
        return response.data;
    },

    // Create purchase order
    create: async (data) => {
        const response = await api.post('/purchase-orders', data);
        return response.data;
    },

    // Update purchase order
    update: async (id, data) => {
        const response = await api.put(`/purchase-orders/${id}`, data);
        return response.data;
    },

    // Delete purchase order
    delete: async (id) => {
        const response = await api.delete(`/purchase-orders/${id}`);
        return response.data;
    },

    // Approve purchase order
    approve: async (id, notes = '') => {
        const response = await api.post(`/purchase-orders/${id}/approve`, { notes });
        return response.data;
    },

    // Cancel purchase order
    cancel: async (id, reason) => {
        const response = await api.post(`/purchase-orders/${id}/cancel`, { reason });
        return response.data;
    },

    // Receive goods for purchase order
    receive: async (id, data) => {
        const response = await api.post(`/purchase-orders/${id}/receive`, data);
        return response.data;
    },

    // Get pending purchase orders
    getPending: async (params = {}) => {
        const response = await api.get('/purchase-orders/pending', { params });
        return response.data;
    },

    // Download PDF
    downloadPdf: async (id) => {
        const response = await api.get(`/purchase-orders/${id}/pdf`, {
            responseType: 'blob',
        });
        return response;
    },

    // Get PDF preview URL
    getPdfPreviewUrl: (id) => {
        return `${api.defaults.baseURL}/purchase-orders/${id}/pdf/preview`;
    },

    // Send email to supplier
    sendEmail: async (id) => {
        const response = await api.post(`/purchase-orders/${id}/send-email`);
        return response.data;
    },
};

export default purchaseOrderAPI;
