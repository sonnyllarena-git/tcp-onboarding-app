import React from 'react';
import PropTypes from 'prop-types';

/**
 * ToggleSwitch Component
 *
 * Shared accessible toggle used across the Settings sections.
 * OFF: thumb on the LEFT + gray background.
 * ON:  thumb on the RIGHT + gold background.
 *
 * @component
 * @param {boolean} checked - Current ON/OFF state
 * @param {Function} onChange - Called with the new boolean value on click
 * @param {boolean} [disabled] - If true, the toggle is non-interactive
 * @param {string} [ariaLabel] - Accessible name (each toggle represents a
 *   different setting, so callers must supply their own label)
 * @returns {React.ReactElement} ToggleSwitch component
 */
function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2
        border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]
        ${checked ? 'bg-[#d4a574]' : 'bg-gray-600'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full
          bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

ToggleSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
};

export default ToggleSwitch;
