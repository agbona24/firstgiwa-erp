import api from './api';

const salesOrderAPI = {
    /**
     * Get list of sales orders
     */
    getSalesOrders: async (params = {}) => {
        const response = await api.get('/sales-orders', { params });
        return response.data;
    },

    /**
     * Get sales order by ID
     */
    getSalesOrder: async (id) => {
        const response = await api.get(`/sales-orders/${id}`);
        return response.data.data;
    },

    /**
     * Create new sales order
     */
    createSalesOrder: async (data) => {
        const response = await api.post('/sales-orders', data);
        return response.data;
    },

    /**
     * Approve sales order
     */
    approveSalesOrder: async (id, reason = '') => {
        const response = await api.post(`/sales-orders/${id}/approve`, { reason });
        return response.data;
    },

    /**
     * Reject sales order
     */
    rejectSalesOrder: async (id, reason) => {
        const response = await api.post(`/sales-orders/${id}/reject`, { reason });
        return response.data;
    },

    /**
     * Get pending sales orders
     */
    getPendingSalesOrders: async (params = {}) => {
        const response = await api.get('/sales-orders/pending', { params });
        return response.data;
    },

    /**
     * Update fulfillment status of a sales order
     */
    fulfillSalesOrder: async (id, data) => {
        const response = await api.post(`/sales-orders/${id}/fulfill`, data);
        return response.data;
    },
};

export default salesOrderAPI;
