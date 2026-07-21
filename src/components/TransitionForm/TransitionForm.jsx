import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  createTransitionRequest,
  saveRequest,
  withTimelineEvent,
  getPendingRequestByEmail,
  DEPARTMENT_OPTIONS,
  MANAGER_OPTIONS,
  FLOOR_OPTIONS,
  ROLE_OPTIONS,
  TYPE_OPTIONS,
  MOCK_JOB_TITLES,
} from '../../mockData';
import { useAuth } from '../../hooks/useAuth';
import { recordAuditLog } from '../AuditLogs';

const FIELD_DEFS = [
  { key: 'newDepartment', oldKey: 'department', label: 'Department', options: DEPARTMENT_OPTIONS },
  { key: 'newManager', oldKey: 'manager', label: 'Manager', options: MANAGER_OPTIONS },
  { key: 'newFloor', oldKey: 'floor', label: 'Floor', options: FLOOR_OPTIONS },
  { key: 'newRole', oldKey: 'role', label: 'Role / Group', options: ROLE_OPTIONS },
  { key: 'newJobTitle', oldKey: 'jobTitle', label: 'Job Title', options: MOCK_JOB_TITLES.map((j) => j.label) },
  { key: 'newType', oldKey: 'type', label: 'Type', options: TYPE_OPTIONS },
];

/**
 * TransitionForm Component
 *
 * Modal for moving an ACTIVE user to a new department/manager/floor/
 * role/job title/type without creating a duplicate user record. Submits
 * a PENDING 'Transition' request (same request pipeline as onboarding/
 * offboarding - it's completed later from RequestDetails, not applied
 * immediately). There is no platform-provisioning step here; platform
 * access changes are called out as a manual follow-up, matching how the
 * source spec described it.
 *
 * @component
 * @param {Object} user - The active user being transitioned
 * @param {Function} onClose - Close the modal without submitting
 * @param {Function} onSuccess - Called with the new request after a successful submit
 * @returns {React.ReactElement} TransitionForm component
 */
function TransitionForm({ user, onClose, onSuccess }) {
  const loggedInUser = useAuth();
  const [formData, setFormData] = useState({
    newDepartment: user.department || '',
    newManager: user.manager || '',
    newFloor: user.floor || '',
    newRole: user.role || '',
    newJobTitle: user.jobTitle || '',
    newType: user.type || 'Internal',
  });
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', submit: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    FIELD_DEFS.forEach(({ key, label }) => {
      if (!formData[key]) {
        nextErrors[key] = `${label} is required`;
      }
    });

    const hasChanges = FIELD_DEFS.some(({ key, oldKey }) => (user[oldKey] || '') !== formData[key]);
    if (Object.keys(nextErrors).length === 0 && !hasChanges) {
      nextErrors.submit = 'No changes detected - update at least one field before submitting.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReview = (event) => {
    event.preventDefault();
    if (validate()) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    const conflict = getPendingRequestByEmail(user.email);
    if (conflict) {
      setShowConfirm(false);
      setErrors({ submit: `${user.name} already has a pending ${conflict.type.toLowerCase()} request.` });
      return;
    }

    const baseRequest = createTransitionRequest(user, formData, {
      submittedBy: loggedInUser?.name || 'Unknown User',
      submittedByRole: loggedInUser?.role || 'Unknown',
      submittedByDept: loggedInUser?.department || 'Unknown',
    });
    const newRequest = withTimelineEvent(baseRequest, 'Transition Requested', 'completed');
    saveRequest(newRequest);

    recordAuditLog({
      userEmail: loggedInUser?.email,
      userName: loggedInUser?.name,
      department: loggedInUser?.department,
      action: 'TRANSITION_REQUEST_SUBMITTED',
      requestId: newRequest.id,
      details: `${user.name}: Department ${newRequest.oldDepartment} → ${newRequest.newDepartment}, Manager ${newRequest.oldManager || 'N/A'} → ${newRequest.newManager}, Role ${newRequest.oldRole || 'N/A'} → ${newRequest.newRole}`,
    });

    setShowConfirm(false);
    onSuccess(newRequest);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="transition-form-title"
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#d4a574]/30 bg-[#1a365d] shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#d4a574]/20 px-6 py-4">
            <div>
              <h2 id="transition-form-title" className="text-xl font-bold text-white">
                🔄 Transition {user.name}
              </h2>
              <p className="mt-1 text-sm text-gray-400">Update department, manager, and role assignment.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-xl leading-none text-gray-400 transition-colors hover:bg-white/10 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
            >
              &#10005;
            </button>
          </div>

          <form onSubmit={handleReview} className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {FIELD_DEFS.map(({ key, oldKey, label, options }) => (
                <div key={key} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {label} (Current)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={user[oldKey] || 'N/A'}
                      className="w-full rounded-lg border border-blue-400/40 bg-blue-400/10 px-3 py-2 text-sm text-blue-300"
                    />
                  </div>
                  <div className="hidden justify-center text-[#48bb78] sm:flex">→</div>
                  <div>
                    <label htmlFor={`transition-${key}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
                      {label} (New)
                    </label>
                    <select
                      id={`transition-${key}`}
                      value={formData[key]}
                      onChange={(event) => handleChange(key, event.target.value)}
                      className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${
                        errors[key] ? 'border-red-400' : 'border-[#d4a574]/40 focus:border-[#d4a574]'
                      }`}
                    >
                      <option value="">Select {label}</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-[#d4a574]/20 bg-white/5 p-3">
                <p className="text-xs text-gray-400">
                  ℹ️ Platform access (Azure AD groups, Jira, etc.) is not updated automatically for transitions - IT
                  will need to update platform access manually after this request is completed.
                </p>
              </div>
            </div>

            {errors.submit && (
              <div className="mt-4 rounded-lg border-l-2 border-red-400 bg-red-400/10 p-3 text-sm text-red-300">
                ❌ {errors.submit}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Review &amp; Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowConfirm(false)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">Confirm Transition</h2>
            <div className="mb-4 space-y-2 rounded-lg border border-[#d4a574]/20 bg-[#0d1b30] p-3 text-sm">
              {FIELD_DEFS.map(({ key, oldKey, label }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-gray-400">{label}:</span>
                  <span className="text-blue-300">{user[oldKey] || 'N/A'}</span>
                  <span className="text-[#48bb78]">→</span>
                  <span className="font-semibold text-[#48bb78]">{formData[key]}</span>
                </div>
              ))}
            </div>
            <p className="mb-4 text-xs text-gray-400">
              This creates a pending transition request - it won&apos;t take effect until an admin completes it from
              the request details page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

TransitionForm.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    department: PropTypes.string,
    manager: PropTypes.string,
    floor: PropTypes.string,
    role: PropTypes.string,
    jobTitle: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default TransitionForm;
