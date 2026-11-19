export const ROLES = {
    ADMIN: 'ROLE_ADMIN',
    FACULTY: 'ROLE_FACULTY',
    STUDENT: 'ROLE_STUDENT',
    TRANSPORT_MANAGER: 'ROLE_TRANSPORT_MANAGER',
    LIBRARIAN: 'ROLE_LIBRARIAN',
};

export const getRoles = (user) => user?.roles || [];

export const hasRole = (user, ...roles) => getRoles(user).some((r) => roles.includes(r));

export const primaryRole = (user) => getRoles(user)[0] || null;

export const roleLabel = (role) => (role ? role.replace('ROLE_', '').replace(/_/g, ' ') : '');
