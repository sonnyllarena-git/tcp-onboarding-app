import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage, { validateEmail } from './LoginPage';

describe('validateEmail', () => {
  it('accepts a well-formed email address', () => {
    expect(validateEmail('employee@thecreditpros.com')).toBe(true);
  });

  it('rejects an email missing the @ symbol', () => {
    expect(validateEmail('employee.thecreditpros.com')).toBe(false);
  });

  it('rejects an email missing a domain', () => {
    expect(validateEmail('employee@')).toBe(false);
  });

  it('rejects an empty string, since email is now required', () => {
    expect(validateEmail('')).toBe(false);
  });
});

function renderLoginPage() {
  const onLoginSuccess = vi.fn();
  render(<LoginPage onLoginSuccess={onLoginSuccess} />);
  return onLoginSuccess;
}

function fillEmail(email) {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: email } });
}

describe('LoginPage', () => {
  it('renders the heading, email field, and both login buttons', () => {
    renderLoginPage();
    expect(
      screen.getByRole('heading', { name: /employee onboarding portal/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login as User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login as Admin' })).toBeInTheDocument();
  });

  it('shows a validation error and does not log in when the email is empty', async () => {
    const onLoginSuccess = renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: 'Login as User' }));

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('shows a validation error for a malformed email regardless of which button is clicked', async () => {
    const onLoginSuccess = renderLoginPage();
    fillEmail('not-an-email');
    fireEvent.click(screen.getByRole('button', { name: 'Login as Admin' }));

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('shows "Account not found" for an email with no matching account', async () => {
    const onLoginSuccess = renderLoginPage();
    fillEmail('nobody@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as User' }));

    expect(await screen.findByText(/account not found/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  }, 5000);

  it('logs in a USER account via "Login as User"', async () => {
    const onLoginSuccess = renderLoginPage();
    fillEmail('sarah.miller@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as User' }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(onLoginSuccess.mock.calls[0][0]).toMatchObject({
      email: 'sarah.miller@thecreditpros.com',
      role: 'USER',
    });
  }, 5000);

  it('denies a USER account via "Login as Admin" without logging in', async () => {
    const onLoginSuccess = renderLoginPage();
    fillEmail('sarah.miller@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as Admin' }));

    expect(
      await screen.findByText(/you don't have admin access/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  }, 5000);

  it('logs in an ADMIN account via "Login as Admin"', async () => {
    const onLoginSuccess = renderLoginPage();
    fillEmail('john.doe@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as Admin' }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(onLoginSuccess.mock.calls[0][0]).toMatchObject({
      email: 'john.doe@thecreditpros.com',
      role: 'ADMIN',
    });
  }, 5000);

  it('logs in an ADMIN account via "Login as User" — role comes from the account, not the button', async () => {
    const onLoginSuccess = renderLoginPage();
    fillEmail('john.doe@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as User' }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(onLoginSuccess.mock.calls[0][0].role).toBe('ADMIN');
  }, 5000);

  it('disables both buttons and shows a spinner while a login is in progress', async () => {
    renderLoginPage();
    fillEmail('sarah.miller@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as User' }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login as Admin' })).toBeDisabled();
  });

  it('dismisses the "no admin access" alert when its close button is clicked', async () => {
    renderLoginPage();
    fillEmail('sarah.miller@thecreditpros.com');
    fireEvent.click(screen.getByRole('button', { name: 'Login as Admin' }));

    await screen.findByText(/you don't have admin access/i, {}, { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText(/you don't have admin access/i)).not.toBeInTheDocument();
  }, 5000);

  it('renders the collapsible test accounts list', () => {
    renderLoginPage();
    expect(screen.getByText('Test accounts')).toBeInTheDocument();
    expect(screen.getByText('john.doe@thecreditpros.com (ADMIN)')).toBeInTheDocument();
    expect(screen.getByText('sarah.miller@thecreditpros.com (USER)')).toBeInTheDocument();
  });
});
