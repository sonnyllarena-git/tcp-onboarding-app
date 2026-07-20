function SuccessModal({ isOpen, employeeName, requestId, onClose, onViewRequest }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#1a365d] p-6 rounded-lg border border-[#d4a574]/30 max-w-sm">
        <h2 className="text-white font-bold mb-4">✅ Success!</h2>
        <p className="text-gray-300 mb-2">Onboarding request submitted for {employeeName}</p>
        <p className="text-[#d4a574] font-bold mb-6">Request ID: #{requestId}</p>
        <div className="flex gap-2">
          <button onClick={onViewRequest} className="bg-[#d4a574] text-[#1a365d] px-4 py-2 rounded flex-1 font-bold">View Request</button>
          <button onClick={onClose} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded flex-1">Done</button>
        </div>
      </div>
    </div>
  );
}

export default SuccessModal;
