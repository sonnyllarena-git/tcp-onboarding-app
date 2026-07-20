import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import StatBox from './StatBox';
import QuickActions from './QuickActions';

const MOCK_STATS = [
  { label: 'Active Users', value: 24, icon: '👥', trend: 'up', color: 'green' },
  { label: 'Pending Requests', value: 8, icon: '⏳', trend: 'up', color: 'orange' },
  { label: 'Completed Today', value: 12, icon: '✅', trend: 'up', color: 'green' },
  { label: 'Failed/Issues', value: 2, icon: '⚠️', trend: 'down', color: 'red' },
];

// TODO: Replace with a real API call to fetch dashboard stats.
function mockFetchDashboardData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ stats: MOCK_STATS });
    }, 400);
  });
}

/**
 * Returns a time-of-day greeting.
 *
 * @param {number} [hour] - Hour of day (0-23), defaults to the current hour
 * @returns {string} "Good morning" | "Good afternoon" | "Good evening"
 */
export function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Dashboard Component
 *
 * Main dashboard view for TCP Employee Onboarding Portal.
 * Shows overview statistics, recent activities, and quick actions.
 *
 * @component
 * @param {string} [userName] - Name of logged-in user, defaults to "User"
 * @param {Function} [dataService] - Injectable data loader, defaults to the mock fetch. Swap in a real API call, or a stub in tests.
 * @returns {React.ReactElement} Dashboard component
 *
 * @example
 * <Dashboard userName="John Doe" />
 */
function Dashboard({ userName = 'User', dataService = mockFetchDashboardData }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    dataService().then((data) => {
      if (isMounted) {
        setStats(data.stats);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [dataService]);

  const handleQuickAction = (action) => {
    if (action === 'New Onboarding') {
      navigate('/onboarding');
      return;
    }
    if (action === 'View Requests') {
      navigate('/requests');
      return;
    }
    if (action === 'Users List') {
      navigate('/manage-users');
      return;
    }
    if (action === 'Audit Logs') {
      navigate('/audit-logs');
      return;
    }
    if (action === 'Generate Report') {
      navigate('/reports');
      return;
    }
    // TODO: Wire up real navigation/API calls for the remaining actions.
    console.log(`Quick action triggered: ${action}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-white sm:text-[32px]">
          {getGreeting()}, {userName}
        </h1>
        <p className="mt-1 text-sm text-gray-300">
          Here&apos;s what&apos;s happening across onboarding today.
        </p>
      </header>

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-3 py-24">
          <svg
            className="h-8 w-8 animate-spin text-[#d4a574]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-gray-300">Loading dashboard...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <section aria-label="Key statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatBox key={stat.label} {...stat} />
            ))}
          </section>

          <section aria-label="Quick actions">
            <QuickActions onAction={handleQuickAction} />
          </section>
        </div>
      )}
    </div>
  );
}

Dashboard.propTypes = {
  userName: PropTypes.string,
  dataService: PropTypes.func,
};

export default Dashboard;
