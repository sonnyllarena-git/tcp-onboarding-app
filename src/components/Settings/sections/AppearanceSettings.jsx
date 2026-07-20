import React from 'react';
import PropTypes from 'prop-types';
import ToggleSwitch from '../ToggleSwitch';

/**
 * AppearanceSettings Component
 *
 * Lets the user toggle dark mode. The "dark" class on document.documentElement
 * is applied here immediately for a live preview as soon as the toggle is
 * clicked — it is NOT persisted to localStorage until the user clicks
 * "Save Changes" in the parent Settings component (see useSettings'
 * saveSettings/cancelSettings, which commit or revert this preview).
 *
 * @component
 * @param {Object} settings - Current (working, not-yet-saved) settings object
 * @param {boolean} settings.darkMode - Whether dark mode is on in the working copy
 * @param {Function} onUpdateSettings - Callback to update the working settings
 * @returns {React.ReactElement} AppearanceSettings component
 */
function AppearanceSettings({ settings, onUpdateSettings }) {
  const handleDarkModeToggle = (value) => {
    // Preview immediately.
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Update the working state only - not saved until "Save Changes".
    onUpdateSettings({ darkMode: value });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-[#d4a574]">Appearance</h2>
      <p className="mb-6 text-sm text-gray-300">Customize how the app looks for you.</p>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-[#d4a574]/20 bg-white/5 p-4">
        <div>
          <p className="font-semibold text-white">Dark Mode</p>
          <p className="text-sm text-gray-400">
            Switch to ultra-dark theme for low-light environments
          </p>
        </div>
        <ToggleSwitch checked={settings.darkMode} onChange={handleDarkModeToggle} ariaLabel="Dark Mode" />
      </div>
    </div>
  );
}

AppearanceSettings.propTypes = {
  settings: PropTypes.shape({
    darkMode: PropTypes.bool.isRequired,
  }).isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
};

export default AppearanceSettings;
