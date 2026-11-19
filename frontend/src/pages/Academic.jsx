import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Users, Presentation } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Tabs from '../components/ui/Tabs';
import CrudGrid from '../components/ui/CrudGrid';
import Modal from '../components/ui/Modal';
import { Loading, Badge } from '../components/ui/States';
import academicService, { courseApi, subjectApi, classroomApi, getAvailableClassrooms } from '../services/academic.service';
import { useAuth } from '../context/AuthContext';
import { hasRole, ROLES } from '../utils/roles';
import { fullName, fmtDate } from '../utils/format';

const TABS = [
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'classrooms', label: 'Classrooms', icon: Presentation },
];

const courseFields = [
    { name: 'name', label: 'Course name', required: true, placeholder: 'B.Tech Computer Science', span: 2 },
    { name: 'code', label: 'Course code', placeholder: 'BTCS' },
];

const subjectFields = [
    { name: 'name', label: 'Subject name', required: true, minLength: 2, maxLength: 200, span: 2 },
    {
        name: 'code', label: 'Subject code', required: true, uppercase: true, minLength: 2, maxLength: 20,
        pattern: '[A-Z0-9]+', title: 'Uppercase letters and numbers only', hint: 'Uppercase letters and numbers only, e.g. CS101',
    },
];

const classroomFields = [
    { name: 'name', label: 'Room name / number', required: true, span: 2 },
    { name: 'floor', label: 'Floor', type: 'number', min: 0 },
    { name: 'capacity', label: 'Capacity', type: 'number', min: 1 },
    { name: 'hasProjector', label: 'Has projector', type: 'checkbox' },
    { name: 'hasSmartboard', label: 'Has smartboard', type: 'checkbox' },
    { name: 'isAvailable', label: 'Currently available', type: 'checkbox', defaultValue: true },
];

const CourseStudents = ({ course, onClose }) => {
    const [students, setStudents] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!course) return;
        setStudents(null);
        setError('');
        academicService
            .getStudentsInCourse(course.id)
            .then(setStudents)
            .catch(() => setError('Could not load students for this course.'));
    }, [course]);

    return (
        <Modal isOpen={!!course} onClose={onClose} title={course ? `${course.name} — Students` : ''} size="max-w-lg">
            {error ? (
                <p className="text-red-300 text-sm">{error}</p>
            ) : students === null ? (
                <Loading />
            ) : students.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No students are enrolled in this course.</p>
            ) : (
                <ul className="divide-y divide-white/5">
                    {students.map((s) => (
                        <li key={s.id} className="py-3 flex justify-between items-center">
                            <span className="font-medium">{fullName(s)}</span>
                            <span className="text-xs text-slate-400">Joined {fmtDate(s.dateOfJoining)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
};

const Academic = () => {
    const { user } = useAuth();
    const canManage = hasRole(user, ROLES.ADMIN);
    const [tab, setTab] = useState('courses');
    const [courseForStudents, setCourseForStudents] = useState(null);
    const [freeOnly, setFreeOnly] = useState(false);

    const courseCard = (c) => (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-500/20 p-3 rounded-xl text-purple-300">
                    <GraduationCap className="w-6 h-6" />
                </div>
                {c.code && <Badge tone="purple">{c.code}</Badge>}
            </div>
            <h3 className="text-xl font-bold mb-2 pr-16">{c.name}</h3>
            <div className="flex items-center gap-4 text-xs text-slate-300 mt-auto pt-4 border-t border-white/5">
                <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {c.subjects?.length ?? 0} subjects
                </span>
                <button
                    onClick={() => setCourseForStudents(c)}
                    className="flex items-center gap-1 text-primary hover:text-white transition-colors ml-auto"
                >
                    <Users className="w-3 h-3" /> View students
                </button>
            </div>
        </>
    );

    const subjectCard = (s) => (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-teal-500/20 p-3 rounded-xl text-teal-300">
                    <BookOpen className="w-6 h-6" />
                </div>
                <Badge>{s.code || 'NO CODE'}</Badge>
            </div>
            <h3 className="text-xl font-bold mb-4 pr-16">{s.name}</h3>
            <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-white/5 text-center">
                {[
                    ['Faculty', s.taughtBy?.length],
                    ['Students', s.studiedBy?.length],
                    ['Ref. books', s.refBooks?.length],
                ].map(([label, n]) => (
                    <div key={label}>
                        <p className="text-lg font-bold">{n ?? 0}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
                    </div>
                ))}
            </div>
        </>
    );

    const classroomCard = (r) => (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-500/20 p-3 rounded-xl text-orange-300">
                    <Presentation className="w-6 h-6" />
                </div>
                <Badge tone={r.isAvailable ? 'green' : 'red'}>{r.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}</Badge>
            </div>
            <h3 className="text-xl font-bold mb-1">{r.name}</h3>
            <p className="text-sm text-slate-400 mb-4">
                Floor {r.floor ?? '—'} • Capacity {r.capacity ?? '—'}
            </p>
            <div className="flex gap-2 mt-auto pt-4 border-t border-white/5 flex-wrap">
                {r.hasProjector && <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-300">Projector</span>}
                {r.hasSmartboard && <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-300">Smartboard</span>}
                {!r.hasProjector && !r.hasSmartboard && <span className="text-[10px] text-slate-500">Standard room</span>}
            </div>
        </>
    );

    return (
        <PageShell
            title="Academic Center"
            subtitle={canManage ? 'Manage courses, subjects and classrooms' : 'Browse courses, subjects and classrooms'}
            actions={<Tabs tabs={TABS} active={tab} onChange={setTab} />}
        >
            {tab === 'courses' && (
                <CrudGrid
                    key="courses"
                    entity="course"
                    load={courseApi.getAll}
                    renderCard={courseCard}
                    searchKeys={['name', 'code']}
                    searchPlaceholder="Search courses…"
                    fields={courseFields}
                    canManage={canManage}
                    onCreate={courseApi.create}
                    onUpdate={(c, data) => courseApi.update(c.id, data)}
                    onDelete={(c) => courseApi.remove(c.id)}
                    emptyIcon={GraduationCap}
                    formSize="max-w-lg"
                />
            )}
            {tab === 'subjects' && (
                <CrudGrid
                    key="subjects"
                    entity="subject"
                    load={subjectApi.getAll}
                    renderCard={subjectCard}
                    searchKeys={['name', 'code']}
                    searchPlaceholder="Search subjects…"
                    fields={subjectFields}
                    canManage={canManage}
                    onCreate={subjectApi.create}
                    onUpdate={(s, data) => subjectApi.update(s.id, data)}
                    onDelete={(s) => subjectApi.remove(s.id)}
                    emptyIcon={BookOpen}
                    formSize="max-w-lg"
                />
            )}
            {tab === 'classrooms' && (
                <CrudGrid
                    key={`classrooms-${freeOnly}`}
                    entity="classroom"
                    load={freeOnly ? getAvailableClassrooms : classroomApi.getAll}
                    toolbar={
                        <button
                            onClick={() => setFreeOnly(!freeOnly)}
                            className={`px-3 h-10 rounded-lg text-sm border transition-colors ${freeOnly ? 'bg-green-500/20 border-green-500/40 text-green-200' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                        >
                            Available now
                        </button>
                    }
                    renderCard={classroomCard}
                    searchKeys={['name']}
                    searchPlaceholder="Search classrooms…"
                    fields={classroomFields}
                    canManage={canManage}
                    onCreate={classroomApi.create}
                    onUpdate={(r, data) => classroomApi.update(r.id, data)}
                    onDelete={(r) => classroomApi.remove(r.id)}
                    emptyIcon={Presentation}
                    formSize="max-w-lg"
                />
            )}

            <CourseStudents course={courseForStudents} onClose={() => setCourseForStudents(null)} />
        </PageShell>
    );
};

export default Academic;
