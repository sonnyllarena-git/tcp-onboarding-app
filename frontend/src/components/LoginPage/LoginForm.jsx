import React, { useState } from 'react';
import PropTypes from 'prop-types';
import LoginButton from './LoginButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address. The field is optional throughout this form,
 * so an empty value is considered valid — only a non-empty, malformed
 * address is flagged.
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True when the email is empty or well-formed
 */
export function validateEmail(email) {
  if (!email) {
    return true;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * LoginForm Component
 *
 * Form component for entering credentials and initiating login.
 *
 * @component
 * @param {string} email - Current email value
 * @param {Function} onEmailChange - Callback for email input
 * @param {Function} onSubmit - Callback when form submitted
 * @param {boolean} isLoading - Loading state
 * @param {string} error - Error message
 * @param {Function} onRetry - Callback for retry button
 * @returns {React.ReactElement} LoginForm component
 */
function LoginForm({
  email = '',
  onEmailChange,
  onSubmit,
  isLoading = false,
  error = '',
  onRetry,
}) {
  const [emailTouched, setEmailTouched] = useState(false);
  const showEmailError = emailTouched && !validateEmail(email);

  const handleEmailInputChange = (event) => {
    onEmailChange(event.target.value);
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
  };

  const handleMicrosoftClick = async () => {
    try {
      await onSubmit();
    } catch (err) {
      // onSubmit is expected to catch its own errors and surface them via the
      // `error` prop. This guards the component boundary in case a caller's
      // onSubmit implementation throws directly instead of rejecting cleanly.
      console.error('LoginForm: onSubmit rejected unexpectedly.', err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-1 block text-sm text-gray-300">
          Email <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          value={email}
          onChange={handleEmailInputChange}
          onBlur={handleEmailBlur}
          placeholder="you@thecreditpros.com"
          aria-invalid={showEmailError}
          aria-describedby={showEmailError ? 'login-email-error' : undefined}
          disabled={isLoading}
          className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-400 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] disabled:cursor-not-allowed disabled:opacity-60 ${
            showEmailError ? 'border-[#f56565]' : 'border-white/20'
          }`}
        />
        {showEmailError && (
          <p id="login-email-error" role="alert" className="mt-1 text-sm text-[#f56565]">
            Please enter a valid email address.
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-[#f56565]/40 bg-[#f56565]/10 p-3">
          <p className="text-sm text-[#f56565]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm font-semibold text-white underline underline-offset-2 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            Try again
          </button>
        </div>
      )}

      <LoginButton
        text="Sign in with Microsoft"
        onClick={handleMicrosoftClick}
        isLoading={isLoading}
        disabled={isLoading}
        variant="primary"
      />
    </div>
  );
}

LoginForm.propTypes = {
  email: PropTypes.string,
  onEmailChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

export default LoginForm;
