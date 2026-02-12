import api from './api';

/**
 * POS (Point of Sale) API service
 */
const posAPI = {
    /**
     * Get products for POS display
     * @param {Object} params - Query parameters
     * @param {string} params.category_id - Filter by category
     * @param {string} params.search - Search term
     * @returns {Promise}
     */
    getProducts: async (params = {}) => {
        const response = await api.get('/pos/products', { params });
        return response.data;
    },

    /**
     * Get categories for POS filter
     * @returns {Promise}
     */
    getCategories: async () => {
        const response = await api.get('/pos/categories');
        return response.data;
    },

    /**
     * Get customers for POS selection
     * @param {Object} params - Query parameters
     * @param {string} params.search - Search term
     * @returns {Promise}
     */
    getCustomers: async (params = {}) => {
        const response = await api.get('/pos/customers', { params });
        return response.data;
    },

    /**
     * Get POS summary (today's sales, pending tickets, etc.)
     * @returns {Promise}
     */
    getSummary: async () => {
        const response = await api.get('/pos/summary');
        return response.data;
    },

    /**
     * Create a POS sale
     * @param {Object} saleData - Sale data
     * @param {Array} saleData.items - Cart items
     * @param {string} saleData.payment_method - Payment method
     * @param {number} saleData.customer_id - Customer ID
     * @param {number} saleData.discount - Discount value
     * @param {string} saleData.discount_type - percentage or fixed
     * @param {number} saleData.amount_received - Amount received (for cash)
     * @returns {Promise}
     */
    createSale: async (saleData) => {
        const response = await api.post('/pos/sale', saleData);
        return response.data;
    },

    /**
     * Get pending tickets
     * @returns {Promise}
     */
    getTickets: async () => {
        const response = await api.get('/pos/tickets');
        return response.data;
    },

    /**
     * Save order as ticket (pending payment)
     * @param {Object} ticketData - Ticket data
     * @param {Array} ticketData.items - Cart items
     * @param {number} ticketData.customer_id - Customer ID
     * @param {number} ticketData.discount - Discount value
     * @returns {Promise}
     */
    saveTicket: async (ticketData) => {
        const response = await api.post('/pos/tickets', ticketData);
        return response.data;
    },

    /**
     * Resume a ticket (get ticket data for loading into cart)
     * @param {string} ticketNumber - Ticket number
     * @returns {Promise}
     */
    resumeTicket: async (ticketNumber) => {
        const response = await api.get(`/pos/tickets/${ticketNumber}`);
        return response.data;
    },

    /**
     * Complete a ticket (convert to sale)
     * @param {string} ticketNumber - Ticket number
     * @param {Object} paymentData - Payment data
     * @param {string} paymentData.payment_method - Payment method
     * @param {number} paymentData.amount_received - Amount received
     * @returns {Promise}
     */
    completeTicket: async (ticketNumber, paymentData) => {
        const response = await api.post(`/pos/tickets/${ticketNumber}/complete`, paymentData);
        return response.data;
    },

    /**
     * Cancel a ticket
     * @param {string} ticketNumber - Ticket number
     * @returns {Promise}
     */
    cancelTicket: async (ticketNumber) => {
        const response = await api.delete(`/pos/tickets/${ticketNumber}`);
        return response.data;
    },

    // ==========================================
    // REGISTER / SESSION MANAGEMENT
    // ==========================================

    /**
     * Get current active session for the logged-in user
     * @returns {Promise}
     */
    getActiveSession: async () => {
        const response = await api.get('/pos/session');
        return response.data;
    },

    /**
     * Open a new register/shift session
     * @param {Object} data - Session data
     * @param {number} data.opening_cash - Opening cash balance
     * @param {string} data.terminal_id - Optional terminal identifier
     * @param {string} data.notes - Optional notes
     * @returns {Promise}
     */
    openRegister: async (data) => {
        const response = await api.post('/pos/session/open', data);
        return response.data;
    },

    /**
     * Close the current register/shift session
     * @param {Object} data - Close data
     * @param {number} data.closing_cash - Closing cash balance
     * @param {string} data.notes - Optional notes
     * @returns {Promise}
     */
    closeRegister: async (data) => {
        const response = await api.post('/pos/session/close', data);
        return response.data;
    },

    /**
     * Get session history
     * @param {Object} params - Query parameters
     * @returns {Promise}
     */
    getSessionHistory: async (params = {}) => {
        const response = await api.get('/pos/sessions', { params });
        return response.data;
    },

    /**
     * Get detailed session report
     * @param {number} sessionId - Session ID
     * @returns {Promise}
     */
    getSessionReport: async (sessionId) => {
        const response = await api.get(`/pos/sessions/${sessionId}`);
        return response.data;
    },
};

export default posAPI;
