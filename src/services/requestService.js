/**
 * requestService.js
 *
 * Real backend onboarding/offboarding requests (the "A"/"B"/"C" items
 * from Phase 3's scope). Transition and Reactivation requests are NOT
 * handled here - the Phase 2 backend has no endpoints for them, so
 * those two types stay on mockData.js's existing localStorage-backed
 * pipeline (see mockData.js's own header comment for why).
 *
 * The backend's request rows have no employee name/email/workEmail on
 * them at all (only a `userId`) - adaptRequestSummary/adaptRequestDetail
 * join in the associated user (via userService) so every existing
 * component still gets the same `employeeName`/`email`/`workEmail`
 * fields it always has.
 *
 * Known gaps vs. the original mock model (Phase 2's schema has no
 * columns for these - disclosed, not silently invented):
 *   - offboardingReason / finalDay / timing (OffboardingForm collects
 *     them, but they don't persist past submission)
 *   - submittedByRole / submittedByDept, approvedBy/approvedByRole,
 *     confirmedWorkEmail, hasDuplicateName, welcomeEmailSentAt - purely
 *     decorative UX fields kept in React state only, not the backend
 *   - "role" (Engineer/Manager/...) - stored on the REQUEST (backend
 *     has a `role` column there), but not carried onto the user's
 *     profile after approval (see userService.js)
 */

import { api } from './api';
import { getUser } from './userService';

function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function formatDate(iso) {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return 'Unknown';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function mapPlatformStatus(rawStatus) {
  if (!rawStatus) return 'pending';
  if (rawStatus === 'FAILED') return 'failed';
  if (rawStatus.startsWith('COMPLETED')) return 'completed';
  return 'pending';
}

const AUDIT_ACTION_LABELS = {
  ONBOARDING_SUBMITTED: 'Request Created',
  OFFBOARDING_SUBMITTED: 'Request Created',
  ONBOARDING_COMPLETED: 'User Activated',
  OFFBOARDING_COMPLETED: 'User Offboarded',
};

function humanizeAuditEntry(entry) {
  if (entry.action === 'PLATFORM_STATUS_UPDATED') {
    const status = entry.details?.status || 'updated';
    return `Platform ${entry.platformName || ''}: ${status}`.trim();
  }
  return AUDIT_ACTION_LABELS[entry.action] || entry.action;
}

/** Lightweight adapter for list views (RequestsList/Dashboard/Reports) - no platform/audit fetch. */
function adaptRequestSummary(raw, user) {
  const createdAt = raw.slaStartTime || raw.createdAt;
  return {
    id: raw.id,
    type: capitalize(raw.type),
    requestType: capitalize(raw.type),
    name: user?.name || 'Unknown',
    employeeName: user?.name || 'Unknown',
    email: user?.email || '',
    workEmail: user?.workEmail || null,
    status: (raw.status || 'pending').toLowerCase(),
    date: formatDate(createdAt),
    startDate: formatDate(createdAt),
    createdAt,
    completedAt: raw.completedAt || null,
    department: raw.department,
    departmentName: raw.department,
    manager: raw.manager,
    managerName: raw.manager,
    userId: raw.userId,
    role: raw.role,
    displayName: raw.displayName || user?.displayName || user?.name,
    team: raw.team,
    country: raw.country,
    workingLocation: raw.workingLocation,
    startDate: raw.startDate,
    platforms: [], // full per-platform rows aren't fetched at list scope - see file header
  };
}

/** Full adapter for RequestDetails - includes platforms + an audit-derived timeline. */
function adaptRequestDetail(raw, platformRows, auditRows, user) {
  const createdAt = raw.slaStartTime || raw.createdAt;
  return {
    id: raw.id,
    type: capitalize(raw.type),
    requestType: capitalize(raw.type),
    name: user.name,
    employeeName: user.name,
    email: user.email,
    workEmail: user.workEmail,
    status: (raw.status || 'pending').toLowerCase(),
    date: formatDate(createdAt),
    startDate: formatDate(createdAt),
    createdAt,
    completedAt: raw.completedAt || null,
    department: raw.department,
    departmentName: raw.department,
    manager: raw.manager,
    managerName: raw.manager,
    floor: raw.floor,
    role: raw.role,
    jobTitleLabel: raw.jobTitle || 'N/A',
    userId: raw.userId,
    submittedBy: raw.submittedBy,
    submittedByRole: null,
    submittedByDept: null,
    offboardingReason: 'Not tracked by backend',
    finalDay: 'N/A',
    timing: 'immediate',
    displayName: raw.displayName || user.displayName || user.name,
    team: raw.team,
    country: raw.country,
    workingLocation: raw.workingLocation,
    startDate: raw.startDate,
    platforms: platformRows.map((p) => ({
      name: p.platformName,
      status: mapPlatformStatus(p.status),
      completedBy: p.completedBy,
      completedAt: p.completedAt,
      error: p.errorMessage,
      workEmail: p.platformName === 'Azure AD' ? user.workEmail : undefined,
      workEmailCreatedAt: p.platformName === 'Azure AD' ? user.workEmailCreatedAt : undefined,
    })),
    timeline: auditRows.map((a) => ({
      timestamp: formatDateTime(a.createdAt),
      action: humanizeAuditEntry(a),
      status: 'completed',
    })),
    hasDuplicateName: false,
    confirmedWorkEmail: null,
    approvedBy: null,
    approvedByRole: null,
    welcomeEmailSentAt: null,
  };
}

/** GET /api/requests - onboarding + offboarding, joined with their user. */
export async function listRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  const query = params.toString();
  const { requests } = await api.get(`/api/requests${query ? `?${query}` : ''}`);

  const uniqueUserIds = [...new Set(requests.map((r) => r.userId))];
  const users = await Promise.all(uniqueUserIds.map((id) => getUser(id).catch(() => null)));
  const usersById = new Map(uniqueUserIds.map((id, i) => [id, users[i]]));

  return requests.map((raw) => adaptRequestSummary(raw, usersById.get(raw.userId)));
}

/** GET /api/requests/:id - full detail: request + platforms + audit trail + user. */
export async function getRequest(id) {
  const { request, platforms, auditTrail } = await api.get(`/api/requests/${id}`);
  const user = await getUser(request.userId);
  return adaptRequestDetail(request, platforms, auditTrail, user);
}

/** POST /api/requests/onboarding */
export async function submitOnboardingRequest(payload) {
  return api.post('/api/requests/onboarding', payload);
}

/** POST /api/requests/offboarding */
export async function submitOffboardingRequest(payload) {
  return api.post('/api/requests/offboarding', payload);
}

/** PATCH /api/requests/:id - status must be 'PENDING' | 'COMPLETED' */
export async function updateRequestStatus(id, status) {
  return api.patch(`/api/requests/${id}`, { status });
}

/** PATCH /api/requests/:id/platform/:platform */
export async function updatePlatformStatus(id, platformName, { status, completedBy, errorMessage } = {}) {
  return api.patch(`/api/requests/${id}/platform/${encodeURIComponent(platformName)}`, {
    status,
    completedBy,
    errorMessage,
  });
}

/** True when `id` is a real backend request (UUID), not a mock Transition/Reactivation id (a plain integer). */
export function isRealRequestId(id) {
  return !/^\d+$/.test(String(id));
}
