import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import RequestDetails, { getRequestById, formatDate } from './RequestDetails';
import PlatformStatus, { getPlatformIcon } from './PlatformStatus';
import DetailSection from './DetailSection';

function renderRequestDetails(initialPath = '/requests/107') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/requests/:id" element={<RequestDetails />} />
        <Route path="/requests" element={<div>Requests Page Stub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('getRequestById', () => {
  it('resolves the matching mock request for a known id', async () => {
    const result = await getRequestById(107);
    expect(result.employeeName).toBe('John Doe');
  });

  it('resolves null for an unknown id', async () => {
    const result = await getRequestById(999);
    expect(result).toBeNull();
  });

  it('coerces a string id to match the numeric mock ids', async () => {
    const result = await getRequestById('103');
    expect(result.employeeName).toBe('Sophia Turner');
  });
});

describe('formatDate', () => {
  it('formats a parseable date string', () => {
    expect(formatDate('Jul 15, 2026')).toBe('Jul 15, 2026');
  });

  it('falls back to the original value when the input is not a valid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('getPlatformIcon', () => {
  it('returns a distinct icon for each known status', () => {
    expect(getPlatformIcon('completed')).not.toBe(getPlatformIcon('pending'));
    expect(getPlatformIcon('in-progress')).not.toBe(getPlatformIcon('pending'));
  });

  it('falls back to the pending icon for an unknown status', () => {
    expect(getPlatformIcon('unknown')).toBe(getPlatformIcon('pending'));
  });
});

describe('RequestDetails', () => {
  it('shows a loading indicator before data resolves', async () => {
    renderRequestDetails();
    expect(screen.getByRole('status')).toBeInTheDocument();
    // Wait for the mock fetch to settle so no state update lands after the test exits.
    await screen.findByRole('heading', { name: 'John Doe' });
  });

  it('renders the employee details once loaded', async () => {
    renderRequestDetails('/requests/107');
    expect(await screen.findByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByText('john.doe@thecreditpros.com')).toBeInTheDocument();
    expect(screen.getByText('Robert Chen')).toBeInTheDocument();
  });

  it('reads a different request based on the URL id param', async () => {
    renderRequestDetails('/requests/103');
    expect(await screen.findByRole('heading', { name: 'Sophia Turner' })).toBeInTheDocument();
  });

  it('renders the platform sync statuses', async () => {
    renderRequestDetails('/requests/107');
    await screen.findByRole('heading', { name: 'John Doe' });
    expect(screen.getByText('Azure AD')).toBeInTheDocument();
    expect(screen.getByText('Keeper')).toBeInTheDocument();
    expect(screen.getByText('Acuity')).toBeInTheDocument();
  });

  it('renders the timeline events', async () => {
    renderRequestDetails('/requests/107');
    expect(await screen.findByText('Request Created')).toBeInTheDocument();
    expect(screen.getByText('Review Started')).toBeInTheDocument();
    expect(screen.getByText('Request Completed')).toBeInTheDocument();
  });

  it('shows a not-found error state for an unknown id', async () => {
    renderRequestDetails('/requests/999');
    expect(await screen.findByRole('alert')).toHaveTextContent(/no request found/i);
  });

  it('logs when the Approve button is clicked', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderRequestDetails('/requests/107');
    await screen.findByRole('heading', { name: 'John Doe' });

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('107'));
    consoleLog.mockRestore();
  });

  it('logs when the Reject button is clicked', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderRequestDetails('/requests/107');
    await screen.findByRole('heading', { name: 'John Doe' });

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('107'));
    consoleLog.mockRestore();
  });

  it('navigates back to /requests when the back button is clicked', async () => {
    renderRequestDetails('/requests/107');
    await screen.findByRole('heading', { name: 'John Doe' });

    fireEvent.click(screen.getByRole('button', { name: /back to requests/i }));

    expect(await screen.findByText('Requests Page Stub')).toBeInTheDocument();
  });
});

describe('DetailSection', () => {
  it('renders each key-value pair from data', () => {
    render(<DetailSection title="Request Information" data={{ Email: 'a@b.com', Department: 'IT' }} />);
    expect(screen.getByText('Request Information')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
  });
});

describe('PlatformStatus', () => {
  it('renders each platform name and its status label', () => {
    render(
      <PlatformStatus
        platforms={[
          { name: 'Azure', status: 'completed' },
          { name: 'Keeper', status: 'in-progress' },
          { name: 'Hodu', status: 'pending' },
        ]}
      />
    );
    expect(screen.getByText('Azure')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Keeper')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Hodu')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('logs a PropTypes warning when a platform has an invalid status', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PlatformStatus platforms={[{ name: 'Azure', status: 'unknown-status' }]} />);
    const loggedWarning = consoleError.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('status'))
    );
    expect(loggedWarning).toBe(true);
    consoleError.mockRestore();
  });
});
