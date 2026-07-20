import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestByIdMerged, saveRequest, getAllUsers, saveUser, buildActivatedUser, withTimelineEvent } from '../../mockData';
import { useAuth } from '../../hooks/useAuth';
import { recordAuditLog } from '../AuditLogs';
import { NotFoundPage } from '../ErrorState';

function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth();
  const [request, setRequest] = useState(null);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);

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

    let updated = withTimelineEvent(request, 'Request Approved', 'completed');
    updated.status = 'in-progress';
    saveRequest(updated);
    setRequest(updated);

    // Simulate platform provisioning
    for (const platform of updated.platforms) {
      platform.status = 'in-progress';
      saveRequest(updated);
      await new Promise(r => setTimeout(r, 1500));

      platform.status = 'completed';
      platform.completedBy = user?.name;
      platform.completedAt = new Date().toLocaleString();
      updated = withTimelineEvent(updated, `Platform Provisioned: ${platform.name}`, 'completed');
      saveRequest(updated);
      setRequest({ ...updated });
    }

    // Activate user
    updated.status = 'completed';
    const activated = buildActivatedUser(updated);
    saveUser(activated);
    updated = withTimelineEvent(updated, 'User Activated', 'completed');
    saveRequest(updated);
    setRequest(updated);

    recordAuditLog({
      userEmail: user?.email,
      userName: user?.name,
      department: user?.department,
      action: 'ONBOARDING_APPROVED',
      details: `${updated.employeeName} onboarding completed`,
    });

    setApproving(false);
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!request) return <NotFoundPage />;

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate('/requests')} className="text-[#d4a574] hover:text-[#c4956a] mb-6">
        ← Back to Requests
      </button>

      <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-6 mb-6">
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
          <div>
            <p className="text-sm text-gray-400">Job Title</p>
            <p className="font-semibold">{request.jobTitleLabel}</p>
          </div>
        </div>
      </div>

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

      {request.status === 'pending' && (
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full bg-[#d4a574] text-[#1a365d] font-bold py-3 rounded-lg hover:bg-[#c4956a] disabled:opacity-50 transition-colors"
        >
          {approving ? 'Approving & Provisioning...' : 'Approve Request'}
        </button>
      )}

      {request.status === 'in-progress' && (
        <div className="bg-blue-900 text-blue-300 p-4 rounded-lg">
          ⏳ Platform provisioning in progress...
        </div>
      )}

      {request.status === 'completed' && (
        <div className="bg-green-900 text-green-300 p-4 rounded-lg">
          ✅ All platforms provisioned. User is now active.
        </div>
      )}
    </div>
  );
}

export default RequestDetails;
