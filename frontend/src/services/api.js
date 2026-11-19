import axios from 'axios';
import { isTokenExpired } from '../utils/token';

const api = axios.create({
    baseURL: '/api', // Proxy in vite.config.js will handle this
    headers: {
        'Content-Type': 'application/json',
    },
});

const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=true');
    }
};

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            if (isTokenExpired(token) && !config.url?.startsWith('/auth/')) {
                forceLogout();
                return Promise.reject(new axios.CanceledError('Session expired'));
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            forceLogout();
        }
        return Promise.reject(error);
    }
);

export default api;
