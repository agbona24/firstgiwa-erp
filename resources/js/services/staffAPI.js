import api from './api';

const staffAPI = {
    // Get staff list with filters
    getAll: async (params = {}) => {
        const response = await api.get('/staff', { params });
        return response.data;
    },

    // Get single staff member
    get: async (id) => {
        const response = await api.get(`/staff/${id}`);
        return response.data;
    },

    // Create staff member
    create: async (data) => {
        const response = await api.post('/staff', data);
        return response.data;
    },

    // Update staff member
    update: async (id, data) => {
        const response = await api.put(`/staff/${id}`, data);
        return response.data;
    },

    // Delete staff member
    delete: async (id) => {
        const response = await api.delete(`/staff/${id}`);
        return response.data;
    },

    // Terminate staff
    terminate: async (id, data) => {
        const response = await api.post(`/staff/${id}/terminate`, data);
        return response.data;
    },

    // Suspend staff
    suspend: async (id, reason) => {
        const response = await api.post(`/staff/${id}/suspend`, { reason });
        return response.data;
    },

    // Reinstate staff
    reinstate: async (id) => {
        const response = await api.post(`/staff/${id}/reinstate`);
        return response.data;
    },

    // Update salary
    updateSalary: async (id, data) => {
        const response = await api.post(`/staff/${id}/salary`, data);
        return response.data;
    },

    // Get staff by department
    getByDepartment: async () => {
        const response = await api.get('/staff/by-department');
        return response.data;
    },

    // Get staff summary/statistics
    getSummary: async () => {
        const response = await api.get('/staff/summary');
        return response.data;
    },
};

export default staffAPI;
