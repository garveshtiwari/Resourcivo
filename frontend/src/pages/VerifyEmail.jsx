import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const requested = useRef(false);
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        // React StrictMode runs effects twice in development; the link may only be used once per page load
        if (requested.current) return;
        requested.current = true;

        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification token.');
                return;
            }

            try {
                await authService.verifyEmail(token);
                // success: show the login page with a confirmation message
                navigate('/login?verified=true', { replace: true });
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
            }
        };

        verify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 w-full max-w-md text-center"
            >
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-12 h-12 text-primary animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Verifying Email...</h2>
                        <p className="text-slate-400">Please wait while we verify your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                        <p className="text-slate-400 mb-6">Your account has been successfully verified.</p>
                        <Link to="/login" className="btn-primary w-full block">
                            Back to Login
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-red-200 bg-red-500/10 p-4 rounded-lg text-sm mb-6 w-full">
                            {message}
                        </p>
                        <Link to="/resend-verification" className="btn-primary w-full block mb-3">
                            Send a new verification link
                        </Link>
                        <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                            Back to Login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
