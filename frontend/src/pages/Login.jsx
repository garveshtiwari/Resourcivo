import { useState } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getErrorMessage } from '../utils/errors';
import PasswordInput from '../components/ui/PasswordInput';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // the password is sent exactly as typed (no trimming)
            const data = await login(username.trim(), password);
            navigate(data.mustChangePassword ? '/change-password' : '/dashboard');
        } catch (err) {
            setError(getErrorMessage(err, 'Invalid credentials. Please try again.'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 w-full max-w-md relative"
            >
                <Link to="/" className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </Link>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold title-gradient mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to access Resourcivo</p>
                </div>

                {params.get('verified') && !error && (
                    <div className="bg-green-500/20 text-green-200 p-3 rounded-lg mb-6 text-sm border border-green-500/30">
                        Verification successful! Log in to continue.
                    </div>
                )}
                {params.get('registered') && !error && (
                    <div className="bg-green-500/20 text-green-200 p-3 rounded-lg mb-6 text-sm border border-green-500/30">
                        Account created. Check your email for the verification link, then sign in.
                        <span className="block mt-1 text-green-100/80">
                            Didn&apos;t get it?{' '}
                            <Link to="/resend-verification" state={{ email: location.state?.email }} className="underline font-medium hover:text-white">
                                Send it again
                            </Link>
                        </span>
                    </div>
                )}
                {params.get('expired') && !error && (
                    <div className="bg-amber-500/20 text-amber-200 p-3 rounded-lg mb-6 text-sm border border-amber-500/30">
                        Your session expired. Please sign in again.
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-6 text-sm border border-red-500/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="glass-input !pl-12"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                            <PasswordInput
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input !pl-12"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-white transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2 group">
                        Sign In
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-6 space-y-2 text-center text-sm text-slate-400">
                    <p>
                        New here? <Link to="/register" className="text-primary hover:underline">Create an account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
