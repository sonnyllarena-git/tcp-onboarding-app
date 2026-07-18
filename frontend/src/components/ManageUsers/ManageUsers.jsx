import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UsersFilters from './UsersFilters';
import UsersTable from './UsersTable';
import UserDetailsModal from './UserDetailsModal';
import { MOCK_USERS, MOCK_REQUESTS, getMockRequestByEmail } from '../../mockData';

const ITEMS_PER_PAGE = 10;

/**
 * Filters a list of users by search term (name or email, case-insensitive)
 * and status ("all" bypasses the status filter). Both filters apply together.
 *
 * @param {Array} users - Users to filter
 * @param {string} searchTerm - Search text to match against name or email
 * @param {string} statusFilter - Status to filter by, or "all"
 * @returns {Array} The filtered users
 */
export function filterUsers(users, searchTerm, statusFilter) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      normalizedSearch === '' ||
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

/**
 * Slices a list of users down to the requested page.
 *
 * @param {Array} users - Users to paginate (already filtered)
 * @param {number} currentPage - 1-indexed page number
 * @param {number} [itemsPerPage] - Users per page, defaults to 10
 * @returns {Array} The users for the requested page
 */
export function getPaginatedUsers(users, currentPage, itemsPerPage = ITEMS_PER_PAGE) {
  const start = (currentPage - 1) * itemsPerPage;
  return users.slice(start, start + itemsPerPage);
}

/**
 * Find request ID by user email
 * BUG #1 FIX: Look up pending request by email
 *
 * @param {string} email - User email
 * @returns {number|null} Request ID or null if not found
 */
function getRequestIdByEmail(email) {
  const request = getMockRequestByEmail(email);
  return request ? request.id : null;
}

/**
 * ManageUsers Component
 *
 * Displays list of all users with filtering and pagination.
 * Allows viewing user details and initiating offboarding.
 *
 * @component
 * @returns {React.ReactElement} ManageUsers component
 */
function ManageUsers() {
  const navigate = useNavigate();
  const [users] = useState(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null); // NEW - For modal
  const [showUserModal, setShowUserModal] = useState(false); // NEW - For modal

  const filteredUsers = useMemo(
    () => filterUsers(users, searchTerm, statusFilter),
    [users, searchTerm, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(
    () => getPaginatedUsers(filteredUsers, safePage, ITEMS_PER_PAGE),
    [filteredUsers, safePage]
  );

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  // BUG #2, #5 FIX: Open UserDetailsModal
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // NEW: Close modal
  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // BUG #1 FIX: Navigate to RequestDetails with request ID
  const handleViewPending = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const requestId = getRequestIdByEmail(user.email);
    if (requestId) {
      navigate(`/requests/${requestId}`);
    } else {
      console.warn(`No request found for user: ${user.email}`);
    }
  };

  // BUG #4 FIX: Navigate to OffboardingForm
  const handleOffboard = (userId) => {
    navigate(`/offboard/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-white">Manage Users</h1>
        <p className="mt-1 text-sm text-gray-300">
          View and manage all onboarded employees.
        </p>
      </header>

      <div className="mb-6">
        <UsersFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
        />
      </div>

      <UsersTable
        users={paginatedUsers}
        onViewDetails={handleViewDetails}
        onViewPending={handleViewPending}
        onOffboard={handleOffboard}
      />

      {/* User Details Modal - NEW */}
      <UserDetailsModal
        isOpen={showUserModal}
        user={selectedUser}
        onClose={handleCloseModal}
      />

      <nav
        aria-label="Pagination"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="text-gray-300">
          Page {safePage} of {totalPages} &middot; {filteredUsers.length} user
          {filteredUsers.length === 1 ? '' : 's'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={safePage === 1}
            className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage === 1}
            className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              aria-current={page === safePage ? 'page' : undefined}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] ${
                page === safePage
                  ? 'border-[#d4a574] bg-[#d4a574] text-[#1a365d]'
                  : 'border-[#1a365d] text-[#d4a574] hover:bg-white/5'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={safePage === totalPages}
            className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            Last
          </button>
        </div>
      </nav>
    </div>
  );
}

export default ManageUsers;