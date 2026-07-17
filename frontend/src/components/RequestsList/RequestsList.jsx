import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestsFilters from './RequestsFilters';
import RequestsTable from './RequestsTable';

const MOCK_REQUESTS = [
  { id: 1, name: 'John Doe', email: 'john.doe@thecreditpros.com', type: 'Onboarding', status: 'completed', date: 'Jul 15, 2026' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@thecreditpros.com', type: 'Offboarding', status: 'completed', date: 'Jul 14, 2026' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@thecreditpros.com', type: 'Onboarding', status: 'in-progress', date: 'Jul 16, 2026' },
  { id: 4, name: 'Alice Brown', email: 'alice.brown@thecreditpros.com', type: 'Onboarding', status: 'completed', date: 'Jul 10, 2026' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie.wilson@thecreditpros.com', type: 'Offboarding', status: 'pending', date: 'Jul 17, 2026' },
  { id: 6, name: 'Emma Davis', email: 'emma.davis@thecreditpros.com', type: 'Onboarding', status: 'completed', date: 'Jul 8, 2026' },
  { id: 7, name: 'Michael Lee', email: 'michael.lee@thecreditpros.com', type: 'Onboarding', status: 'in-progress', date: 'Jul 16, 2026' },
  { id: 8, name: 'Sarah Miller', email: 'sarah.miller@thecreditpros.com', type: 'Offboarding', status: 'completed', date: 'Jul 12, 2026' },
  { id: 9, name: 'David Garcia', email: 'david.garcia@thecreditpros.com', type: 'Onboarding', status: 'pending', date: 'Jul 17, 2026' },
  { id: 10, name: 'Laura Martinez', email: 'laura.martinez@thecreditpros.com', type: 'Onboarding', status: 'in-progress', date: 'Jul 15, 2026' },
  { id: 11, name: 'Kevin Anderson', email: 'kevin.anderson@thecreditpros.com', type: 'Offboarding', status: 'pending', date: 'Jul 11, 2026' },
  { id: 12, name: 'Rachel Thomas', email: 'rachel.thomas@thecreditpros.com', type: 'Onboarding', status: 'completed', date: 'Jul 9, 2026' },
];

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
