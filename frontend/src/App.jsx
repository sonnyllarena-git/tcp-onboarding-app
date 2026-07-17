import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import RequestsList from './components/RequestsList';
import RequestDetails from './components/RequestDetails';
import OnboardingForm from './components/OnboardingForm';

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/requests': 'Requests',
  '/onboarding': 'New Onboarding',
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
 * Main App Component
 *
 * Routes between LoginPage and authenticated views.
 * Manages SSO authentication state and user information.
 *
 * @component
 * @returns {React.ReactElement} App component
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  /**
   * Handle successful SSO login
   * @param {Object} user - User data from SSO
   * @param {string} user.name - User's display name
   * @param {string} user.email - User's email
   * @param {string} user.id - User's ID
   */
  const handleLoginSuccess = (user) => {
    setUserData(user);
    setIsAuthenticated(true);
    console.log('User logged in:', user.name);
  };

  /**
   * Handle logout - clear auth state
   * TODO: Call Azure AD logout when real MSAL is integrated
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    console.log('User logged out');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30]">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <AuthenticatedApp userName={userData?.name} onLogout={handleLogout} />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
