import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * CancelConfirmationModal Component
 *
 * Modal asking user to confirm request cancellation.
 * "Cancel" = Navigate to Dashboard
 * "Continue Request" = Return to form
 *
 * @component
 * @param {boolean} isOpen - Show/hide modal
 * @param {Function} onConfirm - Confirm cancellation (navigate to Dashboard)
 * @param {Function} onDismiss - Dismiss modal (return to form)
 * @returns {React.ReactElement|null} Cancel confirmation modal
 */
function CancelConfirmationModal({ isOpen, onConfirm, onDismiss }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f56565]/10 text-2xl"
          aria-hidden="true"
        >
          ⚠️
        </div>
        <h2 id="cancel-modal-title" className="mb-2 text-lg font-bold text-[#1a365d]">
          Cancel Request?
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          You are about to cancel your request. Please confirm.
        </p>
        
        {/* TWO BUTTONS - Swapped behavior */}
        <div className="flex gap-3">
          {/* CANCEL BUTTON - Navigate to Dashboard */}
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            Cancel
          </button>
          
          {/* CONTINUE REQUEST BUTTON - Return to form */}
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            Continue Request
          </button>
        </div>
      </div>
    </div>
  );
}

CancelConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default CancelConfirmationModal;