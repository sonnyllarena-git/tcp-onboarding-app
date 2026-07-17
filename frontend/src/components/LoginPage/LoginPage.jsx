import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import LoginForm from './LoginForm';

// TODO: Replace with the real Azure AD SDK (@azure/msal-browser / @azure/msal-react).
// This mock simulates the round trip of an interactive Microsoft sign-in:
// a short delay followed by a resolved user profile.
function mockAzureADLogin() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ email: 'employee@thecreditpros.com', name: 'TCP Employee' });
    }, 2000);
  });
}

/**
 * LoginPage Component
 *
 * Main login container for TCP Employee Onboarding Portal.
 * Handles Azure AD authentication with error states.
 *
 * All async work (`authService`) is awaited inside a try/catch and every
 * failure is turned into local `error` state rather than a thrown error, so
 * this component renders safely under a standard React error boundary.
 *
 * @component
 * @param {Function} [onLoginSuccess] - Callback when login succeeds, receives the authenticated user
 * @param {Function} [authService] - Injectable auth call, defaults to the mock Azure AD login. Swap in real MSAL logic here, or a stub in tests.
 * @returns {React.ReactElement} LoginPage component
 *
 * @example
 * <LoginPage onLoginSuccess={() => navigate('/dashboard')} />
 */
function LoginPage({ onLoginSuccess, authService = mockAzureADLogin }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage || 'Something went wrong. Please try again.');
    setIsLoading(false);
    setShowSuccess(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError('');
    setShowSuccess(false);
    setIsLoading(false);
  }, []);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
  }, []);

  const handleMicrosoftLogin = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const user = await authService();
      setIsLoading(false);
      setShowSuccess(true);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      handleError(err.message);
    }
  }, [authService, onLoginSuccess, handleError]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#1a365d] via-[#152b4d] to-[#0d1b30] px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <header className="mb-6 text-center">
          {/* TODO: Replace with the official TCP logo asset, e.g.
              <img src={tcpLogo} alt="The Credit Pros logo" className="h-14 w-14" /> */}
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d4a574]/20"
            aria-hidden="true"
          >
            <span className="text-lg font-bold text-[#d4a574]">TCP</span>
          </div>
          <h1 className="text-[28px] font-bold leading-tight text-white">
            Employee Onboarding Portal
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Sign in with your TheCreditPros Microsoft account to continue
          </p>
        </header>

        {showSuccess ? (
          <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
            <svg
              className="h-12 w-12 text-[#48bb78]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-base font-semibold text-white">Sign-in successful. Redirecting...</p>
          </div>
        ) : (
          <LoginForm
            email={email}
            onEmailChange={handleEmailChange}
            onSubmit={handleMicrosoftLogin}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onLoginSuccess: PropTypes.func,
  authService: PropTypes.func,
};

export default LoginPage;
