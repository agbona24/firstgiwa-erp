import api from './api';

const inventoryAPI = {
    // Get inventory list with filters
    getInventory: async (params = {}) => {
        const response = await api.get('/inventory', { params });
        return response.data;
    },

    // Get stock movements
    getMovements: async (productId, params = {}) => {
        const response = await api.get(`/inventory/${productId}/movements`, { params });
        return response.data;
    },

    // Get all stock movements
    getAllMovements: async (params = {}) => {
        const response = await api.get('/inventory/movements', { params });
        return response.data;
    },

    // Get low stock items
    getLowStock: async () => {
        const response = await api.get('/inventory/low-stock');
        return response.data;
    },

    // Get critical stock items
    getCriticalStock: async () => {
        const response = await api.get('/inventory/critical-stock');
        return response.data;
    },

    // Create stock adjustment
    createAdjustment: async (data) => {
        const response = await api.post('/inventory/adjust', data);
        return response.data;
    },

    // Get adjustment history
    getAdjustments: async (params = {}) => {
        const response = await api.get('/inventory/adjustments', { params });
        return response.data;
    },

    // Get pending adjustments
    getPendingAdjustments: async (params = {}) => {
        const response = await api.get('/inventory/adjustments/pending', { params });
        return response.data;
    },

    // Approve adjustment
    approveAdjustment: async (adjustmentId, notes = '') => {
        const response = await api.post(`/inventory/adjustments/${adjustmentId}/approve`, { approval_notes: notes });
        return response.data;
    },

    // Reject adjustment
    rejectAdjustment: async (adjustmentId, notes) => {
        const response = await api.post(`/inventory/adjustments/${adjustmentId}/reject`, { approval_notes: notes });
        return response.data;
    },

    // Transfer stock
    transferStock: async (data) => {
        const response = await api.post('/inventory/transfer', data);
        return response.data;
    },

    // Get inventory batches
    getBatches: async (params = {}) => {
        const response = await api.get('/inventory/batches', { params });
        return response.data;
    },

    // Get single inventory item
    getInventoryItem: async (productId) => {
        const response = await api.get(`/inventory/${productId}`);
        return response.data;
    },
};

export default inventoryAPI;
