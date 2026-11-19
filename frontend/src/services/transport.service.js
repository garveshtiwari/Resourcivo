import api from './api';

// 204 No Content comes back as an empty string; normalise it to null.
const orNull = (data) => (data === '' || data === undefined ? null : data);

// Get all transports (Student/Faculty view)
const getAllTransports = async () => {
    const response = await api.get('/transport');
    return response.data;
};

// Get available transports
const getAvailableTransports = async () => {
    const response = await api.get('/transport/available');
    return response.data;
};

// Book a transport (Student)
const bookTransportStudent = async (studentId, transportId, pickupPoint) => {
    const response = await api.post(`/transport/booking/student/${studentId}`, {
        transportId,
        pickupPoint,
    });
    return response.data;
};

// Book a transport (Faculty)
const bookTransportFaculty = async (facultyId, transportId, pickupPoint) => {
    const response = await api.post(`/transport/booking/faculty/${facultyId}`, {
        transportId,
        pickupPoint,
    });
    return response.data;
};

// Get active booking
const getStudentBooking = async (studentId) => {
    const response = await api.get(`/transport/booking/student/${studentId}`);
    return orNull(response.data);
};

const getFacultyBooking = async (facultyId) => {
    const response = await api.get(`/transport/booking/faculty/${facultyId}`);
    return orNull(response.data);
};

// The signed-in user's own booking (student or faculty), no id needed
const getMyBooking = async () => orNull((await api.get('/transport/bookings/me')).data);

// Staff: activate / deactivate a vehicle, cancel any booking
const setTransportActive = async (id, isActive) => (await api.patch(`/transport/${id}/status`, { isActive })).data;

const cancelBookingById = async (bookingId) => {
    await api.post(`/transport/bookings/${bookingId}/cancel`);
};

// Cancel booking
const cancelStudentBooking = async (studentId) => {
    await api.delete(`/transport/booking/student/${studentId}`);
};

const cancelFacultyBooking = async (facultyId) => {
    await api.delete(`/transport/booking/faculty/${facultyId}`);
};

// Admin / Transport manager: every booking in the system
const getAllBookings = async () => {
    const response = await api.get('/transport/bookings');
    return response.data || [];
};

// Admin: Create Transport
const createTransport = async (transportData) => {
    const response = await api.post('/transport', transportData);
    return response.data;
};

// Admin: Update Transport
const updateTransport = async (id, transportData) => {
    const response = await api.put(`/transport/${id}`, transportData);
    return response.data;
};

// Admin: Delete Transport
const deleteTransport = async (id) => {
    await api.delete(`/transport/${id}`);
};

const transportService = {
    getAllTransports,
    getAvailableTransports,
    bookTransportStudent,
    bookTransportFaculty,
    getStudentBooking,
    getFacultyBooking,
    cancelStudentBooking,
    cancelFacultyBooking,
    getAllBookings,
    getMyBooking,
    setTransportActive,
    cancelBookingById,
    createTransport,
    updateTransport,
    deleteTransport,
};

export default transportService;
