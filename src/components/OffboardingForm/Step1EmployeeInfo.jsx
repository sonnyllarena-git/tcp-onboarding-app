import React from 'react';
import PropTypes from 'prop-types';

const OFFBOARDING_REASONS = ['Termination', 'Resignation', 'Retirement', 'Transfer', 'Other'];

/**
 * Returns today's date as a "YYYY-MM-DD" string in the local timezone
 * (not UTC), matching what a native date input treats as "today".
 *
 * @returns {string} Today's date
 */
export function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks that Step 1 is complete: a reason is chosen, an offboarding date
 * is set and isn't in the past, and the optional final day (if given)
 * isn't before the offboarding date.
 *
 * @param {Object} formData - Current wizard form data
 * @param {string} [todayIso] - Reference "today" date, defaults to the real today
 * @returns {boolean} True when Step 1 is complete and valid
 */
export function validateStep1(formData, todayIso = getTodayIsoDate()) {
  if (!formData.offboardingReason) {
    return false;
  }
  if (!formData.offboardingDate || formData.offboardingDate < todayIso) {
    return false;
  }
  if (formData.finalDay && formData.finalDay < formData.offboardingDate) {
    return false;
  }
  return true;
}

/**
 * Step1EmployeeInfo Component
 *
 * First step: confirm the employee being offboarded (read-only) and
 * collect the offboarding reason and dates.
 *
 * @component
 * @param {Object} formData - Current form data
 * @param {Function} onDataChange - Update form data
 * @param {Function} onNext - Go to step 2
 * @param {Function} onCancel - Show cancel modal
 * @returns {React.ReactElement} Step 1 component
 */
function Step1EmployeeInfo({ formData, onDataChange, onNext, onCancel }) {
  const todayIso = getTodayIsoDate();
  const isValid = validateStep1(formData, todayIso);

  const dateError =
    formData.offboardingDate && formData.offboardingDate < todayIso
      ? 'Offboarding date cannot be in the past.'
      : null;
  const finalDayError =
    formData.finalDay && formData.finalDay < formData.offboardingDate
      ? 'Final day cannot be before the offboarding date.'
      : null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-[#d4a574]">Confirm Employee Offboarding</h2>

      <dl className="mb-6 space-y-2 rounded-lg border border-[#d4a574]/20 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-400">Employee Name</dt>
          <dd className="font-medium text-white">{formData.employeeName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-400">Email Address</dt>
          <dd className="font-medium text-white">{formData.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-400">Current Status</dt>
          <dd className="font-medium text-[#48bb78]">Active</dd>
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
          <dt className="text-gray-400">Date Onboarded</dt>
          <dd className="font-medium text-white">{formData.dateOnboarded}</dd>
        </div>
      </dl>

      <div className="space-y-4">
        <fieldset>
          <legend className="mb-1 block text-sm text-gray-300">Offboarding Timing</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name="timing"
                value="immediate"
                checked={(formData.timing || 'immediate') === 'immediate'}
                onChange={(event) => onDataChange({ timing: event.target.value })}
              />
              Immediate (today)
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name="timing"
                value="scheduled"
                checked={formData.timing === 'scheduled'}
                onChange={(event) => onDataChange({ timing: event.target.value })}
              />
              Scheduled for date
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="offboardingReason" className="mb-1 block text-sm text-gray-300">
            Offboarding Reason <span className="text-[#f56565]">*</span>
          </label>
          <select
            id="offboardingReason"
            required
            value={formData.offboardingReason}
            onChange={(event) => onDataChange({ offboardingReason: event.target.value })}
            className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2.5 text-sm text-white transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            <option value="" disabled>
              Select a reason...
            </option>
            {OFFBOARDING_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="offboardingDate" className="mb-1 block text-sm text-gray-300">
            Offboarding Date <span className="text-[#f56565]">*</span>
          </label>
          <input
            id="offboardingDate"
            type="date"
            required
            min={todayIso}
            value={formData.offboardingDate}
            onChange={(event) => onDataChange({ offboardingDate: event.target.value })}
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? 'offboarding-date-error' : undefined}
            className={`w-full rounded-lg border bg-[#0d1b30] px-4 py-2.5 text-sm text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] ${
              dateError ? 'border-[#f56565]' : 'border-[#d4a574]/40 focus:border-[#d4a574]'
            }`}
          />
          {dateError && (
            <p id="offboarding-date-error" role="alert" className="mt-1 text-sm text-[#f56565]">
              {dateError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="finalDay" className="mb-1 block text-sm text-gray-300">
            Final Day <span className="text-gray-500">(optional)</span>
          </label>
          <input
            id="finalDay"
            type="date"
            min={formData.offboardingDate || todayIso}
            value={formData.finalDay}
            onChange={(event) => onDataChange({ finalDay: event.target.value })}
            aria-invalid={Boolean(finalDayError)}
            aria-describedby={finalDayError ? 'final-day-error' : undefined}
            className={`w-full rounded-lg border bg-[#0d1b30] px-4 py-2.5 text-sm text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] ${
              finalDayError ? 'border-[#f56565]' : 'border-[#d4a574]/40 focus:border-[#d4a574]'
            }`}
          />
          {finalDayError && (
            <p id="final-day-error" role="alert" className="mt-1 text-sm text-[#f56565]">
              {finalDayError}
            </p>
          )}
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
            disabled
            className="cursor-not-allowed rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-gray-500 opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!isValid}
            className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

Step1EmployeeInfo.propTypes = {
  formData: PropTypes.shape({
    employeeName: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    manager: PropTypes.string,
    dateOnboarded: PropTypes.string,
    offboardingReason: PropTypes.string,
    offboardingDate: PropTypes.string,
    finalDay: PropTypes.string,
  }).isRequired,
  onDataChange: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Step1EmployeeInfo;
