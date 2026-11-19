import api from './api';

// ---- Student side (/api/student/...) ----
const requestIssue = async (studentId, bookId) =>
    (await api.post('/student/issue-request', { studentId, bookId })).data;

const getIssuedBooks = async (studentId) => (await api.get(`/student/${studentId}/issued-books`)).data || [];

const getIssueHistory = async (studentId) => (await api.get(`/student/${studentId}/issue-history`)).data || [];

const requestReturn = async (issueId) => (await api.put(`/student/issue-request/${issueId}/return`)).data;

// ---- Librarian desk (/api/librarian/...) ----
const getPendingRequests = async () => (await api.get('/librarian/issue-requests')).data || [];

const approve = async (id) => (await api.put(`/librarian/issue-request/${id}/approve`)).data;
const reject = async (id) => (await api.put(`/librarian/issue-request/${id}/reject`)).data;
const confirmReturn = async (id) => (await api.put(`/librarian/issue-request/${id}/confirm-return`)).data;
const rejectReturn = async (id) => (await api.put(`/librarian/issue-request/${id}/reject-return`)).data;

const getBookHistory = async (bookId) => (await api.get(`/library-book/${bookId}/history`)).data || [];

const getReturnRequests = async () => (await api.get('/librarian/return-requests')).data || [];

const getOverdue = async () => (await api.get('/librarian/overdue')).data || [];

const cancelRequest = async (issueId) => {
    await api.post(`/student/issue-request/${issueId}/cancel`);
};

const renew = async (issueId) => (await api.post(`/student/issue-request/${issueId}/renew`)).data;

// Paged list of every issue (optionally one status): { content, totalElements, totalPages, number }
const getIssues = async ({ status, page = 0, size = 20 } = {}) =>
    (await api.get('/librarian/issues', { params: { status, page, size } })).data;

const libraryService = {
    requestIssue,
    getIssuedBooks,
    getIssueHistory,
    requestReturn,
    getPendingRequests,
    getReturnRequests,
    getOverdue,
    cancelRequest,
    renew,
    getIssues,
    approve,
    reject,
    confirmReturn,
    rejectReturn,
    getBookHistory,
};

export default libraryService;
