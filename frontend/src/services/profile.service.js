import api from './api';
import { contactApi, addressApi } from './directory.service';

// 204 No Content (no record yet) comes back as an empty string
const orNull = (data) => (data === '' || data === undefined ? null : data);

/**
 * Student / faculty records now belong to a login on the server:
 *  - GET  /student/me  returns the record (claiming an admin-created one with the same verified email), or 204
 *  - POST /student/me  creates it (first/last name always come from the account)
 *  - PATCH /student/me updates it (name, course and joining date cannot be changed)
 * Faculty works the same way under /faculty/me.
 */
const student = {
    get: async () => orNull((await api.get('/student/me')).data),
    create: async (payload) => (await api.post('/student/me', payload)).data,
    update: async (payload) => (await api.patch('/student/me', payload)).data,
    emergencyContacts: async () => (await api.get('/student/me/emergency-contacts')).data || [],
    addEmergencyContact: async (dto) => (await api.post('/student/me/emergency-contact', dto)).data,
    removeEmergencyContact: async (id) => {
        await api.delete(`/student/me/emergency-contacts/${id}`);
    },
};

const faculty = {
    get: async () => orNull((await api.get('/faculty/me')).data),
    create: async (payload) => (await api.post('/faculty/me', payload)).data,
    update: async (payload) => (await api.patch('/faculty/me', payload)).data,
};

const librarian = {
    get: async () => (await api.get('/librarian/me')).data,
    update: async (payload) => (await api.patch('/librarian/me', payload)).data,
};

// Subject names for the faculty dropdown (public endpoint)
const getSubjects = async () => (await api.get('/public/subjects')).data || [];

// Used by the admin Directory to read a student's contact / address details
const getStudentDetails = async (studentRecord) => {
    const [contact, address] = await Promise.allSettled([
        studentRecord.contactId ? contactApi.getById(studentRecord.contactId) : Promise.resolve(null),
        studentRecord.currentAddressId ? addressApi.getById(studentRecord.currentAddressId) : Promise.resolve(null),
    ]);
    return {
        contact: contact.status === 'fulfilled' ? contact.value : null,
        address: address.status === 'fulfilled' ? address.value : null,
    };
};

const profileService = { student, faculty, librarian, getSubjects, getStudentDetails };

export default profileService;
