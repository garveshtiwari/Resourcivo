import api from './api';

// One role-aware call that replaces the eight separate count requests the dashboard used to make
export const getDashboardSummary = async () => (await api.get('/dashboard/summary')).data || {};
