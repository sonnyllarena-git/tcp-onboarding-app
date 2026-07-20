import React from 'react';
import PropTypes from 'prop-types';
import { PLATFORM_ACTIONS } from '../../mockData';

/**
 * Checks that at least one platform action has been selected.
 *
 * @param {Object} formData - Current wizard form data
 * @returns {boolean} True when Step 2 is complete and valid
 */
export function validateStep2(formData) {
  return formData.selectedPlatforms.length > 0;
}

/**
 * Step2OffboardingActions Component
 *
 * Second step: choose which platforms to disable/delete/revoke for the
 * employee being offboarded.
 *
 * @component
 * @param {Object} formData - Current form data
 * @param {Function} onDataChange - Update form data
 * @param {Function} onNext - Go to step 3
 * @param {Function} onBack - Go back to step 1
 * @param {Function} onCancel - Show cancel modal
 * @returns {React.ReactElement} Step 2 component
 */
function Step2OffboardingActions({ formData, onDataChange, onNext, onBack, onCancel }) {
  const isValid = validateStep2(formData);

  const togglePlatform = (platform) => {
    const isSelected = formData.selectedPlatforms.includes(platform);
    const nextSelection = isSelected
      ? formData.selectedPlatforms.filter((selected) => selected !== platform)
      : [...formData.selectedPlatforms, platform];
    onDataChange({ selectedPlatforms: nextSelection });
  };

  return (
    <div>
      <p className="mb-1 text-sm text-gray-400">Offboarding</p>
      <h2 className="mb-2 text-lg font-bold text-white">{formData.employeeName}</h2>
      <p className="mb-4 text-sm text-gray-300">
        Select which platforms to disable/delete for this employee.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PLATFORM_ACTIONS.map(({ name, offboardAction }) => {
          const checked = formData.selectedPlatforms.includes(name);
          return (
            <label
              key={name}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d4a574]/20 bg-[#0d1b30] px-3 py-2 text-sm text-white transition-colors hover:border-[#d4a574]/50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePlatform(name)}
                className="mt-0.5 h-4 w-4 accent-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
              />
              <span>
                <span className="font-medium">{name}</span>
                <span className="block text-xs text-gray-400">{offboardAction}</span>
              </span>
            </label>
          );
        })}
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

Step2OffboardingActions.propTypes = {
  formData: PropTypes.shape({
    employeeName: PropTypes.string,
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onDataChange: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Step2OffboardingActions;
