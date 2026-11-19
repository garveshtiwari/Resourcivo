import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, Bus, BookMarked, CheckCheck, Info, ShieldCheck, Trash2, X } from 'lucide-react';
import notificationService from '../services/notification.service';
import { useToast } from '../context/ToastContext';

const POLL_MS = 30000;

const TYPE_ICON = { TRANSPORT: Bus, LIBRARY: BookMarked, ACCOUNT: ShieldCheck, SYSTEM: Info };

const LEVEL_STYLE = {
    INFO: 'text-indigo-300 bg-indigo-500/15',
    SUCCESS: 'text-green-300 bg-green-500/15',
    WARNING: 'text-amber-300 bg-amber-500/15',
    ALERT: 'text-red-300 bg-red-500/15',
};

const timeAgo = (iso) => {
    if (!iso) return '';
    const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
};

/** Bell with an unread badge and a dropdown of the signed-in user's notifications. */
const NotificationBell = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const wrapRef = useRef(null);
    const panelRef = useRef(null);
    const knownIds = useRef(null); // ids already seen, so only genuinely new ones raise a toast

    const refresh = useCallback(async () => {
        try {
            const list = await notificationService.getNotifications(false);
            if (knownIds.current) {
                const fresh = list.filter((n) => !n.read && !knownIds.current.has(n.id));
                fresh.slice(0, 2).forEach((n) => toast?.info(n.title));
            }
            knownIds.current = new Set(list.map((n) => n.id));
            setItems(list);
        } catch {
            /* the bell is a convenience; stay quiet if the request fails */
        } finally {
            setLoaded(true);
        }
    }, [toast]);

    useEffect(() => {
        refresh();
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') refresh();
        }, POLL_MS);
        const onFocus = () => refresh();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', onFocus);
        };
    }, [refresh]);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            const inside = (ref) => ref.current && ref.current.contains(e.target);
            if (!inside(wrapRef) && !inside(panelRef)) setOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const unread = items.filter((n) => !n.read).length;

    const openItem = async (n) => {
        if (!n.read) {
            setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
            notificationService.markRead(n.id).catch(() => {});
        }
        if (n.link) {
            setOpen(false);
            navigate(n.link);
        }
    };

    const readAll = async () => {
        setItems((list) => list.map((x) => ({ ...x, read: true })));
        notificationService.markAllRead().catch(() => refresh());
    };

    const removeItem = async (e, n) => {
        e.stopPropagation();
        setItems((list) => list.filter((x) => x.id !== n.id));
        knownIds.current?.delete(n.id);
        notificationService.remove(n.id).catch(() => refresh());
    };

    const clearAll = async () => {
        setItems([]);
        knownIds.current = new Set();
        notificationService.clearAll().catch(() => refresh());
    };

    return (
        <div className="relative" ref={wrapRef}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Notifications"
                aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-[10px] font-bold text-white flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {createPortal(
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="fixed left-4 right-4 top-20 sm:left-auto sm:right-6 sm:w-96 glass-panel !bg-slate-900/95 !shadow-2xl overflow-hidden z-[60]"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <p className="font-bold text-white">Notifications</p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={readAll}
                                    disabled={unread === 0}
                                    className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={clearAll}
                                    disabled={items.length === 0}
                                    className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-red-300 disabled:opacity-40 disabled:hover:bg-transparent"
                                    title="Clear all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 sm:hidden"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                            {!loaded ? (
                                <p className="p-6 text-center text-sm text-slate-400">Loading…</p>
                            ) : items.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <BellOff className="w-8 h-8 mx-auto mb-2 opacity-60" />
                                    <p className="text-sm">You're all caught up.</p>
                                </div>
                            ) : (
                                items.map((n) => {
                                    const Icon = TYPE_ICON[n.type] || Info;
                                    return (
                                        <div
                                            key={n.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openItem(n)}
                                            onKeyDown={(e) => e.key === 'Enter' && openItem(n)}
                                            className={`group flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${n.read ? 'opacity-70' : 'bg-white/[0.03]'}`}
                                        >
                                            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${LEVEL_STYLE[n.level] || LEVEL_STYLE.INFO}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-snug ${n.read ? 'text-slate-300' : 'font-semibold text-white'}`}>
                                                        {n.title}
                                                    </p>
                                                    {!n.read && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-secondary" />}
                                                </div>
                                                {n.message && <p className="text-xs text-slate-400 mt-0.5 break-words">{n.message}</p>}
                                                <p className="text-[11px] text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => removeItem(e, n)}
                                                className="self-start p-1 rounded text-slate-500 hover:text-red-300 hover:bg-white/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                title="Dismiss"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
            )}
        </div>
    );
};

export default NotificationBell;
