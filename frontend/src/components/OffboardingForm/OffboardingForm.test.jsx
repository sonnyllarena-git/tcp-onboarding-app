import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import OffboardingForm from './OffboardingForm';
import { validateStep1, getTodayIsoDate } from './Step1EmployeeInfo';
import { validateStep2 } from './Step2OffboardingActions';
import { getMockUserById } from '../../mockData';

function renderOffboardingForm(userId = '7') {
  return render(
    <MemoryRouter initialEntries={[`/offboard/${userId}`]}>
      <Routes>
        <Route path="/offboard/:userId" element={<OffboardingForm />} />
        <Route path="/" element={<div>Dashboard Stub</div>} />
        <Route path="/manage-users" element={<div>Manage Users Stub</div>} />
        <Route path="/requests/:id" element={<div>Request Details Stub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillStep1({ reason = 'Termination', offboardingDate = getTodayIsoDate() } = {}) {
  fireEvent.change(screen.getByLabelText(/offboarding reason/i), { target: { value: reason } });
  fireEvent.change(screen.getByLabelText(/offboarding date/i), {
    target: { value: offboardingDate },
  });
}

describe('validateStep1', () => {
  const TODAY = '2026-07-18';

  it('is false until a reason and offboarding date are set', () => {
    expect(
      validateStep1({ offboardingReason: '', offboardingDate: '', finalDay: '' }, TODAY)
    ).toBe(false);
  });

  it('is false when the offboarding date is in the past', () => {
    expect(
      validateStep1(
        { offboardingReason: 'Termination', offboardingDate: '2026-07-01', finalDay: '' },
        TODAY
      )
    ).toBe(false);
  });

  it('is false when the final day is before the offboarding date', () => {
    expect(
      validateStep1(
        {
          offboardingReason: 'Termination',
          offboardingDate: '2026-07-20',
          finalDay: '2026-07-15',
        },
        TODAY
      )
    ).toBe(false);
  });

  it('is true with a reason, a non-past offboarding date, and no final day', () => {
    expect(
      validateStep1(
        { offboardingReason: 'Resignation', offboardingDate: TODAY, finalDay: '' },
        TODAY
      )
    ).toBe(true);
  });

  it('is true when the final day is on or after the offboarding date', () => {
    expect(
      validateStep1(
        {
          offboardingReason: 'Resignation',
          offboardingDate: '2026-07-20',
          finalDay: '2026-07-20',
        },
        TODAY
      )
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

describe('getMockUserById', () => {
  it('resolves an active user by id', () => {
    expect(getMockUserById(7).name).toBe('John Doe');
    expect(getMockUserById(7).status).toBe('active');
  });

  it('returns null for an unknown id', () => {
    expect(getMockUserById(9999)).toBeNull();
  });

  it('coerces a string id', () => {
    expect(getMockUserById('8').name).toBe('Jane Smith');
  });
});

describe('OffboardingForm wizard', () => {
  it('loads the correct employee from the userId in the URL', () => {
    renderOffboardingForm('7');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@thecreditpros.com')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('Robert Chen')).toBeInTheDocument();
  });

  it('shows a not-found message for an unknown userId', () => {
    renderOffboardingForm('9999');
    expect(screen.getByRole('alert')).toHaveTextContent(/no employee found/i);
  });

  it('shows a not-active message when the user is not active', () => {
    renderOffboardingForm('1'); // Olivia Martin is pending, not active
    expect(screen.getByRole('alert')).toHaveTextContent(/not active/i);
  });

  it('disables the Back button on Step 1', () => {
    renderOffboardingForm('7');
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  it('disables Next on Step 1 until reason and date are filled', () => {
    renderOffboardingForm('7');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fillStep1();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('advances to Step 2 once Step 1 is valid', () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/azure ad/i)).toBeInTheDocument();
  });

  it('preserves the offboarding reason when navigating back from Step 2', () => {
    renderOffboardingForm('7');
    fillStep1({ reason: 'Resignation' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText(/offboarding reason/i)).toHaveValue('Resignation');
  });

  it('disables Next on Step 2 until a platform is selected', () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('advances to Step 3 showing the summary and selected actions', () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    fireEvent.click(screen.getByLabelText(/keeper/i));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Robert Chen')).toBeInTheDocument();
    expect(screen.getByText(/Azure AD - Disable account/)).toBeInTheDocument();
    expect(screen.getByText(/Keeper - Delete credentials/)).toBeInTheDocument();
  });

  it('preserves selected platforms when navigating back from Step 3', () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText(/azure ad/i)).toBeChecked();
  });

  it('disables Submit until the confirmation checkbox is checked', () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/i confirm this employee should be offboarded/i));
    expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
  });

  it('shows an "are you sure" prompt before submitting, and "No" returns to the form', () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/i confirm this employee should be offboarded/i));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const dialog = screen.getByRole('dialog', { name: /confirm offboarding/i });
    expect(dialog).toHaveTextContent(/are you sure you want to offboard john doe/i);

    fireEvent.click(within(dialog).getByRole('button', { name: 'No' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
  });

  it('submits after confirming "Yes" and shows the success modal', async () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/i confirm this employee should be offboarded/i));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const dialog = screen.getByRole('dialog', { name: /confirm offboarding/i });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Yes' }));

    expect(
      await screen.findByRole('dialog', { name: /offboarding request submitted/i }, { timeout: 3000 })
    ).toBeInTheDocument();
  }, 10000);

  it('opens the cancel confirmation modal with the employee name in the message', () => {
    renderOffboardingForm('7');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.getByRole('dialog', { name: /cancel offboarding request/i })
    ).toHaveTextContent(/John Doe/);
  });

  it('dismisses the cancel modal and stays on the form when "Continue Request" is clicked', () => {
    renderOffboardingForm('7');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue Request' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('navigates to Dashboard when "Cancel Offboarding" is clicked', async () => {
    renderOffboardingForm('7');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Offboarding' }));
    expect(await screen.findByText('Dashboard Stub')).toBeInTheDocument();
  });

  it('navigates from the success modal to Dashboard or the new request', async () => {
    renderOffboardingForm('7');
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/azure ad/i));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText(/i confirm this employee should be offboarded/i));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: /confirm offboarding/i })).getByRole('button', { name: 'Yes' }));

    await screen.findByRole('dialog', { name: /offboarding request submitted/i }, { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: 'View Request' }));
    expect(await screen.findByText('Request Details Stub')).toBeInTheDocument();
  }, 10000);
});
