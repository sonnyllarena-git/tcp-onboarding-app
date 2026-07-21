import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { getAllRequests, buildTransitionChangeSummary } from '../../mockData';

const STATUS_BADGE_STYLES = {
  completed: 'bg-[#48bb78]/15 text-[#48bb78]',
  pending: 'bg-[#4299e1]/15 text-[#4299e1]',
  'in-progress': 'bg-[#4299e1]/15 text-[#4299e1]',
};

const TYPE_LABELS = {
  Onboarding: 'Onboarded',
  Offboarding: 'Offboarded',
  Transition: 'Transitioned',
};

/**
 * Builds the one-line summary shown under a history entry.
 * @param {Object} request
 * @returns {string}
 */
function buildEntrySummary(request) {
  if (request.type === 'Transition') {
    return buildTransitionChangeSummary(request);
  }
  if (request.type === 'Offboarding') {
    return `Employee offboarded from ${request.departmentName || 'N/A'}.`;
  }
  return `Employee onboarded to ${request.departmentName || 'N/A'}.`;
}

/**
 * Formats an ISO datetime (or display date string) as "Month D, YYYY".
 * @param {string} value
 * @returns {string}
 */
function formatHistoryDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * EmployeeHistoryModal Component
 *
 * Read-only timeline of every onboarding/offboarding/transition request
 * tied to this employee's email (the same match key RequestDetails'
 * "Other Requests for This Employee" section already uses), newest
 * first. Opened from UserDetailsModal as a second, stacked modal.
 *
 * @component
 * @param {Object} user - The employee whose history to show
 * @param {Function} onClose - Close this modal
 * @returns {React.ReactElement} EmployeeHistoryModal component
 */
function EmployeeHistoryModal({ user, onClose }) {
  const history = useMemo(() => {
    const email = (user.email || '').toLowerCase();
    return getAllRequests()
      .filter((r) => (r.email || '').toLowerCase() === email)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [user.email]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-history-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#d4a574]/20 bg-[#1a2d4a] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[#d4a574]/10 px-5 py-4">
          <span id="employee-history-title" className="text-sm font-medium tracking-wide text-[#d4a574]">
            Employee History
          </span>
          <span className="flex-1 text-sm text-gray-400">{user.name}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-base leading-none text-gray-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            &#10005;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No history found for this employee.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-md border-l-2 border-[#d4a574]/30 bg-black/20 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-[#d4a574]">{TYPE_LABELS[entry.type] || entry.type}</span>
                    <span className="flex-1 text-xs text-gray-500">{formatHistoryDate(entry.createdAt)}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] ${STATUS_BADGE_STYLES[entry.status] || 'bg-white/10 text-gray-400'}`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-xs font-normal leading-relaxed text-gray-400">{buildEntrySummary(entry)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

EmployeeHistoryModal.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EmployeeHistoryModal;
