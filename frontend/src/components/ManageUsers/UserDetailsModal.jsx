import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const STATUS_INDICATORS = {
  active: { emoji: '🟢', label: 'Active' },
  pending: { emoji: '🟡', label: 'Pending' },
  inactive: { emoji: '⚫', label: 'Inactive' },
};

/**
 * Formats a date-like value into a short "Mon D, YYYY" string.
 * Falls back to "N/A" for a missing value and to the original value
 * if it can't be parsed as a date.
 *
 * @param {string} [date] - Date value to format
 * @returns {string} Formatted date, "N/A", or the original value
 */
function formatDate(date) {
  if (!date) {
    return 'N/A';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * UserDetailsModal Component
 *
 * Modal popup showing a user's full profile: status, onboarding/offboarding
 * dates, and assigned platforms. Opened from ManageUsers' "View User Details"
 * action; stays on the ManageUsers page rather than navigating away.
 *
 * @component
 * @param {boolean} isOpen - Show/hide the modal
 * @param {Object} [user] - User whose details to display
 * @param {number|string} user.id - User id
 * @param {string} user.name - User's display name
 * @param {string} user.email - User's email address
 * @param {'active'|'pending'|'inactive'} user.status - Current status
 * @param {string} user.dateOnboarded - Onboarding date
 * @param {string} [user.dateOffboarded] - Offboarding date, if any
 * @param {Array<string>} [user.platforms] - Platforms assigned to the user
 * @param {Function} onClose - Callback when the modal is closed
 * @returns {React.ReactElement|null} UserDetailsModal component
 */
function UserDetailsModal({ isOpen, user, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) {
    return null;
  }

  const statusInfo = STATUS_INDICATORS[user.status] || STATUS_INDICATORS.inactive;
  const platforms = user.platforms || [];

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-modal-title"
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[#1a365d] shadow-2xl transition-all duration-200 ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d4a574]/20 bg-[#1a365d] px-6 py-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0d1b30] text-3xl"
              aria-hidden="true"
            >
              👤
            </span>
            <div>
              <h2 id="user-details-modal-title" className="text-xl font-bold text-white">
                {user.name}
              </h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-xl leading-none text-gray-400 transition-colors hover:bg-white/10 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            <span aria-hidden="true">&#10005;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
              Basic Information
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Status</dt>
                <dd className="flex items-center gap-2 font-medium text-white">
                  <span aria-hidden="true">{statusInfo.emoji}</span>
                  {statusInfo.label}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Date Onboarded</dt>
                <dd className="font-medium text-white">{formatDate(user.dateOnboarded)}</dd>
              </div>
              {user.status === 'inactive' && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-400">Date Offboarded</dt>
                  <dd className="font-medium text-white">{formatDate(user.dateOffboarded)}</dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
              Platforms Assigned
            </h3>
            {platforms.length === 0 ? (
              <p className="text-sm text-gray-400">No platforms assigned.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {platforms.map((platform) => (
                  <li
                    key={platform}
                    className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <span aria-hidden="true" className="text-[#48bb78]">
                      &#9745;
                    </span>
                    {platform}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="border-t border-[#d4a574]/20 px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

UserDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    email: PropTypes.string,
    status: PropTypes.oneOf(['active', 'pending', 'inactive']),
    dateOnboarded: PropTypes.string,
    dateOffboarded: PropTypes.string,
    platforms: PropTypes.arrayOf(PropTypes.string),
  }),
  onClose: PropTypes.func.isRequired,
};

export default UserDetailsModal;
