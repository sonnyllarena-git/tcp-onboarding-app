import React from 'react';
import PropTypes from 'prop-types';

const PLATFORMS = [
  'Azure AD',
  'Keeper',
  'Hodu',
  'Krisp',
  'Jira',
  'Zoho Desk',
  'Acuity',
  'TheCreditPros Portal',
  'Sales IQ',
  'StaffCounter',
];

/**
 * Checks that at least one platform has been selected.
 *
 * @param {Object} formData - Current wizard form data
 * @returns {boolean} True when Step 2 is complete and valid
 */
export function validateStep2(formData) {
  return formData.selectedPlatforms.length > 0;
}

/**
 * Step2PlatformSelection Component
 *
 * Second step: Select platforms for onboarding.
 *
 * @component
 * @param {Object} formData - Current form data
 * @param {Function} onDataChange - Update form data
 * @param {Function} onNext - Go to step 3
 * @param {Function} onBack - Go back to step 1
 * @param {Function} onCancel - Show cancel modal
 * @returns {React.ReactElement} Step 2 component
 */
function Step2PlatformSelection({ formData, onDataChange, onNext, onBack, onCancel }) {
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
      <h2 className="mb-2 text-lg font-bold text-[#d4a574]">Platform Selection</h2>
      <p className="mb-4 text-sm text-gray-300">
        Select at least one platform to provision for this employee.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const checked = formData.selectedPlatforms.includes(platform);
          return (
            <label
              key={platform}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#d4a574]/20 bg-[#0d1b30] px-3 py-2 text-sm text-white transition-colors hover:border-[#d4a574]/50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePlatform(platform)}
                className="h-4 w-4 accent-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
              />
              {platform}
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

Step2PlatformSelection.propTypes = {
  formData: PropTypes.shape({
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onDataChange: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Step2PlatformSelection;
