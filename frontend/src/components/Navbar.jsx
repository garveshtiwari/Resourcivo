import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';
import { hasRole, primaryRole, roleLabel, ROLES } from '../utils/roles';
import {
    LogOut, LayoutDashboard, GraduationCap, FlaskConical, Users, Bus, BookMarked, Settings, Menu, X,
} from 'lucide-react';

const { ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER, LIBRARIAN } = ROLES;

// Only show what the backend will actually let this role open.
const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/academic', label: 'Academic', icon: GraduationCap, roles: [ADMIN, FACULTY, STUDENT] },
    { to: '/resources', label: 'Resources', icon: FlaskConical, roles: [ADMIN, FACULTY, STUDENT, LIBRARIAN] },
    { to: '/library', label: 'Library', icon: BookMarked, roles: [ADMIN, STUDENT, LIBRARIAN] },
    { to: '/directory', label: 'Directory', icon: Users, roles: [ADMIN, FACULTY, STUDENT] },
    { to: '/transport', label: 'Transport', icon: Bus, roles: [ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER] },
    { to: '/admin', label: 'Admin', icon: Settings, roles: [ADMIN] },
];

const linkClass = ({ isActive }) =>
    `flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${isActive ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`;

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const items = NAV_ITEMS.filter((i) => !i.roles || hasRole(user, ...i.roles));
    const role = roleLabel(primaryRole(user));

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 p-4">
            <div className="max-w-7xl mx-auto glass-panel border-none bg-opacity-80 backdrop-blur-md px-6 py-3 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                        R
                    </div>
                    <span className="text-xl font-bold title-gradient">Resourcivo</span>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="hidden lg:flex items-center gap-1">
                                {items.map(({ to, label, icon: Icon }) => (
                                    <NavLink key={to} to={to} className={linkClass}>
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </NavLink>
                                ))}
                            </div>

                            <div className="h-6 w-[1px] bg-white/10 mx-2 hidden lg:block"></div>

                            <div className="flex items-center gap-3">
                                <NotificationBell />
                                <Link to="/profile" className="hidden md:block text-right hover:opacity-80 transition-opacity">
                                    <p className="text-sm font-medium text-white">{user.username}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{role}</p>
                                </Link>
                                <Link to="/profile" className="rounded-full hover:ring-2 hover:ring-white/20 transition-all" title="Profile">
                                    <Avatar userId={user.userId} name={user.firstName || user.username} size="w-9 h-9" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setOpen((o) => !o)}
                                    className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="Menu"
                                >
                                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn-primary text-sm px-6 py-2 shadow-lg shadow-primary/20">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile menu */}
            {user && open && (
                <div className="lg:hidden max-w-7xl mx-auto mt-2 glass-panel !bg-slate-900/95 p-3 grid grid-cols-2 gap-1">
                    {items.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
