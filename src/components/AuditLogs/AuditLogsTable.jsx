import React from 'react';
import PropTypes from 'prop-types';

const STATUS_BADGE_STYLES = {
  SUCCESS: 'bg-[#48bb78] text-[#1a365d]',
  FAILED: 'bg-[#f56565] text-white',
};

const STATUS_ICONS = {
  SUCCESS: '✅',
  FAILED: '❌',
};

/**
 * Formats an ISO datetime string as "Jul 18, 02:15 AM".
 * Falls back to the raw value if it can't be parsed.
 *
 * @param {string} isoDateTime - ISO 8601 datetime string
 * @returns {string} Formatted date and time, or the original value
 */
export function formatLogTimestamp(isoDateTime) {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime;
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * AuditLogsTable Component
 *
 * Data grid of audit log entries: timestamp, user email, action, details,
 * status badge, and IP address. Header stays visible while scrolling
 * within the table's own scroll container.
 *
 * @component
 * @param {Array} logs - Audit log entries to display (already filtered/paginated)
 * @returns {React.ReactElement} AuditLogsTable component
 */
function AuditLogsTable({ logs }) {
  return (
    <div className="max-h-[600px] overflow-auto rounded-xl border border-[#d4a574]/30 shadow-lg">
      <table className="w-full min-w-[900px] table-fixed border-collapse bg-[#1a365d]">
        <thead className="sticky top-0 z-10 bg-[#0d1b30]">
          <tr>
            <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Timestamp
            </th>
            <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              User Email
            </th>
            <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Action
            </th>
            <th scope="col" className="w-[8%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Request
            </th>
            <th scope="col" className="w-[22%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Details
            </th>
            <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Status
            </th>
            <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              IP Address
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm">
                <p className="font-semibold text-white">No audit logs found</p>
                <p className="mt-1 text-gray-400">Try adjusting your filters.</p>
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-[#d4a574]/10 transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3 text-xs text-gray-200">{formatLogTimestamp(log.timestampIso)}</td>
                <td className="px-4 py-3 text-xs text-gray-300">{log.userEmail}</td>
                <td className="px-4 py-3 text-xs font-semibold text-white">{log.action}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {log.requestId != null ? <code className="rounded bg-black/30 px-1.5 py-0.5 text-[#d4a574]">{log.requestId}</code> : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">
                  <p>{log.details}</p>
                  {log.errorMessage && <p className="mt-1 text-red-300">❌ {log.errorMessage}</p>}
                  {log.jiraTicketId && <p className="mt-1 text-purple-300">🎫 {log.jiraTicketId}</p>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLES[log.status]}`}
                  >
                    <span aria-hidden="true">{STATUS_ICONS[log.status]}</span>
                    <span>{log.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

AuditLogsTable.propTypes = {
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      timestampIso: PropTypes.string.isRequired,
      userEmail: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired,
      requestId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      details: PropTypes.string.isRequired,
      errorMessage: PropTypes.string,
      jiraTicketId: PropTypes.string,
      status: PropTypes.oneOf(['SUCCESS', 'FAILED']).isRequired,
      ipAddress: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default AuditLogsTable;
