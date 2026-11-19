import api from './api';

const getNotifications = async (unreadOnly = false) =>
    (await api.get('/notifications', { params: { unreadOnly } })).data || [];

const getUnreadCount = async () => (await api.get('/notifications/unread-count')).data?.count ?? 0;

const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
};

const markAllRead = async () => {
    await api.post('/notifications/read-all');
};

const remove = async (id) => {
    await api.delete(`/notifications/${id}`);
};

const clearAll = async () => {
    await api.delete('/notifications');
};

const notificationService = { getNotifications, getUnreadCount, markRead, markAllRead, remove, clearAll };

export default notificationService;
