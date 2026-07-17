import React, { useState } from 'react';
import PropTypes from 'prop-types';
import tcpLogo from '../../assets/tcp-logo.png';

/**
 * LoginPage Component
 *
 * SSO login page for TCP Employee Onboarding Portal.
 * Displays TCP logo and "Sign in with Microsoft" button.
 * Uses mock SSO for local development, will integrate real Azure AD on production.
 *
 * @component
 * @param {Function} onLoginSuccess - Callback when user successfully logs in
 * @returns {React.ReactElement} LoginPage component
 *
 * @example
 * <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
 */
function LoginPage({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle Microsoft SSO login click
   * Mock: Simulates 2-second login delay
   * Production: Will call real Azure AD MSAL SDK
   *
   * TODO: Replace with real Azure AD MSAL integration
   */
  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock SSO: Simulate 2-second login delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock user data from SSO
      const mockUser = {
        name: 'John Doe',
        email: 'john.doe@thecreditpros.com',
        id: 'user-123',
      };

      // TODO: Replace with real Azure AD response
      console.log('SSO Login successful (mock):', mockUser);
      onLoginSuccess(mockUser);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#d4a574] border-opacity-20 bg-[#1a365d] bg-opacity-50 p-8 shadow-2xl backdrop-blur-lg sm:p-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center justify-center rounded-lg bg-[#d4a574] p-3 shadow-lg">
            <img
              src={tcpLogo}
              alt="The Credit Pros logo"
              className="h-12 w-auto sm:h-14"
            />
          </div>
        </div>

        {/* Header Text */}
        <h1 className="mb-2 text-center text-2xl font-bold text-white sm:text-3xl">
          Employee Onboarding Portal
        </h1>
        <p className="mb-8 text-center text-sm text-gray-300 sm:text-base">
          Sign in with your TheCreditPros Microsoft account to continue
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500 border-opacity-50 bg-red-500 bg-opacity-10 p-4">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* Email Field (Optional for future use) */}
        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@thecreditpros.com"
            className="w-full rounded-lg border border-[#d4a574] border-opacity-30 bg-[#0d1b30] px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#d4a574] focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:ring-opacity-20"
            disabled={isLoading}
          />
        </div>

        {/* Microsoft Login Button */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={isLoading}
          aria-label="Sign in with Microsoft"
          className="w-full rounded-lg bg-[#d4a574] px-4 py-3 font-bold text-[#1a365d] transition-all duration-200 hover:bg-[#c99a63] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a365d] border-t-transparent"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign in with Microsoft'
          )}
        </button>

        {/* Footer Text */}
        <p className="mt-6 text-center text-xs text-gray-400">
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