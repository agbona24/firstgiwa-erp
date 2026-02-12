import api from './api';

const warehouseAPI = {
    /**
     * Get list of warehouses
     */
    getWarehouses: async (params = {}) => {
        const response = await api.get('/warehouses', { params });
        return response.data;
    },

    /**
     * Get warehouse by ID
     */
    getWarehouse: async (id) => {
        const response = await api.get(`/warehouses/${id}`);
        return response.data.data;
    },

    /**
     * Create new warehouse
     */
    createWarehouse: async (data) => {
        const response = await api.post('/warehouses', data);
        return response.data;
    },

    /**
     * Update warehouse
     */
    updateWarehouse: async (id, data) => {
        const response = await api.put(`/warehouses/${id}`, data);
        return response.data;
    },

    /**
     * Delete warehouse
     */
    deleteWarehouse: async (id, reason) => {
        const response = await api.delete(`/warehouses/${id}`, { data: { reason } });
        return response.data;
    },

    /**
     * Get warehouse inventory
     */
    getWarehouseInventory: async (id, params = {}) => {
        const response = await api.get(`/warehouses/${id}/inventory`, { params });
        return response.data;
    },
};

export default warehouseAPI;
