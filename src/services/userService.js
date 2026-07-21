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
 * Known gap: the backend schema (built in Phase 2, to spec) has no
 * column for "role" or per-user "platforms" - those always come back
 * as null/[] from a real user record. Role is still captured on the
 * onboarding request itself; it's just not persisted onto the user's
 * profile after that.
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
    name: `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    email: raw.email,
    workEmail: raw.workEmail || null,
    workEmailCreatedAt: raw.createdAt || null,
    status: (raw.status || 'pending').toLowerCase(),
    department: raw.department || null,
    manager: raw.manager || null,
    floor: raw.floor || null,
    jobTitle: raw.jobTitle || null,
    role: null, // no backend column - see file header
    type: raw.type || 'Internal',
    dateOnboarded: formatDate(raw.createdAt),
    dateOffboarded: raw.status === 'INACTIVE' ? formatDate(raw.updatedAt) : null,
    platforms: [], // not tracked per-user by the backend - see file header
    azureObjectId: raw.azureObjectId || null,
  };
}

/** GET /api/users - every real Azure AD user, adapted. */
export async function getAllUsers() {
  const { users } = await api.get('/api/users');
  return users.map(adaptUser);
}

/** GET /api/users/:id - one user by the backend's own (UUID) id. */
export async function getUser(id) {
  const { user } = await api.get(`/api/users/${id}`);
  return adaptUser(user);
}

/**
 * POST /api/users/create - creates a REAL Azure AD account plus the
 * local DB record. formData is OnboardingForm's own field names;
 * translated here into the backend's expected payload shape.
 * @param {Object} formData
 * @returns {Promise<{id: string, azureObjectId: string, status: string}>}
 */
export async function createUser(formData) {
  const [firstName, ...rest] = (formData.employeeName || '').trim().split(/\s+/);
  const lastName = rest.join(' ') || firstName;
  return api.post('/api/users/create', {
    firstName,
    lastName,
    email: formData.email,
    workEmail: formData.workEmail,
    department: formData.departmentName,
    manager: formData.managerName,
    floor: formData.floor,
    jobTitle: formData.jobTitleLabel,
    type: formData.employeeTypeLabel || 'Internal',
  });
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
