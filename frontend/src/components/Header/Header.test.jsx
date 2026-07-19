import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <Header title="Dashboard" onLogout={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuth.mockReturnValue(null);
});

describe('Header', () => {
  it('renders the title and does not show a user block when no userName is given', () => {
    renderHeader();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByText('Logged in as')).not.toBeInTheDocument();
  });

  it('shows a gold ADMIN badge for an admin user', () => {
    useAuth.mockReturnValue({ name: 'John Doe', role: 'ADMIN' });
    renderHeader({ userName: 'John Doe' });

    expect(screen.getByText('Logged in as')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const badge = screen.getByText('ADMIN');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#d4a574]');
  });

  it('shows a gray USER badge for a non-admin user', () => {
    useAuth.mockReturnValue({ name: 'Sarah Miller', role: 'USER' });
    renderHeader({ userName: 'Sarah Miller' });

    const badge = screen.getByText('USER');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-400');
  });

  it('shows no role badge when useAuth has no role', () => {
    renderHeader({ userName: 'Guest' });
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
    expect(screen.queryByText('USER')).not.toBeInTheDocument();
  });

  it('calls onLogout when the Log Out button is clicked', () => {
    const onLogout = vi.fn();
    renderHeader({ onLogout });
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
