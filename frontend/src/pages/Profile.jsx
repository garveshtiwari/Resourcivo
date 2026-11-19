import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User, Mail, Shield, Phone, MapPin, Edit3, HeartPulse, Camera, Cake, CalendarDays, KeyRound, Lock, Trash2, Briefcase, BookOpen,
} from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Avatar from '../components/Avatar';
import { usePhoto } from '../hooks/usePhoto';
import { uploadPhoto, removePhoto } from '../services/photo.service';
import { prepareProfileImage } from '../utils/image';
import FormModal from '../components/ui/FormModal';
import { Loading, ErrorState } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/auth.service';
import profileService from '../services/profile.service';
import { hasRole, primaryRole, roleLabel, ROLES } from '../utils/roles';
import { fullName, fmtDate } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { subjectFields, subjectInitial, applySubject } from '../utils/subjects';

const phone = { type: 'tel', cast: 'number', pattern: '[0-9]{10}', title: '10 digit number', maxLength: 10 };

const addressFields = (required) => [
    { type: 'section', label: required ? 'Current address' : 'Current address (optional, fill all or none)' },
    { name: 'currentAddress.houseNumber', label: 'House / flat no.', required },
    { name: 'currentAddress.addressLine1', label: 'Address line 1', required },
    { name: 'currentAddress.addressLine2', label: 'Address line 2' },
    { name: 'currentAddress.city', label: 'City', required },
    { name: 'currentAddress.state', label: 'State', required },
    { name: 'currentAddress.pincode', label: 'Pincode', type: 'number', min: 100000, max: 999999, required },
];

// First / last name come from the account and are shown read-only. Older accounts that never
// had a name saved can type it once (the server stores it on the account).
const nameFields = (locked) => [
    { type: 'section', label: 'Name' },
    { name: 'firstName', label: 'First name', required: true, disabled: locked, minLength: 2 },
    { name: 'lastName', label: 'Last name', required: true, disabled: locked, minLength: 2 },
    {
        name: 'middleName', label: 'Middle name',
        hint: locked ? 'First and last name are taken from your account and can’t be changed here.' : 'This will be saved on your account.',
    },
];

const emergencyFields = [
    { name: 'name', label: 'Contact name', required: true, span: 2 },
    { name: 'primaryContactNumber', label: 'Phone', required: true, ...phone },
    { name: 'alternateContactNumber', label: 'Alternate phone', ...phone },
    { name: 'email', label: 'Email', type: 'email', span: 2 },
];

const Field = ({ icon: Icon, label, children }) => (
    <div className="bg-white/5 p-4 rounded-lg space-y-1">
        <label className="text-xs text-slate-400">{label}</label>
        <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" />}
            <p className="break-words min-w-0">{children || <span className="text-slate-500">—</span>}</p>
        </div>
    </div>
);

const address = (a) =>
    a && [a.houseNumber, a.addressLine1, a.addressLine2, a.city, a.state, a.pincode].filter(Boolean).join(', ');

/* ------------------------------ Student ------------------------------ */

const StudentPanel = ({ user, lockNames }) => {
    const toast = useToast();
    const { student, status, refresh } = useProfile();
    const [modal, setModal] = useState(null); // 'create' | 'edit' | 'emergency'
    const [contacts, setContacts] = useState([]);

    const loadContacts = useCallback(async () => {
        if (!student) return setContacts([]);
        try {
            setContacts(await profileService.student.emergencyContacts());
        } catch {
            setContacts([]);
        }
    }, [student]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    const baseNames = useMemo(() => ({ firstName: user.firstName || '', lastName: user.lastName || '' }), [user]);

    const createFields = useMemo(
        () => [
            ...nameFields(lockNames),
            { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
            { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
            { name: 'dateOfJoining', label: 'Date of joining', type: 'date' },
            { type: 'section', label: 'Contact' },
            { name: 'contact.primaryNumber', label: 'Phone', required: true, ...phone },
            { name: 'contact.primaryEmail', label: 'Email', type: 'email', required: true },
            ...addressFields(false),
            { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
        ],
        [lockNames]
    );

    const editFields = useMemo(
        () => [
            ...nameFields(true),
            { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
            { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
            { name: 'yearOfGraduation', label: 'Expected graduation', type: 'date' },
            { type: 'section', label: 'Contact' },
            { name: 'contact.primaryNumber', label: 'Phone', required: true, ...phone },
            { name: 'contact.primaryEmail', label: 'Email', type: 'email', required: true },
            { name: 'contact.alternateNumber', label: 'Alternate phone', ...phone },
            ...addressFields(false),
            { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
        ],
        []
    );

    const createInitial = useMemo(() => ({ ...baseNames, contact: { primaryEmail: user.email } }), [baseNames, user.email]);
    const editInitial = useMemo(
        () => (student ? { ...student, firstName: student.firstName, lastName: student.lastName } : null),
        [student]
    );

    if (status === 'loading') return <Loading />;
    if (status === 'error') return <ErrorState message="Could not load your student record." onRetry={refresh} />;

    if (status === 'unlinked') {
        return (
            <>
                <div className="bg-white/5 p-5 rounded-lg space-y-4">
                    <p className="text-sm text-slate-400">
                        Fill in your details and save your profile to borrow books and appear in the directory.
                        If an administrator already added you, ask them to use this same email address (<span className="text-slate-200">{user.email}</span>).
                    </p>
                    <button onClick={() => setModal('create')} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                        <Edit3 className="w-4 h-4" /> Edit profile
                    </button>
                </div>
                <FormModal
                    isOpen={modal === 'create'}
                    onClose={() => setModal(null)}
                    title="Your student profile"
                    fields={createFields}
                    initialValues={createInitial}
                    submitLabel="Save profile"
                    onSubmit={async (payload) => {
                        await profileService.student.create(payload);
                        await refresh();
                        toast.success('Profile saved');
                    }}
                />
            </>
        );
    }

    const s = student;
    return (
        <>
            <Field icon={Phone} label="Phone">{s.contact?.primaryNumber}</Field>
            <Field icon={Mail} label="Contact email">{s.contact?.primaryEmail}</Field>
            <Field icon={Cake} label="Date of birth">{s.dateOfBirth && fmtDate(s.dateOfBirth)}</Field>
            <Field icon={CalendarDays} label="Joined">{s.dateOfJoining && fmtDate(s.dateOfJoining)}</Field>
            {s.course && <Field icon={BookOpen} label="Course">{s.course}</Field>}
            <Field icon={MapPin} label="Current address">{address(s.currentAddress)}</Field>
            {s.bio && <Field label="Bio">{s.bio}</Field>}
            <div className="flex gap-3 pt-2">
                <button onClick={() => setModal('edit')} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit profile
                </button>
                <button onClick={() => setModal('emergency')} className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2">
                    <HeartPulse className="w-4 h-4" /> Add emergency contact
                </button>
            </div>

            {contacts.length > 0 && (
                <div className="bg-white/5 rounded-lg divide-y divide-white/5">
                    <p className="p-4 text-xs text-slate-400 uppercase tracking-wider">Emergency contacts ({contacts.length}/2)</p>
                    {contacts.map((c) => (
                        <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{c.name}</p>
                                <p className="text-xs text-slate-400">{[c.primaryContactNumber, c.email].filter(Boolean).join(' · ')}</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!window.confirm(`Remove ${c.name} as an emergency contact?`)) return;
                                    try {
                                        await profileService.student.removeEmergencyContact(c.id);
                                        toast.success('Emergency contact removed');
                                        loadContacts();
                                    } catch (err) {
                                        toast.error(getErrorMessage(err));
                                    }
                                }}
                                className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <FormModal
                isOpen={modal === 'edit'}
                onClose={() => setModal(null)}
                title="Edit profile"
                fields={editFields}
                initialValues={editInitial}
                onSubmit={async (payload) => {
                    await profileService.student.update(payload);
                    await refresh();
                    toast.success('Profile updated');
                }}
            />
            <FormModal
                isOpen={modal === 'emergency'}
                onClose={() => setModal(null)}
                title="Add emergency contact"
                size="max-w-lg"
                fields={emergencyFields}
                submitLabel="Add contact"
                onSubmit={async (payload) => {
                    await profileService.student.addEmergencyContact(payload);
                    toast.success('Emergency contact added');
                    loadContacts();
                }}
            />
        </>
    );
};

/* ------------------------------ Faculty ------------------------------ */

const FacultyPanel = ({ user, lockNames }) => {
    const toast = useToast();
    const { faculty, status, refresh } = useProfile();
    const [modal, setModal] = useState(null); // 'create' | 'edit'
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        profileService.getSubjects().then(setSubjects).catch(() => setSubjects([]));
    }, []);

    const profileFields = useMemo(
        () => (locked) => [
            ...nameFields(locked),
            { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
            { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
            { type: 'section', label: 'Teaching' },
            ...subjectFields(subjects),
            { name: 'level', label: 'Designation', placeholder: 'e.g. Assistant Professor' },
            { name: 'yearOfExperience', label: 'Years of experience', type: 'number', min: 0 },
            { name: 'dateOfJoining', label: 'Date of joining', type: 'date' },
            { type: 'section', label: 'Contact' },
            { name: 'contact.primaryNumber', label: 'Phone', required: true, ...phone },
            { name: 'contact.primaryEmail', label: 'Email', type: 'email', required: true },
            ...addressFields(false),
            { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
        ],
        [subjects]
    );

    const createInitial = useMemo(
        () => ({ firstName: user.firstName || '', lastName: user.lastName || '', contact: { primaryEmail: user.email } }),
        [user]
    );
    const editInitial = useMemo(
        () => (faculty ? { ...faculty, ...subjectInitial(faculty.subject?.name, subjects) } : null),
        [faculty, subjects]
    );

    if (status === 'loading') return <Loading />;
    if (status === 'error') return <ErrorState message="Could not load your faculty record." onRetry={refresh} />;

    if (status === 'unlinked') {
        return (
            <>
                <div className="bg-white/5 p-5 rounded-lg space-y-4">
                    <p className="text-sm text-slate-400">
                        Fill in your teaching details and save your profile so you appear in the directory.
                    </p>
                    <button onClick={() => setModal('create')} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                        <Edit3 className="w-4 h-4" /> Edit profile
                    </button>
                </div>
                <FormModal
                    isOpen={modal === 'create'}
                    onClose={() => setModal(null)}
                    title="Your faculty profile"
                    fields={profileFields(lockNames)}
                    initialValues={createInitial}
                    submitLabel="Save profile"
                    onSubmit={async (payload) => {
                        await profileService.faculty.create(applySubject(payload));
                        await refresh();
                        toast.success('Profile saved');
                    }}
                />
            </>
        );
    }

    const f = faculty;
    return (
        <>
            <Field icon={BookOpen} label="Subject">{f.subject?.name}</Field>
            <Field icon={Briefcase} label="Designation">
                {[f.level, f.yearOfExperience != null && `${f.yearOfExperience} yrs experience`].filter(Boolean).join(' • ')}
            </Field>
            <Field icon={Phone} label="Phone">{f.contact?.primaryNumber}</Field>
            <Field icon={Mail} label="Contact email">{f.contact?.primaryEmail}</Field>
            <Field icon={Cake} label="Date of birth">{f.dateOfBirth && fmtDate(f.dateOfBirth)}</Field>
            <Field icon={CalendarDays} label="Joined">{f.dateOfJoining && fmtDate(f.dateOfJoining)}</Field>
            <Field icon={MapPin} label="Current address">{address(f.currentAddress)}</Field>
            {f.bio && <Field label="Bio">{f.bio}</Field>}
            <button onClick={() => setModal('edit')} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit profile
            </button>
            <FormModal
                isOpen={modal === 'edit'}
                onClose={() => setModal(null)}
                title="Edit faculty profile"
                fields={profileFields(true)}
                initialValues={editInitial}
                onSubmit={async (payload) => {
                    await profileService.faculty.update(applySubject(payload));
                    await refresh();
                    toast.success('Profile updated');
                }}
            />
        </>
    );
};

/* ------------------------------ Librarian ------------------------------ */

const LibrarianPanel = () => {
    const toast = useToast();
    const [record, setRecord] = useState(undefined);
    const [open, setOpen] = useState(false);

    const load = useCallback(() => {
        profileService.librarian.get().then(setRecord).catch(() => setRecord(null));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Name and email come from the account, so they are shown but not editable
    const fields = useMemo(
        () => [
            { type: 'section', label: 'Name' },
            { name: 'firstName', label: 'First name', disabled: true },
            { name: 'lastName', label: 'Last name', disabled: true, hint: 'Your name is taken from your account and can’t be changed here.' },
            { type: 'section', label: 'About you' },
            { name: 'phoneNumber', label: 'Phone', type: 'tel', pattern: '[0-9]{10}', title: '10 digit number', maxLength: 10 },
            { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
            { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
        ],
        []
    );

    if (record === undefined) return <Loading />;
    if (!record) return <p className="bg-white/5 p-4 rounded-lg text-slate-400 text-sm">No librarian record is linked to this account yet. Ask an administrator.</p>;

    return (
        <>
            <Field icon={Mail} label="Email">{record.email}</Field>
            <Field icon={Phone} label="Phone">{record.phoneNumber}</Field>
            <Field icon={Cake} label="Date of birth">{record.dateOfBirth && fmtDate(record.dateOfBirth)}</Field>
            <Field icon={CalendarDays} label="Joined">{record.joiningDate && fmtDate(record.joiningDate)}</Field>
            <Field icon={BookOpen} label="Library">{record.libraryName || 'Not assigned to a library yet'}</Field>
            {record.bio && <Field label="Bio">{record.bio}</Field>}
            <button onClick={() => setOpen(true)} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit profile
            </button>
            <FormModal
                isOpen={open}
                onClose={() => setOpen(false)}
                title="Edit profile"
                size="max-w-lg"
                fields={fields}
                initialValues={record}
                submitLabel="Save profile"
                onSubmit={async (payload) => {
                    const { phoneNumber, dateOfBirth, bio } = payload;
                    await profileService.librarian.update({ phoneNumber, dateOfBirth, bio });
                    toast.success('Profile saved');
                    load();
                }}
            />
        </>
    );
};

/* ------------------------------ Page ------------------------------ */

const Profile = () => {
    const { user, updateUser } = useAuth();
    const isStudent = hasRole(user, ROLES.STUDENT);
    const isFaculty = hasRole(user, ROLES.FACULTY);
    const isLibrarian = hasRole(user, ROLES.LIBRARIAN);

    // Sessions started before names existed: pick them up from the server
    useEffect(() => {
        if (user.firstName && user.lastName) return;
        authService.getMe().then((me) => updateUser({ firstName: me.firstName, lastName: me.lastName })).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const lockNames = !!(user.firstName && user.lastName);
    const role = roleLabel(primaryRole(user));
    const displayName = fullName(user) || user.username;

    // ---- profile picture
    const toast = useToast();
    const photoUrl = usePhoto(user.userId);
    const fileRef = useRef(null);
    const [photoBusy, setPhotoBusy] = useState(false);

    const onPickPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // lets the same file be picked again
        if (!file) return;
        setPhotoBusy(true);
        try {
            const blob = await prepareProfileImage(file);
            await uploadPhoto(user.userId, blob);
            toast.success('Profile picture saved');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not save the picture'));
        } finally {
            setPhotoBusy(false);
        }
    };

    const onRemovePhoto = async () => {
        if (!window.confirm('Remove your profile picture?')) return;
        setPhotoBusy(true);
        try {
            await removePhoto(user.userId);
            toast.success('Profile picture removed');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not remove the picture'));
        } finally {
            setPhotoBusy(false);
        }
    };

    return (
        <PageShell width="max-w-4xl">
            <motion.div className="glass-panel p-8">
                <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-8">
                    <div className="relative shrink-0">
                        <Avatar userId={user.userId} name={displayName} size="w-24 h-24" text="text-3xl" className="shadow-2xl" />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={photoBusy}
                            className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-60"
                            title={photoUrl ? 'Change picture' : 'Add a picture'}
                            aria-label="Change profile picture"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickPhoto} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold truncate">{displayName}</h1>
                        <p className="text-slate-400 text-sm">@{user.username}</p>
                        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            {role}
                        </span>
                        <div className="flex gap-3 mt-3 text-sm">
                            <button onClick={() => fileRef.current?.click()} disabled={photoBusy} className="text-primary hover:underline disabled:opacity-60">
                                {photoBusy ? 'Saving…' : photoUrl ? 'Change picture' : 'Add picture'}
                            </button>
                            {photoUrl && (
                                <button onClick={onRemovePhoto} disabled={photoBusy} className="text-slate-400 hover:text-red-300 disabled:opacity-60">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <User className="w-5 h-5 text-slate-400" /> Account
                        </h3>
                        <Field icon={Mail} label="Email address">{user.email}</Field>
                        <Field icon={Lock} label="Name (from registration)">{fullName(user)}</Field>
                        <Field icon={Shield} label="User ID"><span className="font-mono text-sm">{user.userId}</span></Field>
                        <Link to="/change-password" className="btn-secondary text-sm flex items-center justify-center gap-2">
                            <KeyRound className="w-4 h-4" /> Change password
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-slate-400" /> {isStudent ? 'Student record' : isFaculty ? 'Faculty record' : isLibrarian ? 'Librarian record' : 'Details'}
                        </h3>
                        {isStudent && <StudentPanel user={user} lockNames={lockNames} />}
                        {isFaculty && <FacultyPanel user={user} lockNames={lockNames} />}
                        {isLibrarian && <LibrarianPanel />}
                        {!isStudent && !isFaculty && !isLibrarian && (
                            <p className="bg-white/5 p-4 rounded-lg text-slate-400 text-sm">
                                Staff details are maintained by the administration.
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </PageShell>
    );
};

export default Profile;
