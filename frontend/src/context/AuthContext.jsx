import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/auth.service';
import { decodeToken, isTokenExpired } from '../utils/token';

const AuthContext = createContext();

const REFRESH_CHECK_MS = 5 * 60 * 1000; // look every 5 minutes
const REFRESH_WINDOW_MS = 10 * 60 * 1000; // renew when less than 10 minutes are left

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const currentUser = authService.getCurrentUser();
        if (currentUser && token && !isTokenExpired(token)) {
            setUser(currentUser);
        } else if (token || currentUser) {
            authService.logout(); // stale or expired session
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const data = await authService.login(username, password);
        setUser(data);
        return data;
    };

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    // Merge changes into the stored user (e.g. after the temporary password is replaced)
    const updateUser = useCallback((changes) => {
        setUser((prev) => {
            const next = { ...prev, ...changes };
            authService.storeUser(next);
            return next;
        });
    }, []);

    // Keep an active session alive: swap in a fresh token before the current one runs out
    useEffect(() => {
        if (!user) return undefined;
        const timer = setInterval(async () => {
            const token = localStorage.getItem('token');
            const payload = token ? decodeToken(token) : null;
            if (!payload?.exp) return;
            if (payload.exp * 1000 - Date.now() < REFRESH_WINDOW_MS) {
                try {
                    const fresh = await authService.refresh();
                    setUser(fresh);
                } catch {
                    /* the request interceptor logs out if the token is really gone */
                }
            }
        }, REFRESH_CHECK_MS);
        return () => clearInterval(timer);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
