import api from './api';

/**
 * Small factory for the standard controller shape used across the backend:
 *   GET /x, GET /x/{id}, POST /x, PUT /x/{id}, PATCH /x/{id}, DELETE /x/{id}, POST /x/search
 * Pass { list: 'search' } for controllers that have no "GET all" (e.g. /course).
 */
export const createCrudService = (path, { list = 'get' } = {}) => ({
    getAll: async () => {
        const res = list === 'search' ? await api.post(`${path}/search`, {}) : await api.get(path);
        return res.data || [];
    },
    search: async (filter = {}) => (await api.post(`${path}/search`, filter)).data || [],
    getById: async (id) => (await api.get(`${path}/${id}`)).data,
    create: async (data) => (await api.post(path, data)).data,
    update: async (id, data) => (await api.put(`${path}/${id}`, data)).data,
    patch: async (id, data) => (await api.patch(`${path}/${id}`, data)).data,
    remove: async (id) => {
        await api.delete(`${path}/${id}`);
    },
});
