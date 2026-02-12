import api from './api';

const customerAPI = {
    /**
     * Get list of customers
     */
    getCustomers: async (params = {}) => {
        const response = await api.get('/customers', { params });
        return response.data;
    },

    /**
     * Get customer by ID
     */
    getCustomer: async (id) => {
        const response = await api.get(`/customers/${id}`);
        return response.data.data;
    },

    /**
     * Create new customer
     */
    createCustomer: async (data) => {
        const response = await api.post('/customers', data);
        return response.data;
    },

    /**
     * Update customer
     */
    updateCustomer: async (id, data) => {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },

    /**
     * Delete customer
     */
    deleteCustomer: async (id, reason) => {
        const response = await api.delete(`/customers/${id}`, { data: { reason } });
        return response.data;
    },

    /**
     * Update credit facility
     */
    updateCredit: async (id, data) => {
        const response = await api.post(`/customers/${id}/credit`, data);
        return response.data;
    },

    /**
     * Block or unblock credit
     */
    toggleCreditBlock: async (id, block, reason) => {
        const response = await api.post(`/customers/${id}/credit/block`, { block, reason });
        return response.data;
    },

    /**
     * Get credit summary
     */
    getCreditSummary: async (id) => {
        const response = await api.get(`/customers/${id}/credit-summary`);
        return response.data.data;
    },

    /**
     * Get credit alerts
     */
    getCreditAlerts: async () => {
        const response = await api.get('/customers/credit-alerts');
        return response.data.data;
    },

    /**
     * Check if customer can make credit purchase
     */
    checkCredit: async (id, amount) => {
        const response = await api.post(`/customers/${id}/check-credit`, { amount });
        return response.data.data;
    },

    // Credit Analytics
    /**
     * Get credit analytics for a customer
     */
    getCreditAnalytics: async (id) => {
        const response = await api.get(`/customers/${id}/credit-analytics`);
        return response.data.data;
    },

    /**
     * Recalculate credit score
     */
    recalculateCreditScore: async (id) => {
        const response = await api.post(`/customers/${id}/credit-score/recalculate`);
        return response.data.data;
    },

    /**
     * Get credit transactions
     */
    getCreditTransactions: async (id, params = {}) => {
        const response = await api.get(`/customers/${id}/credit-transactions`, { params });
        return response.data.data;
    },

    /**
     * Get credit payments
     */
    getCreditPayments: async (id, params = {}) => {
        const response = await api.get(`/customers/${id}/credit-payments`, { params });
        return response.data.data;
    },

    /**
     * Apply credit recommendations
     */
    applyCreditRecommendations: async (id) => {
        const response = await api.post(`/customers/${id}/apply-credit-recommendations`);
        return response.data;
    },
};

// Credit Analytics API (global)
export const creditAnalyticsAPI = {
    getSummary: async () => {
        const response = await api.get('/credit-analytics/summary');
        return response.data.data;
    },

    getOverdueTransactions: async (customerId = null) => {
        const params = customerId ? { customer_id: customerId } : {};
        const response = await api.get('/credit-analytics/overdue', { params });
        return response.data.data;
    },

    recordPayment: async (data) => {
        const response = await api.post('/credit-analytics/payments', data);
        return response.data;
    },

    // Record customer credit payment against outstanding balance
    recordCustomerPayment: async (data) => {
        const response = await api.post('/credit-analytics/customer-payment', data);
        return response.data;
    },

    getTransactionDetails: async (transactionId) => {
        const response = await api.get(`/credit-analytics/transactions/${transactionId}`);
        return response.data.data;
    },
};

export default customerAPI;
