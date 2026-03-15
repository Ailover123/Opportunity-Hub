import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';


import Dashboard from './pages/SaaSDashboard';
import CommunityHub from './pages/CommunityHub';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/DedicatedLogin';
import { LayoutDashboard, Users, CreditCard, LogOut, Briefcase, UserCircle } from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useUser();
  const { addNotification } = useNotification();
  const location = useLocation();


  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/community', label: 'Community', icon: <Users size={20} /> },

    { path: '/profile', label: 'Profile Settings', icon: <UserCircle size={20} /> },
    { path: '/billing', label: 'Plans & Billing', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div style={{ padding: '0 0.5rem 2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase color="var(--primary)" fill="var(--primary)" /> OppHub
        </h2>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              color: location.pathname === item.path ? 'white' : '#94a3b8',
              textDecoration: 'none',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              background: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              fontWeight: 500
            }}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0 1rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user?.plan} plan
              <button
                onClick={() => addNotification('Team Upgrade coming soon!', 'info')}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer' }}
              >
                UPGRADE
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            width: '100%', padding: '0.75rem 1rem', background: 'transparent',
            border: 'none', color: '#94a3b8', cursor: 'pointer', textAlign: 'left'
          }}
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="dashboard-container">
      <Sidebar />
      {children}
    </div>
  );
};

const App = () => {
  return (
    <NotificationProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><CommunityHub /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><div className="main-content"><h1>Plans & Billing</h1><p>Secure checkout powered by Stripe & Razorpay. Select your preferred gateway.</p></div></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </UserProvider>
    </NotificationProvider>
  );
};


export default App;