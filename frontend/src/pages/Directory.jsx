import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, Mail, Phone, MapPin, Cake, CalendarDays, Briefcase } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Tabs from '../components/ui/Tabs';
import CrudGrid from '../components/ui/CrudGrid';
import Modal from '../components/ui/Modal';
import Avatar from '../components/Avatar';
import { Loading } from '../components/ui/States';
import { studentApi, facultyApi, contactApi } from '../services/directory.service';
import { courseApi } from '../services/academic.service';
import profileService from '../services/profile.service';
import { useAuth } from '../context/AuthContext';
import { hasRole, ROLES } from '../utils/roles';
import { fullName, fmtDate } from '../utils/format';
import { subjectFields, subjectInitial, applySubject } from '../utils/subjects';

const GENDERS = ['Male', 'Female', 'Other'];
const phoneRule = { type: 'tel', cast: 'number', pattern: '[0-9]{10}', title: '10 digit number', maxLength: 10 };

const studentCreateFields = (courses) => [
    { name: 'firstName', label: 'First name', required: true, minLength: 2 },
    { name: 'lastName', label: 'Last name', required: true, minLength: 2 },
    { name: 'middleName', label: 'Middle name' },
    { name: 'gender', label: 'Gender', type: 'select', required: true, options: GENDERS },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { name: 'course.name', label: 'Course', type: 'select', options: courses.map((c) => c.name) },
    { name: 'dateOfJoining', label: 'Date of joining', type: 'date' },
    { name: 'yearOfGraduation', label: 'Expected graduation', type: 'date' },
    { type: 'section', label: 'Contact' },
    { name: 'contact.primaryNumber', label: 'Phone', required: true, ...phoneRule },
    { name: 'contact.primaryEmail', label: 'Email', type: 'email', required: true, hint: 'Students sign in with the same email to link their account.' },
    { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
];

const studentEditFields = (courses) => [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'middleName', label: 'Middle name' },
    { name: 'gender', label: 'Gender', type: 'select', options: GENDERS },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { name: 'course.name', label: 'Course', type: 'select', options: courses.map((c) => c.name) },
    { name: 'dateOfJoining', label: 'Date of joining', type: 'date' },
    { name: 'yearOfGraduation', label: 'Expected graduation', type: 'date' },
    { type: 'section', label: 'Contact' },
    { name: 'contact.primaryNumber', label: 'Phone', ...phoneRule },
    { name: 'contact.primaryEmail', label: 'Email', type: 'email' },
    { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
];

const facultyFields = (subjects) => [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'middleName', label: 'Middle name' },
    { name: 'gender', label: 'Gender', type: 'select', options: GENDERS },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    ...subjectFields(subjects).map((f) => ({ ...f, required: false, ...(f.name === 'subjectOther' ? { required: true } : {}) })),
    { name: 'level', label: 'Designation', placeholder: 'e.g. Assistant Professor' },
    { name: 'yearOfExperience', label: 'Years of experience', type: 'number', min: 0 },
    { name: 'dateOfJoining', label: 'Date of joining', type: 'date' },
    { type: 'section', label: 'Contact (optional)' },
    { name: 'contact.primaryNumber', label: 'Phone', ...phoneRule },
    { name: 'contact.primaryEmail', label: 'Email', type: 'email' },
    { name: 'bio', label: 'Bio', type: 'textarea', span: 2, maxLength: 1000 },
];

const Row = ({ icon: Icon, children }) => (
    <div className="flex items-start gap-3 text-sm text-slate-300">
        <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <span className="break-words">{children}</span>
    </div>
);

const PersonDetail = ({ person, kind, showContact, onClose }) => {
    const [details, setDetails] = useState(null);

    useEffect(() => {
        setDetails(null);
        if (!person || !showContact) return;
        profileService.getStudentDetails(person).then(setDetails);
    }, [person, kind, showContact]);

    const a = details?.address;

    return (
        <Modal isOpen={!!person} onClose={onClose} title={person ? fullName(person) : ''} size="max-w-lg">
            {person && (
                <div className="space-y-3">
                    {person.bio && <p className="text-sm text-slate-400 italic mb-4">“{person.bio}”</p>}
                    {kind === 'faculty' && person.subject?.name && <Row icon={BookOpen}>{person.subject.name}</Row>}
                    {kind === 'faculty' && person.level && <Row icon={Briefcase}>{person.level}{person.yearOfExperience != null ? ` • ${person.yearOfExperience} yrs experience` : ''}</Row>}
                    {person.dateOfBirth && <Row icon={Cake}>Born {fmtDate(person.dateOfBirth)}</Row>}
                    {person.dateOfJoining && <Row icon={CalendarDays}>Joined {fmtDate(person.dateOfJoining)}</Row>}
                    {kind === 'student' && person.yearOfGraduation && <Row icon={CalendarDays}>Graduating {fmtDate(person.yearOfGraduation)}</Row>}

                    {showContact && (
                        <div className="border-t border-white/5 pt-3 mt-3 space-y-3">
                            {details === null ? (
                                <Loading text="Loading contact details…" />
                            ) : (
                                <>
                                    {details.contact?.primaryEmail && <Row icon={Mail}>{details.contact.primaryEmail}</Row>}
                                    {details.contact?.primaryNumber && <Row icon={Phone}>{details.contact.primaryNumber}</Row>}
                                    {a && (
                                        <Row icon={MapPin}>
                                            {[a.houseNumber, a.addressLine1, a.addressLine2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                                        </Row>
                                    )}
                                    {!details.contact && !a && <p className="text-sm text-slate-500">No contact details on file.</p>}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

const Directory = () => {
    const { user } = useAuth();
    const isAdmin = hasRole(user, ROLES.ADMIN);
    const canSeeFaculty = hasRole(user, ROLES.ADMIN, ROLES.FACULTY); // backend: /api/faculty/** is ADMIN + FACULTY only
    const canSeeContact = canSeeFaculty;

    const tabs = [
        { id: 'student', label: 'Students', icon: BookOpen },
        ...(canSeeFaculty ? [{ id: 'faculty', label: 'Faculty', icon: Users }] : []),
    ];
    const [tab, setTab] = useState('student');
    const [selected, setSelected] = useState(null);
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        if (!isAdmin) return;
        courseApi.getAll().then(setCourses).catch(() => setCourses([]));
        profileService.getSubjects().then(setSubjects).catch(() => setSubjects([]));
    }, [isAdmin]);

    const createFields = useMemo(() => studentCreateFields(courses), [courses]);
    const editFields = useMemo(() => studentEditFields(courses), [courses]);
    const facultyForm = useMemo(() => facultyFields(subjects), [subjects]);

    const renderPerson = (kind) => (p) => (
        <>
            <div className="flex items-center gap-4 mb-4 pr-16">
                <Avatar
                    userId={p.userId}
                    name={fullName(p)}
                    size="w-14 h-14"
                    text="text-xl"
                    className="shadow-lg"
                    fallback={kind === 'student' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}
                />
                <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate">{fullName(p)}</h3>
                    <span className="inline-block px-2 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 uppercase tracking-wider">
                        {kind === 'faculty' && p.level ? p.level : kind}
                    </span>
                </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1 mb-4">
                {kind === 'student' && <p>{p.course ? `${p.course} • ` : ''}Joined {fmtDate(p.dateOfJoining)}</p>}
                {kind === 'faculty' && <p>{[p.subject?.name, p.yearOfExperience != null && `${p.yearOfExperience} years experience`].filter(Boolean).join(' • ') || 'Details not listed'}</p>}
            </div>
            <button onClick={() => setSelected({ person: p, kind })} className="btn-secondary !py-2 text-sm mt-auto">
                View profile
            </button>
        </>
    );

    // Admin edit for students: PATCH the basics, PUT the contact record (the student DTO only carries ids).
    const prepareStudentEdit = async (student) => {
        const { contact } = await profileService.getStudentDetails(student);
        return { ...student, course: student.course ? { name: student.course } : undefined, contact: contact || {} };
    };

    const updateStudent = async (student, payload) => {
        const { contact, ...basic } = payload;
        await studentApi.patch(student.id, basic);
        if (contact && student.contactId) {
            await contactApi.update(student.contactId, contact);
        }
    };

    return (
        <PageShell
            title="People Directory"
            subtitle="Connect with students and faculty"
            actions={tabs.length > 1 ? <Tabs tabs={tabs} active={tab} onChange={setTab} /> : null}
        >
            {tab === 'student' && (
                <CrudGrid
                    key="students"
                    entity="student"
                    load={studentApi.getAll}
                    renderCard={renderPerson('student')}
                    searchKeys={['firstName', 'lastName']}
                    searchPlaceholder="Search by name…"
                    fields={createFields}
                    editFields={editFields}
                    prepareEdit={prepareStudentEdit}
                    canManage={isAdmin}
                    onCreate={studentApi.create}
                    onUpdate={updateStudent}
                    onDelete={(s) => studentApi.remove(s.id)}
                    emptyIcon={BookOpen}
                />
            )}
            {tab === 'faculty' && canSeeFaculty && (
                <CrudGrid
                    key="faculty"
                    entity="faculty member"
                    load={facultyApi.search}
                    renderCard={renderPerson('faculty')}
                    searchKeys={['firstName', 'lastName', 'level']}
                    searchPlaceholder="Search by name or designation…"
                    fields={facultyForm}
                    prepareEdit={async (f) => ({ ...f, ...subjectInitial(f.subject?.name, subjects) })}
                    canManage={isAdmin}
                    onCreate={(data) => facultyApi.create(applySubject(data))}
                    onUpdate={(f, data) => facultyApi.update(f.id, applySubject(data))}
                    onDelete={(f) => facultyApi.remove(f.id)}
                    emptyIcon={Users}
                    addLabel="Add faculty"
                />
            )}

            <PersonDetail
                person={selected?.person}
                kind={selected?.kind}
                showContact={canSeeContact}
                onClose={() => setSelected(null)}
            />
        </PageShell>
    );
};

export default Directory;
