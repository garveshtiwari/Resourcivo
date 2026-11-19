import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONES = {
    success: { cls: 'border-green-500/30 bg-green-500/15 text-green-100', Icon: CheckCircle2 },
    error: { cls: 'border-red-500/30 bg-red-500/15 text-red-100', Icon: AlertCircle },
    info: { cls: 'border-primary/30 bg-primary/15 text-indigo-100', Icon: Info },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const push = useCallback(
        (type, message) => {
            const id = ++idRef.current;
            setToasts((t) => [...t, { id, type, message }]);
            setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
        },
        [dismiss]
    );

    const api = useMemo(
        () => ({
            success: (m) => push('success', m),
            error: (m) => push('error', m),
            info: (m) => push('info', m),
        }),
        [push]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
                <AnimatePresence>
                    {toasts.map(({ id, type, message }) => {
                        const { cls, Icon } = TONES[type];
                        return (
                            <motion.div
                                key={id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40 }}
                                className={`flex items-start gap-3 p-3 pr-2 rounded-xl border backdrop-blur-xl shadow-xl text-sm ${cls}`}
                            >
                                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="flex-1 break-words">{message}</p>
                                <button onClick={() => dismiss(id)} className="p-1 rounded hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
