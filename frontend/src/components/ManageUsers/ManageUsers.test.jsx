import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import ManageUsers, { filterUsers, getPaginatedUsers } from './ManageUsers';
import { getStatusStyle } from './UsersTable';
import UserDetailsModal from './UserDetailsModal';

const FIXTURE_USERS = [
  { id: 1, name: 'Olivia Martin', email: 'olivia.martin@thecreditpros.com', status: 'pending', dateOnboarded: 'Jul 16, 2026', dateOffboarded: null },
  { id: 2, name: 'John Doe', email: 'john.doe@thecreditpros.com', status: 'active', dateOnboarded: 'Jul 15, 2026', dateOffboarded: null },
  { id: 3, name: 'Charlie Wilson', email: 'charlie.wilson@thecreditpros.com', status: 'inactive', dateOnboarded: 'Jun 1, 2026', dateOffboarded: 'Jul 10, 2026' },
];

function renderManageUsers() {
  return render(
    <MemoryRouter initialEntries={['/manage-users']}>
      <Routes>
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/user/:id" element={<div>User Details Stub</div>} />
        <Route path="/offboard/:id" element={<div>Offboard Stub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('filterUsers', () => {
  it('returns every user when search is empty and status is "all"', () => {
    expect(filterUsers(FIXTURE_USERS, '', 'all')).toHaveLength(3);
  });

  it('matches a search term against the name', () => {
    expect(filterUsers(FIXTURE_USERS, 'john', 'all')).toEqual([FIXTURE_USERS[1]]);
  });

  it('matches a search term against the email', () => {
    expect(filterUsers(FIXTURE_USERS, 'charlie.wilson@', 'all')).toEqual([FIXTURE_USERS[2]]);
  });

  it('filters by status alone', () => {
    expect(filterUsers(FIXTURE_USERS, '', 'pending')).toEqual([FIXTURE_USERS[0]]);
  });

  it('applies search and status together with AND logic', () => {
    expect(filterUsers(FIXTURE_USERS, 'john', 'inactive')).toHaveLength(0);
    expect(filterUsers(FIXTURE_USERS, 'john', 'active')).toEqual([FIXTURE_USERS[1]]);
  });
});

describe('getPaginatedUsers', () => {
  it('slices the correct page of results', () => {
    const users = Array.from({ length: 25 }, (_, index) => ({ id: index + 1 }));
    expect(getPaginatedUsers(users, 1, 10)).toHaveLength(10);
    expect(getPaginatedUsers(users, 3, 10)).toHaveLength(5);
    expect(getPaginatedUsers(users, 1, 10)[0].id).toBe(1);
    expect(getPaginatedUsers(users, 2, 10)[0].id).toBe(11);
  });
});

describe('getStatusStyle', () => {
  it('returns distinct classes for each known status', () => {
    expect(getStatusStyle('pending')).toContain('#4299e1');
    expect(getStatusStyle('active')).toContain('#48bb78');
    expect(getStatusStyle('inactive')).toContain('#a0aec0');
  });

  it('falls back to the inactive variant for an unknown status', () => {
    expect(getStatusStyle('unknown')).toBe(getStatusStyle('inactive'));
  });
});

describe('ManageUsers', () => {
  it('renders the page heading and table column headers', () => {
    renderManageUsers();
    expect(screen.getByRole('heading', { name: 'Manage Users' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date Onboarded')).toBeInTheDocument();
    expect(screen.getByText('Date Offboarded')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('shows only 10 users on the first page of 20 mock users', () => {
    renderManageUsers();
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Olivia Martin')).toBeInTheDocument();
    expect(screen.queryByText('Kevin Anderson')).not.toBeInTheDocument();
  });

  it('filters the table when a search term is typed', () => {
    renderManageUsers();
    fireEvent.change(screen.getByLabelText(/search by name or email/i), {
      target: { value: 'john doe' },
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Olivia Martin')).not.toBeInTheDocument();
  });

  it('filters the table when a status is selected', () => {
    renderManageUsers();
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: 'inactive' },
    });
    expect(screen.getByText('Charlie Wilson')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
  });

  it('applies search and status filters together', () => {
    renderManageUsers();
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: 'active' },
    });
    fireEvent.change(screen.getByLabelText(/search by name or email/i), {
      target: { value: 'jane' },
    });
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('shows an empty state when no users match the filters', () => {
    renderManageUsers();
    fireEvent.change(screen.getByLabelText(/search by name or email/i), {
      target: { value: 'nobody-matches-this' },
    });
    expect(screen.getByText(/no matching users found/i)).toBeInTheDocument();
  });

  it('paginates to the next page and back', () => {
    renderManageUsers();
    expect(screen.getByRole('button', { name: 'First' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Kevin Anderson')).toBeInTheDocument();
    expect(screen.queryByText('Olivia Martin')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Olivia Martin')).toBeInTheDocument();
  });

  it('shows the pending-specific menu items for a pending user', () => {
    renderManageUsers();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Olivia Martin' }));
    expect(screen.getByRole('menuitem', { name: 'View Pending Details' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'View User Details' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Offboard' })).not.toBeInTheDocument();
  });

  it('shows the active-specific menu items for an active user', () => {
    renderManageUsers();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for John Doe' }));
    expect(screen.getByRole('menuitem', { name: 'View User Details' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Offboard' })).toBeInTheDocument();
  });

  it('shows only "View User Details" for an inactive user', () => {
    renderManageUsers();
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: 'inactive' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Charlie Wilson' }));
    expect(screen.getByRole('menuitem', { name: 'View User Details' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Offboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'View Pending Details' })).not.toBeInTheDocument();
  });

  it('navigates to /offboard/:id when Offboard is clicked', async () => {
    renderManageUsers();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for John Doe' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Offboard' }));
    expect(await screen.findByText('Offboard Stub')).toBeInTheDocument();
  });

  it('opens the UserDetailsModal (without navigating) when View User Details is clicked', () => {
    renderManageUsers();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for John Doe' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'View User Details' }));

    const dialog = screen.getByRole('dialog', { name: 'John Doe' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('john.doe@thecreditpros.com')).toBeInTheDocument();
    expect(screen.queryByText('User Details Stub')).not.toBeInTheDocument();
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
  });

  it('closes the UserDetailsModal when its Close button is clicked', () => {
    renderManageUsers();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for John Doe' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'View User Details' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('logs when "View Pending Details" is clicked', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderManageUsers();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Olivia Martin' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'View Pending Details' }));
    const loggedUserOne = consoleLog.mock.calls.some((args) =>
      args.some((arg) => String(arg).includes('1'))
    );
    expect(loggedUserOne).toBe(true);
    consoleLog.mockRestore();
  });
});

describe('UserDetailsModal', () => {
  const PENDING_USER = {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@thecreditpros.com',
    status: 'pending',
    department: 'IT',
    manager: 'Diana Foster',
    dateOnboarded: 'Jul 16, 2026',
    dateOffboarded: null,
    platforms: ['Azure AD', 'Keeper'],
  };

  const INACTIVE_USER = {
    id: 17,
    name: 'Charlie Wilson',
    email: 'charlie.wilson@thecreditpros.com',
    status: 'inactive',
    department: 'Finance',
    manager: null,
    dateOnboarded: 'Jun 1, 2026',
    dateOffboarded: 'Jul 10, 2026',
    platforms: [],
  };

  it('renders nothing when isOpen is false', () => {
    render(<UserDetailsModal isOpen={false} user={PENDING_USER} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing when user is null, even if isOpen is true', () => {
    render(<UserDetailsModal isOpen user={null} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the status indicator, onboarded date, and platform checklist', () => {
    render(<UserDetailsModal isOpen user={PENDING_USER} onClose={() => {}} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Jul 16, 2026')).toBeInTheDocument();
    expect(screen.getByText('Azure AD')).toBeInTheDocument();
    expect(screen.getByText('Keeper')).toBeInTheDocument();
    expect(screen.queryByText(/date offboarded/i)).not.toBeInTheDocument();
  });

  it('shows the department and manager for a user with a manager on file', () => {
    render(<UserDetailsModal isOpen user={PENDING_USER} onClose={() => {}} />);
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('Diana Foster')).toBeInTheDocument();
  });

  it('shows "No manager" for a user with no manager on file', () => {
    render(<UserDetailsModal isOpen user={INACTIVE_USER} onClose={() => {}} />);
    expect(screen.getByText('No manager')).toBeInTheDocument();
  });

  it('shows the Date Offboarded field for an inactive user', () => {
    render(<UserDetailsModal isOpen user={INACTIVE_USER} onClose={() => {}} />);
    expect(screen.getByText(/date offboarded/i)).toBeInTheDocument();
    expect(screen.getByText('Jul 10, 2026')).toBeInTheDocument();
  });

  it('shows an empty state when the user has no assigned platforms', () => {
    render(<UserDetailsModal isOpen user={INACTIVE_USER} onClose={() => {}} />);
    expect(screen.getByText(/no platforms assigned/i)).toBeInTheDocument();
  });

  it('calls onClose when a Close button is clicked', () => {
    const onClose = vi.fn();
    render(<UserDetailsModal isOpen user={PENDING_USER} onClose={onClose} />);
    // Both the top-right X and the footer button are labeled "Close".
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons).toHaveLength(2);
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop', () => {
    const onClose = vi.fn();
    render(<UserDetailsModal isOpen user={PENDING_USER} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog').parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal card', () => {
    const onClose = vi.fn();
    render(<UserDetailsModal isOpen user={PENDING_USER} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<UserDetailsModal isOpen user={PENDING_USER} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
