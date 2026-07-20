import React from 'react';
import PropTypes from 'prop-types';

const INPUT_CLASSES =
  'w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2 text-sm text-white placeholder-gray-400 transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]';

/**
 * AuditLogsFilters Component
 *
 * Search box plus date range, action type, and status filters for the
 * audit log table, and a button to reset all of them. Filtering is
 * real-time (every change re-filters immediately), so there is no
 * separate "Search" button to trigger it.
 *
 * @component
 * @param {string} searchTerm - Current search term
 * @param {Function} onSearchChange - Callback when the search term changes
 * @param {Object} filters - Current filter values
 * @param {string} filters.requestId - Request id substring to match, or ""
 * @param {string} filters.userName - User name substring to match, or ""
 * @param {string} filters.dateFrom - "YYYY-MM-DD", or "" for no lower bound
 * @param {string} filters.dateTo - "YYYY-MM-DD", or "" for no upper bound
 * @param {string} filters.actionType - Selected action type, or "all"
 * @param {string} filters.status - Selected status, or "all"
 * @param {Function} onFiltersChange - Callback with the next filters object
 * @param {Function} onReset - Callback to reset search + all filters
 * @param {Array<string>} actionTypeOptions - Distinct action types to list
 * @returns {React.ReactElement} AuditLogsFilters component
 */
function AuditLogsFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onReset,
  actionTypeOptions,
}) {
  const handleFieldChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#d4a574]/30 bg-white/5 p-4">
      <div>
        <label htmlFor="audit-search" className="sr-only">
          Search by user email or action
        </label>
        <input
          id="audit-search"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by user email or action..."
          className={INPUT_CLASSES}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="audit-request-id" className="mb-1 block text-xs font-semibold text-gray-300">
            Request ID
          </label>
          <input
            id="audit-request-id"
            type="text"
            value={filters.requestId}
            onChange={(event) => handleFieldChange('requestId', event.target.value)}
            placeholder="e.g. 105"
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="audit-user-name" className="mb-1 block text-xs font-semibold text-gray-300">
            User Name
          </label>
          <input
            id="audit-user-name"
            type="text"
            value={filters.userName}
            onChange={(event) => handleFieldChange('userName', event.target.value)}
            placeholder="e.g. John Doe"
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="audit-date-from" className="mb-1 block text-xs font-semibold text-gray-300">
            From
          </label>
          <input
            id="audit-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => handleFieldChange('dateFrom', event.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="audit-date-to" className="mb-1 block text-xs font-semibold text-gray-300">
            To
          </label>
          <input
            id="audit-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => handleFieldChange('dateTo', event.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="audit-action-type" className="mb-1 block text-xs font-semibold text-gray-300">
            Action Type
          </label>
          <select
            id="audit-action-type"
            value={filters.actionType}
            onChange={(event) => handleFieldChange('actionType', event.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="all">All</option>
            {actionTypeOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="audit-status" className="mb-1 block text-xs font-semibold text-gray-300">
            Status
          </label>
          <select
            id="audit-status"
            value={filters.status}
            onChange={(event) => handleFieldChange('status', event.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="all">All</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

AuditLogsFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    requestId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    dateFrom: PropTypes.string.isRequired,
    dateTo: PropTypes.string.isRequired,
    actionType: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  actionTypeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AuditLogsFilters;
