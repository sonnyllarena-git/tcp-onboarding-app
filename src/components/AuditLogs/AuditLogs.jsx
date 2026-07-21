import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ForbiddenPage } from '../ErrorState';
import AuditLogsFilters from './AuditLogsFilters';
import AuditLogsTable from './AuditLogsTable';
 
const ITEMS_PER_PAGE = 20;
 
const DEFAULT_FILTERS = {
  employeeName: '',
  userName: '',
  dateFrom: '',
  dateTo: '',
  actionType: 'all',
  status: 'all',
};

const DEFAULT_VISIBLE_COLUMNS = {
  timestamp: true,
  userEmail: true,
  action: true,
  status: true,
  ipAddress: true,
};
 
/**
 * 66 mock audit log entries spanning Jul 10-18, 2026, across 5 actors,
 * 12 action types, and both statuses.
 */
export const MOCK_AUDIT_LOGS = [
  { id: 1, timestampIso: '2026-07-10T08:00:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_IMPORT', details: '150 users', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 2, timestampIso: '2026-07-10T08:05:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Olivia Martin (olivia.martin@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 3, timestampIso: '2026-07-10T08:06:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Ethan Clark (ethan.clark@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 4, timestampIso: '2026-07-10T09:00:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 5, timestampIso: '2026-07-10T09:15:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'ONBOARDING_SUBMITTED', details: 'Olivia Martin — IT', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 6, timestampIso: '2026-07-10T10:00:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '192.168.1.110' },
  { id: 7, timestampIso: '2026-07-10T10:01:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '192.168.1.110' },
  { id: 8, timestampIso: '2026-07-10T10:02:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.110' },
  { id: 9, timestampIso: '2026-07-10T11:30:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 10, timestampIso: '2026-07-10T11:45:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'ONBOARDING_SUBMITTED', details: 'Ava Bennett — HR', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 11, timestampIso: '2026-07-10T14:00:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'CSV_EXPORT', details: '20 records exported', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 12, timestampIso: '2026-07-10T16:20:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Unrecognized device', status: 'FAILED', ipAddress: '203.0.113.50' },
  { id: 13, timestampIso: '2026-07-10T16:21:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Account locked after 5 attempts', status: 'FAILED', ipAddress: '203.0.113.50' },
  { id: 14, timestampIso: '2026-07-11T08:00:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_IMPORT', details: '85 users', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 15, timestampIso: '2026-07-11T08:10:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Sophia Turner (sophia.turner@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 16, timestampIso: '2026-07-11T08:40:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Azure API timeout', status: 'FAILED', ipAddress: '192.168.1.101' },
  { id: 17, timestampIso: '2026-07-11T09:00:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 18, timestampIso: '2026-07-11T09:30:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'PLATFORM_CLICK', details: 'Keeper — Delete credentials', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 19, timestampIso: '2026-07-11T10:00:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 20, timestampIso: '2026-07-11T10:30:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'ONBOARDING_SUBMITTED', details: 'Sophia Turner — Marketing', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 21, timestampIso: '2026-07-11T13:00:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 22, timestampIso: '2026-07-11T13:15:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'CSV_EXPORT', details: '35 records exported', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 23, timestampIso: '2026-07-11T15:00:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.110' },
  { id: 24, timestampIso: '2026-07-11T15:20:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'ONBOARDING_SUBMITTED', details: 'Liam Foster — Finance', status: 'SUCCESS', ipAddress: '192.168.1.110' },
  { id: 25, timestampIso: '2026-07-12T08:00:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_IMPORT', details: '40 users', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 26, timestampIso: '2026-07-12T08:20:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Ava Bennett (ava.bennett@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 27, timestampIso: '2026-07-12T08:21:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Noah Coleman (noah.coleman@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 28, timestampIso: '2026-07-12T09:00:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 29, timestampIso: '2026-07-12T09:10:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN_FAILED', details: 'Session expired mid-login', status: 'FAILED', ipAddress: '192.168.1.100' },
  { id: 30, timestampIso: '2026-07-12T09:11:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 31, timestampIso: '2026-07-12T11:00:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'OFFBOARDING_SUBMITTED', details: 'Charlie Wilson — Finance', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 32, timestampIso: '2026-07-12T11:30:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'KEEPER_DISABLED', details: 'Charlie Wilson (charlie.wilson@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 33, timestampIso: '2026-07-12T11:31:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'HODU_DISABLED', details: 'Charlie Wilson (charlie.wilson@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 34, timestampIso: '2026-07-12T11:32:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'AZURE_DISABLED', details: 'Charlie Wilson (charlie.wilson@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 35, timestampIso: '2026-07-12T14:00:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 36, timestampIso: '2026-07-12T14:30:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'PLATFORM_CLICK', details: 'Azure AD — Disable account', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 37, timestampIso: '2026-07-15T08:00:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_IMPORT', details: '12 users', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 38, timestampIso: '2026-07-15T09:00:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 39, timestampIso: '2026-07-15T09:05:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'ONBOARDING_SUBMITTED', details: 'Grace Kim — Customer Support', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 40, timestampIso: '2026-07-15T10:00:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 41, timestampIso: '2026-07-15T10:10:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'USER_DELETED', details: 'David Garcia (david.garcia@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 42, timestampIso: '2026-07-15T13:00:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '192.168.1.110' },
  { id: 43, timestampIso: '2026-07-15T13:01:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.110' },
  { id: 44, timestampIso: '2026-07-15T15:00:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'CSV_EXPORT', details: '60 records exported', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 45, timestampIso: '2026-07-16T08:00:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_IMPORT', details: '150 users', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 46, timestampIso: '2026-07-16T08:30:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Noah Coleman (noah.coleman@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 47, timestampIso: '2026-07-16T09:00:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 48, timestampIso: '2026-07-16T09:20:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'ONBOARDING_SUBMITTED', details: 'Noah Coleman — Operations', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 49, timestampIso: '2026-07-16T12:00:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 50, timestampIso: '2026-07-16T12:20:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'USER_DELETED', details: 'Laura Martinez (laura.martinez@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 51, timestampIso: '2026-07-16T16:00:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '203.0.113.50' },
  { id: 52, timestampIso: '2026-07-16T16:01:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '203.0.113.50' },
  { id: 53, timestampIso: '2026-07-16T16:02:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Account locked after 5 attempts', status: 'FAILED', ipAddress: '203.0.113.50' },
  { id: 54, timestampIso: '2026-07-17T09:00:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 55, timestampIso: '2026-07-17T09:10:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'ONBOARDING_SUBMITTED', details: 'Ethan Clark — Sales', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 56, timestampIso: '2026-07-17T10:00:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 57, timestampIso: '2026-07-17T10:20:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'ONBOARDING_SUBMITTED', details: 'Ava Bennett — HR', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 58, timestampIso: '2026-07-17T13:00:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_EXPORT', details: '200 records exported', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 59, timestampIso: '2026-07-17T15:00:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.115' },
  { id: 60, timestampIso: '2026-07-18T01:30:00', userEmail: 'bob.johnson@thecreditpros.com', userName: 'Bob Johnson', department: 'Finance', action: 'LOGIN_FAILED', details: 'Invalid password', status: 'FAILED', ipAddress: '192.168.1.110' },
  { id: 61, timestampIso: '2026-07-18T01:45:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'OFFBOARDING_SUBMITTED', details: 'John Doe — IT', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 62, timestampIso: '2026-07-18T02:10:00', userEmail: 'jane.smith@thecreditpros.com', userName: 'Jane Smith', department: 'HR', action: 'LOGIN', details: 'Successful sign-in', status: 'SUCCESS', ipAddress: '192.168.1.105' },
  { id: 63, timestampIso: '2026-07-18T02:14:00', userEmail: 'admin@thecreditpros.com', userName: 'Admin User', department: 'IT', action: 'CSV_IMPORT', details: '150 users', status: 'SUCCESS', ipAddress: '192.168.1.101' },
  { id: 64, timestampIso: '2026-07-18T02:15:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'USER_CREATED_AZURE', details: 'Olivia Martin (olivia.martin@thecreditpros.com)', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 65, timestampIso: '2026-07-18T02:20:00', userEmail: 'john.doe@thecreditpros.com', userName: 'John Doe', department: 'IT', action: 'PLATFORM_CLICK', details: 'Hodu — Disable agent', status: 'SUCCESS', ipAddress: '192.168.1.100' },
  { id: 66, timestampIso: '2026-07-18T09:00:00', userEmail: 'alice.brown@thecreditpros.com', userName: 'Alice Brown', department: 'Marketing', action: 'CSV_EXPORT', details: '15 records exported', status: 'SUCCESS', ipAddress: '192.168.1.115' },
];
 
const AUDIT_LOGS_STORAGE_KEY = 'tcp_audit_logs';

function readExtraAuditLogs() {
  try {
    const stored = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeExtraAuditLogs(logs) {
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // localStorage unavailable - the entry still works for this session,
    // it just won't persist across a reload.
  }
}

/**
 * Records a real, runtime audit log entry (e.g. ONBOARDING_SUBMITTED,
 * ONBOARDING_APPROVED) alongside the static MOCK_AUDIT_LOGS seed above.
 * @param {Object} entry - action/details/userEmail/userName/department, etc.
 */
export function recordAuditLog(entry) {
  const logs = readExtraAuditLogs();
  logs.push({
    id: `extra-${Date.now()}-${logs.length}`,
    timestampIso: new Date().toISOString(),
    ipAddress: '192.168.1.100',
    status: 'SUCCESS',
    ...entry,
  });
  writeExtraAuditLogs(logs);
}

/**
 * All audit logs: the static MOCK_AUDIT_LOGS seed plus any real entries
 * recorded at runtime via recordAuditLog.
 * @returns {Array}
 */
export function getAllAuditLogs() {
  return [...MOCK_AUDIT_LOGS, ...readExtraAuditLogs()];
}

export const ACTION_TYPE_OPTIONS = [...new Set(MOCK_AUDIT_LOGS.map((log) => log.action))].sort();
 
export function filterAuditLogs(
  logs,
  {
    searchTerm = '',
    employeeName = '',
    userName = '',
    dateFrom = '',
    dateTo = '',
    actionType = 'all',
    status = 'all',
  } = {}
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedEmployeeName = employeeName.trim().toLowerCase();
  const normalizedUserName = userName.trim().toLowerCase();

  return logs.filter((log) => {
    const logDate = log.timestampIso.slice(0, 10);

    const matchesSearch =
      normalizedSearch === '' ||
      log.userEmail.toLowerCase().includes(normalizedSearch) ||
      log.action.toLowerCase().includes(normalizedSearch);

    // Audit log entries have no dedicated "employee being onboarded/
    // offboarded" field - that name only ever appears embedded in the
    // free-text `details` string (e.g. "Ethan Clark - Sales"), so this
    // filters on `details` rather than a field that doesn't exist.
    const matchesEmployeeName =
      normalizedEmployeeName === '' || (log.details || '').toLowerCase().includes(normalizedEmployeeName);
    const matchesUserName =
      normalizedUserName === '' || (log.userName || '').toLowerCase().includes(normalizedUserName);
    const matchesDateFrom = !dateFrom || logDate >= dateFrom;
    const matchesDateTo = !dateTo || logDate <= dateTo;
    const matchesActionType = actionType === 'all' || log.action === actionType;
    const matchesStatus = status === 'all' || log.status === status;

    return (
      matchesSearch &&
      matchesEmployeeName &&
      matchesUserName &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesActionType &&
      matchesStatus
    );
  });
}
 
export function sortLogsByNewest(logs) {
  return [...logs].sort((a, b) => (a.timestampIso < b.timestampIso ? 1 : -1));
}
 
export function getPaginatedLogs(logs, currentPage, itemsPerPage = ITEMS_PER_PAGE) {
  const start = (currentPage - 1) * itemsPerPage;
  return logs.slice(start, start + itemsPerPage);
}
 
/**
 * AuditLogs Component
 *
 * Admin-only audit trail of system activity: searchable, filterable
 * (date range / action type / status), and paginated 20 rows at a time.
 * Non-admins are redirected to the Dashboard.
 *
 * @component
 * @returns {React.ReactElement} AuditLogs component
 */
function AuditLogs() {
  const user = useAuth();

  const [logs] = useState(getAllAuditLogs);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showPlatformLogs, setShowPlatformLogs] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Derived from every log actually present (seed + runtime), not just the
  // seed - otherwise action types only ever recorded at runtime (e.g. the
  // Azure/welcome-email/transition workflow actions) would show up in the
  // table but never be selectable in this filter.
  const actionTypeOptions = useMemo(() => [...new Set(logs.map((log) => log.action))].sort(), [logs]);

  const filteredLogs = useMemo(() => {
    const filtered = filterAuditLogs(logs, { searchTerm, ...filters });
    // Per-platform entries (Azure account creation, provisioning,
    // manual/automated completions, transition platform updates, ...)
    // are identified by already carrying a platformName - hidden by
    // default so they don't bury the "big" submission/completion
    // entries, but never dropped from storage, just from this view.
    const visible = showPlatformLogs ? filtered : filtered.filter((log) => !log.platformName);
    return sortLogsByNewest(visible);
  }, [logs, searchTerm, filters, showPlatformLogs]);
 
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(
    () => getPaginatedLogs(filteredLogs, safePage, ITEMS_PER_PAGE),
    [filteredLogs, safePage]
  );
 
  // ADMIN CHECK - Only allow admins to see this page
  if (!user || user.role !== 'ADMIN') {
    return <ForbiddenPage />;
  }
 
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
 
  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };
 
  const handleReset = () => {
    setSearchTerm('');
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };
 
  const handlePageChange = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const handleToggleColumn = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };
 
  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-300">
          Review every system activity for security and compliance tracking.
        </p>
      </header>
 
      <AuditLogsFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
        actionTypeOptions={actionTypeOptions}
      />

      <div className="mb-4 rounded-lg border border-[#d4a574]/20 bg-white/5 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#d4a574]">Show/Hide Columns</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries({
            timestamp: 'Timestamp',
            userEmail: 'User Email',
            action: 'Action',
            status: 'Status',
            ipAddress: 'IP Address',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={visibleColumns[key]}
                onChange={() => handleToggleColumn(key)}
                className="h-4 w-4 accent-[#d4a574]"
              />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-3 flex w-fit items-center gap-2 border-t border-[#d4a574]/10 pt-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={showPlatformLogs}
            onChange={() => setShowPlatformLogs((prev) => !prev)}
            className="h-4 w-4 accent-[#d4a574]"
          />
          Show platform logs
        </label>
      </div>

      {isLoading ? (
        <p className="rounded-xl border border-[#d4a574]/30 py-10 text-center text-sm text-gray-300">
          Loading audit logs...
        </p>
      ) : (
        <>
          <AuditLogsTable logs={paginatedLogs} visibleColumns={visibleColumns} />
 
          <nav
            aria-label="Pagination"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <p className="text-gray-300">
              Page {safePage} of {totalPages} &middot; {filteredLogs.length} log
              {filteredLogs.length === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safePage === 1}
                className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  aria-current={page === safePage ? 'page' : undefined}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574] ${
                    page === safePage
                      ? 'border-[#d4a574] bg-[#d4a574] text-[#1a365d]'
                      : 'border-[#1a365d] text-[#d4a574] hover:bg-white/5'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-[#1a365d] px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
              >
                Last
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
 
export default AuditLogs;