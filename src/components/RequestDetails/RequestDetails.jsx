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

  const fromManageUsers = Boolean(location.state?.fromManageUsers);

  useEffect(() => {
    const req = getRequestByIdMerged(Number(id));
    if (req) {
      setRequest(req);
    }
    setLoading(false);
  }, [id]);

  const handleApprove = async () => {
    if (!request) return;
    setApproving(true);

    const isOffboarding = request.type === 'Offboarding';
    const approvedAction = isOffboarding ? 'Offboarding Approved' : 'Request Approved';

    let updated = withTimelineEvent(request, approvedAction, 'completed');
    updated.status = 'in-progress';
    saveRequest(updated);
    setRequest(updated);

    // Simulate platform provisioning (same mechanics for onboarding and
    // offboarding - only what happens to the user afterward differs).
    for (const platform of updated.platforms) {
      platform.status = 'in-progress';
      saveRequest(updated);
      await new Promise(r => setTimeout(r, 1500));

      platform.status = 'completed';
      platform.completedBy = loggedInUser?.name;
      platform.completedAt = new Date().toLocaleString();
      updated = withTimelineEvent(updated, `Platform ${isOffboarding ? 'Disabled' : 'Provisioned'}: ${platform.name}`, 'completed');
      saveRequest(updated);
      setRequest({ ...updated });
    }

    updated.status = 'completed';
    updated.approvedBy = loggedInUser?.name || 'Unknown';
    updated.approvedByRole = loggedInUser?.role || 'Unknown';
    updated.completedAt = new Date().toISOString();

    if (isOffboarding) {
      // The employee stays active while the request is pending/in-progress
      // (see OffboardingForm's handleSubmit) - this is what actually flips
      // them to inactive, once every platform has finished being disabled.
      const deactivated = buildDeactivatedUser(updated);
      if (deactivated) {
        saveUser(deactivated);
      }
      updated = withTimelineEvent(updated, 'User Offboarded', 'completed');
      recordAuditLog({
        userEmail: loggedInUser?.email,
        userName: loggedInUser?.name,
        department: loggedInUser?.department,
        action: 'OFFBOARDING_APPROVED',
        details: `${updated.employeeName} offboarding completed`,
      });
    } else {
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
    }

    saveRequest(updated);
    setRequest(updated);
    setApproving(false);
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!request) return <NotFoundPage />;

  const isOffboarding = request.type === 'Offboarding';
  const relatedRequests = getAllRequests().filter(
    (r) => r.id !== request.id && r.email.toLowerCase() === request.email.toLowerCase()
  );

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
          {request.platforms?.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-[#0d1b30] p-3 rounded">
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
          ))}
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

      {request.status === 'pending' && (
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full bg-[#d4a574] text-[#1a365d] font-bold py-3 rounded-lg hover:bg-[#c4956a] disabled:opacity-50 transition-colors"
        >
          {approving ? (isOffboarding ? 'Approving & Disabling Access...' : 'Approving & Provisioning...') : 'Approve Request'}
        </button>
      )}

      {request.status === 'in-progress' && (
        <div className="bg-blue-900 text-blue-300 p-4 rounded-lg">
          ⏳ {isOffboarding ? 'Disabling platform access...' : 'Platform provisioning in progress...'}
        </div>
      )}

      {request.status === 'completed' && (
        <div className="bg-green-900 text-green-300 p-4 rounded-lg">
          {isOffboarding ? '✅ All platforms disabled. User is now inactive.' : '✅ All platforms provisioned. User is now active.'}
        </div>
      )}
    </div>
  );
}

export default RequestDetails;
