/**
 * rolePlatformMappingService.js
 *
 * Admin-editable overrides for ROLE_PLATFORM_MAPPING (formOptions.js).
 * Per the Phase 4 spec ("Audit logging: localStorage for now - will
 * use backend later"), this is entirely localStorage-backed - same
 * seed + runtime-overlay pattern used elsewhere in this app (Settings,
 * the Transition/Reactivation request pipeline). PlatformSelector
 * reads the MERGED mapping via getEffectiveMapping() (not the raw
 * static ROLE_PLATFORM_MAPPING) so an admin's edits here actually take
 * effect in the live onboarding wizard, not just in this settings page.
 */

import { ROLE_PLATFORM_MAPPING } from '../data/formOptions';

const OVERRIDES_KEY = 'tcp_role_platform_overrides';
const AUDIT_KEY = 'tcp_role_platform_audit';

function readOverrides() {
  try {
    const stored = localStorage.getItem(OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable - edit still applies for this session only.
  }
}

function appendAudit(entry) {
  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    const logs = stored ? JSON.parse(stored) : [];
    logs.unshift({ id: `rpm-${Date.now()}`, timestamp: new Date().toISOString(), ...entry });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // best-effort only
  }
}

/** The mapping every role actually uses right now: defaults + admin overrides. */
export function getEffectiveMapping() {
  return { ...ROLE_PLATFORM_MAPPING, ...readOverrides() };
}

/** The default (un-overridden) platform set for a role. */
export function getDefaultPlatforms(role) {
  return ROLE_PLATFORM_MAPPING[role] || [];
}

/** True if this role currently has an admin override applied. */
export function hasOverride(role) {
  return Object.prototype.hasOwnProperty.call(readOverrides(), role);
}

/**
 * Saves an admin edit for one role's platform set.
 * @param {string} role
 * @param {Array<string>} platforms
 * @param {string} changedBy - Admin's name/email, for the audit trail
 */
export function saveRoleOverride(role, platforms, changedBy) {
  const overrides = readOverrides();
  const before = getEffectiveMapping()[role] || [];
  overrides[role] = platforms;
  writeOverrides(overrides);
  appendAudit({ action: 'ROLE_PLATFORM_MAPPING_UPDATED', role, before, after: platforms, changedBy });
}

/** Reverts one role back to its ROLE_PLATFORM_MAPPING default. */
export function resetRoleOverride(role, changedBy) {
  const overrides = readOverrides();
  const before = overrides[role];
  delete overrides[role];
  writeOverrides(overrides);
  appendAudit({ action: 'ROLE_PLATFORM_MAPPING_RESET', role, before, after: ROLE_PLATFORM_MAPPING[role] || [], changedBy });
}

/** Clears every admin override, reverting all 38 roles to their defaults. */
export function resetAllOverrides(changedBy) {
  writeOverrides({});
  appendAudit({ action: 'ROLE_PLATFORM_MAPPING_RESET_ALL', role: null, before: null, after: null, changedBy });
}

/** Recent Role-Platform Mapping changes, newest first. */
export function getAuditLog() {
  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
