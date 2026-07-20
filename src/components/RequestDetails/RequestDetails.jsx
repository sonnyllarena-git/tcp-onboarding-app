import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getRequestByIdMerged,
  getAllRequests,
  saveRequest,
  saveUser,
  buildActivatedUser,
  buildDeactivatedUser,
  withTimelineEvent,
  calculateRequestSLA,
  getSLAStatusText,
  generateWorkEmail,
} from '../../mockData';
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
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Offboarding: a single confirm modal per not-yet-completed platform.
  const [offboardPlatformToConfirm, setOffboardPlatformToConfirm] = useState(null);

  // Onboarding: automation trigger -> spinner -> success/failure -> error
  // options (Jira/manual) -> manual confirm. `platformModal.mode` is one
  // of 'trigger' | 'error' | 'manual'.
  const [platformModal, setPlatformModal] = useState(null);
  const [automatingPlatform, setAutomatingPlatform] = useState(null);

  const fromManageUsers = Boolean(location.state?.fromManageUsers);

  useEffect(() => {
    const req = getRequestByIdMerged(Number(id));
    if (req) {
      setRequest(req);
    }
    setLoading(false);
  }, [id]);

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

  // ---- Offboarding: manual-only per platform ----

  const handleOffboardPlatformClick = (platformName) => {
    if (!isAdmin || !request || request.status !== 'pending') return;
    const platform = request.platforms.find((p) => p.name === platformName);
    if (!platform || platform.status === 'completed') return;
    setOffboardPlatformToConfirm(platformName);
  };

  const confirmManualOffboarding = () => {
    if (!request || !offboardPlatformToConfirm) return;
    const platformName = offboardPlatformToConfirm;
    let updated = {
      ...request,
      platforms: request.platforms.map((p) =>
        p.name === platformName
          ? { ...p, status: 'completed', completedBy: loggedInUser?.name || 'Unknown', completedAt: new Date().toISOString(), error: null }
          : p
      ),
    };
    updated = withTimelineEvent(updated, `Platform manually offboarded: ${platformName}`, 'completed');
    saveRequest(updated);
    setRequest(updated);
    logWorkflowEvent('PLATFORM_OFFBOARDED_MANUAL', `${platformName} manually offboarded for ${updated.employeeName}`, { platformName });
    setOffboardPlatformToConfirm(null);
  };

  // ---- Onboarding: automation trigger, then manual fallback on failure ----

  const handleOnboardPlatformClick = (platform) => {
    if (!isAdmin || !request || request.status !== 'pending' || automatingPlatform) return;
    if (platform.status === 'completed') return;
    if (platform.status === 'failed') {
      setPlatformModal({ platformName: platform.name, mode: 'error' });
    } else {
      setPlatformModal({ platformName: platform.name, mode: 'trigger' });
    }
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
    const workEmail = isAzureAd ? generateWorkEmail(request.employeeName) : null;
    let updated;

    if (failed) {
      updated = {
        ...request,
        platforms: request.platforms.map((p) =>
          p.name === platformName ? { ...p, status: 'failed', error: errorMessage } : p
        ),
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
    setAutomatingPlatform(null);

    if (failed) {
      logWorkflowEvent('PLATFORM_PROVISION_FAILED', `${platformName} automation failed for ${updated.employeeName}`, {
        platformName,
        errorMessage,
        status: 'FAILED',
      });
      setPlatformModal({ platformName, mode: 'error' });
    } else if (isAzureAd) {
      logWorkflowEvent('AZURE_ACCOUNT_CREATED', `Azure account created - ${workEmail}`, { platformName, workEmail });
    } else {
      logWorkflowEvent('PLATFORM_PROVISIONED_AUTOMATED', `${platformName} provisioned automatically for ${updated.employeeName}`, { platformName });
    }
  };

  const handleSendErrorToDev = () => {
    if (!platformModal || !request) return;
    const platformName = platformModal.platformName;
    const ticketId = `TCP-${Math.floor(Math.random() * 10000)}`;
    const updated = {
      ...request,
      platforms: request.platforms.map((p) => (p.name === platformName ? { ...p, jiraTicketId: ticketId } : p)),
    };
    saveRequest(updated);
    setRequest(updated);
    logWorkflowEvent('JIRA_TICKET_CREATED', `Jira ticket ${ticketId} created for ${platformName} provisioning failure (${updated.employeeName})`, {
      platformName,
      jiraTicketId: ticketId,
    });
    setPlatformModal({ platformName, mode: 'error' });
  };

  const confirmManualOnboard = () => {
    if (!platformModal || !request) return;
    const platformName = platformModal.platformName;
    const isAzureAd = platformName === 'Azure AD';
    const workEmail = isAzureAd ? generateWorkEmail(request.employeeName) : null;
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
  };

  // ---- Finalize (either type) once every platform is completed ----

  const handleCompleteRequest = () => {
    if (!isAdmin || !request || !request.platforms.every((p) => p.status === 'completed')) return;
    const isOffboarding = request.type === 'Offboarding';

    let updated = { ...request, status: 'completed' };
    updated.approvedBy = loggedInUser?.name || 'Unknown';
    updated.approvedByRole = loggedInUser?.role || 'Unknown';
    updated.completedAt = new Date().toISOString();

    if (isOffboarding) {
      const deactivated = buildDeactivatedUser(updated);
      if (deactivated) saveUser(deactivated);
      updated = withTimelineEvent(updated, 'User Offboarded', 'completed');
      logWorkflowEvent('OFFBOARDING_APPROVED', `${updated.employeeName} offboarding completed`);
    } else {
      saveUser(buildActivatedUser(updated));
      updated = withTimelineEvent(updated, 'User Activated', 'completed');
      logWorkflowEvent('ONBOARDING_APPROVED', `${updated.employeeName} onboarding completed`);
    }

    saveRequest(updated);
    setRequest(updated);
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!request) return <NotFoundPage />;

  const isOffboarding = request.type === 'Offboarding';
  const relatedRequests = getAllRequests().filter(
    (r) => r.id !== request.id && r.email.toLowerCase() === request.email.toLowerCase()
  );
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
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(fromManageUsers ? '/manage-users' : '/requests')}
          className="text-[#d4a574] hover:text-[#c4956a]"
        >
          ← Back to {fromManageUsers ? 'Manage Users' : 'Requests'}
        </button>
        <span className="flex items-center gap-2">
          <span className="rounded bg-[#0d1b30] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d4a574]">
            {isOffboarding ? 'Offboarding Request' : 'Onboarding Request'}
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
            (SLA: {sla.slaLimitMs / 3600000}h {isOffboarding ? 'offboarding' : 'onboarding'})
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

        <div className="grid grid-cols-2 gap-4 text-gray-300">
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="font-semibold">{request.email}</p>
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
              <p className="font-semibold">{request.jobTitleLabel}</p>
            </div>
          )}
        </div>
      </div>

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

      <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">{isOffboarding ? 'Platforms' : 'Platform Provisioning'}</h2>
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

                {isOffboarding && isPending && (
                  <button
                    type="button"
                    onClick={() => handleOffboardPlatformClick(p.name)}
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Only IT admins can manage platforms' : ''}
                    className="mt-2 w-full rounded-lg border border-[#d4a574]/40 bg-transparent px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Click to Offboard Manually
                  </button>
                )}

                {!isOffboarding && isPending && automatingPlatform === p.name && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-300">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                    Triggering automation...
                  </div>
                )}
                {!isOffboarding && isPending && automatingPlatform !== p.name && (
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
            ✓ {isOffboarding ? 'Complete Request' : 'Complete Onboarding Request'}
          </button>
          <p className="mt-2 text-center text-sm text-gray-400">
            {allPlatformsCompleted
              ? `All platforms ${isOffboarding ? 'offboarded' : 'provisioned'}. Ready to complete the request.`
              : `Complete all ${request.platforms.filter((p) => p.status !== 'completed').length} remaining platform(s) before completing the request.`}
          </p>
        </>
      )}

      {request.status === 'completed' && (
        <div className="bg-green-900 text-green-300 p-4 rounded-lg">
          {isOffboarding ? '✅ All platforms disabled. User is now inactive.' : '✅ All platforms provisioned. User is now active.'}
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
            <h2 className="mb-3 text-lg font-bold text-white">Confirm Manual Offboarding</h2>
            <p className="mb-6 text-sm text-gray-300">
              Are you sure you want to manually offboard <strong>{request.employeeName}</strong> from{' '}
              <strong>{offboardPlatformToConfirm}</strong>?
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
    </div>
  );
}

export default RequestDetails;
