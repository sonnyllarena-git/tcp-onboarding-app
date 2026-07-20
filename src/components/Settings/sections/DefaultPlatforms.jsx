import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MOCK_DEPARTMENT_GROUPS, AVAILABLE_PLATFORMS, DEFAULT_SETTINGS } from '../../../mockData';

/**
 * DefaultPlatforms Component
 *
 * Admin-only: one expandable card per department group, letting an admin
 * choose which platforms are pre-checked when someone submits an
 * OnboardingForm request for that group. Only currently-ACTIVE platforms
 * (per PlatformManagement) are offered — disabling a platform there removes
 * it from every group's checkbox list here automatically.
 *
 * TODO: OnboardingForm Step 2 should read defaultPlatformsByGroup by
 * selected department - wire in next task. This component only persists
 * the setting for now.
 *
 * @component
 * @param {Object} settings - Current settings object
 * @param {Array<string>} settings.activePlatforms - Platform ids currently enabled
 * @param {Object} settings.defaultPlatformsByGroup - Map of group id -> selected platform ids
 * @param {Function} onUpdateSettings - Callback to persist a settings update
 * @returns {React.ReactElement} DefaultPlatforms component
 */
function DefaultPlatforms({ settings, onUpdateSettings }) {
  const [openGroupId, setOpenGroupId] = useState(MOCK_DEPARTMENT_GROUPS[0]?.id ?? null);

  const activePlatforms = AVAILABLE_PLATFORMS.filter((platform) =>
    settings.activePlatforms.includes(platform.id)
  );

  const updateGroupSelection = (groupId, platformIds) => {
    onUpdateSettings({
      defaultPlatformsByGroup: { ...settings.defaultPlatformsByGroup, [groupId]: platformIds },
    });
  };

  const togglePlatformForGroup = (groupId, platformId) => {
    const current = settings.defaultPlatformsByGroup[groupId] || [];
    const next = current.includes(platformId)
      ? current.filter((id) => id !== platformId)
      : [...current, platformId];
    updateGroupSelection(groupId, next);
  };

  const handleResetToDefault = (groupId) => {
    updateGroupSelection(groupId, DEFAULT_SETTINGS.defaultPlatformsByGroup[groupId] || []);
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-[#d4a574]">Default Platforms Per Department</h2>
      <p className="mb-4 text-sm text-gray-300">
        Set which platforms are pre-checked when onboarding an employee from each department
        group. Saves time for the person submitting the request.
      </p>

      <div className="mb-6 rounded-lg border border-blue-400/30 bg-blue-400/10 p-3 text-sm text-blue-200">
        ℹ️ In production, these groups map to Azure AD security groups (e.g. TCP-IT-Staff).
        Currently using mock department groups for local testing.
      </div>

      <div className="space-y-3">
        {MOCK_DEPARTMENT_GROUPS.map((group) => {
          const isOpen = openGroupId === group.id;
          const selected = settings.defaultPlatformsByGroup[group.id] || [];
          const allSelected =
            activePlatforms.length > 0 && selected.length === activePlatforms.length;

          return (
            <div key={group.id} className="rounded-xl border border-[#d4a574]/20 bg-white/5">
              <button
                type="button"
                onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="font-semibold text-white">{group.name}</span>{' '}
                  <span className="text-xs text-gray-400">(Azure Group: {group.azureGroup})</span>
                </span>
                <span aria-hidden="true" className="text-[#d4a574]">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-[#d4a574]/20 px-4 py-4">
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {activePlatforms.map((platform) => (
                      <label key={platform.id} className="flex items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={selected.includes(platform.id)}
                          onChange={() => togglePlatformForGroup(group.id, platform.id)}
                          className="h-4 w-4 accent-[#d4a574] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
                        />
                        {platform.name}
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                      {selected.length} of {activePlatforms.length} platform
                      {activePlatforms.length === 1 ? '' : 's'} selected
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetToDefault(group.id)}
                        className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
                      >
                        Reset to Default
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateGroupSelection(
                            group.id,
                            allSelected ? [] : activePlatforms.map((platform) => platform.id)
                          )
                        }
                        className="rounded-lg bg-[#d4a574] px-3 py-1.5 text-xs font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

DefaultPlatforms.propTypes = {
  settings: PropTypes.shape({
    activePlatforms: PropTypes.arrayOf(PropTypes.string).isRequired,
    defaultPlatformsByGroup: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  }).isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
};

export default DefaultPlatforms;
