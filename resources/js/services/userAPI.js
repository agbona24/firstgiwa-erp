import api from './api';

const userAPI = {
    /**
     * Get list of users
     */
    getUsers: async (params = {}) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    /**
     * Get user by ID
     */
    getUser: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data.data;
    },

    /**
     * Create new user
     */
    createUser: async (data) => {
        const response = await api.post('/users', data);
        return response.data;
    },

    /**
     * Update user
     */
    updateUser: async (id, data) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },

    /**
     * Delete/deactivate user
     */
    deleteUser: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    /**
     * Get all roles
     */
    getRoles: async () => {
        const response = await api.get('/users/roles');
        return response.data;
    },

    /**
     * Get all permissions
     */
    getPermissions: async () => {
        const response = await api.get('/users/permissions');
        return response.data;
    },

    /**
     * Create new role
     */
    createRole: async (data) => {
        const response = await api.post('/users/roles', data);
        return response.data;
    },

    /**
     * Update role
     */
    updateRole: async (roleId, data) => {
        const response = await api.put(`/users/roles/${roleId}`, data);
        return response.data;
    },

    /**
     * Delete role
     */
    deleteRole: async (roleId) => {
        const response = await api.delete(`/users/roles/${roleId}`);
        return response.data;
    },

    /**
     * Assign roles to user
     */
    assignRoles: async (userId, roles) => {
        const response = await api.post(`/users/${userId}/assign-roles`, { roles });
        return response.data;
    },

    /**
     * Revoke role from user
     */
    revokeRole: async (userId, role) => {
        const response = await api.post(`/users/${userId}/revoke-role`, { role });
        return response.data;
    },

    /**
     * Toggle user active/inactive status
     */
    toggleStatus: async (userId) => {
        const response = await api.post(`/users/${userId}/toggle-status`);
        return response.data;
    },

    /**
     * Admin reset password for a user
     */
    resetPassword: async (userId, password, password_confirmation) => {
        const response = await api.post(`/users/${userId}/reset-password`, { password, password_confirmation });
        return response.data;
    },

    /**
     * Set PIN code for a user
     */
    setPin: async (userId, pin) => {
        const response = await api.post(`/users/${userId}/set-pin`, { pin });
        return response.data;
    },

    /**
     * Remove PIN code from a user
     */
    removePin: async (userId) => {
        const response = await api.delete(`/users/${userId}/remove-pin`);
        return response.data;
    },
};

export default userAPI;
