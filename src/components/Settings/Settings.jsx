import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_SETTINGS } from '../../mockData';
import AppearanceSettings from './sections/AppearanceSettings';
import NotificationSettings from './sections/NotificationSettings';
import PlatformManagement from './sections/PlatformManagement';
import RolePlatformMapping from './sections/RolePlatformMapping';

const SETTINGS_KEY = 'tcp_settings';

const USER_SECTIONS = [
  { key: 'appearance', label: 'Appearance', icon: '⚙️' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
];

const ADMIN_ONLY_SECTIONS = [
  { key: 'platformManagement', label: 'Platform Management', icon: '🖥️' },
  { key: 'rolePlatformMapping', label: 'Role → Platform Mapping', icon: '🔀' },
];

/**
 * Reads persisted settings from localStorage, merged over DEFAULT_SETTINGS
 * so any keys added since a user's last visit still have a value. Falls
 * back to DEFAULT_SETTINGS entirely if nothing is stored, or it fails to parse.
 * @returns {Object} Settings object
 */
function readStoredSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * useSettings Hook
 *
 * Tracks a last-committed `savedSettings` copy (persisted to localStorage,
 * key: 'tcp_settings') and a `workingSettings` copy the sections actually
 * read/write via `updateSetting`. Nothing reaches localStorage until
 * `saveSettings()` runs; `cancelSettings()` discards the working copy and
 * reverts to what was last saved — including re-applying the saved dark-mode
 * class, since AppearanceSettings previews dark mode live before it's saved.
 *
 * @returns {{
 *   settings: Object,
 *   hasUnsavedChanges: boolean,
 *   updateSetting: Function,
 *   saveSettings: Function,
 *   cancelSettings: Function,
 * }}
 */
export function useSettings() {
  const [savedSettings, setSavedSettings] = useState(readStoredSettings);
  const [workingSettings, setWorkingSettings] = useState(savedSettings);

  const hasUnsavedChanges = JSON.stringify(workingSettings) !== JSON.stringify(savedSettings);

  const updateSetting = (updates) => {
    setWorkingSettings((prev) => ({ ...prev, ...updates }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(workingSettings));
      setSavedSettings(workingSettings);
      if (workingSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return true;
    } catch {
      return false;
    }
  };

  const cancelSettings = () => {
    setWorkingSettings(savedSettings);
    if (savedSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return { settings: workingSettings, hasUnsavedChanges, updateSetting, saveSettings, cancelSettings };
}

/**
 * Settings Component
 *
 * Role-based settings page: USER sees Appearance + Notifications, ADMIN
 * additionally sees Platform Management + Default Platforms. Changes are
 * held in a working copy until explicitly saved: a sticky "unsaved changes"
 * bar appears with Save/Cancel actions, and only Save persists to
 * localStorage (dark mode is the one exception that also previews live).
 *
 * @component
 * @returns {React.ReactElement} Settings component
 */
function Settings() {
  const user = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { settings, hasUnsavedChanges, updateSetting, saveSettings, cancelSettings } = useSettings();
  const [activeSection, setActiveSection] = useState('appearance');
  const [toast, setToast] = useState(null);

  const sections = isAdmin ? [...USER_SECTIONS, ...ADMIN_ONLY_SECTIONS] : USER_SECTIONS;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = () => {
    const success = saveSettings();
    setToast(
      success
        ? { message: 'Settings saved successfully!', type: 'success' }
        : { message: 'Failed to save settings.', type: 'error' }
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearanceSettings settings={settings} onUpdateSettings={updateSetting} />;
      case 'notifications':
        return (
          <NotificationSettings
            settings={settings}
            onUpdateSettings={updateSetting}
            isAdmin={isAdmin}
          />
        );
      case 'platformManagement':
        return isAdmin ? (
          <PlatformManagement settings={settings} onUpdateSettings={updateSetting} />
        ) : null;
      case 'rolePlatformMapping':
        return isAdmin ? <RolePlatformMapping /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 dark:from-[#0a0f1e] dark:to-[#0a0f1e] sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-300">
          Manage your preferences for the onboarding portal.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          aria-label="Settings sections"
          className="flex gap-2 overflow-x-auto rounded-xl bg-[#0d1b30] p-2 dark:bg-[#111827] lg:w-64 lg:flex-none lg:flex-col lg:overflow-visible"
        >
          {sections.map((section) => {
            const isActive = section.key === activeSection;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg border-l-4 px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
                  isActive
                    ? 'border-[#d4a574] bg-white/5 text-[#d4a574]'
                    : 'border-transparent text-gray-300 hover:bg-white/5'
                }`}
              >
                <span aria-hidden="true">{section.icon}</span>
                {section.label}
              </button>
            );
          })}
        </nav>

        <section className="flex-1 rounded-xl border border-[#d4a574]/20 bg-[#1a365d]/30 p-6 dark:bg-[#111827]/60">
          {renderSection()}
        </section>
      </div>

      {hasUnsavedChanges && (
        <div className="sticky bottom-0 mt-6 flex items-center justify-between rounded-xl border border-[#d4a574]/30 bg-[#0d1b30] px-6 py-4 shadow-lg">
          <p className="flex items-center gap-2 text-sm text-yellow-400">
            <span>⚠️</span>
            <span>You have unsaved changes</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={cancelSettings}
              className="rounded-lg border border-gray-500 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-[#d4a574] px-6 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c4956a]"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            toast.type === 'success' ? 'bg-[#48bb78]' : 'bg-[#f56565]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Settings;
