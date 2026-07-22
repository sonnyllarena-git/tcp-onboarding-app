import React from 'react';
import PlatformSelector from './PlatformSelector';

/** Step 3: at least one platform (or the explicit 'N/A') must be selected. */
export function validateStep3(formData) {
  return Array.isArray(formData.selectedPlatforms) && formData.selectedPlatforms.length > 0;
}

function Step3Review({ formData, onDataChange, onSubmit, onBack, onCancel, submitting, error, attemptedSubmit }) {
  const platformError =
    attemptedSubmit && !validateStep3(formData) ? 'Please select at least one platform.' : '';

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded border-l-4 border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-1 rounded bg-[#0d1b30] p-4 text-sm text-gray-300">
        <p><strong className="text-white">Name:</strong> {formData.displayName}</p>
        <p><strong className="text-white">Email:</strong> {formData.email}</p>
        <p><strong className="text-white">Working Location:</strong> {formData.workingLocation}</p>
        <p><strong className="text-white">Country:</strong> {formData.country}</p>
        <p><strong className="text-white">Start Date:</strong> {formData.startDate}</p>
        <p><strong className="text-white">Role:</strong> {formData.role}</p>
        <p><strong className="text-white">Department:</strong> {formData.department}</p>
        <p><strong className="text-white">Manager:</strong> {formData.manager}</p>
        <p><strong className="text-white">Team:</strong> {formData.team}</p>
        <p><strong className="text-white">Job Title:</strong> {formData.jobTitle}</p>
        <p><strong className="text-white">Employee Type:</strong> {formData.employeeType}</p>
      </div>

      <PlatformSelector
        selectedRole={formData.role}
        platforms={formData.selectedPlatforms || []}
        onChange={(platforms) => onDataChange({ selectedPlatforms: platforms })}
        errors={platformError}
      />

      <div className="flex gap-2 pt-2">
        <button onClick={onBack} className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574]">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Step3Review;
