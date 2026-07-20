import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Formats an ISO datetime string into a short, readable date + time.
 * Falls back to the raw value if it can't be parsed.
 *
 * @param {string} isoDateTime - ISO 8601 datetime string
 * @returns {string} Formatted date and time, or the original value
 */
function formatDateTime(isoDateTime) {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime;
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * SuccessModal Component
 *
 * Modal shown after an offboarding request is successfully submitted.
 *
 * @component
 * @param {boolean} isOpen - Show/hide modal
 * @param {Object} [requestData] - Details of the submitted request
 * @param {string|number} requestData.requestId - Generated mock request id
 * @param {string} requestData.employeeName - Name of the employee who was offboarded
 * @param {string} requestData.submittedBy - Name of who submitted the request
 * @param {string} requestData.submittedAt - ISO datetime the request was submitted
 * @param {Array<string>} requestData.selectedPlatforms - Platforms selected for offboarding
 * @param {Function} onGoToDashboard - Navigate to the Dashboard
 * @param {Function} onViewRequest - Navigate to the new request's details page
 * @returns {React.ReactElement|null} Success modal
 */
function SuccessModal({ isOpen, requestData, onGoToDashboard, onViewRequest }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onGoToDashboard();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onGoToDashboard]);

  if (!isOpen || !requestData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offboard-success-title"
        className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl"
      >
        <h2 id="offboard-success-title" className="mb-2 text-lg font-bold text-[#1a365d]">
          ✅ Offboarding Request Submitted
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Offboarding request for {requestData.employeeName} has been submitted.
        </p>

        <dl className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-left text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Request ID</dt>
            <dd className="font-medium text-[#1a365d]">{requestData.requestId}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Submitted by</dt>
            <dd className="font-medium text-[#1a365d]">{requestData.submittedBy}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Submitted at</dt>
            <dd className="font-medium text-[#1a365d]">{formatDateTime(requestData.submittedAt)}</dd>
          </div>
        </dl>

        <div className="mb-6 text-left">
          <p className="mb-2 text-sm font-semibold text-gray-500">Selected Platforms</p>
          <div className="flex flex-wrap gap-2">
            {requestData.selectedPlatforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full bg-[#d4a574]/20 px-3 py-1 text-xs font-semibold text-[#1a365d]"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onGoToDashboard}
            className="flex-1 rounded-lg border border-[#1a365d] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={onViewRequest}
            className="flex-1 rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d]"
          >
            View Request
          </button>
        </div>
      </div>
    </div>
  );
}

SuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  requestData: PropTypes.shape({
    requestId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    employeeName: PropTypes.string,
    submittedBy: PropTypes.string,
    submittedAt: PropTypes.string,
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
  }),
  onGoToDashboard: PropTypes.func.isRequired,
  onViewRequest: PropTypes.func.isRequired,
};

export default SuccessModal;
