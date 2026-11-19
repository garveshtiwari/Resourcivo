import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookMarked, Clock, Inbox, Undo2, Check, X, RefreshCw, Library as LibraryIcon, CalendarPlus, AlertTriangle } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Tabs from '../components/ui/Tabs';
import { Loading, EmptyState, ErrorState, Badge, ProfileNotice } from '../components/ui/States';
import libraryService from '../services/library.service';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';
import { hasRole, ROLES } from '../utils/roles';
import { fmtDate, titleCase } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { issueTone } from '../utils/status';

const IssueCard = ({ issue, showStudent, children }) => {
    const overdue = !!issue.overdue;
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 flex flex-col">
            <div className="flex justify-between items-start gap-3 mb-3">
                <div className="bg-blue-500/20 p-3 rounded-xl text-blue-300">
                    <BookMarked className="w-5 h-5" />
                </div>
                <Badge tone={overdue ? 'red' : issueTone(issue.status)}>{overdue ? 'OVERDUE' : titleCase(issue.status)}</Badge>
            </div>
            <h3 className="font-bold text-lg">{issue.bookName}</h3>
            {showStudent && <p className="text-sm text-slate-400">Student: {issue.studentName}</p>}
            {showStudent && issue.libraryName && <p className="text-sm text-slate-400">Library: {issue.libraryName}</p>}
            <dl className="mt-3 text-xs text-slate-400 grid grid-cols-2 gap-x-4 gap-y-1">
                <dt>Requested</dt><dd className="text-slate-300">{fmtDate(issue.requestDate)}</dd>
                {issue.issueDate && (<><dt>Issued</dt><dd className="text-slate-300">{fmtDate(issue.issueDate)}</dd></>)}
                {issue.expectedReturnDate && !issue.returnDate && (
                    <><dt>Due</dt><dd className={overdue ? 'text-red-300 font-semibold' : 'text-slate-300'}>{fmtDate(issue.expectedReturnDate)}</dd></>
                )}
                {issue.returnDate && (<><dt>Returned</dt><dd className="text-slate-300">{fmtDate(issue.returnDate)}</dd></>)}
            </dl>
            {children && <div className="mt-auto pt-4 flex gap-2">{children}</div>}
        </motion.div>
    );
};

/* ------------------------------ Student ------------------------------ */

const StudentLibrary = () => {
    const toast = useToast();
    const { student, status } = useProfile();
    const [tab, setTab] = useState('current');
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        if (!student) {
            setLoading(status === 'loading');
            return;
        }
        setError('');
        try {
            setIssues(await libraryService.getIssueHistory(student.id));
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your library records'));
        } finally {
            setLoading(false);
        }
    }, [student, status]);

    useEffect(() => {
        load();
    }, [load]);

    const requestReturn = async (issue) => {
        setBusyId(issue.id);
        try {
            await libraryService.requestReturn(issue.id);
            toast.success('Return requested. Hand the book to the librarian to complete it.');
            await load();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const renew = async (issue) => {
        setBusyId(issue.id);
        try {
            const res = await libraryService.renew(issue.id);
            toast.success(`Renewed. New due date: ${fmtDate(res.expectedReturnDate)}`);
            await load();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const cancelRequest = async (issue) => {
        if (!window.confirm('Cancel this book request?')) return;
        setBusyId(issue.id);
        try {
            await libraryService.cancelRequest(issue.id);
            toast.success('Request cancelled');
            await load();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    if (status === 'unlinked') return <ProfileNotice />;
    if (loading || status === 'loading') return <Loading />;
    if (status === 'error') return <ErrorState message="Could not check your student profile." />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    const current = issues.filter((i) => ['ISSUED', 'RETURN_REQUESTED'].includes(i.status));
    const pending = issues.filter((i) => i.status === 'PENDING');
    const past = issues.filter((i) => ['RETURNED', 'REJECTED'].includes(i.status));

    return (
        <>
            <div className="mb-6">
                <Tabs
                    tabs={[
                        { id: 'current', label: 'My books', icon: BookMarked, badge: current.length + pending.length },
                        { id: 'history', label: 'History', icon: Clock },
                    ]}
                    active={tab}
                    onChange={setTab}
                />
            </div>

            {tab === 'current' && (
                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-semibold mb-4">Currently borrowed</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {current.map((i) => (
                                <IssueCard key={i.id} issue={i}>
                                    {i.status === 'ISSUED' ? (
                                        <>
                                            <button
                                                onClick={() => renew(i)}
                                                disabled={busyId === i.id || i.overdue}
                                                title={i.overdue ? 'Overdue books cannot be renewed' : 'Extend by one week'}
                                                className="btn-secondary flex-1 !py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <CalendarPlus className="w-4 h-4" /> Renew
                                            </button>
                                            <button
                                                onClick={() => requestReturn(i)}
                                                disabled={busyId === i.id}
                                                className="btn-secondary flex-1 !py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                                            >
                                                <Undo2 className="w-4 h-4" /> Return
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-xs text-purple-300">Waiting for the librarian to confirm your return.</p>
                                    )}
                                </IssueCard>
                            ))}
                            {current.length === 0 && (
                                <EmptyState icon={BookMarked} text="You have no books out right now.">
                                    <Link to="/resources" className="btn-primary inline-block mt-4 text-sm">Browse the catalogue</Link>
                                </EmptyState>
                            )}
                        </div>
                    </section>

                    {pending.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4">Awaiting approval</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pending.map((i) => (
                                    <IssueCard key={i.id} issue={i}>
                                        <button
                                            onClick={() => cancelRequest(i)}
                                            disabled={busyId === i.id}
                                            className="btn-secondary w-full !py-2 text-sm flex items-center justify-center gap-2 hover:!text-red-300 disabled:opacity-60"
                                        >
                                            <X className="w-4 h-4" /> Cancel request
                                        </button>
                                    </IssueCard>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {tab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {past.map((i) => <IssueCard key={i.id} issue={i} />)}
                    {past.length === 0 && <EmptyState icon={Clock} text="No past borrowing yet." />}
                </div>
            )}
        </>
    );
};

/* ------------------------------ Librarian desk (admin) ------------------------------ */

const Desk = () => {
    const toast = useToast();
    const [tab, setTab] = useState('requests');
    const [requests, setRequests] = useState([]);
    const [returns, setReturns] = useState([]);
    const [overdue, setOverdue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [req, ret, late] = await Promise.all([
                libraryService.getPendingRequests(),
                libraryService.getReturnRequests(),
                libraryService.getOverdue(),
            ]);
            setRequests(req);
            setReturns(ret);
            setOverdue(late);
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load library requests'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const act = async (fn, issue, okMsg) => {
        setBusyId(issue.id);
        try {
            await fn(issue.id);
            toast.success(okMsg);
            await load();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const actions = (issue, primary, secondary) => (
        <>
            <button
                disabled={busyId === issue.id}
                onClick={() => act(primary.fn, issue, primary.msg)}
                className="btn-primary flex-1 !py-2 text-sm flex items-center justify-center gap-1 disabled:opacity-60"
            >
                <Check className="w-4 h-4" /> {primary.label}
            </button>
            <button
                disabled={busyId === issue.id}
                onClick={() => act(secondary.fn, issue, secondary.msg)}
                className="btn-secondary flex-1 !py-2 text-sm flex items-center justify-center gap-1 hover:!text-red-300 disabled:opacity-60"
            >
                <X className="w-4 h-4" /> {secondary.label}
            </button>
        </>
    );

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <Tabs
                    tabs={[
                        { id: 'requests', label: 'Issue requests', icon: Inbox, badge: requests.length },
                        { id: 'returns', label: 'Return requests', icon: Undo2, badge: returns.length },
                        { id: 'overdue', label: 'Overdue', icon: AlertTriangle, badge: overdue.length },
                    ]}
                    active={tab}
                    onChange={setTab}
                />
                <button onClick={load} className="btn-secondary !py-2 text-sm flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {loading ? (
                <Loading />
            ) : error ? (
                <ErrorState message={error} onRetry={load} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tab === 'requests' &&
                        requests.map((i) => (
                            <IssueCard key={i.id} issue={i} showStudent>
                                {actions(
                                    i,
                                    { label: 'Approve', fn: libraryService.approve, msg: 'Issue approved (due in 2 weeks)' },
                                    { label: 'Reject', fn: libraryService.reject, msg: 'Request rejected' }
                                )}
                            </IssueCard>
                        ))}
                    {tab === 'requests' && requests.length === 0 && <EmptyState icon={Inbox} text="No pending issue requests." />}

                    {tab === 'returns' &&
                        returns.map((i) => (
                            <IssueCard key={i.id} issue={i} showStudent>
                                {actions(
                                    i,
                                    { label: 'Confirm', fn: libraryService.confirmReturn, msg: 'Return confirmed' },
                                    { label: 'Decline', fn: libraryService.rejectReturn, msg: 'Return declined; book stays with the student' }
                                )}
                            </IssueCard>
                        ))}
                    {tab === 'returns' && returns.length === 0 && <EmptyState icon={Undo2} text="No return requests waiting." />}

                    {tab === 'overdue' && overdue.map((i) => <IssueCard key={i.id} issue={i} showStudent />)}
                    {tab === 'overdue' && overdue.length === 0 && <EmptyState icon={Clock} text="Nothing is overdue." />}
                </div>
            )}
        </>
    );
};

const Library = () => {
    const { user } = useAuth();
    const isDesk = hasRole(user, ROLES.ADMIN, ROLES.LIBRARIAN);

    return (
        <PageShell
            title={isDesk ? 'Library Desk' : 'My Library'}
            subtitle={isDesk ? 'Approve book requests and confirm returns' : 'Track the books you have borrowed'}
            actions={
                <Link to="/resources" className="btn-secondary !py-2 text-sm flex items-center gap-2 w-fit">
                    <LibraryIcon className="w-4 h-4" /> Browse catalogue
                </Link>
            }
        >
            {isDesk ? <Desk /> : <StudentLibrary />}
        </PageShell>
    );
};

export default Library;
