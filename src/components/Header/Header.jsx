import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import tcpLogo from '../../assets/tcp-logo.png';
import { useAuth } from '../../hooks/useAuth';
import NotificationCenter from './NotificationCenter';

/**
 * Header Component
 *
 * Global sticky header shown on authenticated pages: logo/page title,
 * a centered "Logged in as" greeting, and Home/Activity/Menu on the
 * right. Settings and Logout live inside the hamburger menu rather than
 * as standalone buttons, keeping the bar itself uncluttered as more
 * menu items are added later.
 *
 * @component
 * @param {string} title - Page title to display (e.g. "Dashboard")
 * @param {string} userName - Authenticated user name from SSO (optional)
 * @param {Function} onLogout - Callback when the logout menu item is clicked
 * @returns {React.ReactElement} Header component
 *
 * @example
 * <Header title="Dashboard" userName="John Doe" onLogout={() => setIsAuthenticated(false)} />
 */
function Header({ title, userName = null, onLogout }) {
  const navigate = useNavigate();
  const user = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogoutClick = () => {
    setMenuOpen(false);
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
    setMenuOpen(false);
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

        {/* Center intentionally left empty - the user's name/role already
            appears in the Dashboard's own greeting and in the hamburger
            menu below, so repeating it here would be redundant. */}
        <div className="flex-1" />

        {/* Right: Home, Activity (notification bell), and the hamburger menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleHomeClick}
            aria-label="Go to home"
            title="Go to Home"
            className="rounded-lg bg-[#d4a574] px-3 py-1.5 text-sm font-bold text-[#1a365d] transition-all duration-200 hover:bg-[#c99a63] hover:shadow-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            <span aria-hidden="true">🏠</span> <span className="hidden sm:inline">Home</span>
          </button>

          <NotificationCenter />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              title="Menu"
              className={`flex h-8 w-9 items-center justify-center rounded-lg border text-xl leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] ${
                menuOpen
                  ? 'border-[#d4a574] bg-[#d4a574]/20 text-[#d4a574]'
                  : 'border-[#d4a574]/30 text-gray-300 hover:border-[#d4a574] hover:bg-white/10 hover:text-[#d4a574]'
              }`}
            >
              &#8801;
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="User menu"
                className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-[#d4a574]/30 bg-[#1a365d] shadow-2xl"
              >
                <div className="border-b border-[#d4a574]/20 bg-white/5 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#d4a574]">{user?.name || userName}</p>
                  {user?.role && (
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">{user.role}</p>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSettingsClick}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-200 transition-colors hover:bg-blue-500/10 hover:text-blue-300 focus:outline-none focus-visible:bg-blue-500/10"
                >
                  <span aria-hidden="true">⚙️</span> Settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogoutClick}
                  className="flex w-full items-center gap-2.5 border-t border-[#d4a574]/20 px-4 py-2.5 text-left text-sm text-gray-200 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:bg-red-500/10"
                >
                  <span aria-hidden="true">🚪</span> Logout
                </button>
              </div>
            )}
          </div>
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

export default Header;
