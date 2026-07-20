import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ErrorState from './ErrorState';
import ErrorReportModal, {
  collectErrorReport,
  buildReportText,
  buildMailtoUrl,
  getBrowserInfo,
  getOSInfo,
} from './ErrorReportModal';
import NotFoundPage from './NotFoundPage';
import ForbiddenPage from './ForbiddenPage';
import ServerErrorPage from './ServerErrorPage';
import App from '../../App';
import { useAuth } from '../../hooks/useAuth';

// Partial mock: only useAuth is replaced. AuthProvider/useAuthActions stay
// real so the App-level route integration tests below still get a working
// (if unused) auth context — they drive the logged-in user via
// useAuth.mockReturnValue(...) instead of seeding sessionStorage.
vi.mock('../../hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuth: vi.fn() };
});

const ADMIN_USER = {
  name: 'John Doe',
  email: 'john.doe@thecreditpros.com',
  role: 'ADMIN',
  department: 'IT',
};

const USER_ROLE = {
  name: 'Sarah Miller',
  email: 'sarah.miller@thecreditpros.com',
  role: 'USER',
  department: 'HR',
};

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  useAuth.mockReturnValue(ADMIN_USER);
});

describe('ErrorState', () => {
  const baseProps = {
    code: 404,
    icon: '🔍',
    title: 'Page Not Found',
    message: 'The page you requested does not exist.',
    suggestion: 'Try going back to the Dashboard.',
    primaryAction: { label: 'Go to Dashboard', onClick: vi.fn() },
  };

  it('renders the error code, icon, title, message, and suggestion', () => {
    renderWithRouter(<ErrorState {...baseProps} />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(screen.getByText(baseProps.message)).toBeInTheDocument();
    expect(screen.getByText(/Try going back to the Dashboard/)).toBeInTheDocument();
  });

  it('renders the primary action button and calls its onClick', () => {
    const onClick = vi.fn();
    renderWithRouter(<ErrorState {...baseProps} primaryAction={{ label: 'Go to Dashboard', onClick }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render a secondary action button when none is provided', () => {
    renderWithRouter(<ErrorState {...baseProps} />);
    expect(screen.queryByRole('button', { name: 'Go Back' })).not.toBeInTheDocument();
  });

  it('renders the secondary action button and calls its onClick when provided', () => {
    const onClick = vi.fn();
    renderWithRouter(<ErrorState {...baseProps} secondaryAction={{ label: 'Go Back', onClick }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the "Contact IT Support" link', () => {
    renderWithRouter(<ErrorState {...baseProps} />);
    const link = screen.getByRole('link', { name: 'Contact IT Support' });
    expect(link).toHaveAttribute('href', 'mailto:it@thecreditpros.com');
  });

  it('shows the "Report this error to IT" button', () => {
    renderWithRouter(<ErrorState {...baseProps} />);
    expect(screen.getByRole('button', { name: /report this error to it/i })).toBeInTheDocument();
  });

  it('opens the ErrorReportModal when "Report this error to IT" is clicked', () => {
    renderWithRouter(<ErrorState {...baseProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /report this error to it/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('collectErrorReport / buildReportText / buildMailtoUrl', () => {
  it('falls back to placeholder values when there is no logged-in user', () => {
    const report = collectErrorReport({ errorCode: 404, errorTitle: 'Page Not Found', user: null });
    expect(report.userName).toBe('Not logged in');
    expect(report.userEmail).toBe('Unknown');
    expect(report.userRole).toBe('Unknown');
    expect(report.userDepartment).toBe('Unknown');
  });

  it('includes the logged-in user details when present', () => {
    const report = collectErrorReport({ errorCode: 403, errorTitle: 'Access Denied', user: USER_ROLE });
    expect(report.userName).toBe('Sarah Miller');
    expect(report.userEmail).toBe('sarah.miller@thecreditpros.com');
    expect(report.userRole).toBe('USER');
    expect(report.userDepartment).toBe('HR');
  });

  it('builds report text containing every field', () => {
    const report = collectErrorReport({ errorCode: 404, errorTitle: 'Page Not Found', user: ADMIN_USER });
    const text = buildReportText(report);
    expect(text).toContain('Error Code:    404');
    expect(text).toContain('Error Title:   Page Not Found');
    expect(text).toContain('User:          John Doe');
    expect(text).toContain('Please attach a screenshot');
  });

  it('builds a mailto url with an encoded subject and body', () => {
    const report = collectErrorReport({ errorCode: 404, errorTitle: 'Page Not Found', user: ADMIN_USER });
    const url = buildMailtoUrl(report);
    expect(url).toMatch(/^mailto:it@thecreditpros\.com\?subject=/);
    expect(decodeURIComponent(url)).toContain('[TCP App Error] 404 — Page Not Found');
  });

  it('getBrowserInfo/getOSInfo return a string for the current test environment', () => {
    expect(typeof getBrowserInfo()).toBe('string');
    expect(typeof getOSInfo()).toBe('string');
  });
});

describe('ErrorReportModal', () => {
  const modalProps = { onClose: vi.fn(), errorCode: 404, errorTitle: 'Page Not Found' };

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('does not render when isOpen is false', () => {
    render(<ErrorReportModal {...modalProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the report with error code/title, user, URL, timestamp, and browser/OS info', () => {
    render(<ErrorReportModal {...modalProps} isOpen />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('404');
    expect(dialog).toHaveTextContent('Page Not Found');
    expect(dialog).toHaveTextContent('John Doe');
    expect(dialog).toHaveTextContent('john.doe@thecreditpros.com');
    expect(dialog).toHaveTextContent('ADMIN');
    expect(dialog).toHaveTextContent(window.location.href);
    expect(dialog).toHaveTextContent(/\d{4}/); // a year, as part of the timestamp
    // Re-use the same helper so this doesn't hardcode a browser name that
    // might not match the actual test/CI user agent.
    expect(dialog).toHaveTextContent(getBrowserInfo());
    expect(dialog).toHaveTextContent(getOSInfo());
  });

  it('shows "Copied! ✓" for 2 seconds after clicking "Copy Report"', async () => {
    render(<ErrorReportModal {...modalProps} isOpen />);

    fireEvent.click(screen.getByRole('button', { name: /copy report/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));

    expect(await screen.findByText('Copied! ✓')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Copied! ✓')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it('opens a mailto link to IT Support when "Email IT" is clicked', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: originalLocation.href },
    });

    render(<ErrorReportModal {...modalProps} isOpen />);
    fireEvent.click(screen.getByRole('button', { name: /email it/i }));

    expect(window.location.href).toContain('mailto:it@thecreditpros.com');
    expect(window.location.href).toContain('subject=');

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('closes when the X button is clicked', () => {
    const onClose = vi.fn();
    render(<ErrorReportModal {...modalProps} isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(<ErrorReportModal {...modalProps} isOpen onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<ErrorReportModal {...modalProps} isOpen onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the dialog card itself is clicked', () => {
    const onClose = vi.fn();
    render(<ErrorReportModal {...modalProps} isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('NotFoundPage', () => {
  it('renders the 404 code and "Page Not Found" title with both action buttons', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
  });
});

describe('ForbiddenPage', () => {
  it('renders the 403 code and "Access Denied" title', () => {
    renderWithRouter(<ForbiddenPage />);
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
  });

  it("shows the user's role in the message when logged in", () => {
    useAuth.mockReturnValue(USER_ROLE);
    renderWithRouter(<ForbiddenPage />);
    expect(screen.getByText(/USER role/)).toBeInTheDocument();
  });

  it('shows a generic message when there is no logged-in user', () => {
    useAuth.mockReturnValue(null);
    renderWithRouter(<ForbiddenPage />);
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
});

describe('ServerErrorPage', () => {
  it('renders the 500 code, "Something Went Wrong" title, and a Refresh Page button', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Something Went Wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
  });
});

describe('App-level route integration', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders NotFoundPage for an unmatched route', async () => {
    useAuth.mockReturnValue(ADMIN_USER);
    window.history.pushState({}, '', '/some-unknown-url');

    render(<App />);

    expect(await screen.findByText('404')).toBeInTheDocument();
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
  });

  it('renders ForbiddenPage at /403', async () => {
    useAuth.mockReturnValue(USER_ROLE);
    window.history.pushState({}, '', '/403');

    render(<App />);

    expect(await screen.findByText('403')).toBeInTheDocument();
    // The Header also shows "Access Denied" as its page title for /403, so
    // scope to <main> to target ErrorState's own heading specifically.
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
  });
});
