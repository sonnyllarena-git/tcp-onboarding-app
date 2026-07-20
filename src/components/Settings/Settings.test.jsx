import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from './Settings';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_SETTINGS } from '../../mockData';

vi.mock('../../hooks/useAuth');

const USER = { name: 'Sarah Miller', role: 'USER' };
const ADMIN = { name: 'John Doe', role: 'ADMIN' };

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  useAuth.mockReturnValue(USER);
});

describe('Settings', () => {
  it('shows only Appearance + Notifications for a USER', () => {
    render(<Settings />);
    expect(screen.getByRole('button', { name: /Appearance/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Platform Management/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Default Platforms/ })).not.toBeInTheDocument();
  });

  it('shows all four sections for an ADMIN', () => {
    useAuth.mockReturnValue(ADMIN);
    render(<Settings />);
    expect(screen.getByRole('button', { name: /Appearance/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Platform Management/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Default Platforms/ })).toBeInTheDocument();
  });

  it('does not render admin-only sections for a USER', () => {
    render(<Settings />);
    expect(screen.queryByText('Platform Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Default Platforms Per Department')).not.toBeInTheDocument();
  });

  it('shows the toggle thumb on the left when off and on the right when on', () => {
    render(<Settings />);
    const toggle = screen.getByRole('switch', { name: 'Dark Mode' });
    const thumb = toggle.firstChild;
    expect(thumb.className).toContain('translate-x-0');

    fireEvent.click(toggle);
    expect(thumb.className).toContain('translate-x-5');
  });

  it('shows no unsaved-changes bar on load', () => {
    render(<Settings />);
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });

  it('shows the unsaved-changes bar after a toggle, without writing to localStorage yet', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    fireEvent.click(screen.getByRole('switch', { name: 'Request Rejected' }));

    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    expect(localStorage.getItem('tcp_settings')).toBeNull();
  });

  it('Cancel reverts the toggle and hides the bar without saving', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    fireEvent.click(screen.getByRole('switch', { name: 'Request Rejected' }));
    expect(screen.getByRole('switch', { name: 'Request Rejected' })).toHaveAttribute(
      'aria-checked',
      'false'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Request Rejected' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(localStorage.getItem('tcp_settings')).toBeNull();
  });

  it('Save Changes persists to localStorage, hides the bar, and shows a success toast', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    fireEvent.click(screen.getByRole('switch', { name: 'Request Rejected' }));

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('tcp_settings'));
    expect(stored.notifications.requestRejected).toBe(false);
  });

  it('previews dark mode immediately, before Save is clicked', () => {
    render(<Settings />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByRole('switch', { name: 'Dark Mode' }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('tcp_settings')).toBeNull();
  });

  it('reverts the dark-mode preview on Cancel', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('switch', { name: 'Dark Mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists dark mode after Save, surviving a simulated reload', () => {
    const { unmount } = render(<Settings />);
    fireEvent.click(screen.getByRole('switch', { name: 'Dark Mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    unmount();

    document.documentElement.classList.remove('dark'); // simulate a fresh page load before Settings re-mounts
    render(<Settings />);

    const stored = JSON.parse(localStorage.getItem('tcp_settings'));
    expect(stored.darkMode).toBe(true);
    expect(screen.getByRole('switch', { name: 'Dark Mode' })).toHaveAttribute('aria-checked', 'true');
  });

  it('updates activePlatforms only after Save (Platform Management)', () => {
    useAuth.mockReturnValue(ADMIN);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: /Platform Management/ }));
    fireEvent.click(screen.getByRole('switch', { name: 'Toggle Krisp' }));

    expect(localStorage.getItem('tcp_settings')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    const stored = JSON.parse(localStorage.getItem('tcp_settings'));
    expect(stored.activePlatforms).not.toContain('plt-4');
  });

  it('updates a Default Platforms selection only after Save', () => {
    useAuth.mockReturnValue(ADMIN);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: /Default Platforms/ }));

    // IT Staff (grp-1) is open by default and starts with Jira selected.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Jira' }));
    expect(localStorage.getItem('tcp_settings')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    const stored = JSON.parse(localStorage.getItem('tcp_settings'));
    expect(stored.defaultPlatformsByGroup['grp-1']).not.toContain('plt-5');
  });

  it('restores persisted settings on a simulated page reload', () => {
    localStorage.setItem(
      'tcp_settings',
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        darkMode: true,
        notifications: { ...DEFAULT_SETTINGS.notifications, requestRejected: false },
      })
    );

    render(<Settings />);

    expect(document.documentElement.classList.contains('dark')).toBe(false); // Settings doesn't apply it - App's mount effect owns that
    expect(screen.getByRole('switch', { name: 'Dark Mode' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(screen.getByRole('switch', { name: 'Request Rejected' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
  });
});
