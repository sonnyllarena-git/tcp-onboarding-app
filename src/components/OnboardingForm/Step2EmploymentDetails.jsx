import React, { useState } from 'react';
import AutocompleteField from '../AutocompleteField';
import SearchableDropdown from '../SearchableDropdown';
import { ROLES, DEPARTMENTS, MANAGERS, TEAMS, JOB_TITLES, EMPLOYEE_TYPES } from '../../data/formOptions';

function isTodayOrLater(isoDateString) {
  if (!isoDateString) return false;
  const [year, month, day] = isoDateString.split('-').map(Number);
  const entered = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return entered >= today;
}

/**
 * True once every Step 2 field is valid. 'N/A' counts as a valid,
 * explicit selection for the searchable/autocomplete fields - these
 * are "required" in the sense that something must be chosen, not
 * that N/A is disallowed.
 * @param {Object} formData
 * @returns {boolean}
 */
export function validateStep2(formData) {
  return (
    isTodayOrLater(formData.startDate) &&
    Boolean(formData.role) &&
    Boolean(formData.department) &&
    Boolean(formData.manager) &&
    Boolean(formData.team) &&
    Boolean(formData.jobTitle) &&
    Boolean(formData.employeeType)
  );
}

function Step2EmploymentDetails({ formData, onDataChange, onNext, onBack, onCancel }) {
  const [touched, setTouched] = useState({});
  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const startDateError =
    touched.startDate && !isTodayOrLater(formData.startDate)
      ? 'Start Date is required and cannot be in the past.'
      : '';

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
          Start Date<span className="ml-0.5 text-red-400">*</span>
        </label>
        <input
          type="date"
          value={formData.startDate || ''}
          onChange={(e) => onDataChange({ startDate: e.target.value })}
          onBlur={() => markTouched('startDate')}
          className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white focus:outline-none ${startDateError ? 'border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'}`}
        />
        {startDateError && <p className="mt-1 text-xs text-red-400">{startDateError}</p>}
      </div>

      <AutocompleteField
        label="Role / Group"
        required
        value={formData.role || ''}
        onChange={(value) => onDataChange({ role: value })}
        onBlur={() => markTouched('role')}
        options={ROLES}
        placeholder="Search roles (e.g. IH.SalesAgent)"
        error={touched.role && !formData.role ? 'Please select Role from the list.' : ''}
      />
      <p className="-mt-3 text-xs text-gray-400">Selecting a role auto-populates the platform checklist in Step 3.</p>

      <SearchableDropdown
        label="Department"
        required
        value={formData.department || ''}
        onChange={(value) => {
          onDataChange({ department: value });
          markTouched('department');
        }}
        options={DEPARTMENTS}
        placeholder="Select Department"
        error={touched.department && !formData.department ? 'Please select Department from the list.' : ''}
      />

      <AutocompleteField
        label="Manager"
        required
        value={formData.manager || ''}
        onChange={(value) => {
          onDataChange({ manager: value });
          markTouched('manager');
        }}
        options={MANAGERS}
        placeholder="Search managers"
        error={touched.manager && !formData.manager ? 'Please select Manager from the list.' : ''}
      />

      <SearchableDropdown
        label="Team"
        required
        value={formData.team || ''}
        onChange={(value) => {
          onDataChange({ team: value });
          markTouched('team');
        }}
        options={TEAMS}
        placeholder="Select Team"
        error={touched.team && !formData.team ? 'Please select Team from the list.' : ''}
      />

      <AutocompleteField
        label="Job Title"
        required
        value={formData.jobTitle || ''}
        onChange={(value) => {
          onDataChange({ jobTitle: value });
          markTouched('jobTitle');
        }}
        options={JOB_TITLES}
        placeholder="Search job titles"
        error={touched.jobTitle && !formData.jobTitle ? 'Please select Job Title from the list.' : ''}
      />

      <SearchableDropdown
        label="Employee Type"
        required
        value={formData.employeeType || ''}
        onChange={(value) => {
          onDataChange({ employeeType: value });
          markTouched('employeeType');
        }}
        options={EMPLOYEE_TYPES}
        placeholder="Select Employee Type"
        error={touched.employeeType && !formData.employeeType ? 'Please select Employee Type from the list.' : ''}
      />

      <div className="flex gap-2 pt-2">
        <button onClick={onBack} className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574]">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!validateStep2(formData)}
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

export default Step2EmploymentDetails;
