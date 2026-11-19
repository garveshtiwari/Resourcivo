export const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

// The backend answers expired tokens with an empty 403 (not 401), so we check `exp` ourselves.
export const isTokenExpired = (token) => {
    const payload = decodeToken(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
};
