import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import Academic from './pages/Academic';
import ResourceCenter from './pages/ResourceCenter';
import Library from './pages/Library';
import Directory from './pages/Directory';
import Transport from './pages/Transport';
import Admin from './pages/Admin';
import ChangePassword from './pages/ChangePassword';
import ResendVerification from './pages/ResendVerification';
import { useAuth } from './context/AuthContext';
import { hasRole, ROLES } from './utils/roles';

const { ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER, LIBRARIAN } = ROLES;

// `roles` mirrors the access rules in the backend SecurityConfig.
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  // Accounts created by an admin must replace their temporary password before anything else
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  if (roles && !hasRole(user, ...roles)) return <Navigate to="/dashboard" replace />;
  return children;
};

const guarded = (element, roles) => <PrivateRoute roles={roles}>{element}</PrivateRoute>;

function App() {
  return (
    <Router>
      <div className="app-min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          <Route path="/change-password" element={guarded(<ChangePassword />)} />
          <Route path="/dashboard" element={guarded(<Dashboard />)} />
          <Route path="/profile" element={guarded(<Profile />)} />
          <Route path="/academic" element={guarded(<Academic />, [ADMIN, FACULTY, STUDENT])} />
          <Route path="/resources" element={guarded(<ResourceCenter />, [ADMIN, FACULTY, STUDENT, LIBRARIAN])} />
          <Route path="/library" element={guarded(<Library />, [ADMIN, STUDENT, LIBRARIAN])} />
          <Route path="/directory" element={guarded(<Directory />, [ADMIN, FACULTY, STUDENT])} />
          <Route path="/transport" element={guarded(<Transport />, [ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER])} />
          <Route path="/admin" element={guarded(<Admin />, [ADMIN])} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
