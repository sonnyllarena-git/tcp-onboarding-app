import React, { useState } from 'react';
import SearchableDropdown from '../SearchableDropdown';
import { WORKING_LOCATIONS, COUNTRIES } from '../../data/formOptions';

const NAME_PATTERN = /^[A-Za-z]{2,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * True once every Step 1 field is individually valid. Exported so
 * OnboardingForm's "Next" button and handleNext guard share one
 * source of truth with this file's own on-blur field errors.
 * @param {Object} formData
 * @param {Array} existingEmails - lowercased emails already in the real directory
 * @returns {boolean}
 */
export function validateStep1(formData, existingEmails = []) {
  return (
    NAME_PATTERN.test(formData.firstName || '') &&
    NAME_PATTERN.test(formData.lastName || '') &&
    Boolean(formData.displayName && formData.displayName.trim().length > 0 && formData.displayName.length <= 100) &&
    EMAIL_PATTERN.test(formData.email || '') &&
    !existingEmails.includes((formData.email || '').trim().toLowerCase()) &&
    Boolean(formData.workingLocation) &&
    Boolean(formData.country)
  );
}

function Step1PersonalInfo({ formData, onDataChange, onNext, onCancel, existingEmails = [] }) {
  const [touched, setTouched] = useState({});

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = {
    firstName: touched.firstName && !NAME_PATTERN.test(formData.firstName || '') ? 'First name must be 2-50 letters, no numbers.' : '',
    lastName: touched.lastName && !NAME_PATTERN.test(formData.lastName || '') ? 'Last name must be 2-50 letters, no numbers.' : '',
    displayName:
      touched.displayName && !(formData.displayName && formData.displayName.trim())
        ? 'Display name is required.'
        : touched.displayName && formData.displayName.length > 100
          ? 'Display name must be 100 characters or fewer.'
          : '',
    email: (() => {
      if (!touched.email) return '';
      if (!EMAIL_PATTERN.test(formData.email || '')) return 'Enter a valid email address.';
      if (existingEmails.includes((formData.email || '').trim().toLowerCase())) return 'Email already exists.';
      return '';
    })(),
    workingLocation: touched.workingLocation && !formData.workingLocation ? 'Please select Working Location from the list.' : '',
    country: touched.country && !formData.country ? 'Please select Country from the list.' : '',
  };

  const handleNameChange = (field) => (event) => {
    const value = event.target.value;
    const updates = { [field]: value };
    // Auto-fill Display Name as "FirstName LastName" until the admin
    // edits it directly - handled on blur per the spec, using the
    // NEXT first/last name value (not yet committed to formData).
    onDataChange(updates);
  };

  const handleNameBlur = (field) => () => {
    markTouched(field);
    if (!formData.displayNameEdited) {
      const combined = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      if (combined) {
        onDataChange({ displayName: combined });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
          First Name<span className="ml-0.5 text-red-400">*</span>
        </label>
        <input
          type="text"
          maxLength={50}
          value={formData.firstName || ''}
          onChange={handleNameChange('firstName')}
          onBlur={handleNameBlur('firstName')}
          className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${errors.firstName ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
        />
        {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
          Last Name<span className="ml-0.5 text-red-400">*</span>
        </label>
        <input
          type="text"
          maxLength={50}
          value={formData.lastName || ''}
          onChange={handleNameChange('lastName')}
          onBlur={handleNameBlur('lastName')}
          className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${errors.lastName ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
        />
        {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
          Display Name<span className="ml-0.5 text-red-400">*</span>
        </label>
        <input
          type="text"
          maxLength={100}
          value={formData.displayName || ''}
          onChange={(e) => onDataChange({ displayName: e.target.value, displayNameEdited: true })}
          onBlur={() => markTouched('displayName')}
          className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${errors.displayName ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
        />
        {errors.displayName && <p className="mt-1 text-xs text-red-400">{errors.displayName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
          Email<span className="ml-0.5 text-red-400">*</span>
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onDataChange({ email: e.target.value })}
          onBlur={() => markTouched('email')}
          className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${errors.email ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
      </div>

      <SearchableDropdown
        label="Working Location"
        required
        value={formData.workingLocation || ''}
        onChange={(value) => {
          onDataChange({ workingLocation: value });
          markTouched('workingLocation');
        }}
        options={WORKING_LOCATIONS}
        placeholder="Select Working Location"
        error={errors.workingLocation}
      />

      <SearchableDropdown
        label="Country"
        required
        value={formData.country || ''}
        onChange={(value) => {
          onDataChange({ country: value });
          markTouched('country');
        }}
        options={COUNTRIES}
        placeholder="Select Country"
        error={errors.country}
      />

      <div className="flex gap-2 pt-2">
        <button
          onClick={onNext}
          disabled={!validateStep1(formData, existingEmails)}
          className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] disabled:opacity-50"
        >
          Next
        </button>
        <button onClick={onCancel} className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Step1PersonalInfo;
