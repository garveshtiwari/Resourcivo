import api from './api';
import { createCrudService } from './crud';

export const bookApi = createCrudService('/library-book');
export const inventoryApi = createCrudService('/inventory-item');
export const labApi = createCrudService('/lab-equipment');
export const libraryApi = createCrudService('/library');

// Librarians who can be chosen to manage a library (admin + librarians)
export const getLibrarianOptions = async () => (await api.get('/library/librarians')).data || [];

export const getBookCategories = async () => (await api.get('/library-book/categories')).data || [];
export const getLowStock = async () => (await api.get('/inventory-item/low-stock')).data || [];
export const getMaintenanceDue = async (days = 30) =>
    (await api.get('/lab-equipment/maintenance-due', { params: { days } })).data || [];

const resourceService = {
    getAllBooks: bookApi.getAll,
    getAllInventoryObj: inventoryApi.getAll,
    getAllLabEquipment: labApi.getAll,
};

export default resourceService;
