import api from './api';

const formulaAPI = {
    /**
     * Get list of formulas
     */
    getFormulas: async (params = {}) => {
        const response = await api.get('/formulas', { params });
        return response.data;
    },

    /**
     * Get formula by ID
     */
    getFormula: async (id) => {
        const response = await api.get(`/formulas/${id}`);
        return response.data.data;
    },

    /**
     * Create new formula
     */
    createFormula: async (data) => {
        const response = await api.post('/formulas', data);
        return response.data;
    },

    /**
     * Update formula
     */
    updateFormula: async (id, data) => {
        const response = await api.put(`/formulas/${id}`, data);
        return response.data;
    },

    /**
     * Delete formula
     */
    deleteFormula: async (id, reason) => {
        const response = await api.delete(`/formulas/${id}`, { data: { reason } });
        return response.data;
    },

    /**
     * Get formulas available for a customer
     */
    getForCustomer: async (customerId) => {
        const response = await api.get(`/formulas/customer/${customerId}`);
        return response.data.data;
    },

    /**
     * Calculate requirements for a formula
     */
    calculateRequirements: async (id, totalQuantity) => {
        const response = await api.post(`/formulas/${id}/calculate`, { total_quantity: totalQuantity });
        return response.data.data;
    },

    /**
     * Toggle active status
     */
    toggleActive: async (id, isActive, reason) => {
        const response = await api.post(`/formulas/${id}/toggle-active`, { is_active: isActive, reason });
        return response.data;
    },

    /**
     * Clone a formula
     */
    cloneFormula: async (id, overrides = {}) => {
        const response = await api.post(`/formulas/${id}/clone`, overrides);
        return response.data;
    },
};

export default formulaAPI;
