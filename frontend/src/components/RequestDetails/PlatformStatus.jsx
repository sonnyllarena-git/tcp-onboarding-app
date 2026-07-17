import React from 'react';
import PropTypes from 'prop-types';

const PLATFORM_ICONS = {
  completed: '✅',
  'in-progress': '⏰',
  pending: '⏳',
};

const PLATFORM_BADGE_STYLES = {
  completed: 'bg-[#48bb78] text-[#1a365d]',
  'in-progress': 'bg-[#f6ad55] text-[#1a365d]',
  pending: 'bg-[#4299e1] text-white',
};

const PLATFORM_STATUS_LABELS = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  pending: 'Pending',
};

/**
 * Returns the icon for a platform sync status.
 * Falls back to the "pending" icon for an unrecognized status.
 *
 * @param {string} status - Platform status (completed/in-progress/pending)
 * @returns {string} Icon representing the status
 */
export function getPlatformIcon(status) {
  return PLATFORM_ICONS[status] || PLATFORM_ICONS.pending;
}

/**
 * PlatformStatus Component
 *
 * Shows sync status for all platforms.
 *
 * @component
 * @param {Array<{name: string, status: string}>} platforms - Array of platform objects
 * @returns {React.ReactElement} PlatformStatus component
 */
function PlatformStatus({ platforms }) {
  return (
    <section className="rounded-lg border border-[#d4a574]/20 p-4">
      <h2 className="mb-3 text-lg font-bold text-[#d4a574]">Platform Sync Status</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {platforms.map((platform) => (
          <li
            key={platform.name}
            className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <span aria-hidden="true">{getPlatformIcon(platform.status)}</span>
              {platform.name}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                PLATFORM_BADGE_STYLES[platform.status] || PLATFORM_BADGE_STYLES.pending
              }`}
            >
              {PLATFORM_STATUS_LABELS[platform.status] || platform.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

PlatformStatus.propTypes = {
  platforms: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['completed', 'in-progress', 'pending']).isRequired,
    })
  ).isRequired,
};

export default PlatformStatus;
