import { Link } from 'react-router-dom';
import { Search, AlertTriangle, Loader2, UserRound } from 'lucide-react';

export const Loading = ({ text = 'Loading…' }) => (
    <div className="flex items-center justify-center gap-3 p-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        {text}
    </div>
);

export const EmptyState = ({ icon: Icon = Search, text = 'Nothing here yet.', children }) => (
    <div className="col-span-full text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
        <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{text}</p>
        {children}
    </div>
);

export const ErrorState = ({ message, onRetry }) => (
    <div className="col-span-full text-center py-10 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-200">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <p className="text-sm">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="btn-secondary mt-4 !py-2 text-sm">
                Try again
            </button>
        )}
    </div>
);

// Shown to students whose login is not yet matched to a Student record.
export const ProfileNotice = () => (
    <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="bg-amber-500/20 p-3 rounded-xl text-amber-300 w-fit">
            <UserRound className="w-6 h-6" />
        </div>
        <div className="flex-1">
            <h3 className="font-bold">Complete your student profile</h3>
            <p className="text-sm text-slate-400">
                Library requests are tied to a student record. Add your details once and you&apos;re set.
            </p>
        </div>
        <Link to="/profile" className="btn-primary text-sm text-center">
            Go to profile
        </Link>
    </div>
);

const TONES = {
    green: 'bg-green-500/20 text-green-300',
    red: 'bg-red-500/20 text-red-300',
    amber: 'bg-amber-500/20 text-amber-300',
    blue: 'bg-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/20 text-purple-300',
    slate: 'bg-slate-700/50 text-slate-300',
};

export const Badge = ({ tone = 'slate', children }) => (
    <span className={`inline-block px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${TONES[tone]}`}>{children}</span>
);
