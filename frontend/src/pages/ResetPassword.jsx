import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PasswordInput from '../components/ui/PasswordInput';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing reset token.');
        }
    }, [token]);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage('Passwords do not match');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            await authService.resetPassword(token, passwords.newPassword);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 w-full max-w-md text-center"
                >
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                    <p className="text-slate-400 mb-6">Your password has been successfully updated.</p>
                    <Link to="/login" className="btn-primary w-full block">
                        Sign In Now
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold title-gradient mb-2">Reset Password</h1>
                    <p className="text-slate-400 text-sm">Create a new secure password</p>
                </div>

                {status === 'error' && (
                    <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {message}
                    </div>
                )}

                {!token ? (
                    <div className="text-center">
                        <Link to="/login" className="text-primary hover:underline">Return to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                <PasswordInput
                                    name="newPassword"
                                    placeholder="New Password"
                                    className="glass-input !pl-12"
                                    value={passwords.newPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                <PasswordInput
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    className="glass-input !pl-12"
                                    value={passwords.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full btn-primary mt-6 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
