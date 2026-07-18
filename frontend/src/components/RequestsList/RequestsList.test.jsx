import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import RequestsList, { filterRequests } from './RequestsList';
import RequestsTable, { getStatusStyle } from './RequestsTable';

const FIXTURE_REQUESTS = [
  { id: 1, name: 'John Doe', email: 'john.doe@thecreditpros.com', type: 'Onboarding', status: 'completed', date: 'Jul 15, 2026' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@thecreditpros.com', type: 'Offboarding', status: 'pending', date: 'Jul 14, 2026' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@thecreditpros.com', type: 'Onboarding', status: 'in-progress', date: 'Jul 16, 2026' },
];

function renderRequestsList() {
  return render(
    <MemoryRouter>
      <RequestsList />
    </MemoryRouter>
  );
}

describe('filterRequests', () => {
  it('returns every request when the search term is empty and status is "all"', () => {
    expect(filterRequests(FIXTURE_REQUESTS, '', 'all')).toHaveLength(3);
  });

  it('matches a search term against the name', () => {
    const result = filterRequests(FIXTURE_REQUESTS, 'jane', 'all');
    expect(result).toEqual([FIXTURE_REQUESTS[1]]);
  });

  it('matches a search term against the email', () => {
    const result = filterRequests(FIXTURE_REQUESTS, 'bob.johnson@', 'all');
    expect(result).toEqual([FIXTURE_REQUESTS[2]]);
  });

  it('matches search terms case-insensitively', () => {
    const result = filterRequests(FIXTURE_REQUESTS, 'JANE SMITH', 'all');
    expect(result).toEqual([FIXTURE_REQUESTS[1]]);
  });

  it('filters by status alone', () => {
    const result = filterRequests(FIXTURE_REQUESTS, '', 'pending');
    expect(result).toEqual([FIXTURE_REQUESTS[1]]);
  });

  it('applies search and status together with AND logic', () => {
    expect(filterRequests(FIXTURE_REQUESTS, 'jane', 'completed')).toHaveLength(0);
    expect(filterRequests(FIXTURE_REQUESTS, 'jane', 'pending')).toEqual([FIXTURE_REQUESTS[1]]);
  });
});

describe('getStatusStyle', () => {
  it('returns distinct classes for each known status', () => {
    expect(getStatusStyle('completed')).toContain('#48bb78');
    expect(getStatusStyle('in-progress')).toContain('#f6ad55');
    expect(getStatusStyle('pending')).toContain('#4299e1');
  });

  it('falls back to the pending variant for an unknown status', () => {
    expect(getStatusStyle('unknown')).toBe(getStatusStyle('pending'));
  });
});

describe('RequestsList', () => {
  it('renders the page heading and all mock requests', () => {
    renderRequestsList();
    expect(screen.getByRole('heading', { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Noah Coleman')).toBeInTheDocument();
  });

  it('renders the table column headers', () => {
    renderRequestsList();
    expect(screen.getByText('Employee Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Request Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('filters the table when a search term is typed', () => {
    renderRequestsList();
    fireEvent.change(screen.getByLabelText(/search by name or email/i), {
      target: { value: 'john doe' },
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters the table when a status is selected', () => {
    renderRequestsList();
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: 'pending' },
    });
    expect(screen.getByText('Ethan Clark')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('applies search and status filters together', () => {
    renderRequestsList();
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: 'completed' },
    });
    fireEvent.change(screen.getByLabelText(/search by name or email/i), {
      target: { value: 'john' },
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    expect(screen.queryByText('Olivia Martin')).not.toBeInTheDocument();
  });

  it('shows an empty state when no requests match the filters', () => {
    renderRequestsList();
    fireEvent.change(screen.getByLabelText(/search by name or email/i), {
      target: { value: 'nobody-matches-this' },
    });
    expect(screen.getByText(/no matching requests found/i)).toBeInTheDocument();
  });

  it('navigates to /requests/:id when a View button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/requests']}>
        <Routes>
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/requests/:id" element={<div>Request Details Stub</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /view request for john doe/i }));

    expect(await screen.findByText('Request Details Stub')).toBeInTheDocument();
  });
});

describe('RequestsTable', () => {
  it('logs a PropTypes warning when a required prop is omitted', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<RequestsTable requests={FIXTURE_REQUESTS} />);
    const loggedWarning = consoleError.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('onViewRequest'))
    );
    expect(loggedWarning).toBe(true);
    consoleError.mockRestore();
  });
});
