import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import { User, Mail, Lock, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getErrorMessage } from '../utils/errors';
import PasswordInput from '../components/ui/PasswordInput';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT' // Default
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Exclude confirmPassword from payload sent to backend
            const { confirmPassword, ...rest } = formData;
            await authService.register({ ...rest, firstName: rest.firstName.trim(), lastName: rest.lastName.trim() });
            navigate('/login?registered=true', { state: { email: formData.email } });
        } catch (err) {
            setError(getErrorMessage(err, 'Registration failed'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold title-gradient mb-2">Create Account</h1>
                    <p className="text-slate-400">Join Resourcivo today</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-6 text-sm border border-red-500/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                            <input
                                name="firstName"
                                type="text"
                                placeholder="First name"
                                className="glass-input !pl-12"
                                onChange={handleChange}
                                maxLength={100}
                                required
                            />
                        </div>
                        <input
                            name="lastName"
                            type="text"
                            placeholder="Last name"
                            className="glass-input"
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>
                    <p className="text-[11px] text-slate-500 -mt-2">
                        Your name is saved on your account and can&apos;t be edited later, so please enter it as it appears on your records.
                    </p>

                    <div className="space-y-1">
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                            <input
                                name="username"
                                type="text"
                                placeholder="Username"
                                className="glass-input !pl-12"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                            <input
                                name="email"
                                type="email"
                                placeholder="Email Address"
                                className="glass-input !pl-12"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                                className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${formData.role === 'STUDENT' ? 'bg-primary/20 border-primary text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                            >
                                <BookOpen className="w-4 h-4" /> Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'FACULTY' })}
                                className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${formData.role === 'FACULTY' ? 'bg-primary/20 border-primary text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                            >
                                <User className="w-4 h-4" /> Faculty
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                            <PasswordInput
                                name="password"
                                placeholder="Password"
                                className="glass-input !pl-12"
                                onChange={handleChange}
                                required
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
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary mt-6 flex items-center justify-center gap-2 group">
                        Sign Up
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center text-slate-400 text-sm mt-6">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
