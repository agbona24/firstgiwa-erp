import api from './api';

const departmentAPI = {
    getAll: (params = {}) => api.get('/departments', { params }),
    
    getById: (id) => api.get(`/departments/${id}`),
    
    create: (data) => api.post('/departments', data),
    
    update: (id, data) => api.put(`/departments/${id}`, data),
    
    delete: (id) => api.delete(`/departments/${id}`),
    
    getStats: () => api.get('/departments/stats'),
};

export default departmentAPI;
