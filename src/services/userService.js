/**
 * userService.js
 *
 * Real backend user management (GET/POST/PATCH /api/users/*), replacing
 * mockData.js's getAllUsers/saveUser/getUserByIdMerged/buildActivatedUser/
 * buildDeactivatedUser/buildPendingUser.
 *
 * The backend's real user shape (firstName/lastName split, uppercase
 * status, no "role" column - only "jobTitle") differs from the shape
 * every existing component already expects (a single "name" field,
 * lowercase status, a "role" field). adaptUser() bridges that gap once,
 * here, so ManageUsers/RequestDetails/TransitionForm/etc. don't each
 * need their own translation.
 *
 * Known gap: the backend schema still has no column for per-user
 * "platforms" - it always comes back as [] from a real user record
 * (per-request platform status is tracked separately, in
 * platform_status). Phase 4 added role/displayName/team/country/
 * workingLocation/startDate columns (see backend/services/dbService.js).
 */

import { api } from './api';

function formatDate(isoOrSqlDateTime) {
  if (!isoOrSqlDateTime) return null;
  const parsed = new Date(isoOrSqlDateTime);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Adapts a raw backend user row into the shape every existing
 * component (ManageUsers, TransitionForm, ReactivationForm,
 * UserDetailsModal, ...) already expects.
 * @param {Object} raw - A row from the backend's `users` table
 * @returns {Object}
 */
export function adaptUser(raw) {
  return {
    id: raw.id,
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    name: `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    displayName: raw.displayName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    email: raw.email,
    workEmail: raw.workEmail || null,
    workEmailCreatedAt: raw.createdAt || null,
    status: (raw.status || 'pending').toLowerCase(),
    department: raw.department || null,
    manager: raw.manager || null,
    floor: raw.floor || null,
    jobTitle: raw.jobTitle || null,
    role: raw.role || null,
    team: raw.team || null,
    country: raw.country || null,
    workingLocation: raw.workingLocation || null,
    startDate: raw.startDate || null,
    type: raw.type || 'Internal',
    dateOnboarded: formatDate(raw.createdAt),
    dateOffboarded: raw.status === 'INACTIVE' ? formatDate(raw.updatedAt) : null,
    platforms: [], // not tracked per-user by the backend - see file header
    azureObjectId: raw.azureObjectId || null,
  };
}

/**
 * GET /api/users - every real Azure AD user in the full tenant
 * (~1000 people), adapted. Only use this where the FULL directory
 * genuinely matters (e.g. checking a new hire's email against every
 * real account) - for anything showing "users this app manages", use
 * getManagedUsers() instead.
 */
export async function getAllAzureUsers() {
  const { users } = await api.get('/api/users');
  return users.map(adaptUser);
}

/** GET /api/users/managed - only users onboarded through this app (local DB). */
export async function getManagedUsers() {
  const { users } = await api.get('/api/users/managed');
  return users.map(adaptUser);
}

/** GET /api/users/:id - one user by the backend's own (UUID) id. */
export async function getUser(id) {
  const { user } = await api.get(`/api/users/${id}`);
  return adaptUser(user);
}

/**
 * POST /api/users/create - creates the local DB record. Pass
 * `deferAzure: true` to skip the real Azure AD account creation and
 * create it later via provisionAzure() instead (this is what
 * OnboardingForm uses - the request is submitted PENDING with no
 * Azure account yet, and an IT admin's "MS Azure" click in
 * RequestDetails is what actually calls Azure).
 * @param {Object} fields - firstName, lastName, displayName, email,
 *   workEmail, department, manager, floor, jobTitle, type, role,
 *   team, country, workingLocation, startDate, deferAzure
 * @returns {Promise<{id: string, azureObjectId: string|null, status: string}>}
 */
export async function createUser(fields) {
  return api.post('/api/users/create', {
    firstName: fields.firstName,
    lastName: fields.lastName,
    displayName: fields.displayName,
    email: fields.email,
    workEmail: fields.workEmail,
    department: fields.department,
    manager: fields.manager,
    floor: fields.floor,
    jobTitle: fields.jobTitle,
    type: fields.type || 'Internal',
    role: fields.role,
    team: fields.team,
    country: fields.country,
    workingLocation: fields.workingLocation,
    startDate: fields.startDate,
    deferAzure: Boolean(fields.deferAzure),
  });
}

/**
 * POST /api/users/:id/provision-azure - creates the REAL Azure AD
 * account for a user that was created with deferAzure. Called from
 * RequestDetails when an IT admin clicks the "MS Azure" platform
 * button.
 * @param {string} id
 * @returns {Promise<{id: string, azureObjectId: string}>}
 */
export async function provisionAzure(id) {
  return api.post(`/api/users/${id}/provision-azure`);
}

/** PATCH /api/users/:id - updates department/manager/floor/jobTitle/type. */
export async function updateUser(id, fields) {
  return api.patch(`/api/users/${id}`, fields);
}

/** PATCH /api/users/:id/disable - offboarding: disables the Azure account. */
export async function disableUser(id) {
  return api.patch(`/api/users/${id}/disable`);
}

/** PATCH /api/users/:id/enable - onboarding/reactivation: enables the Azure account. */
export async function enableUser(id) {
  return api.patch(`/api/users/${id}/enable`);
}
