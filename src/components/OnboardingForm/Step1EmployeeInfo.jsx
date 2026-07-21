import { MOCK_DEPARTMENT_GROUPS, MOCK_JOB_TITLES, ROLE_OPTIONS, FLOOR_OPTIONS, getAllUsers, checkDuplicateActiveUser } from '../../mockData';

export function validateStep1(formData) {
  return formData.employeeName && formData.email && formData.startDate &&
         formData.departmentId && formData.managerId && formData.jobTitleId &&
         formData.role && formData.floor &&
         formData.employeeType && formData.azureGroupId;
}

function Step1EmployeeInfo({ formData, onDataChange, onNext, onCancel }) {
  const managers = getAllUsers().filter(u => u.status === 'active');
  const isDuplicate = checkDuplicateActiveUser(formData.employeeName);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Employee Name"
        value={formData.employeeName}
        onChange={(e) => onDataChange({ employeeName: e.target.value, hasDuplicateName: checkDuplicateActiveUser(e.target.value) })}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      />
      {isDuplicate && (
        <div className="flex items-start gap-3 rounded border-l-4 border-yellow-500 bg-yellow-500/10 p-3">
          <span aria-hidden="true">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Duplicate name detected</p>
            <p className="text-xs text-yellow-300">
              An active employee with this name already exists. You can still submit - reach out to IT afterward so
              the new account gets a distinguishable work email.
            </p>
          </div>
        </div>
      )}
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => onDataChange({ email: e.target.value })}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      />
      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => onDataChange({ startDate: e.target.value })}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      />
      <select
        value={formData.departmentId}
        onChange={(e) => {
          const grp = MOCK_DEPARTMENT_GROUPS.find(g => g.id === e.target.value);
          onDataChange({
            departmentId: e.target.value,
            departmentName: grp?.name || '',
            azureGroupId: e.target.value,
            azureGroupName: grp?.name || '',
            azureGroupKey: grp?.azureGroup || '',
          });
        }}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      >
        <option value="">Select Department</option>
        {MOCK_DEPARTMENT_GROUPS.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <select
        value={formData.managerId}
        onChange={(e) => {
          const mgr = managers.find(m => m.id === Number(e.target.value));
          onDataChange({ managerId: e.target.value, managerName: mgr?.name || '' });
        }}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      >
        <option value="">Select Manager</option>
        {managers.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <select
        value={formData.jobTitleId}
        onChange={(e) => {
          const job = MOCK_JOB_TITLES.find(j => j.id === e.target.value);
          onDataChange({ jobTitleId: e.target.value, jobTitleLabel: job?.label || '' });
        }}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      >
        <option value="">Select Job Title</option>
        {MOCK_JOB_TITLES.map(j => (
          <option key={j.id} value={j.id}>{j.label}</option>
        ))}
      </select>
      <select
        value={formData.role}
        onChange={(e) => onDataChange({ role: e.target.value })}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      >
        <option value="">Select Role / Group</option>
        {ROLE_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <select
        value={formData.floor}
        onChange={(e) => onDataChange({ floor: e.target.value })}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      >
        <option value="">Select Floor</option>
        {FLOOR_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <p className="text-xs italic text-gray-400">
        Role/Group and Floor are mock data only — production will pull these from Azure AD.
      </p>
      <select
        value={formData.employeeType}
        onChange={(e) => {
          const labels = { 'internal': 'Internal (Full-time)', 'external': 'External (Contractor)' };
          onDataChange({ employeeType: e.target.value, employeeTypeLabel: labels[e.target.value] });
        }}
        className="w-full p-2 rounded bg-[#0d1b30] text-white border border-[#d4a574]/30"
      >
        <option value="">Select Type</option>
        <option value="internal">Internal (Full-time)</option>
        <option value="external">External (Contractor)</option>
      </select>
      <div className="flex gap-2">
        <button onClick={onNext} disabled={!validateStep1(formData)} className="bg-[#d4a574] text-[#1a365d] px-4 py-2 rounded disabled:opacity-50">
          Next
        </button>
        <button onClick={onCancel} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Step1EmployeeInfo;
