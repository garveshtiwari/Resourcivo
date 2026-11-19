import api from './api';

/**
 * Profile pictures. The endpoint needs the login token, so an <img src> can't load it directly:
 * we fetch the image with axios, turn it into a blob URL and cache it per user.
 */
const cache = new Map(); // userId -> Promise<string | null>
const listeners = new Set();

export const subscribePhotos = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};

const revokeLater = (promise) => {
    if (promise) setTimeout(() => promise.then((url) => url && URL.revokeObjectURL(url)), 2000);
};

// Forget one user's cached picture and tell mounted avatars to reload it
export const invalidatePhoto = (userId) => {
    revokeLater(cache.get(userId));
    cache.delete(userId);
    listeners.forEach((fn) => fn(userId));
};

// Called on logout so the next person on this browser never sees someone else's pictures
export const clearPhotoCache = () => {
    cache.forEach((promise) => revokeLater(promise));
    cache.clear();
};

// Resolves to a blob URL, or null when the user has no picture
export const loadPhoto = (userId) => {
    if (!cache.has(userId)) {
        cache.set(
            userId,
            api
                .get(`/profile-photo/${userId}`, { responseType: 'blob' })
                .then((res) => (res.status === 204 || !res.data || res.data.size === 0 ? null : URL.createObjectURL(res.data)))
                .catch(() => null)
        );
    }
    return cache.get(userId);
};

export const uploadPhoto = async (userId, blob) => {
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    const res = await api.put('/profile-photo/me', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    invalidatePhoto(userId);
    return res.data;
};

export const removePhoto = async (userId) => {
    await api.delete('/profile-photo/me');
    invalidatePhoto(userId);
};
