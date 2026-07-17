import React from 'react';
import PropTypes from 'prop-types';
import UserActionMenu from './UserActionMenu';

const STATUS_BADGE_STYLES = {
  pending: 'bg-[#4299e1] text-white',
  active: 'bg-[#48bb78] text-[#1a365d]',
  inactive: 'bg-[#a0aec0] text-[#1a365d]',
};

const STATUS_LABELS = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
};

/**
 * Returns the Tailwind classes for a status badge.
 * Falls back to the "inactive" variant for an unrecognized status.
 *
 * @param {string} status - User status (pending/active/inactive)
 * @returns {string} Tailwind background/text classes for the badge
 */
export function getStatusStyle(status) {
  return STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.inactive;
}

/**
 * UsersTable Component
 *
 * Table display of users with all details.
 * Shows: Name, Email, Status, Date Onboarded, Date Offboarded, Actions.
 *
 * @component
 * @param {Array} users - Array of user objects
 * @param {Function} onViewDetails - Callback to view a user's details
 * @param {Function} onViewPending - Callback to view a pending user's platform checklist
 * @param {Function} onOffboard - Callback to offboard an active user
 * @returns {React.ReactElement} UsersTable component
 */
function UsersTable({ users, onViewDetails, onViewPending, onOffboard }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#d4a574]/30 shadow-lg">
      <table className="w-full min-w-[900px] table-fixed border-collapse bg-[#1a365d]">
        <thead className="bg-[#0d1b30]">
          <tr>
            <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Name
            </th>
            <th scope="col" className="w-[25%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Email
            </th>
            <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Status
            </th>
            <th scope="col" className="w-[18%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Date Onboarded
            </th>
            <th scope="col" className="w-[18%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Date Offboarded
            </th>
            <th scope="col" className="w-[7%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-300">
                No matching users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#d4a574]/10 transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3 text-sm font-medium text-white">{user.name}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      user.status
                    )}`}
                  >
                    {STATUS_LABELS[user.status] || user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-200">{user.dateOnboarded}</td>
                <td className="px-4 py-3 text-sm text-gray-200">{user.dateOffboarded || 'N/A'}</td>
                <td className="px-4 py-3">
                  <UserActionMenu
                    user={user}
                    onViewDetails={onViewDetails}
                    onViewPending={onViewPending}
                    onOffboard={onOffboard}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

UsersTable.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'active', 'inactive']).isRequired,
      dateOnboarded: PropTypes.string.isRequired,
      dateOffboarded: PropTypes.string,
    })
  ).isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onViewPending: PropTypes.func.isRequired,
  onOffboard: PropTypes.func.isRequired,
};

export default UsersTable;
