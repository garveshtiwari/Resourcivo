import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import profileService from '../services/profile.service';
import { hasRole, ROLES } from '../utils/roles';

const ProfileContext = createContext({
    student: null,
    faculty: null,
    status: 'na',
    refresh: () => {},
});

/**
 * The student / faculty record that belongs to the signed-in login. The server does the linking
 * (GET /student/me or /faculty/me, which also claims an admin-created record with the same verified email).
 * status: 'na' (no record kind for this role) | 'loading' | 'linked' | 'unlinked' | 'error'
 */
export const ProfileProvider = ({ children }) => {
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [faculty, setFaculty] = useState(null);
    const [status, setStatus] = useState('na');

    const isStudent = hasRole(user, ROLES.STUDENT);
    const isFaculty = hasRole(user, ROLES.FACULTY);

    const refresh = useCallback(async () => {
        setStudent(null);
        setFaculty(null);
        if (!user || (!isStudent && !isFaculty)) {
            setStatus('na');
            return;
        }
        setStatus('loading');
        try {
            const record = isStudent ? await profileService.student.get() : await profileService.faculty.get();
            if (isStudent) setStudent(record);
            else setFaculty(record);
            setStatus(record ? 'linked' : 'unlinked');
        } catch {
            setStatus('error');
        }
    }, [user, isStudent, isFaculty]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo(() => ({ student, faculty, status, refresh }), [student, faculty, status, refresh]);

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => useContext(ProfileContext);
