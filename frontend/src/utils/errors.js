export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    if (!err) return fallback;
    if (err.message === 'Network Error') {
        return 'Cannot reach the server. Is the backend running on port 2020?';
    }
    const res = err.response;
    if (!res) return err.message || fallback;

    const data = res.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
        if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length) {
            return Object.entries(data.errors).map(([field, msg]) => `${field}: ${msg}`).join(' · ');
        }
        if (data.message) return data.message;
    }
    if (res.status === 403) return "You don't have permission to do that.";
    if (res.status === 404) return 'Not found.';
    return fallback;
};
