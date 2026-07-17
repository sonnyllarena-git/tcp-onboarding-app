import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * CancelConfirmationModal Component
 *
 * Modal asking user to confirm request cancellation.
 *
 * @component
 * @param {boolean} isOpen - Show/hide modal
 * @param {Function} onConfirm - Confirm cancellation (navigates away)
 * @param {Function} onDismiss - Dismiss modal (returns to the form)
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-confirm-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
      >
        <h2 id="cancel-confirm-title" className="mb-2 text-lg font-bold text-[#1a365d]">
          Cancel Request?
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          You are about to cancel your request. Please confirm.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
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
