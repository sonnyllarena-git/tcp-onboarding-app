import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import StatBox from './StatBox';
import QuickActions from './QuickActions';
import { getAllRequests } from '../../mockData';
import { getAllUsers } from '../../services/userService';
import { listRequests } from '../../services/requestService';

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
 * Computes the 4 dashboard stat cards straight from the real seed +
 * runtime data, alongside the underlying record lists each card's modal
 * drills into.
 *
 * @param {Array} users - getAllUsers()
 * @param {Array} requests - getAllRequests()
 * @returns {Object} { stats: Array, detail: {activeUsers, pendingRequests, completedToday, failedIssues} }
 */
export function buildDashboardStats(users, requests) {
  const activeUsers = users.filter((u) => u.status === 'active');
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const today = new Date().toDateString();
  const completedToday = requests.filter(
    (r) => r.status === 'completed' && r.completedAt && new Date(r.completedAt).toDateString() === today
  );
  const failedIssues = requests.filter((r) => (r.platforms || []).some((p) => p.status === 'failed'));

  return {
    detail: { activeUsers, pendingRequests, completedToday, failedIssues },
    stats: [
      { key: 'activeUsers', label: 'Active Users', value: activeUsers.length, icon: '👥', trend: 'up', color: 'green' },
      { key: 'pendingRequests', label: 'Pending Requests', value: pendingRequests.length, icon: '⏳', trend: 'up', color: 'orange' },
      { key: 'completedToday', label: 'Completed Today', value: completedToday.length, icon: '✅', trend: 'up', color: 'green' },
      {
        key: 'failedIssues',
        label: 'Failed/Issues',
        value: failedIssues.length,
        icon: '⚠️',
        trend: failedIssues.length > 0 ? 'down' : 'up',
        color: failedIssues.length > 0 ? 'red' : 'green',
      },
    ],
  };
}

const MODAL_TITLES = {
  activeUsers: 'Active Users',
  pendingRequests: 'Pending Requests',
  completedToday: 'Completed Today',
  failedIssues: 'Failed / Issues',
};

/**
 * Detail modal for a clicked stat card: a searchable table of the
 * underlying users or requests behind that number. Requests link
 * straight through to RequestDetails.
 */
function StatDetailModal({ statKey, records, onClose, onViewRequest }) {
  const [search, setSearch] = useState('');
  const isUsers = statKey === 'activeUsers';
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = records.filter((item) => {
    if (normalizedSearch === '') return true;
    const haystack = isUsers ? `${item.name} ${item.email}` : `${item.employeeName} ${item.email}`;
    return haystack.toLowerCase().includes(normalizedSearch);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={MODAL_TITLES[statKey]}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#d4a574]/30 bg-[#1a365d] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#d4a574]/20 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{MODAL_TITLES[statKey]}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-[#d4a574] hover:text-white focus:outline-none"
          >
            &#10005;
          </button>
        </div>

        <div className="border-b border-[#d4a574]/10 px-6 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#d4a574] focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No matching records.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0d1b30]">
                <tr>
                  {isUsers ? (
                    <>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]">Name</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]">Email</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]">Department</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]">Name</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]">Type</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]">Status</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase text-[#d4a574]" />
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[#d4a574]/10">
                    {isUsers ? (
                      <>
                        <td className="px-4 py-2 text-white">{item.name}</td>
                        <td className="px-4 py-2 text-gray-300">{item.email}</td>
                        <td className="px-4 py-2 text-gray-300">{item.department}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-white">{item.employeeName}</td>
                        <td className="px-4 py-2 text-gray-300">{item.type}</td>
                        <td className="px-4 py-2 text-gray-300 capitalize">{item.status}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onViewRequest(item.id)}
                            className="rounded-lg border border-[#d4a574]/40 px-3 py-1 text-xs font-bold text-[#d4a574] hover:bg-[#d4a574]/10"
                          >
                            View →
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#d4a574]/20 px-6 py-3">
          <p className="text-xs text-gray-400">Total: {filtered.length}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#d4a574] hover:bg-[#d4a574] hover:text-[#1a365d]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Component
 *
 * Main dashboard view for TCP Employee Onboarding Portal. Quick Actions
 * come first since they're the primary entry points; the stat cards
 * below are click-through to a searchable detail view of exactly which
 * users/requests make up that number.
 *
 * @component
 * @param {string} [userName] - Name of logged-in user, defaults to "User"
 * @returns {React.ReactElement} Dashboard component
 *
 * @example
 * <Dashboard userName="John Doe" />
 */
function Dashboard({ userName = 'User' }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openStat, setOpenStat] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [realUsers, realRequests] = await Promise.all([getAllUsers(), listRequests()]);
        if (cancelled) return;
        setUsers(realUsers);
        setRequests([...realRequests, ...getAllRequests()]);
      } catch (error) {
        console.error('[Dashboard] failed to load data:', error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { stats, detail } = buildDashboardStats(users, requests);

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
    // TODO: Wire up real navigation/API calls for any future actions.
    console.log(`Quick action triggered: ${action}`);
  };

  const handleViewRequest = (requestId) => {
    setOpenStat(null);
    navigate(`/requests/${requestId}`);
  };

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>;
  }

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

      <div className="space-y-6">
        <section aria-label="Quick actions">
          <QuickActions onAction={handleQuickAction} />
        </section>

        <section aria-label="Key statistics">
          <h2 className="mb-3 text-base font-bold text-white">Today&apos;s Metrics</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatBox key={stat.key} {...stat} onClick={() => setOpenStat(stat.key)} />
            ))}
          </div>
        </section>
      </div>

      {openStat && (
        <StatDetailModal
          statKey={openStat}
          records={detail[openStat]}
          onClose={() => setOpenStat(null)}
          onViewRequest={handleViewRequest}
        />
      )}
    </div>
  );
}

Dashboard.propTypes = {
  userName: PropTypes.string,
};

export default Dashboard;
