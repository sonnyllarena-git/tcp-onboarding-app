import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * SuccessModal Component
 *
 * Modal showing success message after submission.
 *
 * @component
 * @param {boolean} isOpen - Show/hide modal
 * @param {Function} onClose - Close the modal (navigates to Dashboard)
 * @returns {React.ReactElement|null} Success modal
 */
function SuccessModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#48bb78]/10 text-2xl"
          aria-hidden="true"
        >
          ✅
        </div>
        <h2 id="success-modal-title" className="mb-2 text-lg font-bold text-[#1a365d]">
          Request Submitted
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Request Submitted. Status can be checked in View Request Page
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

SuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SuccessModal;
