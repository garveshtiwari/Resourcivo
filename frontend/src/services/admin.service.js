import api from './api';
import { createCrudService } from './crud';

export { libraryApi } from './resource.service';
export const librarianApi = createCrudService('/librarian');
export const transportManagerApi = createCrudService('/transport-manager');

// Admin-only account management
export const createStaffAccount = async (payload) => (await api.post('/admin/staff', payload)).data;
export const listUsers = async () => (await api.get('/admin/users')).data || [];
export const setUserEnabled = async (id, enabled) => (await api.patch(`/admin/users/${id}/enabled`, { enabled })).data;
export const setUserRoles = async (id, roles) => (await api.put(`/admin/users/${id}/roles`, { roles })).data;
