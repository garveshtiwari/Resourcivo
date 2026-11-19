export const fullName = (p) => [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(' ');

export const initials = (p) => `${p?.firstName?.[0] || ''}${p?.lastName?.[0] || ''}`.toUpperCase() || '?';

export const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(typeof d === 'string' && d.length === 10 ? `${d}T00:00:00` : d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtTime = (t) => (t ? String(t).substring(0, 5) : '—');

export const titleCase = (s) =>
    s ? String(s).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '';

export const getIn = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
