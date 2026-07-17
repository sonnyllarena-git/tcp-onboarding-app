import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import LoginButton from './LoginButton';
import { validateEmail } from './LoginForm';

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

  it('treats an empty string as valid since the field is optional', () => {
    expect(validateEmail('')).toBe(true);
  });
});

describe('LoginPage', () => {
  it('renders the heading and the Microsoft sign-in button', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: /employee onboarding portal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in with microsoft/i })
    ).toBeInTheDocument();
  });

  it('shows a loading state and disables the button while authenticating', async () => {
    let resolveLogin;
    const authService = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );
    render(<LoginPage authService={authService} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with microsoft/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeDisabled();

    resolveLogin({ email: 'employee@thecreditpros.com', name: 'TCP Employee' });
    await waitFor(() => expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument());
  });

  it('calls onLoginSuccess with the authenticated user after a successful login', async () => {
    const user = { email: 'employee@thecreditpros.com', name: 'TCP Employee' };
    const authService = vi.fn().mockResolvedValue(user);
    const onLoginSuccess = vi.fn();
    render(<LoginPage authService={authService} onLoginSuccess={onLoginSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with microsoft/i }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(user));
    expect(screen.getByText(/sign-in successful/i)).toBeInTheDocument();
  });

  it('displays an error message when authentication fails', async () => {
    const authService = vi
      .fn()
      .mockRejectedValue(new Error('Azure AD sign-in failed. Please try again.'));
    render(<LoginPage authService={authService} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with microsoft/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/azure ad sign-in failed/i);
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).not.toBeDisabled();
  });

  it('clears the error and returns to the form when "Try again" is clicked', async () => {
    const authService = vi.fn().mockRejectedValue(new Error('Network error.'));
    render(<LoginPage authService={authService} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with microsoft/i }));
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('updates the email field as the user types', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'employee@thecreditpros.com' } });
    expect(emailInput).toHaveValue('employee@thecreditpros.com');
  });

  it('shows a validation message for an invalid email once the field loses focus', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it('does not show a validation message while the field still has focus', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    expect(screen.queryByText(/enter a valid email/i)).not.toBeInTheDocument();
  });

  it('does not show a validation message for an empty, untouched email field', () => {
    render(<LoginPage />);
    expect(screen.queryByText(/enter a valid email/i)).not.toBeInTheDocument();
  });
});

describe('LoginButton', () => {
  it('renders the loading spinner and disables the button when isLoading is true', () => {
    render(<LoginButton text="Sign in" onClick={() => {}} isLoading />);
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('invokes onClick when enabled and clicked', () => {
    const onClick = vi.fn();
    render(<LoginButton text="Sign in" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onClick when disabled', () => {
    const onClick = vi.fn();
    render(<LoginButton text="Sign in" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('logs a PropTypes warning when the required onClick prop is omitted', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<LoginButton text="Sign in" />);
    const loggedOnClickWarning = consoleError.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('onClick'))
    );
    expect(loggedOnClickWarning).toBe(true);
    consoleError.mockRestore();
  });
});
