import api from './api';

const ADMIN_PREFIX = '/admin';

// Dashboard
export const getAdminDashboard = () => api.get(`${ADMIN_PREFIX}/dashboard`);

// Tenants
export const getTenants = (params = {}) => api.get(`${ADMIN_PREFIX}/tenants`, { params });
export const createTenant = (data) => api.post(`${ADMIN_PREFIX}/tenants`, data);
export const getTenant = (id) => api.get(`${ADMIN_PREFIX}/tenants/${id}`);
export const updateTenant = (id, data) => api.put(`${ADMIN_PREFIX}/tenants/${id}`, data);
export const deleteTenant = (id) => api.delete(`${ADMIN_PREFIX}/tenants/${id}`);
export const suspendTenant = (id, reason) => api.post(`${ADMIN_PREFIX}/tenants/${id}/suspend`, { reason });
export const activateTenant = (id) => api.post(`${ADMIN_PREFIX}/tenants/${id}/activate`);
export const impersonateTenant = (id) => api.post(`${ADMIN_PREFIX}/tenants/${id}/impersonate`);

// System Admin Users
export const getAdminUsers = () => api.get(`${ADMIN_PREFIX}/users`);
export const createAdminUser = (data) => api.post(`${ADMIN_PREFIX}/users`, data);
export const deleteAdminUser = (id) => api.delete(`${ADMIN_PREFIX}/users/${id}`);

// Tenant Users
export const getTenantUsers = (tenantId, params = {}) => api.get(`${ADMIN_PREFIX}/tenants/${tenantId}/users`, { params });

// Plans
export const getPlans = (params = {}) => api.get(`${ADMIN_PREFIX}/plans`, { params });
export const createPlan = (data) => api.post(`${ADMIN_PREFIX}/plans`, data);
export const getPlan = (id) => api.get(`${ADMIN_PREFIX}/plans/${id}`);
export const updatePlan = (id, data) => api.put(`${ADMIN_PREFIX}/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`${ADMIN_PREFIX}/plans/${id}`);
export const togglePlanActive = (id) => api.post(`${ADMIN_PREFIX}/plans/${id}/toggle-active`);

// CMS - Landing Page
export const getLandingContent = () => api.get(`${ADMIN_PREFIX}/cms/landing`);
export const updateLandingContent = (data) => api.put(`${ADMIN_PREFIX}/cms/landing`, data);

// System
export const getSystemHealth = () => api.get(`${ADMIN_PREFIX}/system/health`);
export const getActivityLogs = (params = {}) => api.get(`${ADMIN_PREFIX}/system/activity-logs`, { params });
