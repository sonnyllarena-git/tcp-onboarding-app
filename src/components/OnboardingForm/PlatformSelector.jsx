import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PLATFORMS } from '../../data/formOptions';
import { getEffectiveMapping } from '../../services/rolePlatformMappingService';

/**
 * PlatformSelector Component
 *
 * Onboarding Step 3's platform checklist. Auto-populates from
 * ROLE_PLATFORM_MAPPING the instant `selectedRole` changes (tracked
 * via a ref so it only re-applies on an actual role change, not on
 * every re-render or when the admin has manually edited the set for
 * the current role). The admin can still freely check/uncheck any
 * of the 18 platforms, or pick "N/A" to clear the set entirely -
 * checking N/A unchecks everything else, and checking any real
 * platform clears N/A.
 *
 * @component
 * @param {string} selectedRole - The role chosen in Step 2 (drives the default set)
 * @param {Array<string>} platforms - Currently selected platform names (or ['N/A'])
 * @param {Function} onChange - Called with the new platforms array
 * @param {string} [errors] - Validation error to display (e.g. "select at least one")
 * @param {Function} [onReset] - Called after resetting back to the role's defaults
 * @returns {React.ReactElement}
 */
function PlatformSelector({ selectedRole, platforms, onChange, errors, onReset }) {
  const lastAppliedRole = useRef(null);

  useEffect(() => {
    if (selectedRole && selectedRole !== lastAppliedRole.current) {
      lastAppliedRole.current = selectedRole;
      onChange(getEffectiveMapping()[selectedRole] || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole]);

  const isNA = platforms.includes('N/A');

  const handleToggle = (platformName) => {
    if (isNA) {
      onChange([platformName]);
      return;
    }
    const next = platforms.includes(platformName)
      ? platforms.filter((p) => p !== platformName)
      : [...platforms, platformName];
    onChange(next);
  };

  const handleToggleNA = () => {
    onChange(isNA ? [] : ['N/A']);
  };

  const handleReset = () => {
    const defaults = getEffectiveMapping()[selectedRole] || [];
    onChange(defaults);
    if (onReset) onReset();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#d4a574]">Platforms</h3>
        <button
          type="button"
          onClick={handleReset}
          disabled={!selectedRole || selectedRole === 'N/A'}
          className="rounded-lg border border-[#d4a574]/40 px-3 py-1 text-xs font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset to Default
        </button>
      </div>

      <div className={`rounded-lg border p-3 ${errors ? 'border-red-500' : 'border-[#d4a574]/30'}`}>
        <label className="mb-2 flex items-center gap-2 rounded bg-[#0d1b30] p-2 text-sm font-semibold text-white">
          <input type="checkbox" checked={isNA} onChange={handleToggleNA} className="h-4 w-4 accent-[#d4a574]" />
          N/A (no platforms)
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLATFORMS.map((platformName) => (
            <label
              key={platformName}
              className="flex items-center gap-2 rounded bg-[#0d1b30] p-2 text-sm text-white"
            >
              <input
                type="checkbox"
                checked={platforms.includes(platformName)}
                onChange={() => handleToggle(platformName)}
                className="h-4 w-4 accent-[#d4a574]"
              />
              {platformName}
            </label>
          ))}
        </div>
      </div>
      {errors && <p className="mt-1 text-xs text-red-400">{errors}</p>}
    </div>
  );
}

PlatformSelector.propTypes = {
  selectedRole: PropTypes.string,
  platforms: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.string,
  onReset: PropTypes.func,
};

export default PlatformSelector;
