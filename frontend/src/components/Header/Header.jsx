import React from 'react';
import PropTypes from 'prop-types';
import tcpLogo from '../../assets/tcp-logo.png';

/**
 * Header Component
 *
 * Global sticky header shown on authenticated pages. Displays the TCP
 * logo, the current page title, and a logout action.
 *
 * @component
 * @param {string} title - Page title to display (e.g. "Dashboard")
 * @param {Function} onLogout - Callback when the logout button is clicked
 * @returns {React.ReactElement} Header component
 *
 * @example
 * <Header title="Dashboard" onLogout={() => setIsAuthenticated(false)} />
 */
function Header({ title, onLogout }) {
  const handleLogoutClick = () => {
    try {
      onLogout();
    } catch (err) {
      // onLogout is supplied by the caller; guard the component boundary
      // in case its implementation throws directly instead of failing quietly.
      console.error('Header: onLogout threw unexpectedly.', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a365d] to-[#0d1b30] px-4 py-3 shadow-md sm:px-6">
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

        <button
          type="button"
          onClick={handleLogoutClick}
          aria-label="Log out"
          className="rounded-lg bg-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#1a365d] transition-colors duration-200 hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Header;
