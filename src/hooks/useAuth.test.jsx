import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth, useAuthActions } from './useAuth';

const STORAGE_KEY = 'tcp_auth_user';

const ADMIN_ACCOUNT = {
  id: 'acc-3',
  name: 'John Doe',
  email: 'john.doe@thecreditpros.com',
  role: 'ADMIN',
  department: 'IT',
};

function TestConsumer() {
  const user = useAuth();
  const { login, logout } = useAuthActions();

  return (
    <div>
      <p data-testid="user">{user ? `${user.name} (${user.role})` : 'logged out'}</p>
      <button type="button" onClick={() => login(ADMIN_ACCOUNT)}>
        Login
      </button>
      <button type="button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('AuthProvider / useAuth / useAuthActions', () => {
  it('starts logged out when sessionStorage is empty', () => {
    renderWithProvider();
    expect(screen.getByTestId('user')).toHaveTextContent('logged out');
  });

  it('login() sets the user and persists it to sessionStorage', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByTestId('user')).toHaveTextContent('John Doe (ADMIN)');
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY))).toMatchObject({
      name: 'John Doe',
      email: 'john.doe@thecreditpros.com',
      role: 'ADMIN',
    });
  });

  it('logout() clears the user and sessionStorage', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('user')).toHaveTextContent('logged out');
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('initializes from an existing sessionStorage value on mount', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id: 'acc-1',
        name: 'Sarah Miller',
        email: 'sarah.miller@thecreditpros.com',
        role: 'USER',
        department: 'HR',
      })
    );

    renderWithProvider();

    expect(screen.getByTestId('user')).toHaveTextContent('Sarah Miller (USER)');
  });

  it('useAuth() returns null outside of an AuthProvider', () => {
    function Standalone() {
      const user = useAuth();
      return <p data-testid="standalone">{user ? 'has user' : 'no user'}</p>;
    }

    render(<Standalone />);
    expect(screen.getByTestId('standalone')).toHaveTextContent('no user');
  });

  it('useAuthActions() throws when used outside of an AuthProvider', () => {
    function Standalone() {
      useAuthActions();
      return null;
    }

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Standalone />)).toThrow();
    consoleError.mockRestore();
  });
});
