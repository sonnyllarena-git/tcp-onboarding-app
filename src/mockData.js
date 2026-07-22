/**
 * mockData.js
 *
 * Phase 3: this file is NO LONGER a mock user/request database. Real
 * users and real onboarding/offboarding requests now come from the
 * Phase 2 Express backend via src/services/{userService,requestService,
 * platformService,auditService}.js.
 *
 * What's still here, and why:
 *
 *   1. Pure business logic with nothing to do with mocking - SLA
 *      calculation, date-range math for Reports, work-email
 *      generation, timeline formatting. This logic is real regardless
 *      of where the data comes from, so it stays.
 *   2. MOCK_ACCOUNTS / getMockAccountByEmail - LoginPage's login
 *      directory. The Phase 2 backend has no login endpoint, so this
 *      stays mock for now (a deliberate, disclosed Phase 3 scope
 *      decision - see the app's README).
 *   3. A small localStorage-backed request pipeline (getAllRequests/
 *      saveRequest/getRequestByIdMerged/getPendingRequestByEmail/
 *      getNextRequestId) kept ALIVE, but now used ONLY by Transition
 *      and Reactivation requests - the Phase 2 backend has no
 *      endpoints for these two request types. Their pending-request
 *      tracking stays local; the field changes they apply on
 *      completion are written to the REAL backend user record (see
 *      RequestDetails.jsx's handleCompleteRequest).
 *
 * Everything that used to read/write MOCK_USERS or the fictional
 * MOCK_REQUESTS onboarding/offboarding seed has been removed -
 * getAllUsers/saveUser/getUserByIdMerged/buildActivatedUser/
 * buildDeactivatedUser/buildPendingUser/createOnboardingRequest/
 * createOffboardingRequest now live in src/services/*.js instead.
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
 * MOCK_ACCOUNTS - Login credentials directory
 *
 * Simulates Azure AD group membership:
 * - role 'ADMIN' = member of TCPOnboardingAppAdmin (IT, request processors)
 * - role 'USER'  = member of TCPOnboardingAppUser (HR, Team Leads, requesters)
 *
 * The Phase 2 backend has no login/auth endpoint, so this stays the
 * login source of truth for now - a disclosed Phase 3 scope decision,
 * not an oversight.
 */
export const MOCK_ACCOUNTS = [
  { id: 'acc-1', name: 'Sarah Miller', email: 'sarah.miller@thecreditpros.com', role: 'USER', department: 'HR' },
  { id: 'acc-2', name: 'Emma Davis', email: 'emma.davis@thecreditpros.com', role: 'USER', department: 'Finance' },
  { id: 'acc-3', name: 'John Doe', email: 'john.doe@thecreditpros.com', role: 'ADMIN', department: 'IT' },
  { id: 'acc-4', name: 'Sonny Llarena', email: 'sonnyl@thecreditpros.com', role: 'ADMIN', department: 'IT' },
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
 * Option lists for TransitionForm/ReactivationForm's "new" fields.
 */
export const DEPARTMENT_OPTIONS = ['IT', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Customer Support'];

export const MANAGER_OPTIONS = [
  'Diana Foster', 'James Whitfield', 'Rachel Nguyen', 'Marcus Bell', 'Sandra Okafor', 'Kevin Tran',
  'Robert Chen', 'Priya Patel', 'David Kim', 'Laura Chen', 'Nina Rodriguez', 'Steve Park',
  'Angela Cruz', 'Patricia Nguyen', 'Victor Adeyemi', 'Helen Osei',
];

export const FLOOR_OPTIONS = ['C1', 'C2', 'S1', 'S2', 'T1', 'T2'];

export const ROLE_OPTIONS = ['Engineer', 'Senior Engineer', 'Lead Engineer', 'Manager', 'Director', 'Analyst', 'Administrator'];

export const TYPE_OPTIONS = ['Internal', 'External'];

/**
 * Simulated Azure AD security-group name for each role, shown to the
 * admin as an informational note when transitioning a user - real
 * integration would call the Azure API to actually move group
 * membership instead of just recording the intent in the audit log.
 */
export const AZURE_GROUP_MAPPING = {
  Engineer: 'AzureGroup_Engineer',
  'Senior Engineer': 'AzureGroup_SeniorEngineer',
  'Lead Engineer': 'AzureGroup_LeadEngineer',
  Manager: 'AzureGroup_Manager',
  Director: 'AzureGroup_Director',
  Analyst: 'AzureGroup_Analyst',
  Administrator: 'AzureGroup_Administrator',
};

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
 * Transition/Reactivation request pipeline (localStorage-backed)
 * ---------------------------------------------------------------------
 * The Phase 2 backend has no request-tracking table for Transition or
 * Reactivation requests (only onboarding_requests/offboarding_requests
 * exist) - so unlike Onboarding/Offboarding, these two types keep their
 * pending-request lifecycle here, exactly as before Phase 3. What DID
 * change: once one of these requests is completed, the resulting field
 * changes are written to the REAL backend user record (see
 * RequestDetails.jsx), not to a local saveUser call - there is no more
 * local user store to write to.
 */

const REQUESTS_STORAGE_KEY = 'tcp_requests_extra';

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

/**
 * All locally-tracked requests (Transition/Reactivation only).
 * @returns {Array}
 */
export function getAllRequests() {
  return readExtraRequests();
}

/**
 * Looks up one locally-tracked request by id.
 * @param {number|string} requestId
 * @returns {Object|null}
 */
export function getRequestByIdMerged(requestId) {
  const numericId = Number(requestId);
  return getAllRequests().find((r) => r.id === numericId) || null;
}

/**
 * Finds the pending Transition/Reactivation request matching an email, if any.
 * @param {string} email
 * @returns {Object|null}
 */
export function getPendingRequestByEmail(email) {
  const normalized = (email || '').toLowerCase();
  return (
    getAllRequests().find((r) => r.email.toLowerCase() === normalized && r.status === 'pending') || null
  );
}

/**
 * Persists a Transition/Reactivation request: updates it if already
 * tracked, otherwise adds it.
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
 * Next id for a newly created Transition/Reactivation request.
 * @returns {number}
 */
export function getNextRequestId() {
  const allIds = readExtraRequests().map((r) => r.id);
  return Math.max(...allIds, 0) + 1;
}

/**
 * Builds a new transition request for an active user moving to a new
 * department/manager/floor/role/job title/type. There is no platform
 * provisioning step (platform access changes are handled manually), so
 * `platforms` is always empty.
 *
 * @param {Object} user - The active user being transitioned (a real,
 *   backend-adapted user from userService - see userService.adaptUser)
 * @param {Object} formData - { newDepartment, newManager, newFloor, newRole, newJobTitle, newType }
 * @param {Object} submitter - { submittedBy, submittedByRole, submittedByDept }
 * @returns {Object} The new request (not yet persisted - call saveRequest)
 */
export function createTransitionRequest(user, formData, submitter) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    id: getNextRequestId(),
    type: 'Transition',
    requestType: 'Transition',
    name: user.name,
    employeeName: user.name,
    email: user.email,
    status: 'pending',
    date: today,
    startDate: today,
    department: formData.newDepartment,
    departmentName: formData.newDepartment,
    manager: formData.newManager,
    managerName: formData.newManager,
    userId: user.id,
    oldDepartment: user.department || null,
    newDepartment: formData.newDepartment,
    oldManager: user.manager || null,
    newManager: formData.newManager,
    oldFloor: user.floor || null,
    newFloor: formData.newFloor,
    oldRole: user.role || null,
    newRole: formData.newRole,
    oldJobTitle: user.jobTitle || null,
    newJobTitle: formData.newJobTitle,
    oldType: user.type || 'Internal',
    newType: formData.newType,
    azureGroupName: AZURE_GROUP_MAPPING[formData.newRole] || null,
    createdAt: new Date().toISOString(),
    submittedBy: submitter.submittedBy,
    submittedByRole: submitter.submittedByRole,
    submittedByDept: submitter.submittedByDept,
    platforms: (formData.selectedPlatforms || []).map((name) => ({
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
 * Builds the field changes to apply to the real user record once a
 * transition request is completed. Returns null if `existingUser` is
 * null (nothing to update).
 * @param {Object} request - A transition request whose fields to apply
 * @param {Object|null} existingUser - The real user, fetched via userService.getUser
 * @returns {Object|null} { department, manager, floor, jobTitle, type } to pass to userService.updateUser, or null
 */
export function buildTransitionedUser(request, existingUser) {
  if (!existingUser) {
    return null;
  }
  return {
    ...existingUser,
    department: request.newDepartment,
    manager: request.newManager,
    // Floor/Role/Job Title/Type are optional on the request - a blank
    // value means "leave unchanged", not "clear it out".
    floor: request.newFloor || existingUser.floor,
    role: request.newRole || existingUser.role,
    jobTitle: request.newJobTitle || existingUser.jobTitle,
    type: request.newType || existingUser.type,
  };
}

/**
 * Builds a new reactivation request for a rehired INACTIVE employee.
 * Department/Manager are the only required fields in the form - Floor/
 * Role/Job Title/Type are optional.
 *
 * @param {Object} user - The inactive user being reactivated (a real,
 *   backend-adapted user from userService)
 * @param {Object} formData - { department, manager, floor, role, jobTitle, type, selectedPlatforms }
 * @param {Object} submitter - { submittedBy, submittedByRole, submittedByDept }
 * @returns {Object} The new request (not yet persisted - call saveRequest)
 */
export function createReactivationRequest(user, formData, submitter) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    id: getNextRequestId(),
    type: 'Reactivation',
    requestType: 'Reactivation',
    name: user.name,
    employeeName: user.name,
    email: user.email,
    status: 'pending',
    date: today,
    startDate: today,
    userId: user.id,
    department: formData.department,
    departmentName: formData.department,
    manager: formData.manager,
    managerName: formData.manager,
    floor: formData.floor || null,
    role: formData.role || null,
    jobTitleLabel: formData.jobTitle || null,
    employeeType: formData.type === 'External' ? 'external' : 'internal',
    employeeTypeLabel: formData.type || 'Internal',
    createdAt: new Date().toISOString(),
    submittedBy: submitter.submittedBy,
    submittedByRole: submitter.submittedByRole,
    submittedByDept: submitter.submittedByDept,
    platforms: (formData.selectedPlatforms || []).map((name) => ({
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
 * Builds the field changes to apply to the real user record once a
 * reactivation request is completed (re-enabling the account is a
 * separate call - userService.enableUser - since it's a distinct
 * backend endpoint from the field update).
 * @param {Object} request - A reactivation request whose platforms are all completed
 * @param {Object|null} existingUser - The real user, fetched via userService.getUser
 * @returns {Object|null} { department, manager, floor, jobTitle, type } to pass to userService.updateUser, or null
 */
export function buildReactivatedUser(request, existingUser) {
  if (!existingUser) {
    return null;
  }
  return {
    ...existingUser,
    department: request.departmentName,
    manager: request.managerName,
    floor: request.floor || existingUser.floor,
    role: request.role || existingUser.role,
    jobTitle: request.jobTitleLabel || existingUser.jobTitle,
    type: request.employeeType === 'external' ? 'External' : 'Internal',
  };
}

/**
 * Builds a "Field: old → new" summary of only the fields a transition
 * request actually changed - used for both the completion audit log
 * entry and the Employee History modal, so the two never drift apart.
 * @param {Object} request - A transition request (old/new field pairs)
 * @returns {string} Comma-joined list of changes, or a fallback message if none
 */
export function buildTransitionChangeSummary(request) {
  const fields = [
    ['Department', request.oldDepartment, request.newDepartment],
    ['Manager', request.oldManager, request.newManager],
    ['Role', request.oldRole, request.newRole],
    ['Floor', request.oldFloor, request.newFloor],
    ['Job Title', request.oldJobTitle, request.newJobTitle],
    ['Type', request.oldType, request.newType],
  ];
  const changes = fields
    .filter(([, before, after]) => after && before !== after)
    .map(([label, before, after]) => `${label}: ${before || 'N/A'} → ${after}`);
  return changes.length > 0 ? changes.join(', ') : 'No field changes recorded.';
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
  Transition: 24 * 60 * 60 * 1000,
  Reactivation: 24 * 60 * 60 * 1000,
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
 * @param {Object} request - A request from getAllRequests() or requestService
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

/**
 * Simulates the Azure AD account-creation step of onboarding: derives a
 * work email from the employee's first name. Real integration would call
 * the Azure API instead and return whatever mailbox it actually provisions.
 *
 * @param {string} fullName - Employee's full name (e.g. "Sonny Llarena")
 * @returns {string} Work email, e.g. "sonny@thecreditpros.com"
 */
export function generateWorkEmail(fullName) {
  const firstName = (fullName || '').trim().split(/\s+/)[0]?.toLowerCase() || 'user';
  return `${firstName}@thecreditpros.com`;
}

/**
 * True when an ACTIVE user in `activeUsers` already has this exact name
 * (case-insensitive, whitespace-trimmed). Used to warn an admin
 * onboarding a new employee that the name collides with someone
 * already on staff - purely informational, never blocks submission.
 * @param {string} fullName
 * @param {Array} activeUsers - Already-fetched active users (real, from userService)
 * @returns {boolean}
 */
export function checkDuplicateActiveUser(fullName, activeUsers) {
  const normalized = (fullName || '').trim().toLowerCase();
  if (!normalized || !Array.isArray(activeUsers)) return false;
  return activeUsers.some((u) => u.status === 'active' && u.name.trim().toLowerCase() === normalized);
}

/**
 * Suggests a more specific work email (firstname.lastname@) for the
 * duplicate-name case, since generateWorkEmail's firstname-only format
 * would collide with the existing active user of the same name.
 * @param {string} fullName
 * @returns {string}
 */
export function generateDuplicateWorkEmail(fullName) {
  const parts = (fullName || '').trim().toLowerCase().split(/\s+/);
  const first = parts[0] || 'user';
  const last = parts.slice(1).join('') || 'employee';
  return `${first}.${last}@thecreditpros.com`;
}

/**
 * The work email associated with a request. Real (onboarding/offboarding)
 * requests carry `.workEmail` directly (joined in from the real user by
 * requestService); Transition/Reactivation requests fall back to the
 * old platforms-array convention.
 *
 * @param {Object} request
 * @returns {string|null}
 */
export function getRequestWorkEmail(request) {
  if (request?.workEmail) {
    return request.workEmail;
  }
  return request?.platforms?.find((p) => p.name === 'Azure AD')?.workEmail || null;
}

/**
 * Calendar month range, N months back from a reference date.
 *
 * @param {number} [monthsAgo] - 0 = this month, 1 = previous month, etc.
 * @param {Date} [referenceDate]
 * @returns {{start: Date, end: Date, label: string}}
 */
export function getMonthRange(monthsAgo = 0, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() - monthsAgo;
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end, label: start.toLocaleString('en-US', { month: 'long', year: 'numeric' }) };
}

/**
 * Calendar quarter range, N quarters back from a reference date.
 *
 * @param {number} [quartersAgo] - 0 = this quarter, 1 = previous quarter, etc.
 * @param {Date} [referenceDate]
 * @returns {{start: Date, end: Date, label: string}}
 */
export function getQuarterRange(quartersAgo = 0, referenceDate = new Date()) {
  const currentQuarterIndex = Math.floor(referenceDate.getMonth() / 3);
  const totalQuarterIndex = referenceDate.getFullYear() * 4 + currentQuarterIndex - quartersAgo;
  const year = Math.floor(totalQuarterIndex / 4);
  const quarterIndex = ((totalQuarterIndex % 4) + 4) % 4;
  const start = new Date(year, quarterIndex * 3, 1, 0, 0, 0, 0);
  const end = new Date(year, quarterIndex * 3 + 3, 0, 23, 59, 59, 999);
  return { start, end, label: `Q${quarterIndex + 1} ${year}` };
}

/**
 * Year-to-date range: Jan 1 through the reference date (this year, or the
 * same calendar day last year for the "previous period" comparison).
 *
 * @param {number} [yearsAgo] - 0 = this year, 1 = last year
 * @param {Date} [referenceDate]
 * @returns {{start: Date, end: Date, label: string}}
 */
export function getYearToDateRange(yearsAgo = 0, referenceDate = new Date()) {
  const year = referenceDate.getFullYear() - yearsAgo;
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = yearsAgo === 0 ? referenceDate : new Date(year, referenceDate.getMonth(), referenceDate.getDate(), 23, 59, 59, 999);
  return { start, end, label: `Year-to-Date ${year}` };
}

/**
 * The last 12 full calendar months before the current one (oldest first),
 * e.g. for a reference date of July 2026: July 2025 .. June 2026. Used to
 * populate the Reports "Select Month" dropdown.
 *
 * @param {Date} [referenceDate]
 * @returns {Array<{start: Date, end: Date, label: string, monthsAgo: number}>}
 */
export function getLast12MonthRanges(referenceDate = new Date()) {
  const ranges = [];
  for (let monthsAgo = 12; monthsAgo >= 1; monthsAgo -= 1) {
    ranges.push({ ...getMonthRange(monthsAgo, referenceDate), monthsAgo });
  }
  return ranges;
}

/**
 * Splits a date range into its constituent calendar months, for the
 * "monthly breakdown" view of a quarter/year report.
 *
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array<{start: Date, end: Date, label: string}>}
 */
export function getMonthsInRange(rangeStart, rangeEnd) {
  const months = [];
  let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cursor <= rangeEnd) {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({ start, end, label: start.toLocaleString('en-US', { month: 'long', year: 'numeric' }) });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

/**
 * Filters a list of records to those whose `dateField` falls within
 * `range` (inclusive).
 *
 * @param {Array} items
 * @param {{start: Date, end: Date}} range
 * @param {string} [dateField]
 * @returns {Array}
 */
export function getRequestsInDateRange(items, range, dateField = 'createdAt') {
  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const parsed = new Date(raw);
    return parsed >= range.start && parsed <= range.end;
  });
}

/**
 * Percent change and trend direction between a current and previous
 * numeric metric value ("higher is better" framing - flip `invert` for
 * metrics where lower is better, e.g. average completion time).
 *
 * @param {number} current
 * @param {number} previous
 * @param {boolean} [invert]
 * @returns {{current: number, previous: number, changePct: number|null, trend: 'up'|'down'|'flat'}}
 */
export function compareMetrics(current, previous, invert = false) {
  const changePct = previous === 0 ? null : ((current - previous) / previous) * 100;
  let trend = 'flat';
  if (changePct !== null && Math.abs(changePct) >= 0.05) {
    const improved = invert ? current < previous : current > previous;
    trend = improved ? 'up' : 'down';
  }
  return { current, previous, changePct, trend };
}

const mockData = {
  PLATFORM_ACTIONS,
  PLATFORMS,
  MOCK_ACCOUNTS,
  AVAILABLE_PLATFORMS,
  DEFAULT_SETTINGS,
  MOCK_JOB_TITLES,
  IT_SUPPORT,
  DEPARTMENT_OPTIONS,
  MANAGER_OPTIONS,
  FLOOR_OPTIONS,
  ROLE_OPTIONS,
  TYPE_OPTIONS,
  AZURE_GROUP_MAPPING,
  getMockAccountByEmail,
  getAllRequests,
  getRequestByIdMerged,
  getPendingRequestByEmail,
  saveRequest,
  getNextRequestId,
  createTransitionRequest,
  createReactivationRequest,
  withTimelineEvent,
  buildTransitionedUser,
  buildReactivatedUser,
  buildTransitionChangeSummary,
  SLA_CONFIG_MS,
  formatDurationHoursMinutes,
  calculateRequestSLA,
  getSLAStatusText,
  generateWorkEmail,
  checkDuplicateActiveUser,
  generateDuplicateWorkEmail,
  getRequestWorkEmail,
  getMonthRange,
  getLast12MonthRanges,
  getQuarterRange,
  getYearToDateRange,
  getMonthsInRange,
  getRequestsInDateRange,
  compareMetrics,
};

export default mockData;
