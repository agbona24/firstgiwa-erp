import api from './api';

const dashboardAPI = {
    // Dashboard endpoints
    getKpiSummary: () => api.get('/dashboard/kpi-summary').then(res => res.data),
    getTodaySnapshot: () => api.get('/dashboard/today-snapshot').then(res => res.data),
    getSalesTrend: () => api.get('/dashboard/sales-trend').then(res => res.data),
    getRevenueExpenses: () => api.get('/dashboard/revenue-expenses').then(res => res.data),
    getProductionHistory: () => api.get('/dashboard/production-history').then(res => res.data),
    getRecentActivities: () => api.get('/dashboard/recent-activities').then(res => res.data),
    getCreditAlerts: () => api.get('/dashboard/credit-alerts').then(res => res.data),
    getPendingItems: () => api.get('/dashboard/pending-items').then(res => res.data),
    getPlSummary: () => api.get('/dashboard/pl-summary').then(res => res.data),
    
    // Legacy endpoints (still used)
    getLowStock: () => api.get('/inventory/low-stock').then(res => res.data),
    getExpenseSummary: () => api.get('/expenses/summary').then(res => res.data),
    getPaymentSummary: () => api.get('/payments/summary').then(res => res.data),
    getProductionSummary: () => api.get('/production/summary').then(res => res.data),
    getInventory: () => api.get('/inventory').then(res => res.data),
    getSalesOrders: (params = {}) => api.get('/sales-orders', { params }).then(res => res.data),
    getCustomers: () => api.get('/customers').then(res => res.data),
    getProducts: () => api.get('/products').then(res => res.data),
};

export default dashboardAPI;
