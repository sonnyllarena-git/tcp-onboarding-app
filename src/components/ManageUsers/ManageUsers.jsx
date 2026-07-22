import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UsersFilters from './UsersFilters';
import UsersTable from './UsersTable';
import UserDetailsModal from './UserDetailsModal';
import TransitionForm from '../TransitionForm/TransitionForm';
import ReactivationForm from '../ReactivationForm/ReactivationForm';
import { getAllRequests, getPendingRequestByEmail } from '../../mockData';
import * as userService from '../../services/userService';
import * as requestService from '../../services/requestService';

const ITEMS_PER_PAGE = 10;

/**
 * Filters a list of users by search term (name or work email,
 * case-insensitive - the user's personal email is intentionally not
 * displayed or searchable here) and status ("all" bypasses the status
 * filter). Both filters apply together.
 *
 * @param {Array} users - Users to filter
 * @param {string} searchTerm - Search text to match against name or work email
 * @param {string} statusFilter - Status to filter by, or "all"
 * @returns {Array} The filtered users
 */
export function filterUsers(users, searchTerm, statusFilter) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      normalizedSearch === '' ||
      user.name.toLowerCase().includes(normalizedSearch) ||
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
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [realPendingRequests, setRealPendingRequests] = useState([]);
  const [version, setVersion] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setLoadError(null);
    try {
      const [fetchedUsers, pending] = await Promise.all([
        userService.getManagedUsers(),
        requestService.listRequests({ status: 'PENDING' }),
      ]);
      setUsers(fetchedUsers);
      setRealPendingRequests(pending);
    } catch (error) {
      console.error('[ManageUsers] failed to load users:', error.message);
      setLoadError(error.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, version]);

  const pendingOffboardEmails = useMemo(
    () => new Set(realPendingRequests.filter((r) => r.type === 'Offboarding').map((r) => r.email.toLowerCase())),
    [realPendingRequests]
  );
  const pendingTransitionEmails = useMemo(
    () =>
      new Set(
        getAllRequests()
          .filter((r) => r.type === 'Transition' && r.status === 'pending')
          .map((r) => r.email.toLowerCase())
      ),
    [version]
  );
  const pendingReactivationEmails = useMemo(
    () =>
      new Set(
        getAllRequests()
          .filter((r) => r.type === 'Reactivation' && r.status === 'pending')
          .map((r) => r.email.toLowerCase())
      ),
    [version]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [transitionUser, setTransitionUser] = useState(null);
  const [reactivationUser, setReactivationUser] = useState(null);

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

  /**
   * Navigates to the pending request for this user - checks the real
   * backend (Onboarding/Offboarding) first, then falls back to the
   * local mock store (Transition/Reactivation).
   */
  const handleViewRequest = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return;
    }
    const realMatch = realPendingRequests.find((r) => r.userId === userId);
    if (realMatch) {
      navigate(`/requests/${realMatch.id}`, { state: { fromManageUsers: true } });
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

  const handleOpenTransition = (user) => {
    setTransitionUser(user);
  };

  const handleCloseTransition = () => {
    setTransitionUser(null);
  };

  /** A submitted transition doesn't change the user list itself (it only
   * takes effect once completed from RequestDetails) - bumping `version`
   * just re-derives pendingTransitionEmails so the badge shows immediately.
   * Deliberately does NOT close the form (no setTransitionUser(null) here) -
   * TransitionForm stays mounted so its own success modal can render;
   * closing it prematurely would unmount the form (and that modal with
   * it) the instant the request is created. The form closes only once
   * the admin dismisses that modal, via handleCloseTransition. */
  const handleTransitionSuccess = () => {
    setVersion((v) => v + 1);
  };

  const handleOpenReactivation = (user) => {
    setReactivationUser(user);
  };

  const handleCloseReactivation = () => {
    setReactivationUser(null);
  };

  /** Same reasoning as handleTransitionSuccess: refresh the derived
   * pendingReactivationEmails set only - do NOT close the form here, or
   * ReactivationForm's own success modal never gets a chance to render. */
  const handleReactivationSuccess = () => {
    setVersion((v) => v + 1);
  };

  if (loadingUsers) {
    return <div className="p-6 text-white">Loading users...</div>;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-[#f56565]/40 bg-[#f56565]/10 p-6 text-sm text-[#f56565]">{loadError}</div>
      </div>
    );
  }

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
        pendingTransitionEmails={pendingTransitionEmails}
        pendingReactivationEmails={pendingReactivationEmails}
        onViewDetails={handleViewDetails}
        onViewRequest={handleViewRequest}
        onSubmitOffboard={handleSubmitOffboard}
        onTransition={handleOpenTransition}
        onReactivate={handleOpenReactivation}
      />

      <UserDetailsModal
        isOpen={showUserModal}
        user={selectedUser}
        onClose={handleCloseModal}
        onViewRequest={handleViewRequestById}
        onUserUpdated={loadUsers}
      />

      {transitionUser && (
        <TransitionForm user={transitionUser} onClose={handleCloseTransition} onSuccess={handleTransitionSuccess} />
      )}

      {reactivationUser && (
        <ReactivationForm
          user={reactivationUser}
          onClose={handleCloseReactivation}
          onSuccess={handleReactivationSuccess}
        />
      )}

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
