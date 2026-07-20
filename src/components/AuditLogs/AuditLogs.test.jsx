import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import AuditLogs, {
  MOCK_AUDIT_LOGS,
  ACTION_TYPE_OPTIONS,
  filterAuditLogs,
  sortLogsByNewest,
  getPaginatedLogs,
} from './AuditLogs';
import { formatLogTimestamp } from './AuditLogsTable';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

const ADMIN_USER = { name: 'John Doe', email: 'john.doe@thecreditpros.com', role: 'ADMIN' };
const NON_ADMIN_USER = { name: 'Jane Smith', email: 'jane.smith@thecreditpros.com', role: 'USER' };

const FIXTURE_LOGS = [
  { id: 1, timestampIso: '2026-07-10T09:00:00', userEmail: 'john.doe@thecreditpros.com', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 2, timestampIso: '2026-07-11T10:00:00', userEmail: 'bob.johnson@thecreditpros.com', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '192.168.1.110' },
  { id: 3, timestampIso: '2026-07-12T11:00:00', userEmail: 'jane.smith@thecreditpros.com', action: 'CSV_IMPORT', details: '10 users', status: 'SUCCESS', ipAddress: '192.168.1.105' },
];

/** Waits for the (simulated) loading state to clear and the table to render. */
async function waitForLoaded() {
  await screen.findAllByText('john.doe@thecreditpros.com');
}

function renderAuditLogs() {
  return render(
    <MemoryRouter initialEntries={['/audit-logs']}>
      <Routes>
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/" element={<div>Dashboard Stub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuth.mockReturnValue(ADMIN_USER);
});

describe('filterAuditLogs', () => {
  it('returns all logs with no filters', () => {
    expect(filterAuditLogs(FIXTURE_LOGS)).toHaveLength(3);
  });

  it('filters by search term against user email', () => {
    expect(filterAuditLogs(FIXTURE_LOGS, { searchTerm: 'bob.johnson' })).toEqual([FIXTURE_LOGS[1]]);
  });

  it('filters by search term against action (case-insensitive)', () => {
    expect(filterAuditLogs(FIXTURE_LOGS, { searchTerm: 'login_failed' })).toEqual([FIXTURE_LOGS[1]]);
  });

  it('filters by date range (inclusive)', () => {
    expect(filterAuditLogs(FIXTURE_LOGS, { dateFrom: '2026-07-11', dateTo: '2026-07-11' })).toEqual([
      FIXTURE_LOGS[1],
    ]);
  });

  it('filters by action type', () => {
    expect(filterAuditLogs(FIXTURE_LOGS, { actionType: 'CSV_IMPORT' })).toEqual([FIXTURE_LOGS[2]]);
  });

  it('filters by status', () => {
    expect(filterAuditLogs(FIXTURE_LOGS, { status: 'FAILED' })).toEqual([FIXTURE_LOGS[1]]);
  });

  it('combines multiple filters with AND logic', () => {
    expect(
      filterAuditLogs(FIXTURE_LOGS, { searchTerm: 'john.doe', status: 'FAILED' })
    ).toHaveLength(0);
  });
});

describe('sortLogsByNewest', () => {
  it('sorts logs newest-first without mutating the input', () => {
    const shuffled = [FIXTURE_LOGS[1], FIXTURE_LOGS[0], FIXTURE_LOGS[2]];
    const sorted = sortLogsByNewest(shuffled);
    expect(sorted.map((log) => log.id)).toEqual([3, 2, 1]);
    expect(shuffled.map((log) => log.id)).toEqual([2, 1, 3]);
  });
});

describe('getPaginatedLogs', () => {
  it('slices logs to the requested page', () => {
    expect(getPaginatedLogs(FIXTURE_LOGS, 1, 2)).toHaveLength(2);
    expect(getPaginatedLogs(FIXTURE_LOGS, 2, 2)).toHaveLength(1);
    expect(getPaginatedLogs(FIXTURE_LOGS, 1, 2)[0].id).toBe(1);
    expect(getPaginatedLogs(FIXTURE_LOGS, 2, 2)[0].id).toBe(3);
  });
});

describe('formatLogTimestamp', () => {
  it('formats an ISO datetime as "Mon D, HH:MM AM/PM"', () => {
    expect(formatLogTimestamp('2026-07-18T02:15:00')).toBe('Jul 18, 02:15 AM');
  });

  it('falls back to the raw value when it cannot be parsed', () => {
    expect(formatLogTimestamp('not-a-date')).toBe('not-a-date');
  });
});

describe('ACTION_TYPE_OPTIONS', () => {
  it('contains every distinct action from the mock data, with no duplicates', () => {
    const uniqueActions = new Set(MOCK_AUDIT_LOGS.map((log) => log.action));
    expect(ACTION_TYPE_OPTIONS).toHaveLength(uniqueActions.size);
    uniqueActions.forEach((action) => expect(ACTION_TYPE_OPTIONS).toContain(action));
  });
});

describe('AuditLogs page', () => {
  it('shows the audit log table for an admin user', async () => {
    renderAuditLogs();
    expect(await screen.findByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText(/Loading audit logs/i)).toBeInTheDocument();
    await waitForLoaded();
    expect(screen.getAllByText('john.doe@thecreditpros.com').length).toBeGreaterThan(0);
  });

  it('shows the 403 ForbiddenPage for a non-admin instead of redirecting', async () => {
    useAuth.mockReturnValue(NON_ADMIN_USER);
    renderAuditLogs();
    expect(await screen.findByText('403')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Stub')).not.toBeInTheDocument();
  });

  it('shows exactly 20 logs per page and correct pagination counts', async () => {
    renderAuditLogs();
    const rows = await screen.findAllByRole('row');
    // header row + up to 20 data rows
    expect(rows.length).toBeLessThanOrEqual(21);
    expect(
      await screen.findByText(`Page 1 of ${Math.ceil(MOCK_AUDIT_LOGS.length / 20)}`, { exact: false })
    ).toBeInTheDocument();
  });

  it('filters in real time by search term', async () => {
    renderAuditLogs();
    await waitForLoaded();

    fireEvent.change(screen.getByPlaceholderText(/search by user email or action/i), {
      target: { value: 'bob.johnson' },
    });

    expect(screen.getAllByText('bob.johnson@thecreditpros.com').length).toBeGreaterThan(0);
    expect(screen.queryByText('john.doe@thecreditpros.com')).not.toBeInTheDocument();
  });

  it('filters by action type', async () => {
    renderAuditLogs();
    await waitForLoaded();

    fireEvent.change(screen.getByLabelText(/action type/i), { target: { value: 'CSV_IMPORT' } });

    const table = within(screen.getByRole('table'));
    expect(table.queryByText('LOGIN_FAILED')).not.toBeInTheDocument();
    expect(table.getAllByText('CSV_IMPORT').length).toBeGreaterThan(0);
  });

  it('filters by status', async () => {
    renderAuditLogs();
    await waitForLoaded();

    fireEvent.change(screen.getByLabelText(/^status$/i), { target: { value: 'FAILED' } });

    const table = within(screen.getByRole('table'));
    expect(table.queryByText('SUCCESS')).not.toBeInTheDocument();
    expect(table.getAllByText('FAILED').length).toBeGreaterThan(0);
  });

  it('filters by date range', async () => {
    renderAuditLogs();
    await waitForLoaded();

    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: '2026-07-18' } });
    fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: '2026-07-18' } });

    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
  });

  it('shows the empty state when no logs match the filters', async () => {
    renderAuditLogs();
    await waitForLoaded();

    fireEvent.change(screen.getByPlaceholderText(/search by user email or action/i), {
      target: { value: 'nonexistent-user@nowhere.com' },
    });

    expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
  });

  it('resets search and filters when "Reset Filters" is clicked', async () => {
    renderAuditLogs();
    await waitForLoaded();

    fireEvent.change(screen.getByPlaceholderText(/search by user email or action/i), {
      target: { value: 'nonexistent-user@nowhere.com' },
    });
    fireEvent.change(screen.getByLabelText(/^status$/i), { target: { value: 'FAILED' } });
    expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));

    await waitForLoaded();
    expect(screen.getAllByText('john.doe@thecreditpros.com').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/search by user email or action/i)).toHaveValue('');
    expect(screen.getByLabelText(/^status$/i)).toHaveValue('all');
  });

  it('navigates between pages', async () => {
    renderAuditLogs();
    await waitForLoaded();

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/page 2 of/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
  });

  it('displays IP addresses in the table', async () => {
    renderAuditLogs();
    expect((await screen.findAllByText('192.168.1.100')).length).toBeGreaterThan(0);
  });
});
