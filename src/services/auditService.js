/**
 * auditService.js
 *
 * Real backend audit trail (GET /api/audit, /api/audit/:requestId).
 * AuditLogs.jsx merges this with its own local recordAuditLog/
 * getAllAuditLogs (kept for actions that have no backend equivalent -
 * LOGIN, CSV import/export, Transition/Reactivation workflow events -
 * see mockData.js/AuditLogs.jsx's own comments) into one combined,
 * sorted view. adaptAuditEntry() below normalizes a raw backend row
 * into that same local shape so both sources render through one table.
 */

import { api } from './api';

function summarizeDetails(raw) {
  const parts = [];
  if (raw.affectedUser) parts.push(raw.affectedUser);
  if (raw.details && typeof raw.details === 'object') {
    const entries = Object.entries(raw.details)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
    if (entries.length > 0) parts.push(entries.join(', '));
  } else if (typeof raw.details === 'string' && raw.details) {
    parts.push(raw.details);
  }
  return parts.join(' — ') || '—';
}

/** Adapts one real backend audit_logs row into AuditLogs.jsx's local log shape. */
export function adaptAuditEntry(raw) {
  return {
    id: `backend-${raw.id}`,
    timestampIso: raw.createdAt,
    userEmail: raw.userEmail || raw.affectedUser || 'system',
    userName: null,
    department: null,
    action: raw.action,
    details: summarizeDetails(raw),
    status: raw.status,
    ipAddress: raw.ipAddress || null,
    platformName: raw.platformName || null,
  };
}

/** GET /api/audit?user=&action=&dateFrom=&dateTo= */
export async function listAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.user) params.set('user', filters.user);
  if (filters.action) params.set('action', filters.action);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  const query = params.toString();
  const { logs } = await api.get(`/api/audit${query ? `?${query}` : ''}`);
  return logs.map(adaptAuditEntry);
}

/** GET /api/audit/:requestId */
export async function getRequestAuditLog(requestId) {
  const { logs } = await api.get(`/api/audit/${requestId}`);
  return logs.map(adaptAuditEntry);
}
