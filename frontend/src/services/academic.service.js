import api from './api';
import { createCrudService } from './crud';

export const courseApi = createCrudService('/course', { list: 'search' });
export const subjectApi = createCrudService('/subject');
export const classroomApi = createCrudService('/classroom');

const getStudentsInCourse = async (courseId) => {
    const response = await api.get(`/course/${courseId}/students`);
    return response.data || [];
};

export const getAvailableClassrooms = async () => (await api.get('/classroom/available')).data || [];

const academicService = {
    getAllCourses: courseApi.getAll,
    getAllSubjects: subjectApi.getAll,
    getAllClassrooms: classroomApi.getAll,
    getStudentsInCourse,
};

export default academicService;
