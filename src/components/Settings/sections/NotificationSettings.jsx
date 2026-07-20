import React from 'react';
import PropTypes from 'prop-types';
import ToggleSwitch from '../ToggleSwitch';

const USER_NOTIFICATIONS = [
  {
    key: 'requestApproved',
    label: 'Request Approved',
    description: 'When your onboarding/offboarding request is approved',
  },
  {
    key: 'requestCompleted',
    label: 'Request Completed',
    description: 'When all platforms are fully provisioned',
  },
  {
    key: 'requestRejected',
    label: 'Request Rejected',
    description: 'When your request is rejected with a reason',
  },
];

const ADMIN_NOTIFICATIONS = [
  {
    key: 'newRequestSubmitted',
    label: 'New Request Submitted',
    description: 'When a new onboarding or offboarding request is submitted',
  },
  {
    key: 'platformFailed',
    label: 'Platform Sync Failed',
    description: 'When a platform fails to sync during onboarding/offboarding',
  },
];

/**
 * NotificationToggleRow Component
 *
 * One notification preference row: label, description, and a toggle switch.
 *
 * @component
 * @param {{key: string, label: string, description: string}} item - Notification descriptor
 * @param {boolean} checked - Whether this notification is enabled
 * @param {Function} onChange - Callback when the toggle is clicked
 * @returns {React.ReactElement} NotificationToggleRow component
 */
function NotificationToggleRow({ item, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#d4a574]/20 bg-white/5 p-4">
      <div>
        <p className="font-semibold text-white">{item.label}</p>
        <p className="text-sm text-gray-400">{item.description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} ariaLabel={item.label} />
    </div>
  );
}

NotificationToggleRow.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

/**
 * NotificationSettings Component
 *
 * Notification preference toggles. USER sees the 3 requester-facing
 * notifications; ADMIN additionally sees an "Admin Notifications" group.
 * Email delivery itself isn't wired up yet (see the info banner) — these
 * preferences are just persisted for when it is.
 *
 * @component
 * @param {Object} settings - Current settings object
 * @param {Object} settings.notifications - Map of notification key -> enabled
 * @param {Function} onUpdateSettings - Callback to persist a settings update
 * @param {boolean} [isAdmin] - Whether to show the Admin Notifications group
 * @returns {React.ReactElement} NotificationSettings component
 */
function NotificationSettings({ settings, onUpdateSettings, isAdmin = false }) {
  const handleToggle = (key) => {
    onUpdateSettings({
      notifications: { ...settings.notifications, [key]: !settings.notifications[key] },
    });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-[#d4a574]">Notification Preferences</h2>
      <p className="mb-4 text-sm text-gray-300">
        Choose which events send you an email notification. Actual email delivery will be
        activated in production.
      </p>

      <div className="mb-6 rounded-lg border border-blue-400/30 bg-blue-400/10 p-3 text-sm text-blue-200">
        ℹ️ Email notifications will be enabled when the app goes live. These preferences are
        saved for production.
      </div>

      <div className="space-y-3">
        {USER_NOTIFICATIONS.map((item) => (
          <NotificationToggleRow
            key={item.key}
            item={item}
            checked={settings.notifications[item.key]}
            onChange={() => handleToggle(item.key)}
          />
        ))}
      </div>

      {isAdmin && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#d4a574]">
            Admin Notifications
          </h3>
          <div className="space-y-3">
            {ADMIN_NOTIFICATIONS.map((item) => (
              <NotificationToggleRow
                key={item.key}
                item={item}
                checked={settings.notifications[item.key]}
                onChange={() => handleToggle(item.key)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

NotificationSettings.propTypes = {
  settings: PropTypes.shape({
    notifications: PropTypes.objectOf(PropTypes.bool).isRequired,
  }).isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

export default NotificationSettings;
