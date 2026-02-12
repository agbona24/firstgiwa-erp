import api from './api';

const productAPI = {
    /**
     * Get list of products
     */
    getProducts: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    /**
     * Get product by ID
     */
    getProduct: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data.data;
    },

    /**
     * Create new product
     */
    createProduct: async (data) => {
        const response = await api.post('/products', data);
        return response.data;
    },

    /**
     * Update product
     */
    updateProduct: async (id, data) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    /**
     * Delete product
     */
    deleteProduct: async (id, reason) => {
        const response = await api.delete(`/products/${id}`, { data: { reason } });
        return response.data;
    },

    /**
     * Get raw materials
     */
    getRawMaterials: async (params = {}) => {
        const response = await api.get('/products/raw-materials', { params });
        return response.data;
    },

    /**
     * Get finished goods
     */
    getFinishedGoods: async (params = {}) => {
        const response = await api.get('/products/finished-goods', { params });
        return response.data;
    },

    /**
     * Get low stock products
     */
    getLowStock: async (params = {}) => {
        const response = await api.get('/products/stock/low', { params });
        return response.data;
    },

    /**
     * Get critical stock products
     */
    getCriticalStock: async (params = {}) => {
        const response = await api.get('/products/stock/critical', { params });
        return response.data;
    },

    /**
     * Activate product
     */
    activateProduct: async (id) => {
        const response = await api.post(`/products/${id}/activate`);
        return response.data;
    },

    /**
     * Deactivate product
     */
    deactivateProduct: async (id) => {
        const response = await api.post(`/products/${id}/deactivate`);
        return response.data;
    },
};

export default productAPI;
