import React from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * UsersFilters Component
 *
 * Search and filter controls for users list.
 *
 * @component
 * @param {string} searchTerm - Current search term
 * @param {Function} onSearchChange - Callback when search changes
 * @param {string} statusFilter - Current status filter
 * @param {Function} onStatusChange - Callback when status changes
 * @returns {React.ReactElement} UsersFilters component
 */
function UsersFilters({ searchTerm, onSearchChange, statusFilter, onStatusChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <label htmlFor="users-search" className="sr-only">
          Search by name or email
        </label>
        <input
          id="users-search"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2 text-sm text-white placeholder-gray-400 transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
        />
      </div>

      <div className="sm:w-56">
        <label htmlFor="users-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="users-status-filter"
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

UsersFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default UsersFilters;
