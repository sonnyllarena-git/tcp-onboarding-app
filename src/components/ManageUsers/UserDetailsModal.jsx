import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getPendingRequestByEmail } from '../../mockData';
import { listRequests } from '../../services/requestService';
import { updateUser } from '../../services/userService';
import { DEPARTMENTS } from '../../data/formOptions';
import EmployeeHistoryModal from './EmployeeHistoryModal';

const STATUS_INDICATORS = {
  active: { emoji: '🟢', label: 'Active' },
  pending: { emoji: '🟡', label: 'Pending' },
  inactive: { emoji: '⚫', label: 'Inactive' },
};

const NAME_PATTERN = /^[A-Za-z]{2,50}$/;

function buildEditFormData(user) {
  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    displayName: user.displayName || user.name || '',
    displayNameEdited: true, // editing an EXISTING user - don't clobber a deliberately different display name
    jobTitle: user.jobTitle || '',
    department: user.department || '',
  };
}

function validateEditForm(form) {
  const errors = {};
  if (!NAME_PATTERN.test(form.firstName.trim())) errors.firstName = 'First name must be 2-50 letters, no numbers.';
  if (!NAME_PATTERN.test(form.lastName.trim())) errors.lastName = 'Last name must be 2-50 letters, no numbers.';
  if (!form.displayName.trim()) errors.displayName = 'Display name is required.';
  else if (form.displayName.length > 100) errors.displayName = 'Display name must be 100 characters or fewer.';
  if (form.jobTitle.length > 100) errors.jobTitle = 'Job title must be 100 characters or fewer.';
  return errors;
}

/**
 * Formats a date-like value into a short "Mon D, YYYY" string.
 * Falls back to "N/A" for a missing value and to the original value
 * if it can't be parsed as a date.
 *
 * @param {string} [date] - Date value to format
 * @returns {string} Formatted date, "N/A", or the original value
 */
function formatDate(date) {
  if (!date) {
    return 'N/A';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * UserDetailsModal Component
 *
 * Modal popup showing a user's full profile: status, onboarding/offboarding
 * dates, and assigned platforms. Opened from ManageUsers' "View User Details"
 * action; stays on the ManageUsers page rather than navigating away.
 *
 * @component
 * @param {boolean} isOpen - Show/hide the modal
 * @param {Object} [user] - User whose details to display
 * @param {number|string} user.id - User id
 * @param {string} user.name - User's display name
 * @param {string} user.email - User's email address
 * @param {'active'|'pending'|'inactive'} user.status - Current status
 * @param {string} [user.department] - Department the user belongs to
 * @param {string} [user.manager] - User's manager, or null/absent if none on file
 * @param {string} user.dateOnboarded - Onboarding date
 * @param {string} [user.dateOffboarded] - Offboarding date, if any
 * @param {Array<string>} [user.platforms] - Platforms assigned to the user
 * @param {Function} onClose - Callback when the modal is closed
 * @returns {React.ReactElement|null} UserDetailsModal component
 */
function UserDetailsModal({ isOpen, user, onClose, onViewRequest, onUserUpdated }) {
  const [visible, setVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      setShowHistory(false);
      setIsEditing(false);
      setSaveError(null);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Checks the real backend (Onboarding/Offboarding) first, falling
  // back to the local mock store (Transition/Reactivation).
  useEffect(() => {
    if (!isOpen || !user) {
      setPendingRequest(null);
      return undefined;
    }
    let cancelled = false;
    async function loadPending() {
      try {
        const real = await listRequests({ userId: user.id, status: 'PENDING' });
        if (cancelled) return;
        setPendingRequest(real[0] || getPendingRequestByEmail(user.email));
      } catch (error) {
        console.error('[UserDetailsModal] failed to load pending request:', error.message);
        if (!cancelled) setPendingRequest(getPendingRequestByEmail(user.email));
      }
    }
    loadPending();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  const handleEditClick = () => {
    setEditFormData(buildEditFormData(user));
    setEditErrors({});
    setSaveError(null);
    setIsEditing(true);
  };

  // Per this feature's own spec: Cancel discards the in-progress edit
  // AND closes the modal entirely, rather than just returning to the
  // read-only view.
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
    setSaveError(null);
    onClose();
  };

  const handleFieldChange = (field, value) => {
    setEditFormData((prev) => {
      const next = { ...prev, [field]: value };
      if ((field === 'firstName' || field === 'lastName') && !prev.displayNameManuallyEdited) {
        next.displayName = `${next.firstName} ${next.lastName}`.trim();
      }
      return next;
    });
  };

  const handleDisplayNameChange = (value) => {
    setEditFormData((prev) => ({ ...prev, displayName: value, displayNameManuallyEdited: true }));
  };

  const hasChanges =
    editFormData &&
    (editFormData.firstName !== (user.firstName || '') ||
      editFormData.lastName !== (user.lastName || '') ||
      editFormData.displayName !== (user.displayName || user.name || '') ||
      editFormData.jobTitle !== (user.jobTitle || '') ||
      editFormData.department !== (user.department || ''));

  const handleSave = async () => {
    const errors = validateEditForm(editFormData);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateUser(user.id, {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        displayName: editFormData.displayName.trim(),
        jobTitle: editFormData.jobTitle.trim(),
        department: editFormData.department,
      });
      if (onUserUpdated) onUserUpdated();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('[UserDetailsModal] save failed:', error.message);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) {
    return null;
  }

  const statusInfo = STATUS_INDICATORS[user.status] || STATUS_INDICATORS.inactive;
  const platforms = user.platforms || [];

  return (
    <>
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-modal-title"
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[#1a365d] shadow-2xl transition-all duration-200 ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d4a574]/20 bg-[#1a365d] px-6 py-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0d1b30] text-3xl"
              aria-hidden="true"
            >
              👤
            </span>
            <div>
              <h2 id="user-details-modal-title" className="text-xl font-bold text-white">
                {user.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-lg border border-[#d4a574]/40 px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/10"
              >
                ✏️ Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-xl leading-none text-gray-400 transition-colors hover:bg-white/10 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
            >
              <span aria-hidden="true">&#10005;</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {saveError && (
            <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              <span>{saveError}</span>
              <button
                type="button"
                onClick={handleSave}
                className="shrink-0 rounded-lg border border-red-400 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-400/10"
              >
                Retry
              </button>
            </div>
          )}

          {isEditing && (
            <section className="mb-6 space-y-3 rounded-lg border border-[#d4a574]/30 bg-[#0d1b30] p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#d4a574]">Edit Details</h3>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">First Name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={editFormData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  className={`w-full rounded-lg border bg-[#1a365d] px-3 py-2 text-sm text-white focus:outline-none ${editErrors.firstName ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
                />
                {editErrors.firstName && <p className="mt-1 text-xs text-red-400">{editErrors.firstName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Last Name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={editFormData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  className={`w-full rounded-lg border bg-[#1a365d] px-3 py-2 text-sm text-white focus:outline-none ${editErrors.lastName ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
                />
                {editErrors.lastName && <p className="mt-1 text-xs text-red-400">{editErrors.lastName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Display Name</label>
                <input
                  type="text"
                  maxLength={100}
                  value={editFormData.displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className={`w-full rounded-lg border bg-[#1a365d] px-3 py-2 text-sm text-white focus:outline-none ${editErrors.displayName ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
                />
                {editErrors.displayName && <p className="mt-1 text-xs text-red-400">{editErrors.displayName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Job Title</label>
                <input
                  type="text"
                  maxLength={100}
                  value={editFormData.jobTitle}
                  onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                  className={`w-full rounded-lg border bg-[#1a365d] px-3 py-2 text-sm text-white focus:outline-none ${editErrors.jobTitle ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
                />
                {editErrors.jobTitle && <p className="mt-1 text-xs text-red-400">{editErrors.jobTitle}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Department</label>
                <select
                  value={editFormData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  className="w-full rounded-lg border border-[#d4a574]/30 bg-[#1a365d] px-3 py-2 text-sm text-white focus:border-[#d4a574] focus:outline-none"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#1a365d] border-t-transparent" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </section>
          )}

          {pendingRequest && (
            <div className="mb-6 rounded-lg border border-[#ed8936]/40 bg-[#ed8936]/10 p-4">
              <p className="mb-2 text-sm font-bold text-[#ed8936]">
                ⚠️ Pending {pendingRequest.type} Request
              </p>
              {pendingRequest.type === 'Offboarding' ? (
                <>
                  <p className="text-sm text-gray-300">Final Day: {pendingRequest.finalDay || 'N/A'}</p>
                  <p className="text-sm text-gray-300">Reason: {pendingRequest.offboardingReason || 'N/A'}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-300">Department: {pendingRequest.departmentName}</p>
                  <p className="text-sm text-gray-300">Start Date: {pendingRequest.startDate}</p>
                </>
              )}
              {onViewRequest && (
                <button
                  type="button"
                  onClick={() => onViewRequest(pendingRequest.id)}
                  className="mt-3 rounded-lg bg-[#d4a574] px-4 py-1.5 text-xs font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
                >
                  View Request
                </button>
              )}
            </div>
          )}

          <section className="mb-6 space-y-3">
            <div className="rounded-lg border-l-2 border-blue-400 bg-blue-400/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-300">Personal Email</p>
              <p className="font-semibold text-blue-300">{user.email}</p>
              <p className="mt-0.5 text-xs italic text-gray-400">For internal admin reference</p>
            </div>
            <div className="rounded-lg border-l-2 border-[#48bb78] bg-[#48bb78]/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#48bb78]">Work Email</p>
              {user.workEmail ? (
                <>
                  <p className="font-semibold text-[#48bb78]">📧 {user.workEmail}</p>
                  <p className="mt-0.5 text-xs italic text-gray-400">Created {formatDate(user.workEmailCreatedAt)}</p>
                </>
              ) : (
                <p className="font-semibold text-gray-400">Not yet created</p>
              )}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
              Basic Information
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Status</dt>
                <dd className="flex items-center gap-2 font-medium text-white">
                  <span aria-hidden="true">{statusInfo.emoji}</span>
                  {statusInfo.label}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Department</dt>
                <dd className="font-medium text-white">{user.department || 'N/A'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Manager</dt>
                <dd className="font-medium text-white">{user.manager || 'No manager'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Job Title</dt>
                <dd className="font-medium text-white">{user.jobTitle || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Role / Group</dt>
                <dd className="font-medium text-white">{user.role || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Floor</dt>
                <dd className="font-medium text-white">{user.floor || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Type</dt>
                <dd className="font-medium text-white">{user.type || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Date Onboarded</dt>
                <dd className="font-medium text-white">{formatDate(user.dateOnboarded)}</dd>
              </div>
              {user.status === 'inactive' && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-400">Date Offboarded</dt>
                  <dd className="font-medium text-white">{formatDate(user.dateOffboarded)}</dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
              Platforms Assigned
            </h3>
            {platforms.length === 0 ? (
              <p className="text-sm text-gray-400">No platforms assigned.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {platforms.map((platform) => (
                  <li
                    key={platform}
                    className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <span aria-hidden="true" className="text-[#48bb78]">
                      &#9745;
                    </span>
                    {platform}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="border-t border-[#d4a574]/20 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="mb-3 w-full rounded-lg border border-[#d4a574]/30 bg-white/5 px-4 py-2 text-left text-sm font-medium text-[#d4a574] transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            📋 View Employee History
          </button>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    {showHistory && <EmployeeHistoryModal user={user} onClose={() => setShowHistory(false)} />}
    </>
  );
}

UserDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    email: PropTypes.string,
    status: PropTypes.oneOf(['active', 'pending', 'inactive']),
    department: PropTypes.string,
    manager: PropTypes.string,
    dateOnboarded: PropTypes.string,
    dateOffboarded: PropTypes.string,
    platforms: PropTypes.arrayOf(PropTypes.string),
    workEmail: PropTypes.string,
    workEmailCreatedAt: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onViewRequest: PropTypes.func,
  onUserUpdated: PropTypes.func,
};

export default UserDetailsModal;
