import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Builds the menu items for a user based on their status.
 *
 * @param {Object} user - User object
 * @param {Function} onViewDetails - View user details
 * @param {Function} onViewPending - View pending platforms (pending users only)
 * @param {Function} onOffboard - Offboard user (active users only)
 * @returns {Array<{label: string, onClick: Function}>} Menu items for this user
 */
function getMenuItems(user, onViewDetails, onViewPending, onOffboard) {
  if (user.status === 'pending') {
    return [
      { label: 'View Pending Details', onClick: () => onViewPending(user.id) },
      { label: 'View User Details', onClick: () => onViewDetails(user.id) },
    ];
  }
  if (user.status === 'active') {
    return [
      { label: 'View Details', onClick: () => onViewDetails(user.id) },
      { label: 'Offboard', onClick: () => onOffboard(user.id) },
    ];
  }
  return [{ label: 'View User Details', onClick: () => onViewDetails(user.id) }];
}

/**
 * UserActionMenu Component
 *
 * 3-dot dropdown menu for user actions.
 * Actions vary by user status.
 *
 * @component
 * @param {Object} user - User object
 * @param {Function} onViewDetails - View user details
 * @param {Function} onViewPending - View pending platforms
 * @param {Function} onOffboard - Offboard user
 * @returns {React.ReactElement} Action menu
 */
function UserActionMenu({ user, onViewDetails, onViewPending, onOffboard }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const menuItems = getMenuItems(user, onViewDetails, onViewPending, onOffboard);

  const handleItemClick = (onClick) => {
    setIsOpen(false);
    onClick();
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Actions for ${user.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-gray-300 transition-colors hover:bg-white/10 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
      >
        &#8942;
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={`Actions for ${user.name}`}
          className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-[#d4a574]/30 bg-[#0d1b30] shadow-xl"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(item.onClick)}
              className="block w-full px-4 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-[#d4a574] focus:outline-none focus-visible:bg-white/5 focus-visible:text-[#d4a574]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

UserActionMenu.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['pending', 'active', 'inactive']).isRequired,
  }).isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onViewPending: PropTypes.func.isRequired,
  onOffboard: PropTypes.func.isRequired,
};

export default UserActionMenu;
