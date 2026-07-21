function Step3Review({ formData, onSubmit, onBack, onCancel, submitting }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#0d1b30] p-4 rounded text-gray-300 space-y-2">
        <p><strong>Name:</strong> {formData.employeeName}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Department:</strong> {formData.departmentName}</p>
        <p><strong>Manager:</strong> {formData.managerName}</p>
        <p><strong>Job Title:</strong> {formData.jobTitleLabel}</p>
        <p><strong>Role / Group:</strong> {formData.role}</p>
        <p><strong>Floor:</strong> {formData.floor}</p>
        <p><strong>Employee Type:</strong> {formData.employeeTypeLabel}</p>
        <p><strong>Platforms:</strong> {formData.selectedPlatforms.join(', ')}</p>
      </div>
      {formData.hasDuplicateName && (
        <div className="flex items-start gap-3 rounded border-l-4 border-yellow-500 bg-yellow-500/15 p-3">
          <span aria-hidden="true">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Duplicate name detected</p>
            <p className="text-xs text-yellow-300">
              An active employee with this name already exists. Submission is not blocked, but flag it for IT so the
              new Azure account gets a distinguishable work email.
            </p>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onBack} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded">Back</button>
        <button onClick={onSubmit} disabled={submitting} className="bg-[#d4a574] text-[#1a365d] px-4 py-2 rounded disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button onClick={onCancel} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded">Cancel</button>
      </div>
    </div>
  );
}

export default Step3Review;
