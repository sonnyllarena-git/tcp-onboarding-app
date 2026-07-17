import React from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

/**
 * RequestsFilters Component
 *
 * Search and filter controls for requests list.
 *
 * @component
 * @param {string} searchTerm - Current search term
 * @param {Function} onSearchChange - Callback when search changes
 * @param {string} statusFilter - Current status filter
 * @param {Function} onStatusChange - Callback when status changes
 * @returns {React.ReactElement} RequestsFilters component
 */
function RequestsFilters({ searchTerm, onSearchChange, statusFilter, onStatusChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <label htmlFor="requests-search" className="sr-only">
          Search by name or email
        </label>
        <input
          id="requests-search"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2 text-sm text-white placeholder-gray-400 transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
        />
      </div>

      <div className="sm:w-56">
        <label htmlFor="requests-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="requests-status-filter"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2 text-sm text-white transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

RequestsFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default RequestsFilters;
