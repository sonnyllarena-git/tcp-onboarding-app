import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * CancelConfirmationModal Component
 *
 * Modal asking the user to confirm cancelling the offboarding request.
 * "Continue Request" dismisses the modal and stays on the form;
 * "Cancel Offboarding" confirms and navigates away.
 *
 * @component
 * @param {boolean} isOpen - Show/hide modal
 * @param {string} employeeName - Name shown in the confirmation message
 * @param {Function} onConfirm - Confirm cancellation (navigates to Dashboard)
 * @param {Function} onDismiss - Dismiss modal (returns to the form)
 * @returns {React.ReactElement|null} Cancel confirmation modal
 */
function CancelConfirmationModal({ isOpen, employeeName, onConfirm, onDismiss }) {
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
        aria-labelledby="offboard-cancel-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f56565]/10 text-2xl"
          aria-hidden="true"
        >
          ⚠️
        </div>
        <h2 id="offboard-cancel-title" className="mb-2 text-lg font-bold text-[#1a365d]">
          Cancel Offboarding Request?
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          You are about to cancel the offboarding request for {employeeName}. Please confirm.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            Continue Request
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#f56565] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#e53e3e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            Cancel Offboarding
          </button>
        </div>
      </div>
    </div>
  );
}

CancelConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  employeeName: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default CancelConfirmationModal;
