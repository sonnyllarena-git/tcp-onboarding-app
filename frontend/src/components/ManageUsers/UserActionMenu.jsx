import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * Builds the menu items for a user based on their status.
 *
 * @param {Object} user - User object
 * @param {Function} onViewDetails - View user details (opens modal)
 * @param {Function} onViewPending - View pending platforms (navigate to RequestDetails)
 * @param {Function} onOffboard - Offboard user (navigate to OffboardingForm)
 * @returns {Array<{label: string, onClick: Function}>} Menu items for this user
 */
function getMenuItems(user, onViewDetails, onViewPending, onOffboard) {
  // PENDING USERS
  if (user.status === 'pending') {
    return [
      {
        label: 'View Pending Details',
        onClick: () => onViewPending(user.id) // BUG #1 FIX: Navigate to RequestDetails
      },
      {
        label: 'View User Details',
        onClick: () => onViewDetails(user) // BUG #2 FIX: Open UserDetailsModal
      },
    ];
  }

  // ACTIVE USERS
  if (user.status === 'active') {
    return [
      {
        label: 'View User Details', // BUG #3 FIX: Changed from "View Details" to "View User Details"
        onClick: () => onViewDetails(user) // Open UserDetailsModal
      },
      {
        label: 'Offboard',
        onClick: () => onOffboard(user.id) // BUG #4 FIX: Navigate to OffboardingForm
      },
    ];
  }

  // INACTIVE USERS
  return [
    {
      label: 'View User Details',
      onClick: () => onViewDetails(user) // BUG #5 FIX: Open UserDetailsModal
    }
  ];
}

/**
 * UserActionMenu Component
 *
 * 3-dot dropdown menu for user actions.
 * Actions vary by user status.
 * - Pending: View pending platforms (→ RequestDetails) + View user details (→ Modal)
 * - Active: View user details (→ Modal) + Offboard (→ OffboardingForm)
 * - Inactive: View user details (→ Modal)
 *
 * @component
 * @param {Object} user - User object
 * @param {Function} onViewDetails - Open UserDetailsModal with user data
 * @param {Function} onViewPending - Navigate to RequestDetails with request ID
 * @param {Function} onOffboard - Navigate to OffboardingForm with user ID
 * @returns {React.ReactElement} Action menu
 */
function UserActionMenu({ user, onViewDetails, onViewPending, onOffboard }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

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

  // BUG #1 FIX: Wire onViewPending to navigate to RequestDetails
  const handleViewPending = (userId) => {
    // In a real app, we'd fetch the request ID from the user
    // For now, assuming userId corresponds to a request or we have a mapping
    console.log('Navigate to request details for user:', userId);
    // TODO: Get actual request ID and navigate
    // navigate(`/requests/${requestId}`);
  };

  // BUG #2, #5 FIX: Wire onViewDetails to open UserDetailsModal
  const handleViewDetails = (userData) => {
    console.log('Opening user details modal for:', userData);
    onViewDetails(userData);
  };

  // BUG #4 FIX: Wire onOffboard to navigate to OffboardingForm
  const handleOffboard = (userId) => {
    console.log('Navigating to offboarding form for user:', userId);
    navigate(`/offboard/${userId}`);
  };

  const menuItems = getMenuItems(
    user,
    handleViewDetails,      // Open modal
    handleViewPending,      // Navigate to RequestDetails
    handleOffboard          // Navigate to OffboardingForm
  );

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