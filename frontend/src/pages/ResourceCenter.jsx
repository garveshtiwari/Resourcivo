import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, FlaskConical, Box, History, Star, AlertTriangle, Wrench, X } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Tabs from '../components/ui/Tabs';
import CrudGrid from '../components/ui/CrudGrid';
import Modal from '../components/ui/Modal';
import FormModal from '../components/ui/FormModal';
import { Loading, Badge } from '../components/ui/States';
import { bookApi, inventoryApi, labApi, libraryApi, getBookCategories, getLowStock, getMaintenanceDue } from '../services/resource.service';
import libraryService from '../services/library.service';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';
import { hasRole, ROLES } from '../utils/roles';
import { fmtDate, titleCase } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { issueTone, equipmentTone, toOptions } from '../utils/status';

const TABS = [
    { id: 'library', label: 'Library', icon: Book },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'labs', label: 'Labs', icon: FlaskConical },
];

const INVENTORY_CATEGORIES = ['STATIONERY', 'CHEMICALS', 'SPORTS', 'CLEANING', 'OTHER'];
const UNITS = ['PIECES', 'LITERS', 'BOXES', 'KILOGRAMS', 'METERS', 'PACKETS'];
const LAB_TYPES = ['PHYSICS', 'CHEMISTRY'];
const EQUIPMENT_STATUS = ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DAMAGED', 'RETIRED'];

const inventoryFields = [
    { name: 'name', label: 'Item name', required: true },
    { name: 'sku', label: 'SKU', required: true },
    { name: 'category', label: 'Category', type: 'select', required: true, options: toOptions(INVENTORY_CATEGORIES, titleCase) },
    { name: 'unitOfMeasure', label: 'Unit', type: 'select', required: true, options: toOptions(UNITS, titleCase) },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
    { name: 'reorderLevel', label: 'Reorder level', type: 'number', min: 0, hint: 'Flagged as low stock at or below this number' },
    { name: 'pricePerUnit', label: 'Price per unit (₹)', type: 'number', min: 0, step: '0.01' },
    { name: 'supplier', label: 'Supplier' },
    { name: 'expiryDate', label: 'Expiry date', type: 'date' },
];

const labFields = [
    { name: 'name', label: 'Equipment name', required: true },
    { name: 'labType', label: 'Lab', type: 'select', required: true, options: toOptions(LAB_TYPES, titleCase) },
    { name: 'category', label: 'Category' },
    { name: 'modelNumber', label: 'Model number' },
    { name: 'totalQuantity', label: 'Total quantity', type: 'number', required: true, min: 0 },
    { name: 'availableQuantity', label: 'Available quantity', type: 'number', min: 0 },
    { name: 'status', label: 'Status', type: 'select', options: toOptions(EQUIPMENT_STATUS, titleCase), defaultValue: 'OPERATIONAL' },
    { name: 'conditionDetails', label: 'Condition notes' },
    { name: 'lastMaintenanceDate', label: 'Last maintenance', type: 'date' },
    { name: 'nextMaintenanceDueDate', label: 'Next maintenance due', type: 'date' },
    { name: 'aisleNumber', label: 'Aisle' },
    { name: 'shelfNumber', label: 'Shelf' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
];

const bookFields = (libraries) => [
    { name: 'name', label: 'Title', required: true, span: 2 },
    { name: 'author', label: 'Author' },
    { name: 'category', label: 'Category' },
    {
        name: 'libraryId', label: 'Library', type: 'select', cast: 'number', required: true,
        options: libraries.map((l) => ({ value: l.id, label: l.name })),
    },
    { name: 'yearBought', label: 'Date acquired', type: 'date' },
    { name: 'price', label: 'Price (₹)', type: 'number', min: 0, step: '0.01' },
    { name: 'rating', label: 'Rating (0–5)', type: 'number', min: 0, max: 5, step: '0.1' },
    { name: 'about', label: 'About', type: 'textarea', span: 2 },
    { name: 'reviews', label: 'Reviews', type: 'textarea', span: 2 },
];

/* ------------------------------ Library tab ------------------------------ */

const BookHistory = ({ book, onClose }) => {
    const [rows, setRows] = useState(null);

    useEffect(() => {
        if (!book) return;
        setRows(null);
        libraryService.getBookHistory(book.id).then(setRows).catch(() => setRows([]));
    }, [book]);

    return (
        <Modal isOpen={!!book} onClose={onClose} title={book ? `History — ${book.name}` : ''} size="max-w-3xl">
            {rows === null ? (
                <Loading />
            ) : rows.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">This book has never been requested.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="py-2 pr-4">Student</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Requested</th>
                                <th className="py-2 pr-4">Issued</th>
                                <th className="py-2">Returned</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="py-2 pr-4">{r.studentName}</td>
                                    <td className="py-2 pr-4"><Badge tone={issueTone(r.status)}>{titleCase(r.status)}</Badge></td>
                                    <td className="py-2 pr-4">{fmtDate(r.requestDate)}</td>
                                    <td className="py-2 pr-4">{fmtDate(r.issueDate)}</td>
                                    <td className="py-2">{fmtDate(r.returnDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
};

const libraryFormFields = [
    { name: 'name', label: 'Library name', required: true, span: 2 },
    { name: 'location', label: 'Location', required: true, minLength: 2, span: 2, placeholder: 'e.g. Main Block, Ground Floor' },
];

const BooksTab = ({ canManage, isStudent }) => {
    const { user } = useAuth();
    const isAdmin = hasRole(user, ROLES.ADMIN);
    const [libraryModal, setLibraryModal] = useState(false);
    const toast = useToast();
    const { student, status } = useProfile();
    const [libraries, setLibraries] = useState([]);
    const [myIssues, setMyIssues] = useState([]);
    const [historyBook, setHistoryBook] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState('');

    useEffect(() => {
        libraryApi.getAll().then(setLibraries).catch(() => setLibraries([]));
        getBookCategories().then(setCategories).catch(() => setCategories([]));
    }, []);

    // Server-side filter: POST /library-book/search with { category }
    const loadBooks = category ? () => bookApi.search({ category }) : bookApi.getAll;

    const refreshIssues = useCallback(async () => {
        if (!student) {
            setMyIssues([]);
            return;
        }
        try {
            setMyIssues(await libraryService.getIssueHistory(student.id));
        } catch {
            setMyIssues([]);
        }
    }, [student]);

    useEffect(() => {
        refreshIssues();
    }, [refreshIssues]);

    const fields = useMemo(() => bookFields(libraries), [libraries]);

    const myState = (bookId) =>
        myIssues.find((i) => i.bookId === bookId && ['PENDING', 'ISSUED', 'RETURN_REQUESTED'].includes(i.status))?.status;

    const myPendingIssue = (bookId) => myIssues.find((i) => i.bookId === bookId && i.status === 'PENDING');

    const cancelRequest = async (book, reload) => {
        const issue = myPendingIssue(book.id);
        if (!issue) return;
        if (!window.confirm(`Cancel your request for “${book.name}”?`)) return;
        setBusyId(book.id);
        try {
            await libraryService.cancelRequest(issue.id);
            toast.success('Request cancelled');
            await refreshIssues();
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not cancel the request'));
            await refreshIssues();
        } finally {
            setBusyId(null);
        }
    };

    const request = async (book, reload) => {
        setBusyId(book.id);
        try {
            await libraryService.requestIssue(student.id, book.id);
            toast.success(`Requested “${book.name}”. The librarian will review it.`);
            await refreshIssues();
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not send the request'));
        } finally {
            setBusyId(null);
        }
    };

    const studentAction = (book, reload) => {
        const mine = myState(book.id);
        if (mine === 'PENDING') {
            return (
                <button
                    onClick={() => cancelRequest(book, reload)}
                    disabled={busyId === book.id}
                    title="Your request is waiting for the librarian"
                    className="btn-secondary w-full !py-2 text-sm flex items-center justify-center gap-2 hover:!text-red-300 disabled:opacity-60"
                >
                    <X className="w-4 h-4" /> {busyId === book.id ? 'Cancelling…' : 'Cancel request'}
                </button>
            );
        }
        if (mine) return <button disabled className="btn-secondary w-full !py-2 text-sm opacity-60">Issued to you</button>;
        if (book.isIssued) return <button disabled className="btn-secondary w-full !py-2 text-sm opacity-60">Currently issued</button>;
        if (status === 'unlinked') {
            return <Link to="/profile" className="btn-secondary block text-center w-full !py-2 text-sm">Complete profile to borrow</Link>;
        }
        return (
            <button
                onClick={() => request(book, reload)}
                disabled={status !== 'linked' || busyId === book.id}
                className="btn-primary w-full !py-2 text-sm disabled:opacity-60"
            >
                {busyId === book.id ? 'Requesting…' : 'Request issue'}
            </button>
        );
    };

    const renderBook = (b, { reload }) => (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-500/20 p-3 rounded-xl text-blue-300">
                    <Book className="w-6 h-6" />
                </div>
                <Badge tone={b.isIssued ? 'amber' : 'green'}>{b.isIssued ? 'ISSUED' : 'AVAILABLE'}</Badge>
            </div>
            <h3 className="text-lg font-bold mb-1 pr-16">{b.name}</h3>
            <p className="text-sm text-slate-400 mb-3">{b.author || 'Unknown author'}</p>
            <div className="flex flex-wrap gap-2 text-xs mb-3">
                {b.category && <Badge>{b.category}</Badge>}
                {b.libraryName && <Badge tone="blue">{b.libraryName}</Badge>}
                {b.rating != null && (
                    <span className="flex items-center gap-1 text-amber-300">
                        <Star className="w-3 h-3 fill-current" /> {Number(b.rating).toFixed(1)}
                    </span>
                )}
            </div>
            {b.about && <p className="text-sm text-slate-400 line-clamp-2 mb-4">{b.about}</p>}
            <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                {b.price != null && <p className="text-xs text-slate-500">Price ₹{Number(b.price).toFixed(2)}</p>}
                {isStudent && studentAction(b, reload)}
                {canManage && (
                    <button onClick={() => setHistoryBook(b)} className="btn-secondary w-full !py-2 text-sm flex items-center justify-center gap-2">
                        <History className="w-4 h-4" /> Issue history
                    </button>
                )}
            </div>
        </>
    );

    return (
        <>
            {canManage && libraries.length === 0 && (
                <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
                    Books belong to a library, so create one first.{' '}
                    {isAdmin ? (
                        <Link to="/admin?tab=libraries" className="underline font-semibold">Create a library</Link>
                    ) : (
                        <button onClick={() => setLibraryModal(true)} className="underline font-semibold">Create a library</button>
                    )}
                </div>
            )}
            <FormModal
                isOpen={libraryModal}
                onClose={() => setLibraryModal(false)}
                title="Create a library"
                size="max-w-lg"
                fields={libraryFormFields}
                submitLabel="Create library"
                onSubmit={async (payload) => {
                    await libraryApi.create(payload);
                    setLibraries(await libraryApi.getAll());
                    toast.success('Library created');
                }}
            />
            <CrudGrid
                key={`books-${category}`}
                entity="book"
                load={loadBooks}
                toolbar={
                    categories.length > 0 && (
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input h-10 text-sm !w-auto">
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    )
                }
                renderCard={renderBook}
                searchKeys={['name', 'author', 'category']}
                searchPlaceholder="Search title, author, category…"
                fields={fields}
                canManage={canManage}
                addDisabled={libraries.length === 0}
                onCreate={(data) => bookApi.create({ isIssued: false, ...data })}
                onUpdate={(b, data) => bookApi.update(b.id, data)}
                onDelete={(b) => bookApi.remove(b.id)}
                emptyIcon={Book}
                emptyText="No books in the catalogue yet."
            />
            <BookHistory book={historyBook} onClose={() => setHistoryBook(null)} />
        </>
    );
};

/* ------------------------------ Inventory / Labs ------------------------------ */

const renderInventory = (item) => {
    const low = item.quantity <= (item.reorderLevel ?? 0);
    return (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-500/20 p-3 rounded-xl text-orange-300">
                    <Box className="w-6 h-6" />
                </div>
                {low ? (
                    <Badge tone="red"><span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> LOW STOCK</span></Badge>
                ) : (
                    <Badge tone="green">IN STOCK</Badge>
                )}
            </div>
            <h3 className="text-lg font-bold mb-1 pr-16">{item.name}</h3>
            <p className="text-xs font-mono text-slate-500 mb-3">{item.sku}</p>
            <div className="text-sm text-slate-400 space-y-1">
                <p><span className="text-slate-300 font-semibold">{item.quantity}</span> {titleCase(item.unitOfMeasure)} <span className="text-slate-500">(reorder at {item.reorderLevel ?? 0})</span></p>
                <p>Category: {titleCase(item.category)}</p>
                {item.supplier && <p>Supplier: {item.supplier}</p>}
                {item.expiryDate && <p>Expires: {fmtDate(item.expiryDate)}</p>}
            </div>
            <p className="mt-auto pt-4 text-xs text-slate-500">₹{Number(item.pricePerUnit || 0).toFixed(2)} per unit</p>
        </>
    );
};

const renderLab = (item) => {
    const pct = item.totalQuantity ? Math.round((item.availableQuantity / item.totalQuantity) * 100) : 0;
    const overdue = item.nextMaintenanceDueDate && new Date(item.nextMaintenanceDueDate) < new Date();
    return (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-green-500/20 p-3 rounded-xl text-green-300">
                    <FlaskConical className="w-6 h-6" />
                </div>
                <Badge tone={equipmentTone(item.status)}>{titleCase(item.status) || 'Unknown'}</Badge>
            </div>
            <h3 className="text-lg font-bold mb-1 pr-16">{item.name}</h3>
            <p className="text-xs text-slate-500 mb-3">
                {titleCase(item.labType)} lab{item.modelNumber ? ` • ${item.modelNumber}` : ''}
            </p>
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Available</span>
                    <span>{item.availableQuantity} / {item.totalQuantity}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-green-400" style={{ width: `${pct}%` }} />
                </div>
            </div>
            <div className="text-sm text-slate-400 space-y-1">
                {(item.aisleNumber || item.shelfNumber) && <p>Aisle {item.aisleNumber || '—'} • Shelf {item.shelfNumber || '—'}</p>}
                {item.conditionDetails && <p>Condition: {item.conditionDetails}</p>}
            </div>
            {item.nextMaintenanceDueDate && (
                <p className={`mt-auto pt-4 text-xs flex items-center gap-1 ${overdue ? 'text-red-300' : 'text-slate-500'}`}>
                    <Wrench className="w-3 h-3" /> Maintenance {overdue ? 'overdue since' : 'due'} {fmtDate(item.nextMaintenanceDueDate)}
                </p>
            )}
        </>
    );
};

/* ------------------------------ Page ------------------------------ */

const ResourceCenter = () => {
    const { user } = useAuth();
    const canManage = hasRole(user, ROLES.ADMIN);
    const isStudent = hasRole(user, ROLES.STUDENT);
    const isLibrarian = hasRole(user, ROLES.LIBRARIAN);
    const canManageBooks = hasRole(user, ROLES.ADMIN, ROLES.LIBRARIAN);
    const [tab, setTab] = useState('library');
    const [lowOnly, setLowOnly] = useState(false);
    const [dueOnly, setDueOnly] = useState(false);
    // Library staff only have access to the catalogue (the API closes inventory and labs to them)
    const tabs = isLibrarian ? TABS.filter((t) => t.id === 'library') : TABS;

    const chip = (on, set, label) => (
        <button
            onClick={() => set(!on)}
            className={`px-3 h-10 rounded-lg text-sm border transition-colors ${on ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
        >
            {label}
        </button>
    );

    return (
        <PageShell
            title="Resource Center"
            subtitle={canManage ? 'Manage the library catalogue, inventory and lab equipment' : canManageBooks ? 'Manage the library catalogue' : 'Library, inventory and labs'}
            actions={tabs.length > 1 ? <Tabs tabs={tabs} active={tab} onChange={setTab} /> : null}
        >
            {tab === 'library' && <BooksTab canManage={canManageBooks} isStudent={isStudent} />}
            {tab === 'inventory' && (
                <CrudGrid
                    key={`inventory-${lowOnly}`}
                    entity="inventory item"
                    load={lowOnly ? getLowStock : inventoryApi.getAll}
                    toolbar={chip(lowOnly, setLowOnly, 'Low stock only')}
                    renderCard={renderInventory}
                    searchKeys={['name', 'sku', 'category', 'supplier']}
                    searchPlaceholder="Search name, SKU, supplier…"
                    fields={inventoryFields}
                    canManage={canManage}
                    onCreate={inventoryApi.create}
                    onUpdate={(i, data) => inventoryApi.update(i.id, data)}
                    onDelete={(i) => inventoryApi.remove(i.id)}
                    emptyIcon={Box}
                />
            )}
            {tab === 'labs' && (
                <CrudGrid
                    key={`labs-${dueOnly}`}
                    entity="equipment"
                    load={dueOnly ? () => getMaintenanceDue(30) : labApi.getAll}
                    toolbar={chip(dueOnly, setDueOnly, 'Maintenance due (30 days)')}
                    renderCard={renderLab}
                    searchKeys={['name', 'labType', 'category', 'modelNumber']}
                    searchPlaceholder="Search equipment…"
                    fields={labFields}
                    canManage={canManage}
                    onCreate={labApi.create}
                    onUpdate={(i, data) => labApi.update(i.id, data)}
                    onDelete={(i) => labApi.remove(i.id)}
                    emptyIcon={FlaskConical}
                    addLabel="Add equipment"
                />
            )}
        </PageShell>
    );
};

export default ResourceCenter;
