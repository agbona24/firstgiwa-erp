import api from './api';

// Company Profile
export const companyAPI = {
    get: () => api.get('/settings/company'),
    update: (data) => api.put('/settings/company', data),
    uploadLogo: (formData) => api.post('/settings/company/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Branches
export const branchesAPI = {
    list: () => api.get('/settings/branches'),
    create: (data) => api.post('/settings/branches', data),
    update: (id, data) => api.put(`/settings/branches/${id}`, data),
    delete: (id) => api.delete(`/settings/branches/${id}`),
    toggleActive: (id) => api.post(`/settings/branches/${id}/toggle-active`),
};

// Inventory Settings
export const inventorySettingsAPI = {
    get: () => api.get('/settings/inventory'),
    update: (data) => api.put('/settings/inventory', data),
};

// Sales & Billing Settings
export const salesSettingsAPI = {
    get: () => api.get('/settings/sales'),
    update: (data) => api.put('/settings/sales', data),
};

// Taxes
export const taxesAPI = {
    list: () => api.get('/settings/taxes'),
    create: (data) => api.post('/settings/taxes', data),
    update: (id, data) => api.put(`/settings/taxes/${id}`, data),
    delete: (id) => api.delete(`/settings/taxes/${id}`),
    toggleActive: (id) => api.post(`/settings/taxes/${id}/toggle-active`),
};

// Payment Methods
export const paymentMethodsAPI = {
    list: () => api.get('/settings/payment-methods'),
    create: (data) => api.post('/settings/payment-methods', data),
    update: (id, data) => api.put(`/settings/payment-methods/${id}`, data),
    delete: (id) => api.delete(`/settings/payment-methods/${id}`),
    toggleActive: (id) => api.post(`/settings/payment-methods/${id}/toggle-active`),
};

// Bank Accounts
export const bankAccountsAPI = {
    list: () => api.get('/settings/bank-accounts'),
    create: (data) => api.post('/settings/bank-accounts', data),
    update: (id, data) => api.put(`/settings/bank-accounts/${id}`, data),
    delete: (id) => api.delete(`/settings/bank-accounts/${id}`),
    setDefault: (id) => api.post(`/settings/bank-accounts/${id}/set-default`),
};

// Number Sequences
export const sequencesAPI = {
    list: () => api.get('/settings/sequences'),
    update: (id, data) => api.put(`/settings/sequences/${id}`, data),
    reset: (id) => api.post(`/settings/sequences/${id}/reset`),
    getNext: (document) => api.get(`/settings/sequences/${document}/next`),
};

// Approval Workflows
export const approvalsAPI = {
    get: () => api.get('/settings/approvals'),
    update: (data) => api.put('/settings/approvals', data),
};

// Payroll & HR Settings
export const payrollSettingsAPI = {
    get: () => api.get('/settings/payroll'),
    update: (data) => api.put('/settings/payroll', data),
};

// Fiscal Year
export const fiscalYearAPI = {
    get: () => api.get('/settings/fiscal'),
    update: (data) => api.put('/settings/fiscal', data),
};

// Notification Settings
export const notificationSettingsAPI = {
    get: () => api.get('/settings/notifications'),
    update: (data) => api.put('/settings/notifications', data),
};

// SMS/WhatsApp Settings
export const smsSettingsAPI = {
    get: () => api.get('/settings/sms'),
    update: (data) => api.put('/settings/sms', data),
    test: (phone) => api.post('/settings/sms/test', { phone }),
};

// Email Settings
export const emailSettingsAPI = {
    get: () => api.get('/settings/email'),
    update: (data) => api.put('/settings/email', data),
    test: (email) => api.post('/settings/email/test', { email }),
};

// Print & Receipt Settings
export const printSettingsAPI = {
    get: () => api.get('/settings/print'),
    update: (data) => api.put('/settings/print', data),
};

// Document Templates
export const templatesAPI = {
    get: () => api.get('/settings/templates'),
    update: (templates) => api.put('/settings/templates', { templates }),
};

// Credit Facility Settings
export const creditSettingsAPI = {
    get: () => api.get('/settings/credit'),
    update: (data) => api.put('/settings/credit', data),
};

// Credit Facility Types
export const creditFacilityTypesAPI = {
    getAll: () => api.get('/settings/credit-facility-types'),
    get: (id) => api.get(`/settings/credit-facility-types/${id}`),
    create: (data) => api.post('/settings/credit-facility-types', data),
    update: (id, data) => api.put(`/settings/credit-facility-types/${id}`, data),
    delete: (id) => api.delete(`/settings/credit-facility-types/${id}`),
    toggleStatus: (id) => api.post(`/settings/credit-facility-types/${id}/toggle-status`),
};

// Backup & Data
export const backupAPI = {
    getSettings: () => api.get('/settings/backup'),
    updateSettings: (data) => api.put('/settings/backup', data),
    getHistory: () => api.get('/settings/backup/history'),
    create: (type) => api.post('/settings/backup/create', { type }),
    download: (filename) => api.get(`/settings/backup/download/${filename}`, { responseType: 'blob' }),
    delete: (filename) => api.delete(`/settings/backup/${filename}`),
    export: (type, format) => api.post('/settings/backup/export', { type, format }, { responseType: 'blob' }),
    restore: (file) => {
        const formData = new FormData();
        formData.append('backup_file', file);
        return api.post('/settings/backup/restore', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

// API & Integrations
export const apiSettingsAPI = {
    get: () => api.get('/settings/api'),
    update: (data) => api.put('/settings/api', data),
    rotateKey: () => api.post('/settings/api/rotate-key'),
};

// Export all as default
export default {
    company: companyAPI,
    branches: branchesAPI,
    inventory: inventorySettingsAPI,
    sales: salesSettingsAPI,
    taxes: taxesAPI,
    paymentMethods: paymentMethodsAPI,
    bankAccounts: bankAccountsAPI,
    sequences: sequencesAPI,
    approvals: approvalsAPI,
    payroll: payrollSettingsAPI,
    fiscal: fiscalYearAPI,
    notifications: notificationSettingsAPI,
    sms: smsSettingsAPI,
    email: emailSettingsAPI,
    print: printSettingsAPI,
    templates: templatesAPI,
    credit: creditSettingsAPI,
    creditFacilityTypes: creditFacilityTypesAPI,
    backup: backupAPI,
    api: apiSettingsAPI,
};
