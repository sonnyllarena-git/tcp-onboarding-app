import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getRequestByIdMerged,
  getAllRequests,
  saveRequest,
  buildTransitionedUser,
  buildReactivatedUser,
  buildTransitionChangeSummary,
  withTimelineEvent,
  calculateRequestSLA,
  getSLAStatusText,
  generateWorkEmail,
  generateDuplicateWorkEmail,
  getRequestWorkEmail,
} from '../../mockData';
import { getRequest, updateRequestStatus, updatePlatformStatus, isRealRequestId, listRequests } from '../../services/requestService';
import { getUser, updateUser, enableUser, disableUser } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { recordAuditLog } from '../AuditLogs';
import { NotFoundPage } from '../ErrorState';

const AUTOMATION_FAILURE_CHANCE = 0.3;
const AUTOMATION_MIN_DELAY_MS = 2000;
const AUTOMATION_MAX_EXTRA_DELAY_MS = 1000;

/**
 * Formats an ISO datetime string as "Mon D, YYYY at H:MM AM/PM".
 * Falls back to "Unknown" for a missing value.
 * @param {string} [isoDateTime]
 * @returns {string}
 */
function formatDateTime(isoDateTime) {
  if (!isoDateTime) {
    return 'Unknown';
  }
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime;
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).replace(',', ' at');
}

function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loggedInUser = useAuth();
  const isAdmin = loggedInUser?.role === 'ADMIN';
  const isReal = isRealRequestId(id);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [relatedRequests, setRelatedRequests] = useState([]);

  // Offboarding: a single confirm modal per not-yet-completed platform.
  const [offboardPlatformToConfirm, setOffboardPlatformToConfirm] = useState(null);

  // Onboarding: automation trigger -> spinner -> success/failure -> error
  // options (Jira/manual) -> manual confirm. `platformModal.mode` is one
  // of 'trigger' | 'error' | 'manual'.
  const [platformModal, setPlatformModal] = useState(null);
  const [automatingPlatform, setAutomatingPlatform] = useState(null);

  const [showWelcomeEmailModal, setShowWelcomeEmailModal] = useState(false);

  // Azure AD work-email confirmation, shown before the normal trigger
  // modal when the name collides with an existing active employee, or
  // this is a reactivation (where IT may want to reuse the old mailbox).
  const [azureEmailModal, setAzureEmailModal] = useState(false);
  const [azureEmailInput, setAzureEmailInput] = useState('');

  const fromManageUsers = Boolean(location.state?.fromManageUsers);

  // Real (Onboarding/Offboarding) requests come from the backend;
  // Transition/Reactivation requests stay on the local mock pipeline -
  // see mockData.js's header comment for why.
  const loadRequest = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (isReal) {
        const data = await getRequest(id);
        setRequest(data);
      } else {
        const req = getRequestByIdMerged(Number(id));
        setRequest(req || null);
      }
    } catch (error) {
      console.error('[RequestDetails] failed to load request:', error.message);
      setRequest(null);
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, isReal]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  // "Other requests for this employee": real onboarding/offboarding
  // history comes from the backend (filtered by userId); Transition/
  // Reactivation history comes from the local mock store (filtered by
  // email, as before) - merged into one list.
  useEffect(() => {
    if (!request) {
      setRelatedRequests([]);
      return;
    }
    let cancelled = false;
    async function loadRelated() {
      const mockRelated = getAllRequests().filter(
        (r) => r.id !== request.id && r.email.toLowerCase() === request.email.toLowerCase()
      );
      let realRelated = [];
      if (request.userId) {
        try {
          const all = await listRequests({ userId: request.userId });
          realRelated = all.filter((r) => r.id !== request.id);
        } catch (error) {
          console.error('[RequestDetails] failed to load related requests:', error.message);
        }
      }
      if (!cancelled) setRelatedRequests([...realRelated, ...mockRelated]);
    }
    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [request]);

  const logWorkflowEvent = (action, details, extra = {}) => {
    recordAuditLog({
      userEmail: loggedInUser?.email,
      userName: loggedInUser?.name,
      department: loggedInUser?.department,
      action,
      details,
      requestId: request?.id,
      ...extra,
    });
  };

  const isTransition = request?.type === 'Transition';
  const isReactivation = request?.type === 'Reactivation';
  const isOffboarding = request?.type === 'Offboarding';

  // ---- Offboarding & Transition: manual-only per platform ----

  const handleOffboardPlatformClick = (platformName) => {
    if (!isAdmin || !request || request.status !== 'pending') return;
    const platform = request.platforms.find((p) => p.name === platformName);
    if (!platform || platform.status === 'completed') return;
    setOffboardPlatformToConfirm(platformName);
  };

  const confirmManualOffboarding = async () => {
    if (!request || !offboardPlatformToConfirm) return;
    const platformName = offboardPlatformToConfirm;
    setOffboardPlatformToConfirm(null);

    if (isTransition) {
      // Transition stays on the mock pipeline - no backend platform tracking for it.
      let updated = {
        ...request,
        platforms: request.platforms.map((p) =>
          p.name === platformName
            ? { ...p, status: 'completed', completedBy: loggedInUser?.name || 'Unknown', completedAt: new Date().toISOString(), error: null }
            : p
        ),
      };
      updated = withTimelineEvent(updated, `Platform access updated: ${platformName}`, 'completed');
      saveRequest(updated);
      setRequest(updated);
      logWorkflowEvent('TRANSITION_PLATFORM_UPDATED', `${platformName} access updated for ${updated.employeeName}`, { platformName });
      return;
    }

    // Offboarding - real backend. The backend auto-records the audit
    // entry for this, so no manual logWorkflowEvent call is needed.
    try {
      await updatePlatformStatus(request.id, platformName, {
        status: 'COMPLETED - BY IT',
        completedBy: loggedInUser?.name || 'Unknown',
      });
      await loadRequest();
    } catch (error) {
      console.error('[RequestDetails] manual offboarding failed:', error.message);
    }
  };

  // ---- Onboarding: automation trigger, then manual fallback on failure ----

  const handleOnboardPlatformClick = async (platform) => {
    if (!isAdmin || !request || request.status !== 'pending' || automatingPlatform) return;
    if (platform.status === 'completed') return;

    const needsEmailConfirm =
      platform.name === 'Azure AD' &&
      platform.status !== 'failed' &&
      !request.confirmedWorkEmail &&
      request.hasDuplicateName;
    if (needsEmailConfirm) {
      const suggested = generateDuplicateWorkEmail(request.employeeName);
      setAzureEmailInput(suggested);
      setAzureEmailModal(true);
      return;
    }

    if (platform.status === 'failed') {
      setPlatformModal({ platformName: platform.name, mode: 'error' });
    } else {
      setPlatformModal({ platformName: platform.name, mode: 'trigger' });
    }
  };

  const confirmAzureEmail = () => {
    if (!azureEmailInput.trim() || !request) return;
    const updated = { ...request, confirmedWorkEmail: azureEmailInput.trim() };
    if (isReactivation) {
      saveRequest(updated);
    }
    setRequest(updated);
    logWorkflowEvent(
      'AZURE_DUPLICATE_EMAIL_CONFIRMED',
      `Duplicate name detected. IT confirmed email: ${updated.confirmedWorkEmail}`,
      { platformName: 'Azure AD' }
    );
    setAzureEmailModal(false);
    setPlatformModal({ platformName: 'Azure AD', mode: 'trigger' });
  };

  const confirmTriggerAutomation = async () => {
    if (!platformModal || !request) return;
    const platformName = platformModal.platformName;
    setPlatformModal(null);
    setAutomatingPlatform(platformName);

    await new Promise((resolve) =>
      setTimeout(resolve, AUTOMATION_MIN_DELAY_MS + Math.random() * AUTOMATION_MAX_EXTRA_DELAY_MS)
    );

    const failed = Math.random() < AUTOMATION_FAILURE_CHANCE;
    const errorMessage = `Failed to provision ${platformName} - authentication timeout`;
    const isAzureAd = platformName === 'Azure AD';
    const workEmail = isAzureAd ? request.confirmedWorkEmail || generateWorkEmail(request.employeeName) : null;

    if (isReactivation) {
      // Reactivation stays on the mock pipeline.
      let updated;
      if (failed) {
        updated = {
          ...request,
          platforms: request.platforms.map((p) => (p.name === platformName ? { ...p, status: 'failed', error: errorMessage } : p)),
        };
        updated = withTimelineEvent(updated, `Platform automation failed: ${platformName}`, 'in-progress');
      } else {
        updated = {
          ...request,
          platforms: request.platforms.map((p) =>
            p.name === platformName
              ? {
                  ...p,
                  status: 'completed',
                  completedBy: null,
                  completedAt: new Date().toISOString(),
                  error: null,
                  ...(isAzureAd ? { workEmail, workEmailCreatedAt: new Date().toISOString() } : {}),
                }
              : p
          ),
        };
        updated = withTimelineEvent(
          updated,
          isAzureAd ? `Azure AD account created: ${workEmail}` : `Platform provisioned automatically: ${platformName}`,
          'completed'
        );
      }
      saveRequest(updated);
      setRequest(updated);
      if (failed) {
        logWorkflowEvent('PLATFORM_PROVISION_FAILED', `${platformName} automation failed for ${updated.employeeName}`, {
          platformName,
          errorMessage,
          status: 'FAILED',
        });
      } else if (isAzureAd) {
        logWorkflowEvent('AZURE_ACCOUNT_CREATED', `Azure account created - ${workEmail}`, { platformName, workEmail });
      } else {
        logWorkflowEvent('PLATFORM_PROVISIONED_AUTOMATED', `${platformName} provisioned automatically for ${updated.employeeName}`, { platformName });
      }
    } else {
      // Onboarding - real backend. The workEmail was already set when the
      // real Azure user was created (see userService.createUser) - this
      // step just confirms the platform as provisioned. The backend
      // auto-records the audit entry, so no manual logWorkflowEvent here.
      try {
        if (failed) {
          await updatePlatformStatus(request.id, platformName, { status: 'FAILED', errorMessage });
        } else {
          await updatePlatformStatus(request.id, platformName, { status: 'COMPLETED - AUTOMATED' });
        }
        await loadRequest();
      } catch (error) {
        console.error('[RequestDetails] platform automation failed:', error.message);
      }
    }

    setAutomatingPlatform(null);
    if (failed) {
      setPlatformModal({ platformName, mode: 'error' });
    }
  };

  const handleSendErrorToDev = () => {
    if (!platformModal || !request) return;
    const platformName = platformModal.platformName;
    const ticketId = `TCP-${Math.floor(Math.random() * 10000)}`;
    // Jira ticket id is decorative only - neither backend schema tracks
    // it, so for a real (Onboarding) request this is local-state only
    // and won't survive a reload. Reactivation keeps the existing mock
    // persistence since that store already has no such limitation.
    const updated = {
      ...request,
      platforms: request.platforms.map((p) => (p.name === platformName ? { ...p, jiraTicketId: ticketId } : p)),
    };
    if (isReactivation) {
      saveRequest(updated);
    }
    setRequest(updated);
    logWorkflowEvent('JIRA_TICKET_CREATED', `Jira ticket ${ticketId} created for ${platformName} provisioning failure (${updated.employeeName})`, {
      platformName,
      jiraTicketId: ticketId,
    });
    setPlatformModal({ platformName, mode: 'error' });
  };

  const confirmManualOnboard = async () => {
    if (!platformModal || !request) return;
    const platformName = platformModal.platformName;
    const isAzureAd = platformName === 'Azure AD';
    const workEmail = isAzureAd ? request.confirmedWorkEmail || generateWorkEmail(request.employeeName) : null;

    if (isReactivation) {
      let updated = {
        ...request,
        platforms: request.platforms.map((p) =>
          p.name === platformName
            ? {
                ...p,
                status: 'completed',
                completedBy: loggedInUser?.name || 'Unknown',
                completedAt: new Date().toISOString(),
                ...(isAzureAd ? { workEmail, workEmailCreatedAt: new Date().toISOString() } : {}),
              }
            : p
        ),
      };
      updated = withTimelineEvent(updated, `Platform manually provisioned: ${platformName}`, 'completed');
      saveRequest(updated);
      setRequest(updated);
      logWorkflowEvent('PLATFORM_PROVISIONED_MANUAL', `${platformName} manually provisioned by ${loggedInUser?.name} for ${updated.employeeName}`, { platformName });
      setPlatformModal(null);
      return;
    }

    try {
      await updatePlatformStatus(request.id, platformName, {
        status: 'COMPLETED - BY IT',
        completedBy: loggedInUser?.name || 'Unknown',
      });
      await loadRequest();
    } catch (error) {
      console.error('[RequestDetails] manual onboard failed:', error.message);
    }
    setPlatformModal(null);
  };

  // ---- Finalize (either type) once every platform is completed ----

  const handleCompleteRequest = async () => {
    if (!isAdmin || !request || !request.platforms.every((p) => p.status === 'completed')) return;

    if (isTransition || isReactivation) {
      // Mock-tracked request; the field changes land on the REAL user.
      let updated = { ...request, status: 'completed' };
      updated.approvedBy = loggedInUser?.name || 'Unknown';
      updated.approvedByRole = loggedInUser?.role || 'Unknown';
      updated.completedAt = new Date().toISOString();

      try {
        const existingUser = request.userId ? await getUser(request.userId) : null;
        if (isTransition) {
          const transitioned = buildTransitionedUser(updated, existingUser);
          if (transitioned) {
            await updateUser(existingUser.id, {
              department: transitioned.department,
              manager: transitioned.manager,
              floor: transitioned.floor,
              jobTitle: transitioned.jobTitle,
              type: transitioned.type,
            });
          }
          updated = withTimelineEvent(updated, 'Transition Completed', 'completed');
          logWorkflowEvent('TRANSITION_COMPLETED', `${updated.employeeName}: ${buildTransitionChangeSummary(updated)}`);
        } else {
          const reactivated = buildReactivatedUser(updated, existingUser);
          if (reactivated) {
            await enableUser(existingUser.id);
            await updateUser(existingUser.id, {
              department: reactivated.department,
              manager: reactivated.manager,
              floor: reactivated.floor,
              jobTitle: reactivated.jobTitle,
              type: reactivated.type,
            });
          }
          updated = withTimelineEvent(updated, 'User Reactivated', 'completed');
          logWorkflowEvent('REACTIVATION_COMPLETED', `${updated.employeeName} reactivated - Department: ${updated.departmentName}`);
        }
      } catch (error) {
        console.error('[RequestDetails] failed to update the real user record:', error.message);
        return;
      }

      saveRequest(updated);
      setRequest(updated);
      return;
    }

    // Onboarding/Offboarding - real backend. The backend auto-records
    // the completion audit entry, so no manual logWorkflowEvent here.
    try {
      await updateRequestStatus(request.id, 'COMPLETED');
      if (isOffboarding) {
        await disableUser(request.userId);
      } else {
        await enableUser(request.userId);
      }
      await loadRequest();
    } catch (error) {
      console.error('[RequestDetails] failed to complete request:', error.message);
    }
  };

  // ---- Post-completion: welcome email to the employee's onboarding email ----

  const handleSendWelcomeEmail = () => {
    if (!isAdmin || !request) return;
    const sentAt = new Date().toISOString();
    // Decorative only (no backend column for it) - kept in local state so
    // it doesn't survive a reload for real (Onboarding) requests.
    setRequest({ ...request, welcomeEmailSentAt: sentAt });
    logWorkflowEvent('WELCOME_EMAIL_SENT', `Welcome email sent to ${request.email}`, { status: 'SUCCESS' });
    setShowWelcomeEmailModal(true);
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!request) {
    if (loadError) {
      return (
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-xl border border-[#f56565]/40 bg-[#f56565]/10 p-6 text-sm text-[#f56565]">{loadError}</div>
        </div>
      );
    }
    return <NotFoundPage />;
  }

  const allPlatformsCompleted = request.platforms.every((p) => p.status === 'completed');
  const activeModalPlatform =
    platformModal && request.platforms.find((p) => p.name === platformModal.platformName);
  const sla = calculateRequestSLA(request);
  const slaBannerClass = !sla
    ? ''
    : sla.isCompleted
      ? (sla.isViolated ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-green-500 bg-green-500/10 text-green-300')
      : (sla.atRisk ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-blue-400 bg-blue-400/10 text-blue-300');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(fromManageUsers ? '/manage-users' : '/requests')}
          className="text-[#d4a574] hover:text-[#c4956a]"
        >
          ← Back to {fromManageUsers ? 'Manage Users' : 'Requests'}
        </button>
        <span className="flex items-center gap-2">
          <span className="rounded bg-[#0d1b30] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d4a574]">
            {isTransition
              ? 'Transition Request'
              : isReactivation
                ? 'Reactivation Request'
                : isOffboarding
                  ? 'Offboarding Request'
                  : 'Onboarding Request'}
          </span>
          {!isAdmin && (
            <span className="rounded bg-[#d4a574]/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d4a574]">
              View Only
            </span>
          )}
        </span>
      </div>

      {sla && (
        <div className={`mb-6 rounded-lg border px-4 py-2 text-sm font-semibold ${slaBannerClass}`}>
          {getSLAStatusText(sla)}
          <span className="ml-2 font-normal text-gray-400">
            (SLA: {sla.slaLimitMs / 3600000}h{' '}
            {isTransition ? 'transition' : isReactivation ? 'reactivation' : isOffboarding ? 'offboarding' : 'onboarding'})
          </span>
        </div>
      )}

      <div className={`bg-[#1a365d] border rounded-lg p-6 mb-6 ${fromManageUsers ? 'border-[#4299e1]' : 'border-[#d4a574]/30'}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">{request.employeeName}</h1>
          <span className={`px-3 py-1 rounded font-semibold ${
            request.status === 'completed' ? 'bg-green-900 text-green-300' :
            request.status === 'in-progress' ? 'bg-blue-900 text-blue-300' :
            'bg-yellow-900 text-yellow-300'
          }`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>

        {isTransition ? (
          <div className="text-gray-300">
            <p className="text-sm text-gray-400">Email</p>
            <p className="font-semibold">{request.email}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-semibold">{request.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Work Email</p>
              <p className={`font-semibold ${getRequestWorkEmail(request) ? 'text-[#48bb78]' : ''}`}>
                {getRequestWorkEmail(request) || 'Not created yet'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Department</p>
              <p className="font-semibold">{request.departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Manager</p>
              <p className="font-semibold">{request.managerName}</p>
            </div>
            {isOffboarding ? (
              <>
                <div>
                  <p className="text-sm text-gray-400">Timing</p>
                  <p className="font-semibold capitalize">{request.timing || 'immediate'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Offboarding Reason</p>
                  <p className="font-semibold">{request.offboardingReason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Final Day</p>
                  <p className="font-semibold">{request.finalDay || 'N/A'}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-400">Job Title</p>
                <p className="font-semibold">{request.jobTitleLabel || 'N/A'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isTransition && (
        <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🔄 Transition Details</h2>
          <div className="space-y-2">
            {[
              ['Department', request.oldDepartment, request.newDepartment],
              ['Manager', request.oldManager, request.newManager],
              ['Floor', request.oldFloor, request.newFloor],
              ['Role / Group', request.oldRole, request.newRole],
              ['Job Title', request.oldJobTitle, request.newJobTitle],
              ['Type', request.oldType, request.newType],
            ].map(([label, before, after]) => (
              <div key={label} className="flex flex-wrap items-center gap-2 rounded bg-[#0d1b30] p-3 text-sm">
                <span className="w-28 shrink-0 text-gray-400">{label}</span>
                <span className="text-blue-300">{before || 'N/A'}</span>
                <span className="text-[#48bb78]">→</span>
                <span className="font-semibold text-[#48bb78]">{after || 'No change'}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            ℹ️ Platform access is not updated automatically for transitions - IT will need to update platform access
            manually after this request is completed.
          </p>
        </div>
      )}

      <div className="bg-[#1a365d] border-l-4 border-l-[#d4a574] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">📝 Submission Information</h2>
        <div className="bg-[#0d1b30] rounded p-4 space-y-1 text-gray-300 text-sm">
          <p>
            <span className="text-gray-400">Submitted By: </span>
            <span className="font-semibold text-white">
              {request.submittedBy || 'Unknown'}
              {request.submittedByRole ? ` (${request.submittedByRole})` : ''}
            </span>
          </p>
          <p>
            <span className="text-gray-400">Submitted At: </span>
            <span className="font-semibold text-white">{formatDateTime(request.createdAt)}</span>
          </p>
        </div>
      </div>

      {request.status === 'completed' && (
        <div className="bg-[#1a365d] border-l-4 border-l-[#48bb78] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">✅ Approval Information</h2>
          <div className="bg-[#0d1b30] rounded p-4 space-y-1 text-gray-300 text-sm">
            <p>
              <span className="text-gray-400">Approved By: </span>
              <span className="font-semibold text-white">
                {request.approvedBy || 'Unknown'}
                {request.approvedByRole ? ` (${request.approvedByRole})` : ''}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Approved At: </span>
              <span className="font-semibold text-white">{formatDateTime(request.completedAt)}</span>
            </p>
          </div>
        </div>
      )}

      {request.type === 'Onboarding' && request.status === 'completed' && (
        <div className="bg-[#1a365d] border-l-4 border-l-blue-400 border border-[#d4a574]/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">📧 Send Welcome Email</h2>
          <p className="mb-4 text-sm text-gray-300">
            Send a welcome email to <strong>{request.email}</strong> with their work email and setup instructions.
          </p>
          <button
            type="button"
            onClick={handleSendWelcomeEmail}
            disabled={!isAdmin}
            title={!isAdmin ? 'Only IT admins can send the welcome email' : ''}
            className="rounded-lg border border-blue-400 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-300 transition-colors hover:bg-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-400/10"
          >
            📧 Send Welcome Email
          </button>
          {request.welcomeEmailSentAt && (
            <p className="mt-2 text-xs text-gray-400">
              ✓ Last sent {formatDateTime(request.welcomeEmailSentAt)}
            </p>
          )}
        </div>
      )}

      <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">
          {isTransition
            ? 'Platforms to Update'
            : isOffboarding
              ? 'Platforms'
              : isReactivation
                ? 'Platform Re-provisioning'
                : 'Platform Provisioning'}
        </h2>
        {!isAdmin && (
          <div className="mb-4 rounded border-l-4 border-l-[#d4a574] bg-[#d4a574]/10 p-3 text-sm text-[#d4a574]">
            🔒 Platform management restricted to IT administrators
          </div>
        )}
        <div className="space-y-2">
          {request.platforms?.map((p, i) => {
            const isPending = request.status === 'pending' && p.status !== 'completed';
            return (
              <div key={i} className="bg-[#0d1b30] p-3 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-white">{p.name}</span>
                  <span className={`font-semibold ${
                    p.status === 'completed' ? 'text-green-400' :
                    p.status === 'failed' ? 'text-red-400' :
                    p.status === 'in-progress' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {p.status === 'completed' ? '✅ ' : p.status === 'failed' ? '⚠️ ' : ''}
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>

                {p.status === 'completed' && (
                  <p className="mt-1 text-xs text-gray-400">
                    {p.completedBy ? `Provisioned by ${p.completedBy}` : 'Provisioned automatically'} · {formatDateTime(p.completedAt)}
                  </p>
                )}
                {p.status === 'completed' && p.name === 'Azure AD' && p.workEmail && (
                  <p className="mt-2 inline-block rounded border border-[#48bb78]/40 bg-[#48bb78]/10 px-3 py-1.5 text-xs font-semibold text-[#48bb78]">
                    📧 Work Email: <strong>{p.workEmail}</strong>
                    <span className="ml-1 font-normal text-[#48bb78]/70">(created {formatDateTime(p.workEmailCreatedAt)})</span>
                  </p>
                )}
                {p.status === 'failed' && p.jiraTicketId && (
                  <p className="mt-1 text-xs text-purple-300">🎫 Jira ticket {p.jiraTicketId} created</p>
                )}

                {(isOffboarding || isTransition) && isPending && (
                  <button
                    type="button"
                    onClick={() => handleOffboardPlatformClick(p.name)}
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Only IT admins can manage platforms' : ''}
                    className="mt-2 w-full rounded-lg border border-[#d4a574]/40 bg-transparent px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    {isTransition ? 'Click to Confirm Access Update' : 'Click to Offboard Manually'}
                  </button>
                )}

                {!isOffboarding && !isTransition && isPending && automatingPlatform === p.name && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-300">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                    Triggering automation...
                  </div>
                )}
                {!isOffboarding && !isTransition && isPending && automatingPlatform !== p.name && (
                  <button
                    type="button"
                    onClick={() => handleOnboardPlatformClick(p)}
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Only IT admins can manage platforms' : ''}
                    className={`mt-2 w-full rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
                      p.status === 'failed'
                        ? 'border-red-400/50 text-red-300 hover:bg-red-400/10'
                        : 'border-[#d4a574]/40 text-[#d4a574] hover:bg-[#d4a574]/10'
                    }`}
                  >
                    {p.status === 'failed' ? 'Automation Failed - Retry or Manual' : 'Click to Trigger Automation'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Timeline</h2>
        <div className="space-y-2">
          {request.timeline?.map((event, i) => (
            <div key={i} className="text-gray-300 text-sm">
              <p className="font-semibold text-white">{event.timestamp}</p>
              <p>{event.action}</p>
            </div>
          ))}
        </div>
      </div>

      {relatedRequests.length > 0 && (
        <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Other Requests for This Employee</h2>
          <div className="space-y-2">
            {relatedRequests.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/requests/${r.id}`, { state: { fromManageUsers } })}
                className="flex w-full items-center justify-between bg-[#0d1b30] p-3 rounded text-left hover:bg-[#0d1b30]/70 transition-colors"
              >
                <span className="text-white">{r.type} &middot; {r.date}</span>
                <span className="text-gray-400 text-sm">{r.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {request.status === 'pending' && isAdmin && (
        <>
          <button
            onClick={handleCompleteRequest}
            disabled={!allPlatformsCompleted}
            title={!allPlatformsCompleted ? 'Complete all platform provisioning first' : ''}
            className="w-full bg-[#d4a574] text-[#1a365d] font-bold py-3 rounded-lg hover:bg-[#c4956a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✓{' '}
            {isTransition
              ? 'Complete Transition Request'
              : isReactivation
                ? 'Complete Reactivation Request'
                : isOffboarding
                  ? 'Complete Request'
                  : 'Complete Onboarding Request'}
          </button>
          <p className="mt-2 text-center text-sm text-gray-400">
            {allPlatformsCompleted
              ? isTransition
                ? 'All platform access updated. Ready to complete the transition.'
                : isReactivation
                  ? 'All platforms re-provisioned. Ready to complete the reactivation.'
                  : `All platforms ${isOffboarding ? 'offboarded' : 'provisioned'}. Ready to complete the request.`
              : `Complete all ${request.platforms.filter((p) => p.status !== 'completed').length} remaining platform(s) before completing the request.`}
          </p>
        </>
      )}

      {request.status === 'completed' && (
        <div className="bg-green-900 text-green-300 p-4 rounded-lg">
          {isTransition
            ? '✅ Transition completed. Employee details have been updated.'
            : isReactivation
              ? '✅ All platforms re-provisioned. User is now active again.'
              : isOffboarding
                ? '✅ All platforms disabled. User is now inactive.'
                : '✅ All platforms provisioned. User is now active.'}
        </div>
      )}

      {/* Azure AD work-email confirmation (duplicate name or reactivation) */}
      {azureEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setAzureEmailModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-yellow-500/40 bg-[#1a365d] p-6 shadow-2xl"
          >
            {request.hasDuplicateName && (
              <span className="mb-3 inline-block rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-400">
                ⚠️ Duplicate Name Detected
              </span>
            )}
            <h2 className="mb-2 text-lg font-bold text-white">{request.employeeName}</h2>
            <p className="mb-4 text-sm text-gray-300">
              {request.hasDuplicateName
                ? 'An active employee with this name already exists. Confirm or edit the work email before creating the Azure account.'
                : 'Confirm the work email to use for this reactivation - reuse their previous mailbox, or enter a new one.'}
            </p>
            <label htmlFor="azure-email-input" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
              Work Email
            </label>
            <input
              id="azure-email-input"
              type="email"
              value={azureEmailInput}
              onChange={(e) => setAzureEmailInput(e.target.value)}
              placeholder="email@thecreditpros.com"
              className="w-full rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-3 py-2 text-sm text-white focus:border-[#d4a574] focus:outline-none"
            />
            <p className="mt-2 text-xs text-gray-400">
              Demo: saved directly to the user record on confirm. Production: sent to the Azure AD API to
              create/reactivate the account.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAzureEmailModal(false)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAzureEmail}
                disabled={!azureEmailInput.trim()}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm &amp; Create Azure Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offboarding: manual confirm modal */}
      {offboardPlatformToConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOffboardPlatformToConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">
              {isTransition ? 'Confirm Platform Access Update' : 'Confirm Manual Offboarding'}
            </h2>
            <p className="mb-6 text-sm text-gray-300">
              {isTransition ? (
                <>
                  Confirm that <strong>{offboardPlatformToConfirm}</strong> access has been updated for{' '}
                  <strong>{request.employeeName}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to manually offboard <strong>{request.employeeName}</strong> from{' '}
                  <strong>{offboardPlatformToConfirm}</strong>?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOffboardPlatformToConfirm(null)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmManualOffboarding}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding: trigger-automation confirm modal */}
      {platformModal?.mode === 'trigger' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setPlatformModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">Trigger Platform Onboarding</h2>
            <p className="mb-6 text-sm text-gray-300">
              Trigger automated onboarding for <strong>{platformModal.platformName}</strong>?
              {platformModal.platformName === 'Azure AD' && (
                <span className="mt-2 block text-xs text-gray-400">
                  This will create a work email in the form firstname@thecreditpros.com.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlatformModal(null)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTriggerAutomation}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding: automation-failure error modal (Jira / manual fallback) */}
      {platformModal?.mode === 'error' && activeModalPlatform && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setPlatformModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-red-400/40 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">⚠️ Platform Onboarding Failed</h2>
            <p className="mb-2 text-sm text-gray-300">
              Failed to provision <strong>{platformModal.platformName}</strong>.
            </p>
            <p className="mb-4 rounded-lg border-l-2 border-red-400 bg-red-400/10 p-3 text-sm text-red-300">
              {activeModalPlatform.error}
            </p>

            {activeModalPlatform.jiraTicketId ? (
              <p className="mb-4 text-sm text-purple-300">
                🎫 Jira ticket {activeModalPlatform.jiraTicketId} created for the dev team.
              </p>
            ) : (
              <p className="mb-4 text-sm text-gray-400">
                You can send this error to the dev team, or onboard this platform manually.
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              {!activeModalPlatform.jiraTicketId && (
                <button
                  type="button"
                  onClick={handleSendErrorToDev}
                  className="rounded-lg border border-purple-400 px-4 py-2 text-sm font-bold text-purple-300 transition-colors hover:bg-purple-400/10"
                >
                  Send error to Dev
                </button>
              )}
              <button
                type="button"
                onClick={() => setPlatformModal({ platformName: platformModal.platformName, mode: 'manual' })}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Manually Onboard
              </button>
              <button
                type="button"
                onClick={() => setPlatformModal(null)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding: manual-onboard confirm modal */}
      {platformModal?.mode === 'manual' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setPlatformModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-bold text-white">Confirm Manual Onboarding</h2>
            <p className="mb-6 text-sm text-gray-300">
              Confirm manual onboarding for <strong>{platformModal.platformName}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlatformModal(null)}
                className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmManualOnboard}
                className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Welcome email confirmation modal */}
      {showWelcomeEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowWelcomeEmailModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 text-center shadow-2xl"
          >
            <div className="mb-2 text-4xl" aria-hidden="true">📧</div>
            <h2 className="mb-3 text-lg font-bold text-white">Welcome Email Sent</h2>
            <p className="mb-4 text-sm text-gray-300">
              A welcome email has been sent to <strong>{request.email}</strong>

            </p>
            <button
              type="button"
              onClick={() => setShowWelcomeEmailModal(false)}
              className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestDetails;
