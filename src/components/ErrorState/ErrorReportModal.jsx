import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { IT_SUPPORT } from '../../mockData';

/**
 * Detects the browser name from the user agent string. Best-effort only —
 * good enough for an IT support report, not for feature detection. Checks
 * "Edg" before "Chrome" since Chromium-based Edge's user agent contains
 * both tokens.
 * @returns {string} Browser name
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown Browser';
}

/**
 * Detects the OS name from the user agent string. Best-effort only.
 * @returns {string} OS name
 */
export function getOSInfo() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows NT 10')) return 'Windows 10';
  if (ua.includes('Windows NT 11')) return 'Windows 11';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown OS';
}

/**
 * Gathers everything needed for an IT support error report: the error
 * itself, who hit it (from useAuth()), the current URL/time, and basic
 * browser/OS/screen info for troubleshooting. No user input required.
 *
 * @param {Object} params
 * @param {number} params.errorCode - HTTP error code
 * @param {string} params.errorTitle - Error title
 * @param {Object|null} params.user - Current user from useAuth(), or null
 * @returns {Object} The assembled error report
 */
export function collectErrorReport({ errorCode, errorTitle, user }) {
  return {
    errorCode,
    errorTitle,
    url: window.location.href,
    timestamp: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    userName: user?.name || 'Not logged in',
    userEmail: user?.email || 'Unknown',
    userRole: user?.role || 'Unknown',
    userDepartment: user?.department || 'Unknown',
    browser: getBrowserInfo(),
    os: getOSInfo(),
    screenSize: `${window.screen.width}x${window.screen.height}`,
  };
}

/**
 * Formats an error report as the plain-text block shown in the modal's
 * preview box and copied by "Copy Report."
 * @param {Object} report - Report from collectErrorReport()
 * @returns {string} Formatted report text
 */
export function buildReportText(report) {
  return `
TCP Onboarding App — Error Report
===================================
Error Code:    ${report.errorCode}
Error Title:   ${report.errorTitle}
URL:           ${report.url}
Timestamp:     ${report.timestamp}
-----------------------------------
User:          ${report.userName}
Email:         ${report.userEmail}
Role:          ${report.userRole}
Department:    ${report.userDepartment}
-----------------------------------
Browser:       ${report.browser}
OS:            ${report.os}
Screen Size:   ${report.screenSize}
===================================
Please attach a screenshot of the error page.
`.trim();
}

/**
 * Builds a mailto: URL addressed to IT Support, pre-filled with the error
 * report as the subject/body.
 * @param {Object} report - Report from collectErrorReport()
 * @returns {string} mailto URL
 */
export function buildMailtoUrl(report) {
  const subject = encodeURIComponent(`[TCP App Error] ${report.errorCode} — ${report.errorTitle}`);
  const body = encodeURIComponent(
    `
Hi IT Support,

I encountered an error in the TCP Onboarding App. Details below:

Error Code:    ${report.errorCode}
Error Title:   ${report.errorTitle}
URL:           ${report.url}
Timestamp:     ${report.timestamp}

User:          ${report.userName}
Email:         ${report.userEmail}
Role:          ${report.userRole}
Department:    ${report.userDepartment}

Browser:       ${report.browser}
OS:            ${report.os}
Screen Size:   ${report.screenSize}

[Please attach a screenshot of the error page]

Thank you,
${report.userName}
`.trim()
  );

  return `mailto:${IT_SUPPORT.email}?subject=${subject}&body=${body}`;
}

/**
 * ErrorReportModal Component
 *
 * Shown when a user clicks "Report this error to IT" on any error page.
 * Auto-collects error/user/browser details (no manual input) and offers
 * two actions: copy the report as text, or open a pre-filled email to IT.
 *
 * @component
 * @param {boolean} isOpen - Show/hide the modal
 * @param {Function} onClose - Callback to close the modal
 * @param {number} errorCode - HTTP error code (404 | 403 | 500)
 * @param {string} errorTitle - Error title, e.g. "Page Not Found"
 * @returns {React.ReactElement|null} ErrorReportModal component
 */
function ErrorReportModal({ isOpen, onClose, errorCode, errorTitle }) {
  const user = useAuth();
  const [copied, setCopied] = useState(false);

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

  const report = collectErrorReport({ errorCode, errorTitle, user });
  const reportText = buildReportText(report);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmail = () => {
    window.location.href = buildMailtoUrl(report);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-report-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[#d4a574]/30 bg-[#0d1b30] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="error-report-title" className="text-lg font-bold text-white">
            📋 Report Error to IT Support
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-gray-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            &times;
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-300">
          Your error details have been captured. Send this report to IT so they can troubleshoot
          the issue.
        </p>

        <pre className="mb-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[#1a365d]/40 p-4 text-left font-mono text-xs text-gray-200">
          {reportText}
        </pre>

        <p className="mb-4 text-xs text-gray-400">
          📸 Tip: Take a screenshot before sending. Press Win+Shift+S to capture your screen.
        </p>

        <div className="mb-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`rounded-lg border px-5 py-2 text-sm font-bold transition-colors ${
              copied
                ? 'border-[#48bb78] text-[#48bb78]'
                : 'border-[#d4a574]/60 text-[#d4a574] hover:bg-[#d4a574]/10'
            }`}
          >
            {copied ? 'Copied! ✓' : '📋 Copy Report'}
          </button>
          <button
            type="button"
            onClick={handleEmail}
            className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c4956a]"
          >
            📧 Email IT
          </button>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#d4a574]/20" aria-hidden="true" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="h-px flex-1 bg-[#d4a574]/20" aria-hidden="true" />
        </div>

        <p className="text-center text-xs italic text-gray-500">
          In production, this will automatically create a Jira ticket and notify the IT Support
          Teams channel. No manual email needed.
        </p>
      </div>
    </div>
  );
}

ErrorReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  errorCode: PropTypes.number.isRequired,
  errorTitle: PropTypes.string.isRequired,
};

export default ErrorReportModal;
