import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Library as LibraryIcon, UserCog, Bus, MapPin, Mail, Phone, CalendarDays, Info, UserPlus, Users, Copy, Check, RefreshCw,
    ShieldCheck, Power,
} from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Tabs from '../components/ui/Tabs';
import CrudGrid from '../components/ui/CrudGrid';
import FormModal from '../components/ui/FormModal';
import Modal from '../components/ui/Modal';
import LibrariesManager from '../components/LibrariesManager';
import { Loading, ErrorState, EmptyState, Badge } from '../components/ui/States';
import {
    libraryApi, librarianApi, transportManagerApi, createStaffAccount, listUsers, setUserEnabled, setUserRoles,
} from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fullName, initials, fmtDate, titleCase } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { ROLES, roleLabel } from '../utils/roles';

const TABS = [
    { id: 'accounts', label: 'Staff accounts', icon: UserPlus },
    { id: 'users', label: 'All users', icon: Users },
    { id: 'libraries', label: 'Libraries', icon: LibraryIcon },
    { id: 'librarians', label: 'Librarians', icon: UserCog },
    { id: 'managers', label: 'Transport managers', icon: Bus },
];

const staffRecordFields = (extra = []) => [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phoneNumber', label: 'Phone', type: 'tel' },
    { name: 'joiningDate', label: 'Joining date', type: 'date' },
    ...extra,
];

const Note = ({ children }) => (
    <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <p>{children}</p>
    </div>
);

const renderStaff = (libraryName) => (p) => (
    <>
        <div className="flex items-center gap-4 mb-4 pr-16">
            <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white">
                {initials(p)}
            </div>
            <div className="min-w-0">
                <h3 className="text-lg font-bold truncate">{fullName(p)}</h3>
                <Badge tone={p.userId ? 'green' : 'slate'}>{p.userId ? 'Has login' : 'No login'}</Badge>
            </div>
        </div>
        <div className="text-sm text-slate-400 space-y-2">
            {p.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> <span className="truncate">{p.email}</span></p>}
            {p.phoneNumber && <p className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> {p.phoneNumber}</p>}
            {p.joiningDate && <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 shrink-0" /> Joined {fmtDate(p.joiningDate)}</p>}
            {libraryName && p.libraryId && <p className="flex items-center gap-2"><LibraryIcon className="w-4 h-4 shrink-0" /> {libraryName(p.libraryId)}</p>}
        </div>
    </>
);

/* ------------------------------ Staff accounts (CH-01) ------------------------------ */

const CredentialsModal = ({ result, onClose }) => {
    const [copied, setCopied] = useState(false);
    if (!result) return null;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(`Username: ${result.username}\nTemporary password: ${result.temporaryPassword}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard blocked: the values are on screen */
        }
    };
    return (
        <Modal isOpen={!!result} onClose={onClose} title="Account created" size="max-w-lg">
            <div className="space-y-4">
                <p className="text-sm text-slate-300">{result.message}</p>
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4 space-y-3 font-mono text-sm">
                    <div><span className="text-slate-500">Username </span>{result.username}</div>
                    <div><span className="text-slate-500">Temporary password </span><span className="text-amber-300 select-all">{result.temporaryPassword}</span></div>
                </div>
                <p className="text-xs text-slate-500">
                    This password is shown only once and is not stored. The user must choose a new one the first time they sign in.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={copy} className="btn-secondary !py-2 text-sm flex items-center gap-2">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={onClose} className="btn-primary !py-2 text-sm">Done</button>
                </div>
            </div>
        </Modal>
    );
};

const StaffAccountsTab = () => {
    const toast = useToast();
    const [libraries, setLibraries] = useState([]);
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        libraryApi.getAll().then(setLibraries).catch(() => setLibraries([]));
    }, []);

    const fields = useMemo(
        () => [
            { name: 'role', label: 'Role', type: 'select', required: true, options: [
                { value: 'LIBRARIAN', label: 'Librarian' },
                { value: 'TRANSPORT_MANAGER', label: 'Transport manager' },
            ] },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'firstName', label: 'First name', required: true },
            { name: 'lastName', label: 'Last name', required: true },
            { name: 'username', label: 'Username', minLength: 3, maxLength: 50, hint: 'Leave empty to use the part of the email before the @.' },
            { name: 'phoneNumber', label: 'Phone', type: 'tel' },
            { name: 'joiningDate', label: 'Joining date', type: 'date' },
            {
                name: 'libraryId', label: 'Library (librarians)', type: 'select', cast: 'number',
                options: libraries.map((l) => ({ value: l.id, label: l.name })),
                showIf: (v) => v.role === 'LIBRARIAN',
            },
        ],
        [libraries]
    );

    return (
        <>
            <Note>
                Librarians and transport managers can&apos;t register themselves. Create their account here: they get a temporary
                password (also emailed when mail is configured) and must set their own at first sign-in.
            </Note>
            <div className="glass-panel p-8 text-center space-y-4">
                <div className="bg-primary/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Create a staff account</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Sets up the sign-in and the staff record together, so a librarian can approve book requests straight away.
                </p>
                <button onClick={() => setOpen(true)} className="btn-primary inline-flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> New staff account
                </button>
            </div>

            <FormModal
                isOpen={open}
                onClose={() => setOpen(false)}
                title="New staff account"
                fields={fields}
                submitLabel="Create account"
                onSubmit={async (payload) => {
                    const res = await createStaffAccount(payload);
                    setResult(res);
                    toast.success(`${titleCase(res.role)} account created`);
                }}
            />
            <CredentialsModal result={result} onClose={() => setResult(null)} />
        </>
    );
};

/* ------------------------------ All users ------------------------------ */

const ASSIGNABLE = Object.values(ROLES);

const UsersTab = () => {
    const { user: me } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rolesFor, setRolesFor] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setUsers(await listUsers());
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load users'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const toggle = async (u) => {
        try {
            await setUserEnabled(u.id, !u.enabled);
            toast.success(`${u.username} ${u.enabled ? 'disabled' : 'enabled'}`);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const roleFields = ASSIGNABLE.map((r) => ({ name: r, label: roleLabel(r), type: 'checkbox' }));
    const roleInitial = rolesFor ? Object.fromEntries(ASSIGNABLE.map((r) => [r, rolesFor.roles.includes(r)])) : null;

    if (loading) return <Loading />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={load} className="btn-secondary !py-2 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>
            {users.length === 0 ? (
                <div className="grid"><EmptyState icon={Users} text="No users yet." /></div>
            ) : (
                <div className="glass-panel overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Roles</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => {
                                const self = u.id === me.userId;
                                return (
                                    <tr key={u.id} className="hover:bg-white/5">
                                        <td className="p-4">
                                            <p className="font-medium">{fullName(u) || u.username}</p>
                                            <p className="text-xs text-slate-500">@{u.username}</p>
                                        </td>
                                        <td className="p-4 text-slate-400">{u.email}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles.map((r) => <Badge key={r} tone="purple">{roleLabel(r)}</Badge>)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge tone={u.enabled ? 'green' : 'red'}>{u.enabled ? 'Active' : 'Disabled'}</Badge>
                                            {u.mustChangePassword && <span className="ml-2 text-xs text-amber-300">temp password</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setRolesFor(u)} disabled={self} className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40" title={self ? 'You can’t change your own roles' : 'Edit roles'}>
                                                    Roles
                                                </button>
                                                <button onClick={() => toggle(u)} disabled={self} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-40" title={self ? 'You can’t disable yourself' : ''}>
                                                    <Power className="w-3 h-3" /> {u.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <FormModal
                isOpen={!!rolesFor}
                onClose={() => setRolesFor(null)}
                title={rolesFor ? `Roles — ${rolesFor.username}` : ''}
                size="max-w-md"
                fields={roleFields}
                initialValues={roleInitial}
                submitLabel="Save roles"
                onSubmit={async (_payload, values) => {
                    const chosen = ASSIGNABLE.filter((r) => values[r]);
                    if (chosen.length === 0) throw new Error('Pick at least one role');
                    await setUserRoles(rolesFor.id, chosen);
                    toast.success('Roles updated');
                    load();
                }}
            />
        </>
    );
};

/* ------------------------------ Page ------------------------------ */

const LibrariansTab = () => {
    const [libraries, setLibraries] = useState([]);
    useEffect(() => {
        libraryApi.getAll().then(setLibraries).catch(() => setLibraries([]));
    }, []);

    const fields = useMemo(
        () => staffRecordFields([{ name: 'libraryId', label: 'Library', type: 'select', cast: 'number', options: libraries.map((l) => ({ value: l.id, label: l.name })) }]),
        [libraries]
    );
    const nameOf = (id) => libraries.find((l) => l.id === id)?.name || `Library #${id}`;

    return (
        <>
            <Note>This is the librarian directory. To add a new librarian with a login, use Staff accounts; here you can edit or remove records.</Note>
            <CrudGrid
                key="librarians"
                entity="librarian"
                load={librarianApi.getAll}
                renderCard={renderStaff(nameOf)}
                searchKeys={['firstName', 'lastName', 'email']}
                searchPlaceholder="Search librarians…"
                fields={fields}
                canManage
                onUpdate={(p, data) => librarianApi.update(p.id, data)}
                onDelete={(p) => librarianApi.remove(p.id)}
                emptyIcon={UserCog}
            />
        </>
    );
};

const Admin = () => {
    // /admin?tab=libraries opens that tab directly (used by the "create a library" links)
    const [params] = useSearchParams();
    const requested = params.get('tab');
    const [tab, setTab] = useState(TABS.some((t) => t.id === requested) ? requested : 'accounts');

    return (
        <PageShell title="Administration" subtitle="Accounts, libraries and staff records" actions={<Tabs tabs={TABS} active={tab} onChange={setTab} />}>
            {tab === 'accounts' && <StaffAccountsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'libraries' && <LibrariesManager canDelete />}
            {tab === 'librarians' && <LibrariansTab />}
            {tab === 'managers' && (
                <>
                    <Note>This is the transport-manager directory. Add new managers with a login from Staff accounts.</Note>
                    <CrudGrid
                        key="managers"
                        entity="transport manager"
                        load={transportManagerApi.getAll}
                        renderCard={renderStaff()}
                        searchKeys={['firstName', 'lastName', 'email']}
                        searchPlaceholder="Search managers…"
                        fields={staffRecordFields().map((f) => (f.name === 'email' ? { ...f, required: true } : f))}
                        canManage
                        onUpdate={(p, data) => transportManagerApi.update(p.id, data)}
                        onDelete={(p) => transportManagerApi.remove(p.id)}
                        emptyIcon={Bus}
                    />
                </>
            )}
        </PageShell>
    );
};

export default Admin;
