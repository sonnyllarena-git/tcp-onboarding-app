import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PLATFORM_ACTIONS } from '../../mockData';

const ACTION_BY_PLATFORM = PLATFORM_ACTIONS.reduce((map, platform) => {
  map[platform.name] = platform.offboardAction;
  return map;
}, {});

/**
 * Formats a "YYYY-MM-DD" date input value into a short "Mon D, YYYY" string.
 * Parses the parts manually (rather than `new Date(isoString)`) so the
 * result isn't shifted a day off by UTC/local timezone parsing.
 *
 * @param {string} isoDateString - Value from a native date input
 * @returns {string} Formatted date, or an empty string if none was given
 */
function formatIsoDate(isoDateString) {
  if (!isoDateString) {
    return '';
  }
  const [year, month, day] = isoDateString.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDateString;
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Step3Review Component
 *
 * Third step: review the offboarding request and submit it. Submitting
 * shows an inline "are you sure" prompt before actually calling onSubmit.
 *
 * @component
 * @param {Object} formData - Complete form data
 * @param {Function} onDataChange - Update form data (used for the confirmation checkbox)
 * @param {Function} onSubmit - Submit the form (called after the user confirms "Yes")
 * @param {Function} onBack - Go back to step 2
 * @param {Function} onCancel - Show cancel modal
 * @param {boolean} [submitting] - Whether the mock submission is in progress
 * @returns {React.ReactElement} Step 3 component
 */
function Step3Review({ formData, onDataChange, onSubmit, onBack, onCancel, submitting = false, error = null }) {
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);

  const handleSubmitClick = () => {
    setShowConfirmPrompt(true);
  };

  const handleConfirmYes = () => {
    setShowConfirmPrompt(false);
    onSubmit();
  };

  const handleConfirmNo = () => {
    setShowConfirmPrompt(false);
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-[#d4a574]">Review &amp; Submit</h2>

      <section className="mb-6 rounded-lg border border-[#d4a574]/20 p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
          Employee Summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Name</dt>
            <dd className="font-medium text-white">{formData.employeeName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Email</dt>
            <dd className="font-medium text-white">{formData.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Department</dt>
            <dd className="font-medium text-white">{formData.department}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Manager</dt>
            <dd className="font-medium text-white">{formData.manager || 'No manager'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Status</dt>
            <dd className="font-medium text-[#48bb78]">Active</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Offboarding Reason</dt>
            <dd className="font-medium text-white">{formData.offboardingReason}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Offboarding Date</dt>
            <dd className="font-medium text-white">{formatIsoDate(formData.offboardingDate)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-400">Final Day</dt>
            <dd className="font-medium text-white">
              {formData.finalDay ? formatIsoDate(formData.finalDay) : 'N/A'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-6 rounded-lg border border-[#d4a574]/20 p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
          Selected Actions
        </h3>
        <ul className="space-y-2 text-sm">
          {formData.selectedPlatforms.map((platform) => (
            <li key={platform} className="flex items-center gap-2 text-white">
              <span aria-hidden="true" className="text-[#48bb78]">
                &#9745;
              </span>
              {platform} - {ACTION_BY_PLATFORM[platform] || 'Remove access'}
            </li>
          ))}
        </ul>
      </section>

      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#f6ad55]/40 bg-[#f6ad55]/10 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.confirmationChecked}
          onChange={(event) => onDataChange({ confirmationChecked: event.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
        />
        I confirm this employee should be offboarded.
      </label>

      {error && (
        <div role="alert" className="mb-4 rounded border-l-4 border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#f6ad55] transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6ad55]"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={!formData.confirmationChecked || submitting}
            className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {showConfirmPrompt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={handleConfirmNo}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-confirm-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <h2 id="submit-confirm-title" className="mb-2 text-lg font-bold text-[#1a365d]">
              Confirm Offboarding
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to offboard {formData.employeeName}?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleConfirmNo}
                className="flex-1 rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmYes}
                className="flex-1 rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Step3Review.propTypes = {
  formData: PropTypes.shape({
    employeeName: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    manager: PropTypes.string,
    offboardingReason: PropTypes.string,
    offboardingDate: PropTypes.string,
    finalDay: PropTypes.string,
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string).isRequired,
    confirmationChecked: PropTypes.bool.isRequired,
  }).isRequired,
  onDataChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default Step3Review;
