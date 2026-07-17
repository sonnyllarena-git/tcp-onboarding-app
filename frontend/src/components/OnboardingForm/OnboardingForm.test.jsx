import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import OnboardingForm from './OnboardingForm';
import { validateEmail, validateStep1 } from './Step1EmployeeInfo';
import { validateStep2 } from './Step2PlatformSelection';

function renderOnboardingForm() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingForm />} />
        <Route path="/" element={<div>Dashboard Stub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillStep1({
  employeeName = 'Jane Employee',
  email = 'jane.employee@thecreditpros.com',
  startDate = '2026-08-01',
} = {}) {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: employeeName } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: startDate } });
}

describe('validateEmail', () => {
  it('accepts a well-formed email address', () => {
    expect(validateEmail('employee@thecreditpros.com')).toBe(true);
  });

  it('rejects an empty string since email is required here', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects a malformed email address', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });
});

describe('validateStep1', () => {
  it('is false until all fields are filled', () => {
    expect(validateStep1({ employeeName: '', email: '', startDate: '' })).toBe(false);
  });

  it('is true once all fields are filled with a valid email', () => {
    expect(
      validateStep1({
        employeeName: 'Jane Employee',
        email: 'jane@thecreditpros.com',
        startDate: '2026-08-01',
      })
    ).toBe(true);
  });
});

describe('validateStep2', () => {
  it('is false with no platforms selected', () => {
    expect(validateStep2({ selectedPlatforms: [] })).toBe(false);
  });

  it('is true with at least one platform selected', () => {
    expect(validateStep2({ selectedPlatforms: ['Azure AD'] })).toBe(true);
  });
});

describe('OnboardingForm wizard', () => {
  it('renders Step 1 fields on initial render', () => {
    renderOnboardingForm();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('disables Next on Step 1 until every field is filled', () => {
    renderOnboardingForm();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fillStep1();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('keeps Next disabled on Step 1 when the email is malformed', () => {
    renderOnboardingForm();
    fillStep1({ email: 'not-an-email' });
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('shows an inline error for a malformed email once the field is blurred', () => {
    renderOnboardingForm();
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it('advances to Step 2 once Step 1 is valid', () => {
    renderOnboardingForm();
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Azure AD')).toBeInTheDocument();
  });

  it('disables Next on Step 2 until a platform is selected', () => {
    renderOnboardingForm();
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Azure AD'));
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('advances to Step 3 and shows the reviewed data and selected platforms', () => {
    renderOnboardingForm();
    fillStep1({ employeeName: 'Jane Employee', email: 'jane.employee@thecreditpros.com' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText('Azure AD'));
    fireEvent.click(screen.getByLabelText('Jira'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Employee')).toBeInTheDocument();
    expect(screen.getByText('jane.employee@thecreditpros.com')).toBeInTheDocument();
    expect(screen.getByText('Azure AD')).toBeInTheDocument();
    expect(screen.getByText('Jira')).toBeInTheDocument();
  });

  it('preserves entered data when navigating Back from Step 2 to Step 1', () => {
    renderOnboardingForm();
    fillStep1({ employeeName: 'Jane Employee' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Employee');
  });

  it('preserves selected platforms when navigating Back from Step 3 to Step 2', () => {
    renderOnboardingForm();
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText('Azure AD'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Azure AD')).toBeChecked();
  });

  it('opens the cancel confirmation modal when Cancel is clicked', () => {
    renderOnboardingForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('dialog', { name: /cancel request/i })).toBeInTheDocument();
  });

  it('dismisses the cancel modal and stays on the form when "Continue Request" is clicked', () => {
    renderOnboardingForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const dialog = screen.getByRole('dialog', { name: /cancel request/i });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Continue Request' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('navigates to Dashboard when the modal\'s "Cancel" button is clicked', async () => {
    renderOnboardingForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const dialog = screen.getByRole('dialog', { name: /cancel request/i });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Dashboard Stub')).toBeInTheDocument();
  });

  it('shows the success modal after Submit on Step 3', () => {
    renderOnboardingForm();
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText('Azure AD'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('dialog', { name: /request submitted/i })).toBeInTheDocument();
  });

  it('navigates to Dashboard when "Go to Dashboard" is clicked in the success modal', async () => {
    renderOnboardingForm();
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText('Azure AD'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));

    expect(await screen.findByText('Dashboard Stub')).toBeInTheDocument();
  });
});
