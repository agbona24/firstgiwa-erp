import api from './api';

const categoryAPI = {
    /**
     * Get list of categories
     */
    getCategories: async (params = {}) => {
        const response = await api.get('/categories', { params });
        return response.data;
    },

    /**
     * Get category by ID
     */
    getCategory: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data.data;
    },

    /**
     * Create new category
     */
    createCategory: async (data) => {
        const response = await api.post('/categories', data);
        return response.data;
    },

    /**
     * Update category
     */
    updateCategory: async (id, data) => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    /**
     * Delete category
     */
    deleteCategory: async (id, reason) => {
        const response = await api.delete(`/categories/${id}`, { data: { reason } });
        return response.data;
    },
};

export default categoryAPI;
