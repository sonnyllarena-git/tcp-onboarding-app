import React, { useState } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

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
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30]">
      {!isAuthenticated ? (
        // Login Page (no header)
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        // Authenticated View (with header and dashboard)
        <>
          <Header
            title="Dashboard"
            userName={userData?.name}
            onLogout={handleLogout}
          />
          <main className="max-w-7xl mx-auto p-6">
            <Dashboard userName={userData?.name} />
          </main>
        </>
      )}
    </div>
  );
}

export default App;