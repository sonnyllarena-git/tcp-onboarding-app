import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
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
  AZURE_GROUP_MAPPING,
  PLATFORMS,
} from '../../mockData';
import { useAuth } from '../../hooks/useAuth';
import { recordAuditLog } from '../AuditLogs';

const FIELD_DEFS = [
  { key: 'newDepartment', oldKey: 'department', label: 'Department', options: DEPARTMENT_OPTIONS, required: true },
  { key: 'newManager', oldKey: 'manager', label: 'Manager', options: MANAGER_OPTIONS, required: true },
  // Floor/Role/Job Title/Type are new concepts no existing user record has
  // ever had set (every seed user is missing all four), so requiring them
  // would block every transition on fields the admin has no reason to
  // touch - optional here; leaving one blank just means that attribute
  // doesn't change.
  { key: 'newFloor', oldKey: 'floor', label: 'Floor', options: FLOOR_OPTIONS, required: false },
  { key: 'newRole', oldKey: 'role', label: 'Role / Group', options: ROLE_OPTIONS, required: false },
  { key: 'newJobTitle', oldKey: 'jobTitle', label: 'Job Title', options: MOCK_JOB_TITLES.map((j) => j.label), required: false },
  { key: 'newType', oldKey: 'type', label: 'Type', options: TYPE_OPTIONS, required: false },
];

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Platforms' },
  { id: 3, label: 'Review' },
];

const PLATFORM_ICONS = {
  'Azure AD': '☁️',
  Keeper: '🔐',
  Hodu: '📞',
  Krisp: '🎙️',
  Jira: '📋',
  'Zoho Desk': '🎫',
  Acuity: '📅',
  'TheCreditPros Portal': '🏢',
  'Sales IQ': '📈',
  StaffCounter: '👀',
};

/** A single labeled current→new field row, used in both Step 1 and the review step. */
function ChangeRow({ label, before, after }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-[#0d1b30] p-3 text-sm">
      <span className="w-28 shrink-0 text-gray-400">{label}</span>
      <span className="text-blue-300">{before || 'N/A'}</span>
      <span className="text-[#48bb78]">→</span>
      <span className="font-semibold text-[#48bb78]">{after || 'N/A'}</span>
    </div>
  );
}

/**
 * TransitionForm Component
 *
 * 3-step wizard modal for moving an ACTIVE user to a new department/
 * manager/floor/role/job title/type without creating a duplicate user
 * record: Basic Info -> Select Platforms -> Review & Submit. Submits a
 * PENDING 'Transition' request (same request pipeline as onboarding/
 * offboarding), with a platform entry per selected platform that's
 * completed later from RequestDetails, same as offboarding's manual
 * per-platform flow.
 *
 * @component
 * @param {Object} user - The active user being transitioned
 * @param {Function} onClose - Close the modal without submitting
 * @param {Function} onSuccess - Called with the new request after a successful submit (before navigation)
 * @returns {React.ReactElement} TransitionForm component
 */
function TransitionForm({ user, onClose, onSuccess }) {
  const navigate = useNavigate();
  const loggedInUser = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    newDepartment: user.department || '',
    newManager: user.manager || '',
    newFloor: user.floor || '',
    newRole: user.role || '',
    newJobTitle: user.jobTitle || '',
    newType: user.type || 'Internal',
    selectedPlatforms: [],
  });
  const [errors, setErrors] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', submit: '' }));
  };

  const handlePlatformToggle = (name) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(name)
        ? prev.selectedPlatforms.filter((p) => p !== name)
        : [...prev.selectedPlatforms, name],
    }));
    setErrors((prev) => ({ ...prev, platforms: '' }));
  };

  const validateStep1 = () => {
    const nextErrors = {};
    FIELD_DEFS.forEach(({ key, label, required }) => {
      if (required && !formData[key]) {
        nextErrors[key] = `${label} is required`;
      }
    });
    // Deliberately no "at least one field must differ" gate here: Step 2's
    // "at least one platform selected" requirement is what makes a
    // transition meaningful - a platform-only access update with no
    // department/manager/role change is a valid transition on its own.
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    if (formData.selectedPlatforms.length === 0) {
      setErrors({ platforms: 'Select at least one platform to update.' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const handleCancelClick = () => setShowCancelConfirm(true);

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onClose();
  };

  const handleSubmitClick = () => setShowConfirmSubmit(true);

  const handleConfirmSubmit = () => {
    const conflict = getPendingRequestByEmail(user.email);
    if (conflict) {
      setShowConfirmSubmit(false);
      setErrors({ submit: `${user.name} already has a pending ${conflict.type.toLowerCase()} request.` });
      setCurrentStep(1);
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
      details: `${user.name}: Department ${newRequest.oldDepartment} → ${newRequest.newDepartment}, Manager ${newRequest.oldManager || 'N/A'} → ${newRequest.newManager}, Role ${newRequest.oldRole || 'N/A'} → ${newRequest.newRole}, Platforms: ${formData.selectedPlatforms.join(', ')}`,
    });

    if (newRequest.azureGroupName) {
      recordAuditLog({
        userEmail: loggedInUser?.email,
        userName: loggedInUser?.name,
        department: loggedInUser?.department,
        action: 'AZURE_GROUP_UPDATED',
        requestId: newRequest.id,
        details: `Azure AD group updated to ${newRequest.azureGroupName} for ${user.name}`,
      });
    }

    setShowConfirmSubmit(false);
    setSubmittedRequest(newRequest);
    onSuccess(newRequest);
  };

  const handleViewRequestDetails = () => {
    navigate(`/requests/${submittedRequest.id}`, { state: { fromManageUsers: true } });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" onClick={handleCancelClick}>
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
              <p className="mt-1 text-sm text-gray-400">Update department, manager, role, and platform access.</p>
            </div>
            <button
              type="button"
              onClick={handleCancelClick}
              aria-label="Close"
              className="rounded-md p-1 text-xl leading-none text-gray-400 transition-colors hover:bg-white/10 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
            >
              &#10005;
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 border-b border-[#d4a574]/10 px-6 py-4">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
                {i > 0 && <div className={`h-0.5 w-8 ${currentStep >= step.id ? 'bg-[#d4a574]' : 'bg-white/10'}`} />}
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      currentStep >= step.id ? 'bg-[#d4a574] text-[#1a365d]' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {step.id}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${currentStep >= step.id ? 'text-[#d4a574]' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {errors.submit && (
              <div className="mb-4 rounded-lg border-l-2 border-red-400 bg-red-400/10 p-3 text-sm text-red-300">
                ❌ {errors.submit}
              </div>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="rounded-lg border-l-2 border-blue-400 bg-blue-400/10 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-300">Employee</p>
                  <p className="font-semibold text-blue-300">{user.name}</p>
                  <p className="text-xs text-gray-400">
                    {user.email}
                    {user.workEmail && <span className="ml-2 text-[#48bb78]">📧 {user.workEmail}</span>}
                  </p>
                </div>

                {FIELD_DEFS.map(({ key, oldKey, label, options, required }) => (
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
                        {label} (New){!required && <span className="normal-case text-gray-500"> - optional</span>}
                      </label>
                      <select
                        id={`transition-${key}`}
                        value={formData[key]}
                        onChange={(event) => handleChange(key, event.target.value)}
                        className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${
                          errors[key] ? 'border-red-400' : 'border-[#d4a574]/40 focus:border-[#d4a574]'
                        }`}
                      >
                        <option value="">{required ? `Select ${label}` : 'No change'}</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {key === 'newRole' && formData.newRole && AZURE_GROUP_MAPPING[formData.newRole] && (
                        <p className="mt-1 text-xs text-blue-300">
                          🔄 Azure AD group will update to <strong>{AZURE_GROUP_MAPPING[formData.newRole]}</strong>
                        </p>
                      )}
                      {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Select Platforms */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Select which platforms need access updates for this transition. You&apos;ll manually confirm each
                  one from the request details page once submitted.
                </p>
                {errors.platforms && (
                  <div className="rounded-lg border-l-2 border-red-400 bg-red-400/10 p-3 text-sm text-red-300">
                    {errors.platforms}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PLATFORMS.map((name) => (
                    <label
                      key={name}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                        formData.selectedPlatforms.includes(name)
                          ? 'border-[#d4a574] bg-[#d4a574]/10 text-[#d4a574]'
                          : 'border-[#d4a574]/20 bg-[#0d1b30] text-gray-300 hover:border-[#d4a574]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedPlatforms.includes(name)}
                        onChange={() => handlePlatformToggle(name)}
                        className="h-4 w-4 rounded border-[#d4a574]/40 bg-[#0d1b30] text-[#d4a574] focus:ring-[#d4a574]"
                      />
                      <span aria-hidden="true">{PLATFORM_ICONS[name] || '🔗'}</span>
                      <span className="font-semibold">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {FIELD_DEFS.map(({ key, oldKey, label }) => (
                    <ChangeRow key={key} label={label} before={user[oldKey]} after={formData[key]} />
                  ))}
                  {AZURE_GROUP_MAPPING[formData.newRole] && (
                    <div className="rounded-lg border-l-2 border-blue-400 bg-blue-400/10 p-3 text-xs text-blue-300">
                      ⚡ Azure AD group will update to <strong>{AZURE_GROUP_MAPPING[formData.newRole]}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#d4a574]">Platforms to Update</h4>
                  <ul className="space-y-1">
                    {formData.selectedPlatforms.map((name) => (
                      <li key={name} className="flex items-center justify-between rounded bg-[#0d1b30] px-3 py-2 text-sm text-gray-200">
                        <span>
                          {PLATFORM_ICONS[name] || '🔗'} {name}
                        </span>
                        <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs font-bold text-yellow-300">Manual Update</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="rounded-lg border border-[#d4a574]/20 bg-white/5 p-3 text-xs text-gray-400">
                  ℹ️ Submitting creates a pending transition request. Platform access is confirmed manually from the
                  request details page, and the employee&apos;s record only updates once every platform is completed
                  and the request is marked complete.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-[#d4a574]/20 px-6 py-4">
            <button
              type="button"
              onClick={handleCancelClick}
              className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                ← Back
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitClick}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Submit Transition
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowCancelConfirm(false)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-red-400/40 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">⚠️ Cancel Transition?</h2>
            <p className="mb-6 text-sm text-gray-300">All changes will be discarded. Are you sure you want to cancel?</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm submit modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowConfirmSubmit(false)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">Confirm Transition</h2>
            <p className="mb-3 text-center text-lg font-bold text-white">👤 {user.name}</p>
            <div className="mb-4 space-y-2 rounded-lg border border-[#d4a574]/20 bg-[#0d1b30] p-3 text-sm">
              {FIELD_DEFS.map(({ key, oldKey, label }) => (
                <ChangeRow key={key} label={label} before={user[oldKey]} after={formData[key]} />
              ))}
            </div>
            <p className="mb-4 text-xs text-gray-400">
              This creates a pending transition request - it won&apos;t take effect until an admin completes it (all
              selected platforms confirmed) from the request details page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {submittedRequest && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#48bb78]/40 bg-[#1a365d] p-6 text-center shadow-2xl"
          >
            <div className="mb-2 text-4xl" aria-hidden="true">✅</div>
            <p className="text-lg font-bold text-white">{user.name}</p>
            <h2 className="mb-3 text-lg font-bold text-[#48bb78]">Transition Request Submitted</h2>
            <p className="mb-6 text-sm text-gray-300">
              The request is now pending completion - an admin will confirm each selected platform before it takes
              effect.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleViewRequestDetails}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                View Request Details →
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
    workEmail: PropTypes.string,
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
