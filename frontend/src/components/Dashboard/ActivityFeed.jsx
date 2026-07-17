import React from 'react';
import PropTypes from 'prop-types';

const STATUS_DOT_CLASSES = {
  completed: 'bg-[#48bb78]',
  pending: 'bg-[#f6ad55]',
  failed: 'bg-[#f56565]',
};

const STATUS_LABELS = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

/**
 * Formats a timestamp as a relative "time ago" string.
 *
 * @param {number|string|Date} timestamp - The moment to compare against now
 * @returns {string} Human-readable relative time, e.g. "2 hours ago"
 */
export function formatTime(timestamp) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

/**
 * ActivityFeed Component
 *
 * Displays recent onboarding/offboarding activities.
 *
 * @component
 * @param {Array<{timestamp: number, user: string, action: string, status: 'completed'|'pending'|'failed'}>} activities - Activity entries
 * @returns {React.ReactElement} ActivityFeed component
 */
function ActivityFeed({ activities }) {
  return (
    <div className="rounded-xl bg-white shadow-md">
      <h2 className="border-b border-gray-100 px-4 py-3 text-base font-bold text-[#1a365d]">
        Recent Activity
      </h2>
      {activities.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">No recent activity.</p>
      ) : (
        <ul className="max-h-[400px] overflow-y-auto" aria-label="Recent activity">
          {activities.map((activity, index) => (
            <li
              key={`${activity.user}-${activity.timestamp}`}
              className={`flex items-center justify-between gap-4 p-4 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#1a365d]">{activity.user}</p>
                <p className="text-sm text-gray-600">{activity.action}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASSES[activity.status]}`}
                    aria-hidden="true"
                  />
                  {STATUS_LABELS[activity.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.number.isRequired,
      user: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['completed', 'pending', 'failed']).isRequired,
    })
  ).isRequired,
};

export default ActivityFeed;
