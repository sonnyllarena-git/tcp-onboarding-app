import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllAuditLogs } from '../AuditLogs';

const MAX_ACTIVITIES = 20;
const LAST_READ_STORAGE_KEY = 'tcp_notifications_last_read';

// Only the onboarding/offboarding/transition workflow events are shown
// here - the full audit log (logins, CSV imports, platform clicks, ...)
// is a much broader admin tool, already available at /audit-logs.
const ACTION_ICONS = {
  ONBOARDING_SUBMITTED: '📝',
  ONBOARDING_APPROVED: '✅',
  OFFBOARDING_SUBMITTED: '📋',
  OFFBOARDING_APPROVED: '✅',
  TRANSITION_REQUEST_SUBMITTED: '🔄',
  TRANSITION_COMPLETED: '✅',
};

const ACTION_LABELS = {
  ONBOARDING_SUBMITTED: 'Onboarding Submitted',
  ONBOARDING_APPROVED: 'Onboarding Completed',
  OFFBOARDING_SUBMITTED: 'Offboarding Submitted',
  OFFBOARDING_APPROVED: 'Offboarding Completed',
  TRANSITION_REQUEST_SUBMITTED: 'Transition Submitted',
  TRANSITION_COMPLETED: 'Transition Completed',
};

const RELEVANT_ACTIONS = Object.keys(ACTION_LABELS);

/**
 * Loads the most recent onboarding/offboarding workflow events, newest
 * first, capped at MAX_ACTIVITIES.
 * @returns {Array}
 */
function getRecentActivities() {
  return getAllAuditLogs()
    .filter((log) => RELEVANT_ACTIONS.includes(log.action))
    .sort((a, b) => new Date(b.timestampIso) - new Date(a.timestampIso))
    .slice(0, MAX_ACTIVITIES);
}

/**
 * Reads when the admin last opened the notification center. Absent/
 * unparsable localStorage means nothing has ever been read, so every
 * activity counts as unread.
 * @returns {Date}
 */
function getLastReadTime() {
  try {
    const stored = localStorage.getItem(LAST_READ_STORAGE_KEY);
    const parsed = stored ? new Date(stored) : new Date(0);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  } catch {
    return new Date(0);
  }
}

function setLastReadTimeNow() {
  try {
    localStorage.setItem(LAST_READ_STORAGE_KEY, new Date().toISOString());
  } catch {
    // localStorage unavailable - the badge just won't persist across a reload.
  }
}

/**
 * Counts activities newer than the last-read timestamp.
 * @param {Array} activities
 * @param {Date} lastReadTime
 * @returns {number}
 */
function countUnread(activities, lastReadTime) {
  return activities.filter((a) => new Date(a.timestampIso) > lastReadTime).length;
}

/**
 * Formats an ISO timestamp as a short relative time ("Just now",
 * "5 minutes ago", "2 hours ago", ...), falling back to the date once
 * it's more than a week old.
 * @param {string} timestampIso
 * @returns {string}
 */
function getTimeAgo(timestampIso) {
  const diffMs = Date.now() - new Date(timestampIso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(timestampIso).toLocaleDateString();
}

/**
 * NotificationCenter Component
 *
 * Bell icon shown in the Header, next to Logout. Shows a red badge with
 * the count of onboarding/offboarding/transition events since the admin
 * last cleared it; clicking opens a dropdown listing the 20 most recent
 * events. Each row with a linked request (every runtime-created one)
 * is clickable and navigates straight to that request's details.
 *
 * @component
 * @returns {React.ReactElement} NotificationCenter component
 */
function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState(getRecentActivities);
  const [unreadCount, setUnreadCount] = useState(() => countUnread(getRecentActivities(), getLastReadTime()));
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Re-check for new activity on every navigation - covers the common
  // case here (submit/approve is always immediately followed by a
  // navigate() elsewhere in the app) without needing to poll on a timer.
  useEffect(() => {
    const latest = getRecentActivities();
    setActivities(latest);
    setUnreadCount(countUnread(latest, getLastReadTime()));
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleBellClick = () => {
    if (!isOpen) {
      // Opening - mark everything currently shown as read.
      setLastReadTimeNow();
      setUnreadCount(0);
    }
    setIsOpen((prev) => !prev);
  };

  // Runtime-created activities carry a requestId (stamped by
  // recordAuditLog/logWorkflowEvent at submission/approval time); the
  // hand-authored seed activities never do, so they're correctly inert.
  const handleActivityClick = (activity) => {
    if (!activity.requestId) return;
    setIsOpen(false);
    navigate(`/requests/${activity.requestId}`);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Activity notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none text-gray-300 transition-colors hover:bg-white/10 hover:text-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread activities`}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a365d] bg-[#f56565] text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Activity Center"
          className="absolute right-0 z-50 mt-2 flex max-h-[500px] w-96 flex-col overflow-hidden rounded-lg border border-[#d4a574]/30 bg-[#1a365d] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#d4a574]/20 px-4 py-3">
            <h2 className="text-base font-bold text-white">Activity Center</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="text-xl leading-none text-[#d4a574] hover:text-white focus:outline-none"
            >
              &#10005;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">No recent activities</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  title={activity.requestId ? 'Click to view request' : ''}
                  className={`flex gap-3 border-b border-[#d4a574]/10 px-4 py-3 transition-colors ${
                    activity.requestId ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'
                  }`}
                >
                  <span className="mt-0.5 text-lg" aria-hidden="true">
                    {ACTION_ICONS[activity.action] || '📌'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {ACTION_LABELS[activity.action] || activity.action}
                    </p>
                    <p className="truncate text-xs text-gray-400">{activity.details}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {activity.userName ? `${activity.userName} · ` : ''}
                      {getTimeAgo(activity.timestampIso)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t border-[#d4a574]/20 bg-black/20 px-4 py-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg bg-[#d4a574]/20 px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/30 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
