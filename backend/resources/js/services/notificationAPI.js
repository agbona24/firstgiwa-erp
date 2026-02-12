import api from './api';

export const notificationAPI = {
    // Get all notifications
    getAll: (params = {}) => api.get('/notifications', { params }),

    // Get unread count only
    getUnreadCount: () => api.get('/notifications/unread-count'),

    // Generate system notifications (checks low stock, pending approvals, etc.)
    generate: () => api.post('/notifications/generate'),

    // Mark single notification as read
    markAsRead: (id) => api.post(`/notifications/${id}/read`),

    // Mark all notifications as read
    markAllAsRead: () => api.post('/notifications/mark-all-read'),

    // Delete a notification
    delete: (id) => api.delete(`/notifications/${id}`),

    // Clear all read notifications
    clearRead: () => api.delete('/notifications/clear-read'),
};

export default notificationAPI;
