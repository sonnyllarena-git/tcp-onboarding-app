import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorReportModal from './ErrorReportModal';

/**
 * ErrorState Component
 *
 * Base error page used by NotFoundPage (404), ForbiddenPage (403), and
 * ServerErrorPage (500). Every error page gets the same TCP-branded layout
 * and a "Report this error to IT" button that opens ErrorReportModal.
 *
 * @component
 * @param {number} code - HTTP error code
 * @param {string} icon - Emoji icon
 * @param {string} title - Error title
 * @param {string} message - Descriptive error message
 * @param {string} suggestion - What the user can do next
 * @param {{label: string, onClick: Function}} primaryAction - Main action button
 * @param {{label: string, onClick: Function}} [secondaryAction] - Optional second action button
 * @returns {React.ReactElement} ErrorState component
 */
function ErrorState({ code, icon, title, message, suggestion, primaryAction, secondaryAction }) {
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a365d] to-[#0d1b30] p-6 dark:from-[#0a0f1e] dark:to-[#0a0f1e]">
      <div className="w-full max-w-lg rounded-2xl border border-[#d4a574]/20 bg-[#1a365d]/30 p-12 text-center">
        {/* Icon */}
        <div className="mb-4 text-6xl">{icon}</div>

        {/* Error Code */}
        <div className="mb-2 text-8xl font-bold text-[#d4a574]">{code}</div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-semibold text-white">{title}</h1>

        {/* Message */}
        <p className="mb-4 text-sm leading-relaxed text-gray-300">{message}</p>

        {/* Suggestion */}
        <p className="mb-8 text-sm text-gray-400">💡 {suggestion}</p>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="rounded-lg bg-[#d4a574] px-6 py-2.5 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c4956a]"
          >
            {primaryAction.label}
          </button>
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="rounded-lg border border-[#d4a574]/50 px-6 py-2.5 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/10"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-[#d4a574]/20" />

        {/* Footer */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500">
            Need help?{' '}
            <a href="mailto:it@thecreditpros.com" className="text-[#d4a574] hover:underline">
              Contact IT Support
            </a>
          </p>
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="text-xs text-gray-500 underline transition-colors hover:text-gray-300"
          >
            📋 Report this error to IT
          </button>
        </div>
      </div>

      <ErrorReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        errorCode={code}
        errorTitle={title}
      />
    </div>
  );
}

ErrorState.propTypes = {
  code: PropTypes.number.isRequired,
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  suggestion: PropTypes.string.isRequired,
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }).isRequired,
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
};

export default ErrorState;
