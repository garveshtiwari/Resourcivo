import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/auth.service';
import { getErrorMessage } from '../utils/errors';
import PasswordInput from '../components/ui/PasswordInput';

const ChangePassword = () => {
    const { user, updateUser, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const forced = !!user?.mustChangePassword;

    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.newPassword !== form.confirm) {
            setError('The new passwords do not match');
            return;
        }
        setSaving(true);
        try {
            await authService.changePassword(form.currentPassword, form.newPassword);
            updateUser({ mustChangePassword: false });
            toast.success('Password changed');
            navigate('/dashboard');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="bg-primary/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold title-gradient mb-2">{forced ? 'Choose a new password' : 'Change password'}</h1>
                    <p className="text-slate-400 text-sm">
                        {forced
                            ? 'You signed in with a temporary password. Set your own to continue.'
                            : 'Use at least 6 characters.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    {[
                        ['currentPassword', forced ? 'Temporary password' : 'Current password'],
                        ['newPassword', 'New password'],
                        ['confirm', 'Confirm new password'],
                    ].map(([name, label]) => (
                        <div key={name} className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                            <PasswordInput
                                name={name}
                                value={form[name]}
                                onChange={onChange}
                                placeholder={label}
                                className="glass-input !pl-12"
                                minLength={name === 'currentPassword' ? undefined : 6}
                                required
                            />
                        </div>
                    ))}
                    <button type="submit" disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save password
                    </button>
                </form>

                <div className="text-center mt-5 text-sm">
                    {forced ? (
                        <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-white">Sign out</button>
                    ) : (
                        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">Cancel</button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ChangePassword;
