import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * useAuth.js
 *
 * Real (client-only) auth context backed by sessionStorage, standing in
 * for a future MSAL/Azure AD session. `login(account)` and `logout()` are
 * exposed separately via `useAuthActions()` so that `useAuth()` itself can
 * keep returning the current user object directly — every existing caller
 * (e.g. AuditLogs' `const user = useAuth();`) keeps working unchanged.
 *
 * TODO: When real SSO session data is available, replace `login`'s account
 * argument with the actual MSAL token claims instead of a MOCK_ACCOUNTS entry.
 */

const STORAGE_KEY = 'tcp_auth_user';

const AuthContext = createContext(null);

/**
 * Reads the persisted user from sessionStorage, if any.
 * @returns {Object|null} The stored user, or null if absent/unparsable
 */
function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * AuthProvider Component
 *
 * Holds the current signed-in user, lazily initialized from sessionStorage
 * so a page reload or a direct URL visit doesn't bounce the user back to
 * the login page.
 *
 * @component
 * @param {React.ReactNode} children
 * @returns {React.ReactElement} AuthProvider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback((account) => {
    const nextUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      department: account.department,
    };
    setUser(nextUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // Written with createElement (not JSX) so this hook file can keep its
  // plain .js extension, matching mockData.js's convention in this codebase
  // of reserving .jsx for files that need JSX syntax.
  return React.createElement(AuthContext.Provider, { value: { user, login, logout } }, children);
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Returns the current signed-in user, or null when logged out.
 * @returns {{id: string, name: string, email: string, role: string, department: string}|null}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  return context ? context.user : null;
}

/**
 * Returns { login, logout } for components that change auth state
 * (LoginPage, Header, App) — kept separate from useAuth() so read-only
 * consumers don't need an AuthProvider-aware mock to call it.
 * @returns {{login: Function, logout: Function}}
 */
export function useAuthActions() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return { login: context.login, logout: context.logout };
}

export default useAuth;
