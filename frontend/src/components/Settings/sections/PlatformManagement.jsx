import React from 'react';
import PropTypes from 'prop-types';
import { AVAILABLE_PLATFORMS } from '../../../mockData';
import ToggleSwitch from '../ToggleSwitch';

const CATEGORY_STYLES = {
  Identity: 'bg-[#4299e1]/20 text-[#4299e1]',
  Security: 'bg-[#48bb78]/20 text-[#48bb78]',
  Telephony: 'bg-[#ed8936]/20 text-[#ed8936]',
  Productivity: 'bg-[#9f7aea]/20 text-[#9f7aea]',
  Project: 'bg-[#f56565]/20 text-[#f56565]',
  Support: 'bg-[#38b2ac]/20 text-[#38b2ac]',
  Scheduling: 'bg-[#d4a574]/20 text-[#d4a574]',
  Internal: 'bg-gray-400/20 text-gray-300',
  Sales: 'bg-pink-400/20 text-pink-300',
  Monitoring: 'bg-teal-400/20 text-teal-300',
};

/**
 * Returns the Tailwind classes for a category pill. Falls back to a
 * neutral gray for any category not in CATEGORY_STYLES.
 * @param {string} category - Platform category
 * @returns {string} Tailwind background/text classes for the pill
 */
export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || 'bg-gray-400/20 text-gray-300';
}

/**
 * PlatformManagement Component
 *
 * Admin-only: enable/disable which platforms appear in onboarding and
 * offboarding forms app-wide. Toggling here updates settings.activePlatforms,
 * which DefaultPlatforms also reads to filter its own checkbox lists.
 *
 * TODO: OnboardingForm Step 2 should read activePlatforms from settings -
 * wire in next task. This component only persists the setting for now.
 *
 * @component
 * @param {Object} settings - Current settings object
 * @param {Array<string>} settings.activePlatforms - Platform ids currently enabled
 * @param {Function} onUpdateSettings - Callback to persist a settings update
 * @returns {React.ReactElement} PlatformManagement component
 */
function PlatformManagement({ settings, onUpdateSettings }) {
  const isActive = (platformId) => settings.activePlatforms.includes(platformId);

  const handleToggle = (platformId) => {
    const next = isActive(platformId)
      ? settings.activePlatforms.filter((id) => id !== platformId)
      : [...settings.activePlatforms, platformId];
    onUpdateSettings({ activePlatforms: next });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-[#d4a574]">Platform Management</h2>
      <p className="mb-4 text-sm text-gray-300">
        Enable or disable platforms across the entire app. Disabled platforms will not appear in
        onboarding or offboarding forms.
      </p>

      <div className="mb-4 rounded-lg border border-[#f6ad55]/40 bg-[#f6ad55]/10 p-3 text-sm text-[#f6ad55]">
        ⚠️ Disabling a platform removes it from all new onboarding forms immediately. Existing
        requests are not affected.
      </div>

      {settings.activePlatforms.length === 0 && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[#f56565]/40 bg-[#f56565]/10 p-3 text-sm text-[#f56565]"
        >
          No active platforms. Enable at least one platform to allow onboarding.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#d4a574]/30">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-[#0d1b30]">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Platform Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Description
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_PLATFORMS.map((platform) => {
              const active = isActive(platform.id);
              return (
                <tr key={platform.id} className="border-b border-[#d4a574]/10">
                  <td className="px-4 py-3 text-sm font-semibold text-white">{platform.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryStyle(
                        platform.category
                      )}`}
                    >
                      {platform.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{platform.description}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 rounded-full ${active ? 'bg-[#48bb78]' : 'bg-gray-500'}`}
                      />
                      <span className={active ? 'text-[#48bb78]' : 'text-gray-400'}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      checked={active}
                      onChange={() => handleToggle(platform.id)}
                      ariaLabel={`Toggle ${platform.name}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

PlatformManagement.propTypes = {
  settings: PropTypes.shape({
    activePlatforms: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
};

export default PlatformManagement;
