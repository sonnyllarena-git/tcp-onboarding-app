import React from 'react';
import PropTypes from 'prop-types';

/**
 * Formats a "YYYY-MM-DD" date input value into a short "Mon D, YYYY" string.
 * Parses the parts manually (rather than `new Date(isoString)`) so the
 * result isn't shifted a day off by UTC/local timezone parsing.
 *
 * @param {string} isoDateString - Value from a native date input
 * @returns {string} Formatted date, or the original value if unparseable
 */
function formatStartDate(isoDateString) {
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
 * Third step: Review and submit form.
 *
 * @component
 * @param {Object} formData - Complete form data
 * @param {Function} onSubmit - Submit the form
 * @param {Function} onBack - Go back to step 2
 * @param {Function} onCancel - Show cancel modal
 * @returns {React.ReactElement} Step 3 component
 */
function Step3Review({ formData, onSubmit, onBack, onCancel }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-[#d4a574]">Review &amp; Submit</h2>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-400">Employee Name</dt>
          <dd className="font-medium text-white">{formData.employeeName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-400">Email</dt>
          <dd className="font-medium text-white">{formData.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-400">Start Date</dt>
          <dd className="font-medium text-white">{formatStartDate(formData.startDate)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="mb-2 text-sm text-gray-400">Selected Platforms</p>
        <div className="flex flex-wrap gap-2">
          {formData.selectedPlatforms.map((platform) => (
            <span
              key={platform}
              className="rounded-full bg-[#d4a574]/20 px-3 py-1 text-xs font-semibold text-[#d4a574]"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
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
            onClick={onSubmit}
            className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

Step3Review.propTypes = {
  formData: PropTypes.shape({
    employeeName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};



export default Step3Review;
