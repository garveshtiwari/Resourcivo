import { useEffect, useState } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { getErrorMessage } from '../../utils/errors';
import { getIn } from '../../utils/format';

/**
 * Field-driven form in a modal.
 * fields: [{ name, label, type, required, options, span, ... }]
 *  - name may be a dotted path ("contact.primaryNumber") -> nested payload
 *  - type: text | email | tel | number | date | time | textarea | select | checkbox | section
 *  - select options: ['A','B'] or [{ value, label }]; add cast: 'number' for numeric ids
 *  - uppercase: true forces upper-case input
 *  - showIf: (values) => boolean hides a field until it applies (e.g. an "Other" text box)
 *  - disabled: true shows the value read-only (it is still part of the submitted values)
 * Empty values are omitted from the payload (the backend ignores nulls on update).
 */

const inputFields = (fields) => fields.filter((f) => f.type !== 'section');

const setIn = (obj, path, value) => {
    const keys = path.split('.');
    let cur = obj;
    keys.slice(0, -1).forEach((k) => {
        cur[k] = cur[k] ?? {};
        cur = cur[k];
    });
    cur[keys[keys.length - 1]] = value;
};

const prune = (o) => {
    Object.keys(o).forEach((k) => {
        if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) {
            prune(o[k]);
            if (!Object.keys(o[k]).length) delete o[k];
        }
    });
    return o;
};

const buildInitial = (fields, initial) => {
    const values = {};
    inputFields(fields).forEach((f) => {
        const raw = getIn(initial || {}, f.name);
        if (f.type === 'checkbox') values[f.name] = raw ?? f.defaultValue ?? false;
        else values[f.name] = raw ?? f.defaultValue ?? '';
    });
    return values;
};

export const buildPayload = (fields, values) => {
    const out = {};
    inputFields(fields).forEach((f) => {
        let v = values[f.name];
        if (f.type === 'checkbox') {
            setIn(out, f.name, !!v);
            return;
        }
        if (v === '' || v == null) return;
        if (f.type === 'number' || f.cast === 'number') v = Number(v);
        setIn(out, f.name, v);
    });
    return prune(out);
};

const normaliseOptions = (options = []) =>
    options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));

const FormModal = ({
    isOpen,
    onClose,
    title,
    fields,
    initialValues,
    onSubmit,
    submitLabel = 'Save',
    size = 'max-w-2xl',
}) => {
    const [values, setValues] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reset only when the modal opens / the record changes (not on every parent render).
    useEffect(() => {
        if (isOpen) {
            setValues(buildInitial(fields, initialValues));
            setError('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialValues]);

    const handleChange = (field, e) => {
        let v = field.type === 'checkbox' ? e.target.checked : e.target.value;
        if (field.uppercase && typeof v === 'string') v = v.toUpperCase();
        setValues((prev) => ({ ...prev, [field.name]: v }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await onSubmit(buildPayload(fields, values), values);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const renderControl = (f) => {
        const common = {
            id: `f-${f.name}`,
            name: f.name,
            required: f.required,
            disabled: f.disabled,
            onChange: (e) => handleChange(f, e),
        };

        if (f.type === 'textarea') {
            return (
                <textarea
                    {...common}
                    value={values[f.name] ?? ''}
                    rows={f.rows || 3}
                    maxLength={f.maxLength}
                    placeholder={f.placeholder}
                    className="glass-input mt-1"
                />
            );
        }
        if (f.type === 'select') {
            return (
                <select {...common} value={values[f.name] ?? ''} className="glass-input mt-1">
                    <option value="">{f.placeholder || 'Select…'}</option>
                    {normaliseOptions(f.options).map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            );
        }
        if (f.type === 'checkbox') {
            return (
                <label className="flex items-center gap-3 mt-1 py-3 cursor-pointer select-none">
                    <input
                        {...common}
                        type="checkbox"
                        checked={!!values[f.name]}
                        className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-sm text-slate-300">{f.label}</span>
                </label>
            );
        }
        return (
            <input
                {...common}
                type={f.type || 'text'}
                value={values[f.name] ?? ''}
                min={f.min}
                max={f.max}
                step={f.step}
                minLength={f.minLength}
                maxLength={f.maxLength}
                pattern={f.pattern}
                title={f.title}
                placeholder={f.placeholder}
                className="glass-input mt-1"
            />
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="flex items-start gap-2 bg-red-500/15 text-red-200 p-3 rounded-lg text-sm border border-red-500/30">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.filter((f) => !f.showIf || f.showIf(values)).map((f, i) =>
                        f.type === 'section' ? (
                            <h3 key={`s-${i}`} className="md:col-span-2 text-sm font-semibold text-slate-300 border-t border-white/5 pt-4 first:border-0 first:pt-0">
                                {f.label}
                            </h3>
                        ) : (
                            <div key={f.name} className={f.span === 2 ? 'md:col-span-2' : ''}>
                                {f.type !== 'checkbox' && (
                                    <label htmlFor={`f-${f.name}`} className="text-xs text-slate-400">
                                        {f.label}
                                        {f.required && ' *'}
                                    </label>
                                )}
                                {renderControl(f)}
                                {f.hint && <p className="text-[11px] text-slate-500 mt-1">{f.hint}</p>}
                            </div>
                        )
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FormModal;
