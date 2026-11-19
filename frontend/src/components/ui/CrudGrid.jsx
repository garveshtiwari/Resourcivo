import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import FormModal from './FormModal';
import { Loading, EmptyState, ErrorState } from './States';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { getIn } from '../../utils/format';

/**
 * Searchable card grid with optional create / edit / delete.
 *  load()                      -> Promise<array>   (keep it stable: module-level function)
 *  renderCard(item, { reload }) -> JSX for the card body
 *  fields / toForm / onCreate / onUpdate / onDelete / canManage -> CRUD wiring
 */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const CrudGrid = ({
    load,
    renderCard,
    fields,
    editFields, // optional: different field set when editing
    prepareEdit, // optional: async (item) => initial form values (e.g. to fetch related records)
    createValues, // optional: initial values for the "create" form (keep the reference stable)
    toForm = (item) => item,
    onCreate,
    onUpdate,
    onDelete,
    canManage = false,
    searchKeys = ['name'],
    searchPlaceholder = 'Search…',
    entity = 'item',
    addLabel,
    emptyIcon,
    emptyText,
    columns = 'md:grid-cols-2 lg:grid-cols-3',
    toolbar,
    formSize,
    addDisabled = false,
}) => {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [modal, setModal] = useState({ open: false, editing: null, form: null });

    const loadRef = useRef(load);
    loadRef.current = load;

    const reload = useCallback(async () => {
        setError('');
        try {
            setItems((await loadRef.current()) || []);
        } catch (err) {
            setError(getErrorMessage(err, `Failed to load ${entity}s`));
        } finally {
            setLoading(false);
        }
    }, [entity]);

    useEffect(() => {
        reload();
    }, [reload]);

    // Stable reference so the form is only re-initialised when a different record is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const formValues = useMemo(
        () => (modal.editing ? modal.form ?? toForm(modal.editing) : null),
        [modal.editing, modal.form]
    );

    const closeModal = () => setModal({ open: false, editing: null, form: null });

    const openEdit = async (item) => {
        try {
            const form = prepareEdit ? await prepareEdit(item) : null;
            setModal({ open: true, editing: item, form });
        } catch (err) {
            toast.error(getErrorMessage(err, `Could not open ${entity}`));
        }
    };

    const q = query.trim().toLowerCase();
    const visible = q
        ? items.filter((it) => searchKeys.some((k) => String(getIn(it, k) ?? '').toLowerCase().includes(q)))
        : items;

    const handleSubmit = async (payload, values) => {
        if (modal.editing) {
            await onUpdate(modal.editing, payload, values);
            toast.success(`${cap(entity)} updated`);
        } else {
            await onCreate(payload, values);
            toast.success(`${cap(entity)} created`);
        }
        await reload();
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete this ${entity}? This cannot be undone.`)) return;
        try {
            await onDelete(item);
            toast.success(`${cap(entity)} deleted`);
            await reload();
        } catch (err) {
            toast.error(getErrorMessage(err, `Could not delete ${entity}`));
        }
    };

    const canAdd = canManage && onCreate && fields;

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="glass-input !pl-10 h-10 w-full md:w-72 text-sm"
                    />
                </div>
                <div className="flex items-center gap-3">
                    {toolbar}
                    {canAdd && (
                        <button
                            onClick={() => setModal({ open: true, editing: null, form: null })}
                            disabled={addDisabled}
                            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> {addLabel || `Add ${entity}`}
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : (
                <div className={`grid grid-cols-1 ${columns} gap-6`}>
                    {error && <ErrorState message={error} onRetry={reload} />}
                    {!error &&
                        visible.map((item, idx) => (
                            <motion.div
                                key={item.id ?? idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-6 relative group flex flex-col"
                            >
                                {canManage && (onUpdate || onDelete) && (
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                                        {onUpdate && fields && (
                                            <button
                                                onClick={() => openEdit(item)}
                                                className="p-2 bg-slate-700/70 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="p-2 bg-slate-700/70 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                {renderCard(item, { reload })}
                            </motion.div>
                        ))}
                    {!error && visible.length === 0 && (
                        <EmptyState icon={emptyIcon} text={q ? `No ${entity}s match “${query}”.` : emptyText || `No ${entity}s yet.`} />
                    )}
                </div>
            )}

            {fields && (
                <FormModal
                    isOpen={modal.open}
                    onClose={closeModal}
                    title={modal.editing ? `Edit ${entity}` : addLabel || `Add ${entity}`}
                    fields={modal.editing && editFields ? editFields : fields}
                    initialValues={modal.editing ? formValues : createValues ?? null}
                    onSubmit={handleSubmit}
                    submitLabel={modal.editing ? 'Save changes' : 'Create'}
                    size={formSize}
                />
            )}
        </div>
    );
};

export default CrudGrid;
