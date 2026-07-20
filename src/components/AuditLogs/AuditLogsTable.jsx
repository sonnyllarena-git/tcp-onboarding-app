import React, { useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_BADGE_STYLES = {
  SUCCESS: 'bg-[#48bb78] text-[#1a365d]',
  FAILED: 'bg-[#f56565] text-white',
};

const STATUS_ICONS = {
  SUCCESS: '✅',
  FAILED: '❌',
};

const DETAILS_PREVIEW_LENGTH = 60;

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
 * Data grid of audit log entries. Columns other than Details can be
 * hidden via `visibleColumns`; clicking a row expands it in place to show
 * every field (including error/Jira/platform detail when present) rather
 * than cramming all of that into the row itself.
 *
 * @component
 * @param {Array} logs - Audit log entries to display (already filtered/paginated)
 * @param {Object} [visibleColumns] - Which optional columns to show (timestamp/userEmail/action/status/ipAddress)
 * @returns {React.ReactElement} AuditLogsTable component
 */
function AuditLogsTable({ logs, visibleColumns = {} }) {
  const [expandedId, setExpandedId] = useState(null);
  const cols = {
    timestamp: true,
    userEmail: true,
    action: true,
    status: true,
    ipAddress: true,
    ...visibleColumns,
  };
  const columnCount = Object.values(cols).filter(Boolean).length + 1; // +1 for Details, always shown

  return (
    <div className="max-h-[600px] overflow-auto rounded-xl border border-[#d4a574]/30 shadow-lg">
      <table className="w-full min-w-[900px] table-fixed border-collapse bg-[#1a365d]">
        <thead className="sticky top-0 z-10 bg-[#0d1b30]">
          <tr>
            {cols.timestamp && (
              <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Timestamp
              </th>
            )}
            {cols.userEmail && (
              <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                User Email
              </th>
            )}
            {cols.action && (
              <th scope="col" className="w-[16%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Action
              </th>
            )}
            <th scope="col" className="w-[24%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              Details
            </th>
            {cols.status && (
              <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Status
              </th>
            )}
            {cols.ipAddress && (
              <th scope="col" className="w-[13%] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                IP Address
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-10 text-center text-sm">
                <p className="font-semibold text-white">No audit logs found</p>
                <p className="mt-1 text-gray-400">Try adjusting your filters.</p>
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const detailsPreview =
                log.details && log.details.length > DETAILS_PREVIEW_LENGTH
                  ? `${log.details.slice(0, DETAILS_PREVIEW_LENGTH)}...`
                  : log.details;

              return (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="cursor-pointer border-b border-[#d4a574]/10 transition-colors hover:bg-white/5"
                  >
                    {cols.timestamp && (
                      <td className="px-4 py-3 text-xs text-gray-200">{formatLogTimestamp(log.timestampIso)}</td>
                    )}
                    {cols.userEmail && <td className="px-4 py-3 text-xs text-gray-300">{log.userEmail}</td>}
                    {cols.action && <td className="px-4 py-3 text-xs font-semibold text-white">{log.action}</td>}
                    <td className="px-4 py-3 text-xs text-gray-300">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{detailsPreview || '-'}</span>
                        <span aria-hidden="true" className="shrink-0 text-[#d4a574]">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </td>
                    {cols.status && (
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLES[log.status]}`}
                        >
                          <span aria-hidden="true">{STATUS_ICONS[log.status]}</span>
                          <span>{log.status}</span>
                        </span>
                      </td>
                    )}
                    {cols.ipAddress && <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress}</td>}
                  </tr>

                  {isExpanded && (
                    <tr className="border-b border-[#d4a574]/20 bg-[#d4a574]/5">
                      <td colSpan={columnCount} className="px-4 py-4">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="font-bold text-[#d4a574]">Action</dt>
                            <dd className="text-gray-200">{log.action}</dd>
                          </div>
                          <div>
                            <dt className="font-bold text-[#d4a574]">Timestamp</dt>
                            <dd className="text-gray-200">{formatLogTimestamp(log.timestampIso)}</dd>
                          </div>
                          <div>
                            <dt className="font-bold text-[#d4a574]">User Email</dt>
                            <dd className="text-gray-200">{log.userEmail}</dd>
                          </div>
                          <div>
                            <dt className="font-bold text-[#d4a574]">User Name</dt>
                            <dd className="text-gray-200">{log.userName || '-'}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="font-bold text-[#d4a574]">Details</dt>
                            <dd className="whitespace-pre-wrap text-gray-200">{log.details || '-'}</dd>
                          </div>
                          {log.errorMessage && (
                            <div className="sm:col-span-2 rounded border-l-2 border-red-400 bg-red-400/10 p-2">
                              <dt className="font-bold text-red-300">Error Message</dt>
                              <dd className="text-red-200">{log.errorMessage}</dd>
                            </div>
                          )}
                          {log.jiraTicketId && (
                            <div className="rounded border-l-2 border-purple-400 bg-purple-400/10 p-2">
                              <dt className="font-bold text-purple-300">Jira Ticket</dt>
                              <dd className="text-purple-200">{log.jiraTicketId}</dd>
                            </div>
                          )}
                          {log.platformName && (
                            <div>
                              <dt className="font-bold text-[#d4a574]">Platform</dt>
                              <dd className="text-gray-200">{log.platformName}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="font-bold text-[#d4a574]">IP Address</dt>
                            <dd className="text-gray-200">{log.ipAddress}</dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
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
      userName: PropTypes.string,
      action: PropTypes.string.isRequired,
      details: PropTypes.string.isRequired,
      errorMessage: PropTypes.string,
      jiraTicketId: PropTypes.string,
      platformName: PropTypes.string,
      status: PropTypes.oneOf(['SUCCESS', 'FAILED']).isRequired,
      ipAddress: PropTypes.string.isRequired,
    })
  ).isRequired,
  visibleColumns: PropTypes.shape({
    timestamp: PropTypes.bool,
    userEmail: PropTypes.bool,
    action: PropTypes.bool,
    status: PropTypes.bool,
    ipAddress: PropTypes.bool,
  }),
};

export default AuditLogsTable;
