import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import RequestsList from './components/RequestsList';
import RequestDetails from './components/RequestDetails';
import OnboardingForm from './components/OnboardingForm';
import ManageUsers from './components/ManageUsers';
import OffboardingForm from './components/OffboardingForm';
import AuditLogs from './components/AuditLogs';
import Settings from './components/Settings';
import { AuthProvider, useAuth, useAuthActions } from './hooks/useAuth';

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/requests': 'Requests',
  '/onboarding': 'New Onboarding',
  '/manage-users': 'Manage Users',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
};

/**
 * Resolves the Header title for the current route.
 *
 * @param {string} pathname - Current location pathname
 * @returns {string} Page title to show in the Header
 */
function getRouteTitle(pathname) {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }
  if (pathname.startsWith('/requests/')) {
    return 'Request Details';
  }
  if (pathname.startsWith('/offboard/')) {
    return 'Offboard Employee';
  }
  return 'Dashboard';
}

/**
 * AuthenticatedApp Component
 *
 * Renders the sticky Header plus the routed authenticated pages
 * (Dashboard, RequestsList, RequestDetails). Only mounted once the user
 * is authenticated; unmatched paths redirect back to Dashboard.
 *
 * @component
 * @param {string} [userName] - Display name of the logged-in user
 * @param {Function} onLogout - Callback to clear authentication state
 * @returns {React.ReactElement} AuthenticatedApp component
 */
function AuthenticatedApp({ userName, onLogout }) {
  const location = useLocation();

  return (
    <>
      <Header title={getRouteTitle(location.pathname)} userName={userName} onLogout={onLogout} />
      <main className="max-w-7xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard userName={userName} />} />
          <Route path="/onboarding" element={<OnboardingForm />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/offboard/:userId" element={<OffboardingForm />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

AuthenticatedApp.propTypes = {
  userName: PropTypes.string,
  onLogout: PropTypes.func.isRequired,
};

/**
 * AppRoutes Component
 *
 * Routes between LoginPage and authenticated views, driven by the
 * AuthContext's current user rather than local state — this is what lets
 * a page reload or a direct URL visit survive via sessionStorage instead
 * of always bouncing back to the login page.
 *
 * @component
 * @returns {React.ReactElement} AppRoutes component
 */
function AppRoutes() {
  const user = useAuth();
  const { login, logout } = useAuthActions();

  /**
   * Handle successful mock login
   * @param {Object} account - The MOCK_ACCOUNTS entry the user logged in as
   */
  const handleLoginSuccess = (account) => {
    login(account);
    console.log('User logged in:', account.name);
  };

  /**
   * Handle logout - clear auth state
   * TODO: Call Azure AD logout when real MSAL is integrated
   */
  const handleLogout = () => {
    logout();
    console.log('User logged out');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e]">
      {!user ? (
        <Routes>
          <Route path="/" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <AuthenticatedApp userName={user?.name} onLogout={handleLogout} />
      )}
    </div>
  );
}

/**
 * Main App Component
 *
 * Wraps the router in AuthProvider so every route can read the current
 * user (and, for admin-only pages, their role) via useAuth().
 *
 * @component
 * @returns {React.ReactElement} App component
 */
function App() {
  // Applies the persisted dark-mode preference as soon as the app loads,
  // before login and regardless of which page a reload lands on — Settings'
  // own useEffect only re-applies it while the Settings page is mounted.
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('tcp_settings') || 'null');
      if (stored?.darkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch {
      // malformed localStorage - fall back to light mode
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
