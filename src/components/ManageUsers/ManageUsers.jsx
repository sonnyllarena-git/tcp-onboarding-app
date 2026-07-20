import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UsersFilters from './UsersFilters';
import UsersTable from './UsersTable';
import UserDetailsModal from './UserDetailsModal';
import { getAllUsers, getAllRequests, getPendingRequestByEmail } from '../../mockData';
import { useAuth } from '../../hooks/useAuth';
import { recordAuditLog } from '../AuditLogs';

const ITEMS_PER_PAGE = 10;

/**
 * Filters a list of users by search term (name, email, or work email,
 * case-insensitive) and status ("all" bypasses the status filter). Both
 * filters apply together.
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
      user.email.toLowerCase().includes(normalizedSearch) ||
      (user.workEmail && user.workEmail.toLowerCase().includes(normalizedSearch));

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

const STATUS_SORT_ORDER = { active: 0, pending: 1, inactive: 2 };

/**
 * Sorts users active-first, then pending, then inactive; alphabetically
 * by name within each status. Applied after filtering, so it holds
 * regardless of which search/status filter is active.
 *
 * @param {Array} users - Users to sort
 * @returns {Array} A new, sorted array (input is not mutated)
 */
export function sortUsers(users) {
  return [...users].sort((a, b) => {
    const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return (a.name || '').localeCompare(b.name || '');
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
 * Finds the id of the PENDING request (onboarding OR offboarding)
 * matching a user's email. Filtering by status matters once a user can
 * have more than one request over time (e.g. a completed onboarding
 * request plus a new pending offboarding request) - without it, this
 * could resolve to the wrong (already-finished) request.
 *
 * @param {string} email - User email
 * @returns {number|null} Request id, or null if no pending request matches
 */
export function getRequestIdByEmail(email) {
  const request = getPendingRequestByEmail(email);
  return request ? request.id : null;
}

/**
 * ManageUsers Component
 *
 * Displays list of all users with filtering and pagination.
 * Allows viewing user details, jumping to a pending user's onboarding
 * request, and initiating offboarding for an active user.
 *
 * @component
 * @returns {React.ReactElement} ManageUsers component
 */
function ManageUsers() {
  const navigate = useNavigate();
  const loggedInUser = useAuth();
  const [users] = useState(getAllUsers);
  const [pendingOffboardEmails] = useState(
    () =>
      new Set(
        getAllRequests()
          .filter((r) => r.type === 'Offboarding' && r.status === 'pending')
          .map((r) => r.email.toLowerCase())
      )
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [welcomeEmailUser, setWelcomeEmailUser] = useState(null);

  const filteredUsers = useMemo(
    () => sortUsers(filterUsers(users, searchTerm, statusFilter)),
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

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  /** Navigates to the pending request matching this user's email. */
  const handleViewRequest = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return;
    }
    const requestId = getRequestIdByEmail(user.email);
    if (requestId) {
      navigate(`/requests/${requestId}`, { state: { fromManageUsers: true } });
    }
  };

  /** Navigates to the offboarding wizard, pre-filled via the userId route param. */
  const handleSubmitOffboard = (userId) => {
    navigate(`/offboard/${userId}`);
  };

  /** Navigates directly to a known request id (used by UserDetailsModal). */
  const handleViewRequestById = (requestId) => {
    setShowUserModal(false);
    navigate(`/requests/${requestId}`, { state: { fromManageUsers: true } });
  };

  /** Sends (simulated) the welcome email to an active user's email and logs it. */
  const handleSendWelcomeEmail = (user) => {
    recordAuditLog({
      userEmail: loggedInUser?.email,
      userName: loggedInUser?.name,
      department: loggedInUser?.department,
      action: 'WELCOME_EMAIL_SENT',
      details: `Welcome email sent to ${user.email}`,
    });
    setWelcomeEmailUser(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
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
        pendingOffboardEmails={pendingOffboardEmails}
        onViewDetails={handleViewDetails}
        onViewRequest={handleViewRequest}
        onSubmitOffboard={handleSubmitOffboard}
        onSendWelcomeEmail={handleSendWelcomeEmail}
      />

      {welcomeEmailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setWelcomeEmailUser(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 text-center shadow-2xl"
          >
            <div className="mb-2 text-4xl" aria-hidden="true">📧</div>
            <h2 className="mb-3 text-lg font-bold text-white">Welcome Email Sent</h2>
            <p className="mb-4 text-sm text-gray-300">
              A welcome email has been sent to <strong>{welcomeEmailUser.email}</strong>
              {welcomeEmailUser.workEmail && (
                <> with their work email, <strong>{welcomeEmailUser.workEmail}</strong>.</>
              )}
            </p>
            <button
              type="button"
              onClick={() => setWelcomeEmailUser(null)}
              className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <UserDetailsModal
        isOpen={showUserModal}
        user={selectedUser}
        onClose={handleCloseModal}
        onViewRequest={handleViewRequestById}
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
