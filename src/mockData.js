/**
 * mockData.js
 *
 * Single source of truth for every mock record used across the TCP
 * Onboarding Portal (ManageUsers, RequestsList, RequestDetails,
 * OnboardingForm, OffboardingForm, ...). Think of this file as an offline
 * database directory: every component imports its data from here instead
 * of keeping its own inline copy, so a given id/email always resolves to
 * the same person and the same request everywhere in the app.
 *
 * TODO: When a real backend exists, only this file needs to change. Each
 * `getMock*` lookup below can become an `async` function that calls the
 * real API instead of searching an in-memory array — for example:
 *
 *   // Before (mock):
 *   export function getMockUserById(userId) {
 *     return MOCK_USERS.find((u) => u.id === Number(userId)) || null;
 *   }
 *
 *   // After (real API):
 *   export async function getMockUserById(userId) {
 *     const response = await fetch(`/api/users/${userId}`);
 *     return response.json();
 *   }
 *
 * Every component that imports these helpers keeps working unchanged,
 * since it only ever calls `getMockUserById(...)` — it never reaches
 * into MOCK_USERS directly.
 */

/**
 * Canonical platform list with the action taken on each during
 * offboarding. OnboardingForm's checklist uses just the names (via
 * `PLATFORMS`); OffboardingForm's checklist shows name + action together.
 */
export const PLATFORM_ACTIONS = [
  { name: 'Azure AD', offboardAction: 'Disable account' },
  { name: 'Keeper', offboardAction: 'Delete credentials' },
  { name: 'Hodu', offboardAction: 'Disable agent' },
  { name: 'Krisp', offboardAction: 'Disable license' },
  { name: 'Jira', offboardAction: 'Remove access' },
  { name: 'Zoho Desk', offboardAction: 'Remove access' },
  { name: 'Acuity', offboardAction: 'Revoke' },
  { name: 'TheCreditPros Portal', offboardAction: 'Remove access' },
  { name: 'Sales IQ', offboardAction: 'Disable' },
  { name: 'StaffCounter', offboardAction: 'Disable' },
];

/** Platform names only, in the same canonical order as PLATFORM_ACTIONS. */
export const PLATFORMS = PLATFORM_ACTIONS.map((platform) => platform.name);

/**
 * All 20 employees: 6 pending, 10 active, 4 inactive.
 * `manager` is null for inactive users (they no longer have one on file).
 * `platforms` is a plain list of platform names — the platforms assigned
 * to (or, for inactive users, previously assigned to) this employee.
 */
export const MOCK_USERS = [
  // Pending (6)
  { id: 1, name: 'Olivia Martin', email: 'olivia.martin@thecreditpros.com', status: 'pending', department: 'IT', manager: 'Diana Foster', dateOnboarded: 'Jul 16, 2026', dateOffboarded: null, platforms: ['Azure AD', 'Keeper'] },
  { id: 2, name: 'Ethan Clark', email: 'ethan.clark@thecreditpros.com', status: 'pending', department: 'Sales', manager: 'James Whitfield', dateOnboarded: 'Jul 17, 2026', dateOffboarded: null, platforms: ['Azure AD'] },
  { id: 3, name: 'Sophia Turner', email: 'sophia.turner@thecreditpros.com', status: 'pending', department: 'Marketing', manager: 'Rachel Nguyen', dateOnboarded: 'Jul 15, 2026', dateOffboarded: null, platforms: ['Azure AD', 'Jira', 'Krisp'] },
  { id: 4, name: 'Liam Foster', email: 'liam.foster@thecreditpros.com', status: 'pending', department: 'Finance', manager: 'Marcus Bell', dateOnboarded: 'Jul 14, 2026', dateOffboarded: null, platforms: ['Azure AD', 'Hodu'] },
  { id: 5, name: 'Ava Bennett', email: 'ava.bennett@thecreditpros.com', status: 'pending', department: 'HR', manager: 'Sandra Okafor', dateOnboarded: 'Jul 17, 2026', dateOffboarded: null, platforms: ['Azure AD'] },
  { id: 6, name: 'Noah Coleman', email: 'noah.coleman@thecreditpros.com', status: 'pending', department: 'Operations', manager: 'Kevin Tran', dateOnboarded: 'Jul 16, 2026', dateOffboarded: null, platforms: ['Azure AD', 'Zoho Desk'] },
  // Active (10) — all offboardable
  { id: 7, name: 'John Doe', email: 'john.doe@thecreditpros.com', status: 'active', department: 'IT', manager: 'Robert Chen', dateOnboarded: 'Jul 15, 2026', dateOffboarded: null, platforms: [] },
  { id: 8, name: 'Jane Smith', email: 'jane.smith@thecreditpros.com', status: 'active', department: 'HR', manager: 'Priya Patel', dateOnboarded: 'Jul 14, 2026', dateOffboarded: null, platforms: [] },
  { id: 9, name: 'Bob Johnson', email: 'bob.johnson@thecreditpros.com', status: 'active', department: 'Finance', manager: 'David Kim', dateOnboarded: 'Jul 10, 2026', dateOffboarded: null, platforms: [] },
  { id: 10, name: 'Alice Brown', email: 'alice.brown@thecreditpros.com', status: 'active', department: 'Marketing', manager: 'Laura Chen', dateOnboarded: 'Jul 8, 2026', dateOffboarded: null, platforms: [] },
  { id: 11, name: 'Emma Davis', email: 'emma.davis@thecreditpros.com', status: 'active', department: 'HR', manager: 'Nina Rodriguez', dateOnboarded: 'Jul 5, 2026', dateOffboarded: null, platforms: [] },
  { id: 12, name: 'Michael Lee', email: 'michael.lee@thecreditpros.com', status: 'active', department: 'Operations', manager: 'Steve Park', dateOnboarded: 'Jul 3, 2026', dateOffboarded: null, platforms: [] },
  { id: 13, name: 'Sarah Miller', email: 'sarah.miller@thecreditpros.com', status: 'active', department: 'IT', manager: 'Angela Cruz', dateOnboarded: 'Jul 1, 2026', dateOffboarded: null, platforms: [] },
  { id: 14, name: 'Daniel Reed', email: 'daniel.reed@thecreditpros.com', status: 'active', department: 'Sales', manager: 'Patricia Nguyen', dateOnboarded: 'Jul 2, 2026', dateOffboarded: null, platforms: [] },
  { id: 15, name: 'Grace Kim', email: 'grace.kim@thecreditpros.com', status: 'active', department: 'Customer Support', manager: 'Victor Adeyemi', dateOnboarded: 'Jul 4, 2026', dateOffboarded: null, platforms: [] },
  { id: 16, name: 'Lucas Ramirez', email: 'lucas.ramirez@thecreditpros.com', status: 'active', department: 'IT', manager: 'Helen Osei', dateOnboarded: 'Jul 6, 2026', dateOffboarded: null, platforms: [] },
  // Inactive (4) — no current manager on file
  { id: 17, name: 'Charlie Wilson', email: 'charlie.wilson@thecreditpros.com', status: 'inactive', department: 'Finance', manager: null, dateOnboarded: 'Jun 1, 2026', dateOffboarded: 'Jul 10, 2026', platforms: [] },
  { id: 18, name: 'David Garcia', email: 'david.garcia@thecreditpros.com', status: 'inactive', department: 'Sales', manager: null, dateOnboarded: 'Jun 5, 2026', dateOffboarded: 'Jul 12, 2026', platforms: [] },
  { id: 19, name: 'Laura Martinez', email: 'laura.martinez@thecreditpros.com', status: 'inactive', department: 'Marketing', manager: null, dateOnboarded: 'May 20, 2026', dateOffboarded: 'Jul 8, 2026', platforms: [] },
  { id: 20, name: 'Kevin Anderson', email: 'kevin.anderson@thecreditpros.com', status: 'inactive', department: 'Operations', manager: null, dateOnboarded: 'May 15, 2026', dateOffboarded: 'Jul 5, 2026', platforms: [] },
];

const ALL_PLATFORMS_COMPLETED = [
  { name: 'Azure AD', status: 'completed' },
  { name: 'Keeper', status: 'completed' },
  { name: 'Hodu', status: 'completed' },
  { name: 'Krisp', status: 'completed' },
  { name: 'Jira', status: 'completed' },
  { name: 'Zoho Desk', status: 'completed' },
  { name: 'Acuity', status: 'completed' },
];

/**
 * All 9 onboarding/offboarding requests: 6 pending onboarding (one per
 * pending user above), 2 completed onboarding, and 1 completed
 * offboarding. Each record carries BOTH the `name`/`type`/`date` field
 * names (read by RequestsList's existing filter/table logic) and the
 * `employeeName`/`requestType`/`startDate` names (read by RequestDetails'
 * existing display logic) so neither component's code had to change to
 * read from this shared source — only their data source did.
 */
export const MOCK_REQUESTS = [
  { id: 101, name: 'Olivia Martin', employeeName: 'Olivia Martin', email: 'olivia.martin@thecreditpros.com', type: 'Onboarding', requestType: 'Onboarding', status: 'pending', date: 'Jul 16, 2026', startDate: 'Jul 16, 2026', department: 'IT', manager: 'Diana Foster', platforms: [{ name: 'Azure AD', status: 'pending' }, { name: 'Keeper', status: 'pending' }], timeline: [{ timestamp: 'Jul 16, 2026 09:00 AM', action: 'Request Created', status: 'completed' }] },
  { id: 102, name: 'Ethan Clark', employeeName: 'Ethan Clark', email: 'ethan.clark@thecreditpros.com', type: 'Onboarding', requestType: 'Onboarding', status: 'pending', date: 'Jul 17, 2026', startDate: 'Jul 17, 2026', department: 'Sales', manager: 'James Whitfield', platforms: [{ name: 'Azure AD', status: 'pending' }], timeline: [{ timestamp: 'Jul 17, 2026 08:30 AM', action: 'Request Created', status: 'completed' }] },
  { id: 103, name: 'Sophia Turner', employeeName: 'Sophia Turner', email: 'sophia.turner@thecreditpros.com', type: 'Onboarding', requestType: 'Onboarding', status: 'pending', date: 'Jul 15, 2026', startDate: 'Jul 15, 2026', department: 'Marketing', manager: 'Rachel Nguyen', platforms: [{ name: 'Azure AD', status: 'pending' }, { name: 'Jira', status: 'pending' }, { name: 'Krisp', status: 'pending' }], timeline: [{ timestamp: 'Jul 15, 2026 10:00 AM', action: 'Request Created', status: 'completed' }] },
  { id: 104, name: 'Liam Foster', employeeName: 'Liam Foster', email: 'liam.foster@thecreditpros.com', type: 'Onboarding', requestType: 'Onboarding', status: 'pending', date: 'Jul 14, 2026', startDate: 'Jul 14, 2026', department: 'Finance', manager: 'Marcus Bell', platforms: [{ name: 'Azure AD', status: 'pending' }, { name: 'Hodu', status: 'pending' }], timeline: [{ timestamp: 'Jul 14, 2026 09:15 AM', action: 'Request Created', status: 'completed' }] },
  { id: 105, name: 'Ava Bennett', employeeName: 'Ava Bennett', email: 'ava.bennett@thecreditpros.com', type: 'Onboarding', requestType: 'Onboarding', status: 'pending', date: 'Jul 17, 2026', startDate: 'Jul 17, 2026', department: 'HR', manager: 'Sandra Okafor', platforms: [{ name: 'Azure AD', status: 'pending' }], timeline: [{ timestamp: 'Jul 17, 2026 11:00 AM', action: 'Request Created', status: 'completed' }] },
  { id: 106, name: 'Noah Coleman', employeeName: 'Noah Coleman', email: 'noah.coleman@thecreditpros.com', type: 'Onboarding', requestType: 'Onboarding', status: 'pending', date: 'Jul 16, 2026', startDate: 'Jul 16, 2026', department: 'Operations', manager: 'Kevin Tran', platforms: [{ name: 'Azure AD', status: 'pending' }, { name: 'Zoho Desk', status: 'pending' }], timeline: [{ timestamp: 'Jul 16, 2026 01:00 PM', action: 'Request Created', status: 'completed' }] },
  {
    id: 107,
    name: 'John Doe',
    employeeName: 'John Doe',
    email: 'john.doe@thecreditpros.com',
    type: 'Onboarding',
    requestType: 'Onboarding',
    status: 'completed',
    date: 'Jul 15, 2026',
    startDate: 'Jul 15, 2026',
    department: 'IT',
    manager: 'Robert Chen',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 15, 2026 10:30 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 15, 2026 11:00 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 15, 2026 02:30 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
  {
    id: 108,
    name: 'Alice Brown',
    employeeName: 'Alice Brown',
    email: 'alice.brown@thecreditpros.com',
    type: 'Onboarding',
    requestType: 'Onboarding',
    status: 'completed',
    date: 'Jul 8, 2026',
    startDate: 'Jul 8, 2026',
    department: 'Marketing',
    manager: 'Laura Chen',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 8, 2026 10:00 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 8, 2026 10:30 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 8, 2026 03:00 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
  {
    id: 109,
    name: 'Charlie Wilson',
    employeeName: 'Charlie Wilson',
    email: 'charlie.wilson@thecreditpros.com',
    type: 'Offboarding',
    requestType: 'Offboarding',
    status: 'completed',
    date: 'Jul 8, 2026',
    startDate: 'Jul 8, 2026',
    department: 'Finance',
    manager: 'Mark Anderson',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 8, 2026 09:00 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 8, 2026 09:30 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 10, 2026 05:00 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
];

/**
 * MOCK_ACCOUNTS - Login credentials directory
 *
 * Simulates Azure AD group membership:
 * - role 'ADMIN' = member of TCPOnboardingAppAdmin (IT, request processors)
 * - role 'USER'  = member of TCPOnboardingAppUser (HR, Team Leads, requesters)
 *
 * These 4 names/emails intentionally match existing people in MOCK_USERS for
 * consistency, but this is a separate directory (login accounts vs. managed
 * employees) — a MOCK_USERS record can exist with no corresponding login
 * account, and vice versa.
 */
export const MOCK_ACCOUNTS = [
  { id: 'acc-1', name: 'Sarah Miller', email: 'sarah.miller@thecreditpros.com', role: 'USER', department: 'HR' },
  { id: 'acc-2', name: 'Emma Davis', email: 'emma.davis@thecreditpros.com', role: 'USER', department: 'Finance' },
  { id: 'acc-3', name: 'John Doe', email: 'john.doe@thecreditpros.com', role: 'ADMIN', department: 'IT' },
  { id: 'acc-4', name: 'Michael Lee', email: 'michael.lee@thecreditpros.com', role: 'ADMIN', department: 'IT' },
];

/**
 * Finds a login account by email (case-insensitive, trimmed).
 * @param {string} email - Email address to look up
 * @returns {Object|null} The matching account, or null if not found
 */
export function getMockAccountByEmail(email) {
  if (!email) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find((account) => account.email.toLowerCase() === normalized) || null;
}

/**
 * MOCK_JOB_TITLES - Available job titles/descriptions.
 * Production: syncs to Azure AD "jobTitle" field on user creation.
 * The list will be finalized in production; this is the local mock.
 */
export const MOCK_JOB_TITLES = [
  // Customer Service
  { id: 'jt-1', label: 'Customer Service Representative', department: 'Customer Support' },
  { id: 'jt-2', label: 'Customer Service Team Lead', department: 'Customer Support' },
  { id: 'jt-3', label: 'Customer Service Supervisor', department: 'Customer Support' },

  // Sales
  { id: 'jt-4', label: 'Sales Representative', department: 'Sales' },
  { id: 'jt-5', label: 'Sales Team Lead', department: 'Sales' },
  { id: 'jt-6', label: 'Sales Supervisor', department: 'Sales' },

  // IT
  { id: 'jt-7', label: 'IT Developer', department: 'IT' },
  { id: 'jt-8', label: 'IT Support Specialist', department: 'IT' },
  { id: 'jt-9', label: 'IT Systems Administrator', department: 'IT' },
  { id: 'jt-10', label: 'IT Team Lead', department: 'IT' },

  // HR
  { id: 'jt-11', label: 'HR Specialist', department: 'HR' },
  { id: 'jt-12', label: 'HR Manager', department: 'HR' },
  { id: 'jt-13', label: 'Recruiter', department: 'HR' },

  // Finance
  { id: 'jt-14', label: 'Finance Analyst', department: 'Finance' },
  { id: 'jt-15', label: 'Finance Manager', department: 'Finance' },
  { id: 'jt-16', label: 'Accountant', department: 'Finance' },

  // Operations
  { id: 'jt-17', label: 'Operations Specialist', department: 'Operations' },
  { id: 'jt-18', label: 'Operations Supervisor', department: 'Operations' },
  { id: 'jt-19', label: 'Quality Assurance Specialist', department: 'Operations' },

  // General
  { id: 'jt-20', label: 'Training Specialist', department: 'General' },
  { id: 'jt-21', label: 'Team Lead', department: 'General' },
  { id: 'jt-22', label: 'Supervisor', department: 'General' },
];

/**
 * Looks up a mock user by id.
 * @param {number|string} userId - User id, typically read from the URL
 * @returns {Object|null} The matching user, or null if not found
 */
export function getMockUserById(userId) {
  const numericId = Number(userId);
  return MOCK_USERS.find((user) => user.id === numericId) || null;
}

/**
 * Looks up a mock user by email (case-insensitive).
 * @param {string} email - Email address to look up
 * @returns {Object|null} The matching user, or null if not found
 */
export function getMockUserByEmail(email) {
  const normalized = (email || '').toLowerCase();
  return MOCK_USERS.find((user) => user.email.toLowerCase() === normalized) || null;
}

/**
 * Looks up a mock request by id.
 * @param {number|string} requestId - Request id, typically read from the URL
 * @returns {Object|null} The matching request, or null if not found
 */
export function getMockRequestById(requestId) {
  const numericId = Number(requestId);
  return MOCK_REQUESTS.find((request) => request.id === numericId) || null;
}

/**
 * Looks up a mock request by the requester's email (case-insensitive).
 * When more than one request shares an email, the first match is returned.
 * @param {string} email - Email address to look up
 * @returns {Object|null} The matching request, or null if not found
 */
export function getMockRequestByEmail(email) {
  const normalized = (email || '').toLowerCase();
  return MOCK_REQUESTS.find((request) => request.email.toLowerCase() === normalized) || null;
}

/**
 * Filters users by status.
 * @param {string} status - "pending" | "active" | "inactive"
 * @returns {Array} Users with that status
 */
export function getMockUsersByStatus(status) {
  return MOCK_USERS.filter((user) => user.status === status);
}

/**
 * Filters requests by status.
 * @param {string} status - e.g. "pending" | "completed"
 * @returns {Array} Requests with that status
 */
export function getMockRequestsByStatus(status) {
  return MOCK_REQUESTS.filter((request) => request.status === status);
}

/**
 * Filters users by department (case-insensitive).
 * @param {string} department - Department name
 * @returns {Array} Users in that department
 */
export function getMockUsersByDepartment(department) {
  const normalized = (department || '').toLowerCase();
  return MOCK_USERS.filter((user) => (user.department || '').toLowerCase() === normalized);
}

/**
 * Filters users by manager name (case-insensitive). Inactive users have a
 * null manager and never match, regardless of who managed them historically.
 * @param {string} managerName - Manager's name
 * @returns {Array} Users reporting to that manager
 */
export function getMockUsersByManager(managerName) {
  const normalized = (managerName || '').toLowerCase();
  return MOCK_USERS.filter((user) => (user.manager || '').toLowerCase() === normalized);
}

/**
 * @returns {Array} All active users (10)
 */
export function getMockActiveUsers() {
  return getMockUsersByStatus('active');
}

/**
 * @returns {Array} All pending users (6)
 */
export function getMockPendingUsers() {
  return getMockUsersByStatus('pending');
}

/**
 * @returns {Array} All pending requests (6)
 */
export function getMockPendingRequests() {
  return getMockRequestsByStatus('pending');
}

/**
 * @returns {Object} Summary counts across users and requests, handy for
 *   dashboard-style widgets or sanity-checking data consistency in tests.
 */
export function getMockDataSummary() {
  return {
    totalUsers: MOCK_USERS.length,
    activeUsers: getMockUsersByStatus('active').length,
    pendingUsers: getMockUsersByStatus('pending').length,
    inactiveUsers: getMockUsersByStatus('inactive').length,
    totalRequests: MOCK_REQUESTS.length,
    pendingRequests: getMockRequestsByStatus('pending').length,
    completedRequests: getMockRequestsByStatus('completed').length,
  };
}

/**
 * MOCK_DEPARTMENT_GROUPS - Simulates Azure AD role/groups.
 * Production: these map to actual Azure AD security groups.
 * Local: mock groups for testing Default Platforms per Department.
 */
export const MOCK_DEPARTMENT_GROUPS = [
  { id: 'grp-1', name: 'IT Staff', azureGroup: 'TCP-IT-Staff', color: '#4299e1' },
  { id: 'grp-2', name: 'HR Staff', azureGroup: 'TCP-HR-Staff', color: '#48bb78' },
  { id: 'grp-3', name: 'Finance Staff', azureGroup: 'TCP-Finance-Staff', color: '#ed8936' },
  { id: 'grp-4', name: 'Operations Staff', azureGroup: 'TCP-Operations-Staff', color: '#9f7aea' },
  { id: 'grp-5', name: 'Sales Staff', azureGroup: 'TCP-Sales-Staff', color: '#f56565' },
  { id: 'grp-6', name: 'Customer Support Staff', azureGroup: 'TCP-CustomerSupport-Staff', color: '#38b2ac' },
];

/**
 * AVAILABLE_PLATFORMS - Master list of all platforms the app can manage.
 * Admins can toggle platforms on/off via Platform Management settings.
 */
export const AVAILABLE_PLATFORMS = [
  { id: 'plt-1', name: 'Azure AD', category: 'Identity', description: 'Microsoft Azure Active Directory' },
  { id: 'plt-2', name: 'Keeper', category: 'Security', description: 'Password and secrets management' },
  { id: 'plt-3', name: 'Hodu', category: 'Telephony', description: 'Call center platform' },
  { id: 'plt-4', name: 'Krisp', category: 'Productivity', description: 'Noise cancellation software' },
  { id: 'plt-5', name: 'Jira', category: 'Project', description: 'Project and issue tracking' },
  { id: 'plt-6', name: 'Zoho Desk', category: 'Support', description: 'Customer support ticketing' },
  { id: 'plt-7', name: 'Acuity', category: 'Scheduling', description: 'Appointment scheduling' },
  { id: 'plt-8', name: 'TheCreditPros Portal', category: 'Internal', description: 'TCP internal portal' },
  { id: 'plt-9', name: 'Sales IQ', category: 'Sales', description: 'Sales intelligence platform' },
  { id: 'plt-10', name: 'StaffCounter', category: 'Monitoring', description: 'Staff activity monitoring' },
];

/**
 * DEFAULT_SETTINGS - Initial settings values for all users.
 * Persisted to localStorage key: 'tcp_settings' (see Settings/Settings.jsx's useSettings hook).
 */
export const DEFAULT_SETTINGS = {
  // Appearance (USER + ADMIN)
  darkMode: false,

  // Notifications (USER + ADMIN)
  notifications: {
    requestApproved: true,
    requestCompleted: true,
    requestRejected: true,
    newRequestSubmitted: false, // Admin: notified when new request comes in
    platformFailed: true, // Admin: notified when platform sync fails
  },

  // Platform Management (ADMIN only)
  // Platform IDs that are active/enabled in the app
  activePlatforms: ['plt-1', 'plt-2', 'plt-3', 'plt-4', 'plt-5', 'plt-6', 'plt-7', 'plt-8', 'plt-9', 'plt-10'],

  // Default Platforms Per Department Group (ADMIN only)
  // Maps group ID -> array of platform IDs pre-checked on OnboardingForm
  defaultPlatformsByGroup: {
    'grp-1': ['plt-1', 'plt-2', 'plt-3', 'plt-4', 'plt-5'], // IT Staff
    'grp-2': ['plt-1', 'plt-2', 'plt-6'], // HR Staff
    'grp-3': ['plt-1', 'plt-2', 'plt-5'], // Finance Staff
    'grp-4': ['plt-1', 'plt-2', 'plt-8'], // Operations Staff
    'grp-5': ['plt-1', 'plt-2', 'plt-9'], // Sales Staff
    'grp-6': ['plt-1', 'plt-2', 'plt-3', 'plt-6'], // Customer Support
  },
};

/**
 * IT_SUPPORT - IT Support contact info.
 * Used by ErrorReportModal to pre-fill the "Email IT" mailto link.
 */
export const IT_SUPPORT = {
  email: 'it@thecreditpros.com',
  name: 'TCP IT Support',
  teamsChannel: 'TCP-IT-Support', // for future Teams integration
};

/**
 * ---------------------------------------------------------------------
 * Runtime workflow persistence (onboarding/offboarding wiring)
 * ---------------------------------------------------------------------
 * MOCK_USERS/MOCK_REQUESTS above are a static, read-only seed shared by
 * every import of this module (including every test file) - mutating them
 * directly would leak state across renders and across the whole test run.
 * Instead, anything created or changed at runtime (a submitted request, an
 * approved request's platform progress, a user's status flipping) is
 * persisted to its own localStorage key and merged with the seed on read,
 * the same "seed + localStorage overrides" shape Settings already uses for
 * `tcp_settings`.
 *
 * TODO: When a real backend exists, getAllRequests/getAllUsers become the
 * fetch calls and saveRequest/saveUser become the mutation calls - callers
 * (OnboardingForm, OffboardingForm, RequestDetails, RequestsList,
 * ManageUsers) don't need to change.
 */

const REQUESTS_STORAGE_KEY = 'tcp_requests_extra';
const USERS_STORAGE_KEY = 'tcp_users_extra';

function readExtraRequests() {
  try {
    const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeExtraRequests(requests) {
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // localStorage unavailable (e.g. private-browsing quota) - the request
    // still works for this session, it just won't persist across a reload.
  }
}

function readExtraUsers() {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeExtraUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // see writeExtraRequests
  }
}

/**
 * All requests: the static MOCK_REQUESTS seed, with any runtime-created or
 * runtime-modified requests merged in (a runtime entry with the same id as
 * a seed entry overrides it; otherwise it's appended).
 * @returns {Array} Combined requests, seed order first
 */
export function getAllRequests() {
  const extra = readExtraRequests();
  const extraById = new Map(extra.map((r) => [r.id, r]));
  const merged = MOCK_REQUESTS.map((r) => extraById.get(r.id) || r);
  const newOnly = extra.filter((r) => !MOCK_REQUESTS.some((seed) => seed.id === r.id));
  return [...merged, ...newOnly];
}

/**
 * Looks up one request by id from the combined seed + runtime set.
 * @param {number|string} requestId
 * @returns {Object|null} The matching request, or null if not found
 */
export function getRequestByIdMerged(requestId) {
  const numericId = Number(requestId);
  return getAllRequests().find((r) => r.id === numericId) || null;
}

/**
 * Finds the pending request (onboarding OR offboarding) matching an
 * email, if any. A user only ever has one request awaiting approval at a
 * time, so this is enough to answer "does this person have something in
 * flight right now?" without needing a separate per-type lookup.
 * @param {string} email
 * @returns {Object|null} The matching pending request, or null
 */
export function getPendingRequestByEmail(email) {
  const normalized = (email || '').toLowerCase();
  return (
    getAllRequests().find((r) => r.email.toLowerCase() === normalized && r.status === 'pending') ||
    null
  );
}

/**
 * Persists a request: updates it if already tracked at runtime, otherwise
 * adds it. Always writes the full runtime overlay back to localStorage.
 * @param {Object} request
 */
export function saveRequest(request) {
  const extra = readExtraRequests();
  const index = extra.findIndex((r) => r.id === request.id);
  if (index >= 0) {
    extra[index] = request;
  } else {
    extra.push(request);
  }
  writeExtraRequests(extra);
}

/**
 * All users: the static MOCK_USERS seed, with any runtime-created or
 * runtime-modified users merged in (same override-by-id rule as requests).
 * @returns {Array} Combined users, seed order first
 */
export function getAllUsers() {
  const extra = readExtraUsers();
  const extraById = new Map(extra.map((u) => [u.id, u]));
  const merged = MOCK_USERS.map((u) => extraById.get(u.id) || u);
  const newOnly = extra.filter((u) => !MOCK_USERS.some((seed) => seed.id === u.id));
  return [...merged, ...newOnly];
}

/**
 * Looks up one user by id from the combined seed + runtime set - unlike
 * getMockUserById, this also resolves users created or activated at
 * runtime (e.g. by OnboardingForm/RequestDetails), not just the seed.
 * @param {number|string} userId
 * @returns {Object|null} The matching user, or null if not found
 */
export function getUserByIdMerged(userId) {
  const numericId = Number(userId);
  return getAllUsers().find((u) => u.id === numericId) || null;
}

/**
 * Persists a user record: updates it if already overridden/new, otherwise
 * adds it as a new runtime user. Used both for brand-new employees and for
 * status changes to an existing seed user (e.g. active -> inactive).
 * @param {Object} user
 */
export function saveUser(user) {
  const extra = readExtraUsers();
  const index = extra.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    extra[index] = user;
  } else {
    extra.push(user);
  }
  writeExtraUsers(extra);
}

/**
 * Next id for a newly created request, continuing MOCK_REQUESTS' own
 * numeric sequence - onboarding and offboarding requests share one id
 * space (see MOCK_REQUESTS id 109, an offboarding record with a plain
 * numeric id).
 * @returns {number}
 */
export function getNextRequestId() {
  const allIds = [...MOCK_REQUESTS, ...readExtraRequests()].map((r) => r.id);
  return Math.max(...allIds, 0) + 1;
}

/**
 * Next id for a newly created user, continuing MOCK_USERS' sequence.
 * @returns {number}
 */
export function getNextUserId() {
  const allIds = [...MOCK_USERS, ...readExtraUsers()].map((u) => u.id);
  return Math.max(...allIds, 0) + 1;
}

/**
 * Builds a new onboarding request from OnboardingForm's formData. Carries
 * both naming conventions RequestsList/RequestDetails each already read
 * (see MOCK_REQUESTS' own dual-field-name convention) so neither
 * component's existing display logic has to change.
 *
 * @param {Object} formData - OnboardingForm's formData, plus submittedBy/submittedByRole/submittedByDept
 * @returns {Object} The new request (not yet persisted - call saveRequest)
 */
export function createOnboardingRequest(formData) {
  return {
    id: getNextRequestId(),
    type: 'Onboarding',
    requestType: 'Onboarding',
    name: formData.employeeName,
    employeeName: formData.employeeName,
    email: formData.email,
    status: 'pending',
    date: formData.startDate,
    startDate: formData.startDate,
    department: formData.departmentName,
    departmentName: formData.departmentName,
    manager: formData.managerName,
    managerName: formData.managerName,
    jobTitleLabel: formData.jobTitleLabel,
    employeeType: formData.employeeType,
    employeeTypeLabel: formData.employeeTypeLabel,
    azureGroupId: formData.azureGroupId,
    azureGroupName: formData.azureGroupName,
    azureGroupKey: formData.azureGroupKey,
    createdAt: new Date().toISOString(),
    submittedBy: formData.submittedBy,
    submittedByRole: formData.submittedByRole,
    submittedByDept: formData.submittedByDept,
    platforms: formData.selectedPlatforms.map((name) => ({
      name,
      status: 'pending',
      completedBy: null,
      completedAt: null,
      error: null,
    })),
    timeline: [],
  };
}

/**
 * Builds a new offboarding request from OffboardingForm's formData.
 * @param {Object} formData - includes userId, employeeName, email, department,
 *   manager, offboardingReason, offboardingDate, finalDay, selectedPlatforms,
 *   plus submittedBy/submittedByRole/submittedByDept
 * @returns {Object} The new request (not yet persisted - call saveRequest)
 */
export function createOffboardingRequest(formData) {
  return {
    id: getNextRequestId(),
    type: 'Offboarding',
    requestType: 'Offboarding',
    name: formData.employeeName,
    employeeName: formData.employeeName,
    email: formData.email,
    status: 'pending',
    date: formData.offboardingDate,
    startDate: formData.offboardingDate,
    department: formData.department,
    departmentName: formData.department,
    manager: formData.manager,
    managerName: formData.manager,
    userId: formData.userId,
    offboardingReason: formData.offboardingReason,
    finalDay: formData.finalDay,
    timing: formData.timing || 'immediate',
    createdAt: new Date().toISOString(),
    submittedBy: formData.submittedBy,
    submittedByRole: formData.submittedByRole,
    submittedByDept: formData.submittedByDept,
    platforms: formData.selectedPlatforms.map((name) => ({
      name,
      status: 'pending',
      completedBy: null,
      completedAt: null,
      error: null,
    })),
    timeline: [],
  };
}

/**
 * Appends a timeline event to a request's timeline. Returns a NEW request
 * object rather than mutating the input, so React state updates built from
 * this stay clean (no accidental in-place mutation of state).
 *
 * @param {Object} request
 * @param {string} action - e.g. 'Request Created', 'Platform sync: Azure AD'
 * @param {'pending'|'in-progress'|'completed'} [status] - matches Timeline's dot color
 * @returns {Object} A new request object with the event appended
 */
export function withTimelineEvent(request, action, status = 'completed') {
  const event = {
    timestamp: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    action,
    status,
  };
  return { ...request, timeline: [...request.timeline, event] };
}

/**
 * Builds the pending user record created immediately when an onboarding
 * request is submitted (before it's approved) - mirrors the seed data's
 * own convention where every pending user already has a matching pending
 * request from day one. buildActivatedUser later finds this same user by
 * email and flips it to active, reusing its id, once the request is
 * approved and every platform is provisioned.
 * @param {Object} request - A freshly created onboarding request
 * @returns {Object} The user record to persist via saveUser
 */
export function buildPendingUser(request) {
  return {
    id: getNextUserId(),
    name: request.employeeName,
    email: request.email,
    status: 'pending',
    department: request.departmentName,
    manager: request.managerName,
    dateOnboarded: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    dateOffboarded: null,
    platforms: request.platforms.map((p) => p.name),
  };
}

/**
 * Builds the user record that results from a fully-approved onboarding
 * request - a brand-new employee if no user exists yet with this email,
 * or the existing pending user flipped to active.
 * @param {Object} request - An onboarding request whose platforms are all completed
 * @returns {Object} The user record to persist via saveUser
 */
export function buildActivatedUser(request) {
  const existing = getAllUsers().find(
    (u) => u.email.toLowerCase() === request.email.toLowerCase()
  );
  return {
    id: existing ? existing.id : getNextUserId(),
    name: request.employeeName,
    email: request.email,
    status: 'active',
    department: request.departmentName,
    manager: request.managerName,
    dateOnboarded: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    dateOffboarded: null,
    platforms: request.platforms.map((p) => p.name),
  };
}

/**
 * Builds the updated user record after a fully-approved offboarding
 * request completes - flips the existing user to inactive. Inactive users
 * have no manager on file, matching the seed data's own convention.
 * @param {Object} request - An offboarding request whose platforms are all completed
 * @returns {Object|null} The user record to persist via saveUser, or null if no matching user exists
 */
export function buildDeactivatedUser(request) {
  const existing = getAllUsers().find(
    (u) => u.email.toLowerCase() === request.email.toLowerCase()
  );
  if (!existing) {
    return null;
  }
  return {
    ...existing,
    status: 'inactive',
    dateOffboarded: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    manager: null,
  };
}

/**
 * ---------------------------------------------------------------------
 * SLA tracking
 * ---------------------------------------------------------------------
 * Onboarding requests are expected to complete within 24 hours of
 * submission; offboarding within 2 hours (offboarding is far more
 * time-sensitive - a departing employee's access should close quickly).
 * Keyed by the request's own `type` field ('Onboarding'/'Offboarding').
 */
export const SLA_CONFIG_MS = {
  Onboarding: 24 * 60 * 60 * 1000,
  Offboarding: 2 * 60 * 60 * 1000,
};

/**
 * Formats a millisecond duration as "Xh Ym" (e.g. "14h 30m").
 * @param {number} ms - Non-negative duration in milliseconds
 * @returns {string}
 */
export function formatDurationHoursMinutes(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Calculates SLA status for a request, including a per-platform verdict.
 * A platform not yet completed has no verdict yet (`violated: null`) -
 * only requests whose deadline has actually passed count against them.
 * A completed request is only SLA-violated if the request's own total
 * elapsed time, or any individual platform's completion time, exceeded
 * the limit.
 *
 * @param {Object} request - A request from getAllRequests()
 * @returns {Object|null} SLA status, or null if the request has no createdAt
 */
export function calculateRequestSLA(request) {
  if (!request || !request.createdAt) {
    return null;
  }
  const slaLimitMs = SLA_CONFIG_MS[request.type] ?? SLA_CONFIG_MS.Onboarding;
  const submittedMs = new Date(request.createdAt).getTime();
  const isCompleted = request.status === 'completed';
  const endMs = isCompleted && request.completedAt ? new Date(request.completedAt).getTime() : Date.now();
  const elapsedMs = Math.max(0, endMs - submittedMs);
  const remainingMs = slaLimitMs - elapsedMs;

  const platformSLAs = (request.platforms || []).map((p) => {
    if (p.status !== 'completed' || !p.completedAt) {
      return { name: p.name, completed: false, elapsedMs: null, violated: null };
    }
    const platformElapsedMs = Math.max(0, new Date(p.completedAt).getTime() - submittedMs);
    return { name: p.name, completed: true, elapsedMs: platformElapsedMs, violated: platformElapsedMs > slaLimitMs };
  });

  const anyPlatformViolated = platformSLAs.some((p) => p.violated === true);
  const isViolated = elapsedMs > slaLimitMs || (isCompleted && anyPlatformViolated);

  return {
    requestId: request.id,
    requestType: request.type,
    slaLimitMs,
    elapsedMs,
    remainingMs,
    isCompleted,
    isViolated,
    atRisk: !isCompleted && remainingMs <= 0,
    platformSLAs,
  };
}

/**
 * Human-readable SLA status line for display (RequestDetails/RequestsList).
 * @param {Object|null} sla - Result of calculateRequestSLA
 * @returns {string}
 */
export function getSLAStatusText(sla) {
  if (!sla) {
    return '';
  }
  if (!sla.isCompleted) {
    if (sla.remainingMs <= 0) {
      return `🔴 OVERDUE by ${formatDurationHoursMinutes(Math.abs(sla.remainingMs))}`;
    }
    return `⏱️ ${formatDurationHoursMinutes(sla.remainingMs)} remaining`;
  }
  return sla.isViolated
    ? `🔴 SLA violated (${formatDurationHoursMinutes(sla.elapsedMs)} total)`
    : `✅ SLA passed (${formatDurationHoursMinutes(sla.elapsedMs)})`;
}

const mockData = {
  PLATFORM_ACTIONS,
  PLATFORMS,
  MOCK_USERS,
  MOCK_REQUESTS,
  MOCK_ACCOUNTS,
  MOCK_DEPARTMENT_GROUPS,
  AVAILABLE_PLATFORMS,
  DEFAULT_SETTINGS,
  MOCK_JOB_TITLES,
  IT_SUPPORT,
  getMockAccountByEmail,
  getMockUserById,
  getMockUserByEmail,
  getMockRequestById,
  getMockRequestByEmail,
  getMockUsersByStatus,
  getMockRequestsByStatus,
  getMockUsersByDepartment,
  getMockUsersByManager,
  getMockActiveUsers,
  getMockPendingUsers,
  getMockPendingRequests,
  getMockDataSummary,
  getAllRequests,
  getRequestByIdMerged,
  getPendingRequestByEmail,
  saveRequest,
  getAllUsers,
  getUserByIdMerged,
  saveUser,
  getNextRequestId,
  getNextUserId,
  createOnboardingRequest,
  createOffboardingRequest,
  withTimelineEvent,
  buildPendingUser,
  buildActivatedUser,
  buildDeactivatedUser,
  SLA_CONFIG_MS,
  formatDurationHoursMinutes,
  calculateRequestSLA,
  getSLAStatusText,
};

export default mockData;
