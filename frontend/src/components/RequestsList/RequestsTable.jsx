import React from 'react';
import PropTypes from 'prop-types';

const STATUS_STYLES = {
  completed: 'bg-[#48bb78] text-[#1a365d]',
  'in-progress': 'bg-[#f6ad55] text-[#1a365d]',
  pending: 'bg-[#4299e1] text-white',
};

const STATUS_LABELS = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  pending: 'Pending',
};

/**
 * Returns the Tailwind classes for a status badge.
 * Falls back to the "pending" variant for an unrecognized status.
 *
 * @param {string} status - Request status (completed/in-progress/pending)
 * @returns {string} Tailwind background/text classes for the badge
 */
export function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.pending;
}

/**
 * RequestsTable Component
 *
 * Table display of requests with all details.
 * Shows: Name, Email, Type, Status, Date, Actions.
 *
 * @component
 * @param {Array} requests - Array of request objects
 * @param {Function} onViewRequest - Callback when View button clicked
 * @returns {React.ReactElement} RequestsTable component
 */
function RequestsTable({ requests, onViewRequest }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#d4a574]/30 shadow-lg">
      <table className="w-full min-w-[880px] table-fixed border-collapse bg-[#1a365d]">
        <thead className="bg-[#0d1b30]">
          <tr>
            <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Employee Name
            </th>
            <th scope="col" className="w-[25%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Email Address
            </th>
            <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Request Type
            </th>
            <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Status
            </th>
            <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Date
            </th>
            <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-300">
                No matching requests found.
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr
                key={request.id}
                className="border-b border-[#d4a574]/10 transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3 text-sm font-medium text-white">{request.name}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{request.email}</td>
                <td className="px-4 py-3 text-sm text-gray-200">{request.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      request.status
                    )}`}
                  >
                    {STATUS_LABELS[request.status] || request.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-200">{request.date}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onViewRequest(request.id)}
                    aria-label={`View request for ${request.name}`}
                    className="rounded-md border border-[#d4a574] bg-[#0d1b30] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors duration-200 hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

RequestsTable.propTypes = {
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['completed', 'in-progress', 'pending']).isRequired,
      date: PropTypes.string.isRequired,
    })
  ).isRequired,
  onViewRequest: PropTypes.func.isRequired,
};

export default RequestsTable;
