import api from './api';
import { clearPhotoCache } from './photo.service';

const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

const resetPassword = async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
};

const logout = () => {
    clearPhotoCache();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
};

const verifyEmail = async (token) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
};

const getMe = async () => (await api.get('/auth/me')).data;

const changePassword = async (currentPassword, newPassword) =>
    (await api.post('/auth/change-password', { currentPassword, newPassword })).data;

const resendVerification = async (email) => (await api.post('/auth/resend-verification', { email })).data;

// Swap the stored token/user for a fresh one (keeps the session alive while the app is open)
const refresh = async () => {
    const response = await api.post('/auth/refresh');
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const storeUser = (user) => localStorage.setItem('user', JSON.stringify(user));

const authService = {
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    getCurrentUser,
    verifyEmail,
    getMe,
    changePassword,
    resendVerification,
    refresh,
    storeUser,
};

export default authService;
