import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    GraduationCap, FlaskConical, Users, Bus, BookMarked, Settings, ArrowRight, Boxes, Presentation, Clock, MapPin, AlertTriangle, Wrench,
} from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import { Badge } from '../components/ui/States';
import LibrariesManager from '../components/LibrariesManager';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { hasRole, primaryRole, roleLabel, ROLES } from '../utils/roles';
import { fmtDate, fmtTime, fullName } from '../utils/format';
import { getDashboardSummary } from '../services/dashboard.service';
import libraryService from '../services/library.service';
import transportService from '../services/transport.service';

const { ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER, LIBRARIAN } = ROLES;

const LINKS = [
    { to: '/academic', label: 'Academic', desc: 'Courses, subjects, classrooms', icon: GraduationCap, roles: [ADMIN, FACULTY, STUDENT] },
    { to: '/resources', label: 'Resources', desc: 'Books, inventory, lab equipment', icon: FlaskConical, roles: [ADMIN, FACULTY, STUDENT, LIBRARIAN] },
    { to: '/library', label: 'Library', desc: 'Borrowed books and requests', icon: BookMarked, roles: [ADMIN, STUDENT, LIBRARIAN] },
    { to: '/directory', label: 'Directory', desc: 'Students and faculty', icon: Users, roles: [ADMIN, FACULTY, STUDENT] },
    { to: '/transport', label: 'Transport', desc: 'Routes, seats and bookings', icon: Bus, roles: [ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER] },
    { to: '/admin', label: 'Administration', desc: 'Accounts, libraries and staff', icon: Settings, roles: [ADMIN] },
];

const Stat = ({ label, value, to, icon: Icon, tone = 'text-primary' }) => {
    const body = (
        <div className="glass-panel p-5 h-full">
            <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${tone}`} />
                {to && <ArrowRight className="w-4 h-4 text-slate-500" />}
            </div>
            <p className="text-3xl font-bold">{value ?? '—'}</p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">{label}</p>
        </div>
    );
    return to ? <Link to={to}>{body}</Link> : body;
};

const Dashboard = () => {
    const { user } = useAuth();
    const { student, status } = useProfile();
    const isAdmin = hasRole(user, ADMIN);
    const isLibrarian = hasRole(user, LIBRARIAN);
    const isManager = hasRole(user, TRANSPORT_MANAGER);
    const canBook = hasRole(user, STUDENT, FACULTY);

    const [stats, setStats] = useState(null); // null = loading; {} = failed / empty
    const [booking, setBooking] = useState(undefined); // undefined = loading, null = none
    const [issues, setIssues] = useState(null);

    // One call returns the numbers for this role
    useEffect(() => {
        getDashboardSummary().then(setStats).catch(() => setStats({}));
    }, []);

    useEffect(() => {
        if (!canBook) return;
        transportService.getMyBooking().then(setBooking).catch(() => setBooking(null));
    }, [canBook]);

    useEffect(() => {
        if (!student) return;
        libraryService.getIssueHistory(student.id).then(setIssues).catch(() => setIssues([]));
    }, [student]);

    const s = stats || {};
    const links = LINKS.filter((l) => hasRole(user, ...l.roles));
    const borrowed = issues?.filter((i) => ['ISSUED', 'RETURN_REQUESTED'].includes(i.status)) || [];
    const nextDue = borrowed.filter((i) => i.expectedReturnDate).sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate))[0];

    return (
        <PageShell>
            <div className="glass-panel p-8 mb-8">
                <p className="text-slate-400 text-sm mb-1">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold title-gradient">Welcome back, {user.firstName || fullName(user) || user.username}</h1>
                    <Badge tone="purple">{roleLabel(primaryRole(user))}</Badge>
                </div>
            </div>

            {isLibrarian && !isAdmin && (
                <section className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">Libraries</h2>
                    <LibrariesManager />
                </section>
            )}

            {isAdmin && (
                <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Stat label="Students" value={s.students} to="/directory" icon={Users} />
                    <Stat label="Faculty" value={s.faculty} to="/directory" icon={Users} tone="text-secondary" />
                    <Stat label="Courses" value={s.courses} to="/academic" icon={GraduationCap} tone="text-purple-400" />
                    <Stat label="Classrooms" value={s.classrooms} to="/academic" icon={Presentation} tone="text-orange-400" />
                    <Stat label="Books (issued)" value={s.books != null ? `${s.books} (${s.booksIssued})` : null} to="/resources" icon={BookMarked} tone="text-blue-400" />
                    <Stat label="Low-stock items" value={s.lowStockItems} to="/resources" icon={Boxes} tone="text-red-400" />
                    <Stat label="Lab maintenance due" value={s.labMaintenanceDue} to="/resources" icon={Wrench} tone="text-amber-400" />
                    <Stat label="Pending book requests" value={s.pendingIssueRequests} to="/library" icon={Clock} tone="text-amber-400" />
                    <Stat label="Return requests" value={s.pendingReturns} to="/library" icon={BookMarked} tone="text-purple-400" />
                    <Stat label="Overdue books" value={s.overdueBooks} to="/library" icon={AlertTriangle} tone="text-red-400" />
                    <Stat label="Vehicles" value={s.vehicles} to="/transport" icon={Bus} tone="text-green-400" />
                    <Stat label="Active bookings" value={s.activeTransportBookings} to="/transport" icon={Bus} tone="text-green-400" />
                </section>
            )}

            {isLibrarian && !isAdmin && (
                <section className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Stat label="Books" value={s.books} to="/resources" icon={BookMarked} tone="text-blue-400" />
                    <Stat label="Currently issued" value={s.booksIssued} to="/library" icon={BookMarked} />
                    <Stat label="Pending requests" value={s.pendingIssueRequests} to="/library" icon={Clock} tone="text-amber-400" />
                    <Stat label="Return requests" value={s.pendingReturns} to="/library" icon={BookMarked} tone="text-purple-400" />
                    <Stat label="Overdue" value={s.overdueBooks} to="/library" icon={AlertTriangle} tone="text-red-400" />
                </section>
            )}

            {isManager && !isAdmin && (
                <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Stat label="Vehicles" value={s.vehicles} to="/transport" icon={Bus} />
                    <Stat label="Seats available" value={s.seatsAvailable} icon={Users} tone="text-green-400" />
                    <Stat label="Active bookings" value={s.activeTransportBookings} to="/transport" icon={Clock} tone="text-amber-400" />
                </section>
            )}

            {(canBook || student) && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {canBook && (
                        <div className="glass-panel p-6">
                            <h2 className="font-bold flex items-center gap-2 mb-4"><Bus className="w-5 h-5 text-primary" /> My transport</h2>
                            {booking === undefined ? (
                                <p className="text-sm text-slate-400">Loading…</p>
                            ) : booking ? (
                                <div className="space-y-2 text-sm">
                                    <p className="text-lg font-semibold">{booking.transport?.vehicleName}</p>
                                    <p className="text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> {booking.transport?.routes}</p>
                                    <p className="text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" /> {fmtTime(booking.transport?.departureTime)} departure • pickup: {booking.pickupPoint || '—'}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">
                                    You haven&apos;t booked a seat. <Link to="/transport" className="text-primary hover:underline">Find a route</Link>
                                </p>
                            )}
                        </div>
                    )}
                    {hasRole(user, STUDENT) && (
                        <div className="glass-panel p-6">
                            <h2 className="font-bold flex items-center gap-2 mb-4"><BookMarked className="w-5 h-5 text-blue-400" /> My library</h2>
                            {status === 'unlinked' ? (
                                <p className="text-sm text-slate-400">
                                    <Link to="/profile" className="text-primary hover:underline">Complete your student profile</Link> to borrow books.
                                </p>
                            ) : issues === null ? (
                                <p className="text-sm text-slate-400">Loading…</p>
                            ) : (
                                <div className="text-sm space-y-2">
                                    <p><span className="text-3xl font-bold mr-2">{borrowed.length}</span>book{borrowed.length === 1 ? '' : 's'} borrowed</p>
                                    {s.booksOverdue > 0 && <p className="text-red-300">{s.booksOverdue} overdue — please return soon</p>}
                                    {nextDue && <p className="text-slate-400">Next due {fmtDate(nextDue.expectedReturnDate)} — {nextDue.bookName}</p>}
                                    <Link to="/library" className="text-primary hover:underline inline-block">Open my library</Link>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            <section>
                <h2 className="text-lg font-semibold mb-4">Quick links</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map(({ to, label, desc, icon: Icon }) => (
                        <motion.div key={to} whileHover={{ y: -3 }}>
                            <Link to={to} className="glass-panel p-5 flex items-center gap-4">
                                <div className="bg-primary/20 p-3 rounded-xl text-primary"><Icon className="w-6 h-6" /></div>
                                <div className="flex-1">
                                    <p className="font-bold">{label}</p>
                                    <p className="text-xs text-slate-400">{desc}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-500" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>
        </PageShell>
    );
};

export default Dashboard;
