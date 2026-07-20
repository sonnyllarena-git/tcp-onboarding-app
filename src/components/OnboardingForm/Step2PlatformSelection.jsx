export function validateStep2(formData) {
  return formData.selectedPlatforms.length > 0;
}

function Step2PlatformSelection({ formData, onDataChange, onNext, onBack, onCancel }) {
  const platforms = ['Azure AD', 'Keeper', 'Hodu', 'Krisp', 'Jira', 'Zoho Desk'];

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold">Select Platforms</h2>
      <div className="space-y-2">
        {platforms.map(p => (
          <label key={p} className="flex items-center text-white">
            <input
              type="checkbox"
              checked={formData.selectedPlatforms.includes(p)}
              onChange={(e) => {
                const selected = e.target.checked
                  ? [...formData.selectedPlatforms, p]
                  : formData.selectedPlatforms.filter(x => x !== p);
                onDataChange({ selectedPlatforms: selected });
              }}
              className="mr-2"
            />
            {p}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded">Back</button>
        <button onClick={onNext} disabled={!validateStep2(formData)} className="bg-[#d4a574] text-[#1a365d] px-4 py-2 rounded disabled:opacity-50">
          Next
        </button>
        <button onClick={onCancel} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded">Cancel</button>
      </div>
    </div>
  );
}

export default Step2PlatformSelection;
