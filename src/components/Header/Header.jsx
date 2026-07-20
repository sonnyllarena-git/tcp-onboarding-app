import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import tcpLogo from '../../assets/tcp-logo.png';
import { useAuth } from '../../hooks/useAuth';
import NotificationCenter from './NotificationCenter';

/**
 * Header Component
 *
 * Global sticky header shown on authenticated pages. Displays the TCP
 * logo, the current page title, user name from SSO, and logout action.
 *
 * @component
 * @param {string} title - Page title to display (e.g. "Dashboard")
 * @param {string} userName - Authenticated user name from SSO (optional)
 * @param {Function} onLogout - Callback when the logout button is clicked
 * @returns {React.ReactElement} Header component
 *
 * @example
 * <Header title="Dashboard" userName="John Doe" onLogout={() => setIsAuthenticated(false)} />
 */
function Header({ title, userName = null, onLogout }) {
  const navigate = useNavigate();
  const user = useAuth();

  const handleLogoutClick = () => {
    try {
      onLogout();
    } catch (err) {
      console.error('Header: onLogout threw unexpectedly.', err);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a365d] to-[#0d1b30] px-4 py-3 shadow-md dark:from-[#0a0f1e] dark:to-[#0a0f1e] sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-[#d4a574] p-2 shadow-sm">
            <img src={tcpLogo} alt="The Credit Pros logo" className="h-7 w-auto sm:h-8" />
          </div>
          <div>
            <p className="text-xs text-gray-300">TCP Portal</p>
            <h1 className="text-lg font-bold leading-tight text-white">{title}</h1>
          </div>
        </div>

        {/* Right: User Info, Home Button, and Logout */}
        <div className="flex items-center gap-4">
          {/* User Name (SSO) + Role Badge */}
          {userName && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <p className="text-xs text-gray-300">Logged in as</p>
                <p className="text-sm font-semibold text-[#d4a574]">{userName}</p>
              </div>
              {user?.role && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    user.role === 'ADMIN' ? 'bg-[#d4a574] text-[#1a365d]' : 'bg-gray-400 text-[#1a365d]'
                  }`}
                >
                  {user.role}
                </span>
              )}
            </div>
          )}

          {/* Home Button */}
<button
  type="button"
  onClick={handleHomeClick}
  aria-label="Go to home"
  className="rounded-lg bg-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#1a365d] transition-all duration-200 hover:bg-[#c99a63] hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
>
  Home
</button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={handleSettingsClick}
            aria-label="Settings"
            className="rounded-lg border border-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#d4a574] transition-colors duration-200 hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            <span aria-hidden="true">⚙️</span> Settings
          </button>

          {/* Notification Bell */}
          <NotificationCenter />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            aria-label="Log out"
            className="rounded-lg border border-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#d4a574] transition-colors duration-200 hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  userName: PropTypes.string,
  onLogout: PropTypes.func.isRequired,
};

Header.defaultProps = {
  userName: null,
};

export default Header;