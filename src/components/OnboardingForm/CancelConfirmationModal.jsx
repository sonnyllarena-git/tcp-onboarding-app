function CancelConfirmationModal({ isOpen, onConfirm, onDismiss }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#1a365d] p-6 rounded-lg border border-[#d4a574]/30 max-w-sm">
        <h2 className="text-white font-bold mb-4">Cancel Onboarding?</h2>
        <p className="text-gray-300 mb-6">Are you sure? All progress will be lost.</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded">Cancel</button>
          <button onClick={onDismiss} className="border border-[#d4a574] text-[#d4a574] px-4 py-2 rounded">Continue Onboarding</button>
        </div>
      </div>
    </div>
  );
}

export default CancelConfirmationModal;
