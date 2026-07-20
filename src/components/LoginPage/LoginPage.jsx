import React, { useState } from 'react';
import PropTypes from 'prop-types';
import tcpLogo from '../../assets/tcp-logo.png';
import { getMockAccountByEmail } from '../../mockData';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOCK_LOGIN_DELAY_MS = 1500;

const TEST_ACCOUNTS = [
  { email: 'sarah.miller@thecreditpros.com', role: 'USER' },
  { email: 'emma.davis@thecreditpros.com', role: 'USER' },
  { email: 'john.doe@thecreditpros.com', role: 'ADMIN' },
  { email: 'sonnyl@thecreditpros.com', role: 'ADMIN' },
];

/**
 * Validates an email address. Unlike the old SSO form, email is now
 * required, so an empty value is invalid.
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True when the email is non-empty and well-formed
 */
export function validateEmail(email) {
  return EMAIL_REGEX.test((email || '').trim());
}

/**
 * LoginPage Component
 *
 * Mock role-based login for TCP Employee Onboarding Portal. Simulates the
 * future production setup where an Azure AD group membership
 * ("TCPOnboardingAppAdmin" / "TCPOnboardingAppUser") maps to an app role:
 * "Login as User" accepts either role, "Login as Admin" only accepts
 * accounts whose role is actually ADMIN. Role always comes from the
 * looked-up account, never from which button was clicked.
 *
 * @component
 * @param {Function} onLoginSuccess - Callback with the matched MOCK_ACCOUNTS entry
 * @returns {React.ReactElement} LoginPage component
 */
function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [loadingButton, setLoadingButton] = useState(null); // 'user' | 'admin' | null
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const isLoading = loadingButton !== null;

  const attemptLogin = async (requestedRole) => {
    setError(null);
    setAccessDenied(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoadingButton(requestedRole);
    await new Promise((resolve) => setTimeout(resolve, MOCK_LOGIN_DELAY_MS));

    const account = getMockAccountByEmail(email);
    if (!account) {
      setError('Account not found. Contact IT to request access.');
      setLoadingButton(null);
      return;
    }

    if (requestedRole === 'admin' && account.role !== 'ADMIN') {
      setAccessDenied(true);
      setLoadingButton(null);
      return;
    }

    onLoginSuccess(account);
    setLoadingButton(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#d4a574] border-opacity-20 bg-[#1a365d] bg-opacity-50 p-8 shadow-2xl backdrop-blur-lg sm:p-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center justify-center rounded-lg bg-[#d4a574] p-3 shadow-lg">
            <img src={tcpLogo} alt="The Credit Pros logo" className="h-12 w-auto sm:h-14" />
          </div>
        </div>

        {/* Header Text */}
        <h1 className="mb-2 text-center text-2xl font-bold text-white sm:text-3xl">
          Employee Onboarding Portal
        </h1>
        <p className="mb-8 text-center text-sm text-gray-300 sm:text-base">
          Sign in with your TheCreditPros account to continue
        </p>

        {/* Access Denied Alert */}
        {accessDenied && (
          <div role="alert" className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-red-500 border-opacity-50 bg-red-500 bg-opacity-10 p-4">
            <p className="text-sm font-medium text-red-400">You don&apos;t have Admin Access.</p>
            <button
              type="button"
              onClick={() => setAccessDenied(false)}
              aria-label="Dismiss"
              className="shrink-0 text-red-400 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              &times;
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-red-500 border-opacity-50 bg-red-500 bg-opacity-10 p-4">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* Email Field */}
        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@thecreditpros.com"
            className="w-full rounded-lg border border-[#d4a574] border-opacity-30 bg-[#0d1b30] px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#d4a574] focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:ring-opacity-20"
            disabled={isLoading}
          />
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => attemptLogin('user')}
            disabled={isLoading}
            className="w-full rounded-lg bg-[#d4a574] px-4 py-3 font-bold text-[#1a365d] transition-all duration-200 hover:bg-[#c99a63] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            {loadingButton === 'user' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a365d] border-t-transparent" />
                Signing in...
              </span>
            ) : (
              'Login as User'
            )}
          </button>

          <button
            type="button"
            onClick={() => attemptLogin('admin')}
            disabled={isLoading}
            className="w-full rounded-lg border border-[#d4a574] px-4 py-3 font-bold text-[#d4a574] transition-all duration-200 hover:bg-[#d4a574] hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            {loadingButton === 'admin' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d4a574] border-t-transparent" />
                Signing in...
              </span>
            ) : (
              'Login as Admin'
            )}
          </button>
        </div>

        {/* Test Accounts Helper */}
        <details className="mt-6 text-xs text-gray-400">
          <summary className="cursor-pointer select-none hover:text-gray-300">Test accounts</summary>
          <ul className="mt-2 space-y-1 pl-1">
            {TEST_ACCOUNTS.map((account) => (
              <li key={account.email}>{`${account.email} (${account.role})`}</li>
            ))}
          </ul>
        </details>

        {/* Footer Text */}
        <p className="mt-6 text-center text-xs text-gray-400">
          SSO via Microsoft will replace this login in production.
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};

export default LoginPage;
