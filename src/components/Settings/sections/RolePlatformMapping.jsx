import React, { useState } from 'react';
import { ROLES, PLATFORMS } from '../../../data/formOptions';
import {
  getEffectiveMapping,
  hasOverride,
  saveRoleOverride,
  resetRoleOverride,
  resetAllOverrides,
  getAuditLog,
} from '../../../services/rolePlatformMappingService';
import { useAuth } from '../../../hooks/useAuth';

const ONBOARDING_ROLES = ROLES.filter((role) => role !== 'N/A');

/**
 * RolePlatformMapping Component
 *
 * Admin-only editor for which of the 18 onboarding platforms each of
 * the 38 real roles defaults to. Edits are localStorage-backed (per
 * the Phase 4 spec's own "audit logging: localStorage for now, will
 * use backend later" instruction) and take effect immediately in the
 * live OnboardingForm wizard - PlatformSelector reads through the
 * same getEffectiveMapping() this page writes to.
 *
 * @component
 * @returns {React.ReactElement}
 */
function RolePlatformMapping() {
  const user = useAuth();
  const [mapping, setMapping] = useState(getEffectiveMapping);
  const [editingRole, setEditingRole] = useState(null);
  const [draftPlatforms, setDraftPlatforms] = useState([]);
  const [auditLog, setAuditLog] = useState(getAuditLog);

  const refresh = () => {
    setMapping(getEffectiveMapping());
    setAuditLog(getAuditLog());
  };

  const openEditor = (role) => {
    setEditingRole(role);
    setDraftPlatforms(mapping[role] || []);
  };

  const closeEditor = () => {
    setEditingRole(null);
    setDraftPlatforms([]);
  };

  const toggleDraftPlatform = (platformName) => {
    setDraftPlatforms((prev) =>
      prev.includes(platformName) ? prev.filter((p) => p !== platformName) : [...prev, platformName]
    );
  };

  const handleSave = () => {
    saveRoleOverride(editingRole, draftPlatforms, user?.email || 'unknown');
    refresh();
    closeEditor();
  };

  const handleResetOne = (role) => {
    resetRoleOverride(role, user?.email || 'unknown');
    refresh();
  };

  const handleResetAll = () => {
    if (!window.confirm('Reset ALL 38 roles back to their default platform sets?')) return;
    resetAllOverrides(user?.email || 'unknown');
    refresh();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-lg font-bold text-[#d4a574]">Role → Platform Mapping</h2>
          <p className="text-sm text-gray-300">
            Which platforms auto-populate on Onboarding Step 3 for each role. Edits apply immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetAll}
          className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-400/10"
        >
          Reset All Platforms
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#d4a574]/30">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-[#0d1b30]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">Role</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">Platforms</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">Action</th>
            </tr>
          </thead>
          <tbody>
            {ONBOARDING_ROLES.map((role) => (
              <tr key={role} className="border-b border-[#d4a574]/10">
                <td className="px-4 py-3 text-sm font-semibold text-white">{role}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{(mapping[role] || []).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  {hasOverride(role) ? (
                    <span className="rounded-full bg-[#ed8936]/20 px-2.5 py-0.5 text-xs font-semibold text-[#ed8936]">
                      Customized
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-400/20 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor(role)}
                      className="rounded-lg border border-[#d4a574]/40 px-3 py-1 text-xs font-bold text-[#d4a574] hover:bg-[#d4a574]/10"
                    >
                      Edit
                    </button>
                    {hasOverride(role) && (
                      <button
                        type="button"
                        onClick={() => handleResetOne(role)}
                        className="rounded-lg border border-gray-500 px-3 py-1 text-xs font-bold text-gray-300 hover:bg-white/5"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditLog.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#d4a574]">Recent Changes</h3>
          <div className="space-y-2">
            {auditLog.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded bg-[#0d1b30] p-3 text-xs text-gray-300">
                <span className="font-semibold text-white">{entry.role || 'All roles'}</span>
                {' — '}
                {entry.action.replace(/_/g, ' ').toLowerCase()} by {entry.changedBy} at{' '}
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {editingRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h3 className="mb-4 text-lg font-bold text-white">{editingRole}</h3>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platformName) => (
                <label key={platformName} className="flex items-center gap-2 rounded bg-[#0d1b30] p-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={draftPlatforms.includes(platformName)}
                    onChange={() => toggleDraftPlatform(platformName)}
                    className="h-4 w-4 accent-[#d4a574]"
                  />
                  {platformName}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] hover:bg-[#c99a63]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolePlatformMapping;
