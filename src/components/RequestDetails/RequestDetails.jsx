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
} from '../../mockData';
import { useAuth } from '../../hooks/useAuth';
import { recordAuditLog } from '../AuditLogs';
import { NotFoundPage } from '../ErrorState';

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
  const [request, setRequest] = useState(null);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformToConfirm, setPlatformToConfirm] = useState(null);

  const fromManageUsers = Boolean(location.state?.fromManageUsers);

  useEffect(() => {
    const req = getRequestByIdMerged(Number(id));
    if (req) {
      setRequest(req);
    }
    setLoading(false);
  }, [id]);

  // Onboarding only: clicking Approve auto-provisions every platform in
  // sequence, then activates the user. Offboarding uses a different,
  // manual-per-platform flow below (handlePlatformClick/handleCompleteOffboarding).
  const handleApprove = async () => {
    if (!request) return;
    setApproving(true);

    let updated = withTimelineEvent(request, 'Request Approved', 'completed');
    updated.status = 'in-progress';
    saveRequest(updated);
    setRequest(updated);

    for (const platform of updated.platforms) {
      platform.status = 'in-progress';
      saveRequest(updated);
      await new Promise(r => setTimeout(r, 1500));

      platform.status = 'completed';
      platform.completedBy = loggedInUser?.name;
      platform.completedAt = new Date().toLocaleString();
      updated = withTimelineEvent(updated, `Platform Provisioned: ${platform.name}`, 'completed');
      saveRequest(updated);
      setRequest({ ...updated });
    }

    updated.status = 'completed';
    updated.approvedBy = loggedInUser?.name || 'Unknown';
    updated.approvedByRole = loggedInUser?.role || 'Unknown';
    updated.completedAt = new Date().toISOString();

    const activated = buildActivatedUser(updated);
    saveUser(activated);
    updated = withTimelineEvent(updated, 'User Activated', 'completed');
    recordAuditLog({
      userEmail: loggedInUser?.email,
      userName: loggedInUser?.name,
      department: loggedInUser?.department,
      action: 'ONBOARDING_APPROVED',
      details: `${updated.employeeName} onboarding completed`,
    });

    saveRequest(updated);
    setRequest(updated);
    setApproving(false);
  };

  /** Opens the confirmation modal for a not-yet-completed offboarding platform. */
  const handlePlatformClick = (platformName) => {
    if (!request || request.status !== 'pending') {
      return;
    }
    const platform = request.platforms.find((p) => p.name === platformName);
    if (!platform || platform.status === 'completed') {
      return;
    }
    setPlatformToConfirm(platformName);
  };

  /** Marks one platform as manually offboarded by the current admin. */
  const confirmManualOffboarding = () => {
    if (!request || !platformToConfirm) {
      return;
    }
    let updated = {
      ...request,
      platforms: request.platforms.map((p) =>
        p.name === platformToConfirm
          ? { ...p, status: 'completed', completedBy: loggedInUser?.name || 'Unknown', completedAt: new Date().toLocaleString(), error: null }
          : p
      ),
    };
    updated = withTimelineEvent(updated, `Platform manually offboarded: ${platformToConfirm}`, 'completed');
    saveRequest(updated);
    setRequest(updated);

    recordAuditLog({
      userEmail: loggedInUser?.email,
      userName: loggedInUser?.name,
      department: loggedInUser?.department,
      action: 'PLATFORM_OFFBOARDED_MANUAL',
      details: `${platformToConfirm} manually offboarded for ${updated.employeeName}`,
    });

    setPlatformToConfirm(null);
  };

  /** Finalizes an offboarding request once every platform is manually completed. */
  const handleCompleteOffboarding = () => {
    if (!request || !request.platforms.every((p) => p.status === 'completed')) {
      return;
    }

    let updated = { ...request, status: 'completed' };
    updated.approvedBy = loggedInUser?.name || 'Unknown';
    updated.approvedByRole = loggedInUser?.role || 'Unknown';
    updated.completedAt = new Date().toISOString();

    const deactivated = buildDeactivatedUser(updated);
    if (deactivated) {
      saveUser(deactivated);
    }
    updated = withTimelineEvent(updated, 'User Offboarded', 'completed');
    saveRequest(updated);
    setRequest(updated);

    recordAuditLog({
      userEmail: loggedInUser?.email,
      userName: loggedInUser?.name,
      department: loggedInUser?.department,
      action: 'OFFBOARDING_APPROVED',
      details: `${updated.employeeName} offboarding completed`,
    });
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!request) return <NotFoundPage />;

  const isOffboarding = request.type === 'Offboarding';
  const relatedRequests = getAllRequests().filter(
    (r) => r.id !== request.id && r.email.toLowerCase() === request.email.toLowerCase()
  );
  const allPlatformsCompleted = isOffboarding && request.platforms.every((p) => p.status === 'completed');

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(fromManageUsers ? '/manage-users' : '/requests')}
          className="text-[#d4a574] hover:text-[#c4956a]"
        >
          ← Back to {fromManageUsers ? 'Manage Users' : 'Requests'}
        </button>
        <span className="rounded bg-[#0d1b30] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d4a574]">
          {isOffboarding ? 'Offboarding Request' : 'Onboarding Request'}
        </span>
      </div>

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
        <h2 className="text-xl font-bold text-white mb-4">Platforms</h2>
        <div className="space-y-2">
          {request.platforms?.map((p, i) => {
            const isClickable = isOffboarding && request.status === 'pending' && p.status !== 'completed';
            return (
              <div key={i} className="bg-[#0d1b30] p-3 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-white">{p.name}</span>
                  <span className={`font-semibold ${
                    p.status === 'completed' ? 'text-green-400' :
                    p.status === 'in-progress' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {p.status === 'completed' ? '✅ ' : ''}
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>
                {isOffboarding && p.status === 'completed' && (
                  <p className="mt-1 text-xs text-gray-400">
                    Offboarded by {p.completedBy} · {p.completedAt}
                  </p>
                )}
                {isClickable && (
                  <button
                    type="button"
                    onClick={() => handlePlatformClick(p.name)}
                    className="mt-2 w-full rounded-lg border border-[#d4a574]/40 bg-transparent px-3 py-1.5 text-xs font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574]/10"
                  >
                    Click to Offboard Manually
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

      {!isOffboarding && request.status === 'pending' && (
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full bg-[#d4a574] text-[#1a365d] font-bold py-3 rounded-lg hover:bg-[#c4956a] disabled:opacity-50 transition-colors"
        >
          {approving ? 'Approving & Provisioning...' : 'Approve Request'}
        </button>
      )}

      {!isOffboarding && request.status === 'in-progress' && (
        <div className="bg-blue-900 text-blue-300 p-4 rounded-lg">
          ⏳ Platform provisioning in progress...
        </div>
      )}

      {isOffboarding && request.status === 'pending' && (
        <>
          <button
            onClick={handleCompleteOffboarding}
            disabled={!allPlatformsCompleted}
            title={!allPlatformsCompleted ? 'Complete all platform offboarding first' : ''}
            className="w-full bg-[#d4a574] text-[#1a365d] font-bold py-3 rounded-lg hover:bg-[#c4956a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✓ Complete Request
          </button>
          <p className="mt-2 text-center text-sm text-gray-400">
            {allPlatformsCompleted
              ? 'All platforms offboarded. Ready to complete request.'
              : `Complete all ${request.platforms.filter((p) => p.status !== 'completed').length} remaining platform(s) before completing the request.`}
          </p>
        </>
      )}

      {request.status === 'completed' && (
        <div className="bg-green-900 text-green-300 p-4 rounded-lg">
          {isOffboarding ? '✅ All platforms disabled. User is now inactive.' : '✅ All platforms provisioned. User is now active.'}
        </div>
      )}

      {platformToConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setPlatformToConfirm(null)}
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
              <strong>{platformToConfirm}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlatformToConfirm(null)}
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
    </div>
  );
}

export default RequestDetails;
