import React from 'react';
import PropTypes from 'prop-types';

const VARIANT_STYLES = {
  primary:
    'bg-[#d4a574] text-[#1a365d] hover:bg-[#c99a63] focus-visible:ring-[#d4a574]',
  secondary:
    'bg-transparent text-white border border-white/30 hover:bg-white/10 focus-visible:ring-white/50',
  error: 'bg-[#f56565] text-white hover:bg-[#e53e3e] focus-visible:ring-[#f56565]',
};

/**
 * LoginButton Component
 *
 * Reusable button for form submission.
 *
 * @component
 * @param {string} text - Button label text
 * @param {Function} onClick - Click handler
 * @param {boolean} [disabled] - Disabled state
 * @param {boolean} [isLoading] - Loading state
 * @param {'primary'|'secondary'|'error'} [variant] - Button style variant
 * @param {'button'|'submit'|'reset'} [type] - Native button type
 * @param {string} [ariaLabel] - Accessible label, falls back to `text`
 * @returns {React.ReactElement} LoginButton component
 */
function LoginButton({
  text,
  onClick,
  disabled = false,
  isLoading = false,
  variant = 'primary',
  type = 'button',
  ariaLabel,
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel || text}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-bold transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d] disabled:cursor-not-allowed disabled:opacity-60 ${
        VARIANT_STYLES[variant] || VARIANT_STYLES.primary
      }`}
    >
      {isLoading ? (
        <>
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Signing in...</span>
        </>
      ) : (
        <span>{text}</span>
      )}
    </button>
  );
}

LoginButton.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'error']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  ariaLabel: PropTypes.string,
};

export default LoginButton;
