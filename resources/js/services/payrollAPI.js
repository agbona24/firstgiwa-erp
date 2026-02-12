import api from './api';

const payrollAPI = {
    /**
     * Get list of payroll runs
     */
    getPayrollRuns: async (params = {}) => {
        const response = await api.get('/payroll', { params });
        return response.data;
    },

    /**
     * Get payroll run by ID
     */
    getPayrollRun: async (id) => {
        const response = await api.get(`/payroll/${id}`);
        return response.data.data;
    },

    /**
     * Create new payroll run
     */
    createPayrollRun: async (data) => {
        const response = await api.post('/payroll', data);
        return response.data;
    },

    /**
     * Process payroll run
     */
    processPayrollRun: async (id) => {
        const response = await api.post(`/payroll/${id}/process`);
        return response.data;
    },

    /**
     * Approve payroll run
     */
    approvePayrollRun: async (id) => {
        const response = await api.post(`/payroll/${id}/approve`);
        return response.data;
    },

    /**
     * Mark payroll as paid
     */
    markPayrollPaid: async (id) => {
        const response = await api.post(`/payroll/${id}/mark-paid`);
        return response.data;
    },

    /**
     * Get payroll summary
     */
    getPayrollSummary: async (params = {}) => {
        const response = await api.get('/payroll/summary', { params });
        return response.data;
    },

    /**
     * Get payslip for staff member
     */
    getPayslip: async (runId, staffId) => {
        const response = await api.get(`/payroll/${runId}/payslip/${staffId}`);
        return response.data.data;
    },
};

export default payrollAPI;
