import api from './api';
import { createCrudService } from './crud';

export const studentApi = createCrudService('/student');
export const facultyApi = createCrudService('/faculty');
export const contactApi = createCrudService('/contact', { list: 'search' });
export const addressApi = createCrudService('/address', { list: 'search' });

const searchStudents = async (filters = {}) => studentApi.search(filters);
const searchFaculty = async (filters = {}) => facultyApi.search(filters);

const addEmergencyContact = async (studentId, dto) =>
    (await api.post(`/student/${studentId}/emergency-contact`, dto)).data;

const directoryService = {
    searchStudents,
    searchFaculty,
    addEmergencyContact,
};

export default directoryService;
