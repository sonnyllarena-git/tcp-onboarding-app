import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard, { getGreeting } from './Dashboard';
import StatBox, { getStatColor } from './StatBox';
import ActivityFeed, { formatTime } from './ActivityFeed';

const HOUR = 60 * 60 * 1000;

const FIXTURE_STATS = [
  { label: 'Active Users', value: 24, icon: '👥', trend: 'up', color: 'green' },
  { label: 'Pending Requests', value: 8, icon: '⏳', trend: 'up', color: 'orange' },
  { label: 'Completed Today', value: 12, icon: '✅', trend: 'up', color: 'green' },
  { label: 'Failed/Issues', value: 2, icon: '⚠️', trend: 'down', color: 'red' },
];

const FIXTURE_ACTIVITIES = [
  { timestamp: Date.now() - 2 * HOUR, user: 'John Doe', action: 'Onboarded', status: 'completed' },
  { timestamp: Date.now() - 6 * HOUR, user: 'Bob Johnson', action: 'Pending Review', status: 'pending' },
];

function renderDashboard(props = {}) {
  const dataService =
    props.dataService ||
    (() => Promise.resolve({ stats: FIXTURE_STATS, activities: FIXTURE_ACTIVITIES }));
  return render(
    <MemoryRouter>
      <Dashboard {...props} dataService={dataService} />
    </MemoryRouter>
  );
}

describe('getGreeting', () => {
  it('returns a morning greeting before noon', () => {
    expect(getGreeting(9)).toBe('Good morning');
  });

  it('returns an afternoon greeting between noon and 6pm', () => {
    expect(getGreeting(14)).toBe('Good afternoon');
  });

  it('returns an evening greeting at or after 6pm', () => {
    expect(getGreeting(20)).toBe('Good evening');
  });
});

describe('getStatColor', () => {
  it('returns distinct classes for each known color', () => {
    expect(getStatColor('green')).toContain('#48bb78');
    expect(getStatColor('orange')).toContain('#f6ad55');
    expect(getStatColor('red')).toContain('#f56565');
    expect(getStatColor('blue')).toContain('#4299e1');
  });

  it('falls back to the blue variant for an unknown color', () => {
    expect(getStatColor('purple')).toBe(getStatColor('blue'));
  });
});

describe('formatTime', () => {
  it('formats a timestamp from a few hours ago', () => {
    expect(formatTime(Date.now() - 2 * HOUR)).toBe('2 hours ago');
  });

  it('formats a timestamp from just now', () => {
    expect(formatTime(Date.now())).toBe('Just now');
  });

  it('formats a timestamp from a day ago', () => {
    expect(formatTime(Date.now() - 25 * HOUR)).toBe('1 day ago');
  });
});

describe('Dashboard', () => {
  it('shows a loading indicator before data resolves', () => {
    renderDashboard({ dataService: () => new Promise(() => {}) });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('greets the default "User" when no userName prop is given', async () => {
    renderDashboard();
    expect(await screen.findByRole('heading', { name: /User/i })).toBeInTheDocument();
  });

  it('greets the provided userName once data has loaded', async () => {
    renderDashboard({ userName: 'Jordan' });
    expect(await screen.findByRole('heading', { name: /Jordan/i })).toBeInTheDocument();
  });

  it('renders all stat boxes with their values after loading', async () => {
    renderDashboard();
    expect(await screen.findByText('Active Users')).toBeInTheDocument();
    FIXTURE_STATS.forEach((stat) => {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
      expect(screen.getByText(String(stat.value))).toBeInTheDocument();
    });
  });

  it('renders the activity feed entries after loading', async () => {
    renderDashboard();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders all four quick action buttons', async () => {
    renderDashboard();
    await screen.findByText('Active Users');
    expect(screen.getByRole('button', { name: 'New Onboarding' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Requests' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Report' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('logs the action name when a quick action button is clicked', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderDashboard();
    await screen.findByText('Active Users');

    fireEvent.click(screen.getByRole('button', { name: 'Generate Report' }));

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Generate Report'));
    consoleLog.mockRestore();
  });

  it('navigates to /requests when "View Requests" is clicked', async () => {
    const dataService = () =>
      Promise.resolve({ stats: FIXTURE_STATS, activities: FIXTURE_ACTIVITIES });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Dashboard dataService={dataService} />} />
          <Route path="/requests" element={<div>Requests Page Stub</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Active Users');
    fireEvent.click(screen.getByRole('button', { name: 'View Requests' }));

    expect(await screen.findByText('Requests Page Stub')).toBeInTheDocument();
  });
});

describe('StatBox', () => {
  it('renders the label, value, and icon', () => {
    render(<StatBox label="Active Users" value={24} icon="👥" trend="up" color="green" />);
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('logs a PropTypes warning when a required prop is omitted', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<StatBox label="Active Users" value={24} icon="👥" trend="up" />);
    const loggedColorWarning = consoleError.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('color'))
    );
    expect(loggedColorWarning).toBe(true);
    consoleError.mockRestore();
  });
});

describe('ActivityFeed', () => {
  it('renders every provided activity entry', () => {
    render(<ActivityFeed activities={FIXTURE_ACTIVITIES} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('shows an empty state when given no activities', () => {
    render(<ActivityFeed activities={[]} />);
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });
});
