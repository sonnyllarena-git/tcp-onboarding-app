import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Builds the menu items for a user based on their status.
 *
 * @param {Object} user - User object
 * @param {boolean} isPendingOffboard - True when this active user already has an offboarding request awaiting approval
 * @param {Function} onViewDetails - View user details (opens modal)
 * @param {Function} onViewRequest - View this user's request (navigate to RequestDetails)
 * @param {Function} onSubmitOffboard - Offboard user (navigate to OffboardingForm)
 * @param {Function} onTransition - Open TransitionForm for this user
 * @param {boolean} hasPendingTransition - True when this active user already has a transition request awaiting completion
 * @param {Function} onReactivate - Open ReactivationForm for this inactive user
 * @param {boolean} hasPendingReactivation - True when this inactive user already has a reactivation request awaiting completion
 * @returns {Array<{label: string, onClick: Function}>} Menu items for this user
 */
function getMenuItems(
  user,
  isPendingOffboard,
  onViewDetails,
  onViewRequest,
  onSubmitOffboard,
  onTransition,
  hasPendingTransition,
  onReactivate,
  hasPendingReactivation
) {
  if (user.status === 'pending') {
    return [
      { label: 'View Request', onClick: () => onViewRequest(user.id) },
      { label: 'View Details', onClick: () => onViewDetails(user) },
    ];
  }

  if (user.status === 'active') {
    const items = [{ label: 'View Details', onClick: () => onViewDetails(user) }];

    // Already has an offboarding request awaiting approval - offer to view
    // it instead of letting the admin submit a second one.
    if (isPendingOffboard) {
      items.push({ label: 'View Request', onClick: () => onViewRequest(user.id) });
      return items;
    }

    items.push({ label: 'Submit Offboard Request', onClick: () => onSubmitOffboard(user.id) });

    // A user can't be transitioned twice at once, or transitioned while an
    // offboarding request is pending (handled above).
    if (hasPendingTransition) {
      items.push({ label: 'View Transition Request', onClick: () => onViewRequest(user.id) });
    } else {
      items.push({ label: '🔄 Transition User', onClick: () => onTransition(user) });
    }
    return items;
  }

  // inactive
  const items = [{ label: 'View Details', onClick: () => onViewDetails(user) }];
  if (hasPendingReactivation) {
    items.push({ label: 'View Reactivation Request', onClick: () => onViewRequest(user.id) });
  } else {
    items.push({ label: '🔁 Reactivation Request', onClick: () => onReactivate(user) });
  }
  return items;
}

/**
 * UserActionMenu Component
 *
 * 3-dot dropdown menu for user actions. Actions vary by user status:
 * - Pending: View Request (→ RequestDetails) + View Details (→ Modal)
 * - Active: View Details (→ Modal) + Submit Offboard Request (→ OffboardingForm)
 * - Inactive: View Details only (→ Modal)
 *
 * @component
 * @param {Object} user - User object
 * @param {Function} onViewDetails - Open UserDetailsModal with user data
 * @param {Function} onViewRequest - Navigate to RequestDetails with request ID
 * @param {Function} onSubmitOffboard - Navigate to OffboardingForm with user ID
 * @param {Function} onTransition - Open TransitionForm for this user
 * @param {boolean} hasPendingTransition - True when this active user already has a transition request awaiting completion
 * @param {Function} onReactivate - Open ReactivationForm for this inactive user
 * @param {boolean} hasPendingReactivation - True when this inactive user already has a reactivation request awaiting completion
 * @returns {React.ReactElement} Action menu
 */
function UserActionMenu({
  user,
  isPendingOffboard,
  onViewDetails,
  onViewRequest,
  onSubmitOffboard,
  onTransition,
  hasPendingTransition,
  onReactivate,
  hasPendingReactivation,
}) {
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

  const menuItems = getMenuItems(
    user,
    isPendingOffboard,
    onViewDetails,
    onViewRequest,
    onSubmitOffboard,
    onTransition,
    hasPendingTransition,
    onReactivate,
    hasPendingReactivation
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
  isPendingOffboard: PropTypes.bool,
  onViewDetails: PropTypes.func.isRequired,
  onViewRequest: PropTypes.func.isRequired,
  onSubmitOffboard: PropTypes.func.isRequired,
  onTransition: PropTypes.func.isRequired,
  hasPendingTransition: PropTypes.bool,
  onReactivate: PropTypes.func.isRequired,
  hasPendingReactivation: PropTypes.bool,
};

export default UserActionMenu;