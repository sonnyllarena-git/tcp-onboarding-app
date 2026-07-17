import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Strict email regex: requires valid complete domain
// Must have: username@domain.TLD (at least 2 chars after dot)
// Examples that PASS: example@yahoo.com, user@test.co.uk, name@domain.org
// Examples that FAIL: example@yahoo.c, example@yahoo.co, test@domain
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address format with strict requirements.
 * Email must have complete domain (e.g., example@yahoo.com, not example@yahoo.c)
 * An empty string is invalid since the email is required.
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True when the email is a well-formed, non-empty address with complete domain
 */
export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Checks that all Step 1 fields are filled and the email is well-formed.
 *
 * @param {Object} formData - Current wizard form data
 * @returns {boolean} True when Step 1 is complete and valid
 */
export function validateStep1(formData) {
  return (
    formData.employeeName.trim() !== '' &&
    validateEmail(formData.email) &&
    formData.startDate.trim() !== ''
  );
}

/**
 * Step1EmployeeInfo Component
 *
 * First step: Collect employee information.
 * Validates email with strict format (requires complete .com/.org/etc)
 *
 * @component
 * @param {Object} formData - Current form data
 * @param {Function} onDataChange - Update form data
 * @param {Function} onNext - Go to step 2
 * @param {Function} onCancel - Show cancel modal
 * @returns {React.ReactElement} Step 1 component
 */
function Step1EmployeeInfo({ formData, onDataChange, onNext, onCancel }) {
  const [touched, setTouched] = useState({});

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isValid = validateStep1(formData);
  const showEmailError =
    touched.email && formData.email !== '' && !validateEmail(formData.email);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-[#d4a574]">Employee Information</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="employeeName" className="mb-1 block text-sm text-gray-300">
            Full Name <span className="text-[#f56565]">*</span>
          </label>
          <input
            id="employeeName"
            type="text"
            required
            value={formData.employeeName}
            onChange={(event) => onDataChange({ employeeName: event.target.value })}
            onBlur={() => handleBlur('employeeName')}
            placeholder="Jane Employee"
            className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-gray-300">
            Email Address <span className="text-[#f56565]">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(event) => onDataChange({ email: event.target.value })}
            onBlur={() => handleBlur('email')}
            placeholder="employee@thecreditpros.com"
            aria-invalid={showEmailError}
            aria-describedby={showEmailError ? 'email-error' : undefined}
            className={`w-full rounded-lg border bg-[#0d1b30] px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] ${
              showEmailError ? 'border-[#f56565]' : 'border-[#d4a574]/40 focus:border-[#d4a574]'
            }`}
          />
          {showEmailError && (
            <p id="email-error" role="alert" className="mt-1 text-sm text-[#f56565]">
              Please enter a valid email address (e.g., example@yahoo.com)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm text-gray-300">
            Start Date <span className="text-[#f56565]">*</span>
          </label>
          <input
            id="startDate"
            type="date"
            required
            value={formData.startDate}
            onChange={(event) => onDataChange({ startDate: event.target.value })}
            onBlur={() => handleBlur('startDate')}
            className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2.5 text-sm text-white transition-colors focus:border-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          />
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
  );
}

Step1EmployeeInfo.propTypes = {
  formData: PropTypes.shape({
    employeeName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
  }).isRequired,
  onDataChange: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Step1EmployeeInfo;