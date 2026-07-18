import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestsFilters from './RequestsFilters';
import RequestsTable from './RequestsTable';
import { MOCK_REQUESTS } from '../../mockData';

/**
 * Filters a list of requests by search term (name or email, case-insensitive)
 * and status ("all" bypasses the status filter). Both filters apply together.
 *
 * @param {Array} requests - Requests to filter
 * @param {string} searchTerm - Search text to match against name or email
 * @param {string} statusFilter - Status to filter by, or "all"
 * @returns {Array} The filtered requests
 */
export function filterRequests(requests, searchTerm, statusFilter) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesSearch =
      normalizedSearch === '' ||
      request.name.toLowerCase().includes(normalizedSearch) ||
      request.email.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

/**
 * RequestsList Component
 *
 * Main container for displaying onboarding/offboarding requests.
 * Manages search and filtering state.
 *
 * @component
 * @returns {React.ReactElement} RequestsList component
 */
function RequestsList() {
  const [requestsList] = useState(MOCK_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const filteredRequests = useMemo(
    () => filterRequests(requestsList, searchTerm, statusFilter),
    [requestsList, searchTerm, statusFilter]
  );

  const handleViewRequest = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-white">Requests</h1>
        <p className="mt-1 text-sm text-gray-300">
          Review and manage onboarding and offboarding requests.
        </p>
      </header>

      <div className="mb-6">
        <RequestsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      <RequestsTable requests={filteredRequests} onViewRequest={handleViewRequest} />
    </div>
  );
}

export default RequestsList;
