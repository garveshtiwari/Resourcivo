import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import authService from '../services/auth.service';
import { getErrorMessage } from '../utils/errors';

const ResendVerification = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSending(true);
        try {
            const res = await authService.resendVerification(email.trim());
            setMessage(res.message || 'If that email belongs to an unverified account, a new link has been sent.');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 w-full max-w-md relative">
                <Link to="/login" className="absolute top-4 left-4 text-slate-400 hover:text-white flex items-center gap-1 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
                <div className="text-center mb-8 mt-4">
                    <h1 className="text-2xl font-bold title-gradient mb-2">Resend verification email</h1>
                    <p className="text-slate-400 text-sm">Enter the email you registered with and we&apos;ll send a new link.</p>
                </div>
                {message && <div className="bg-green-500/20 text-green-200 p-3 rounded-lg mb-4 text-sm border border-green-500/30">{message}</div>}
                {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}
                <form onSubmit={submit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="glass-input !pl-12" required />
                    </div>
                    <button type="submit" disabled={sending} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                        {sending && <Loader2 className="w-4 h-4 animate-spin" />} Send link
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResendVerification;
