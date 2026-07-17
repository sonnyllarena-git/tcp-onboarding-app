import React from 'react';
import PropTypes from 'prop-types';

const ACTIONS = [
  { key: 'New Onboarding', icon: '➕' },
  { key: 'View Requests', icon: '📋' },
  { key: 'Generate Report', icon: '📊' },
  { key: 'Settings', icon: '⚙️' },
];

/**
 * QuickActions Component
 *
 * Shows quick action buttons for common tasks.
 *
 * @component
 * @param {Function} onAction - Callback when action button clicked, receives the action name
 * @returns {React.ReactElement} QuickActions component
 */
function QuickActions({ onAction }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <h2 className="mb-4 text-base font-bold text-[#1a365d]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ACTIONS.map(({ key, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onAction(key)}
            aria-label={key}
            className="flex flex-col items-center gap-2 rounded-lg bg-[#d4a574] px-4 py-3 text-base font-bold text-[#1a365d] transition-all duration-200 hover:bg-[#c99a63] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d] focus-visible:ring-offset-2"
          >
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="text-center text-sm leading-tight sm:text-base">{key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

QuickActions.propTypes = {
  onAction: PropTypes.func.isRequired,
};

export default QuickActions;
