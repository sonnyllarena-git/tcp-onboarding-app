import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailSection from './DetailSection';
import PlatformStatus from './PlatformStatus';
import Timeline from './Timeline';
import { getMockRequestById } from '../../mockData';

const STATUS_BADGE_STYLES = {
  completed: 'bg-[#48bb78] text-[#1a365d]',
  'in-progress': 'bg-[#f6ad55] text-[#1a365d]',
  pending: 'bg-[#4299e1] text-white',
};

const STATUS_LABELS = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  pending: 'Pending',
};

/**
 * Looks up a mock request record by id.
 * TODO: Replace with a real API call once the backend exists.
 *
 * @param {string|number} id - Request id, typically read from the URL
 * @returns {Promise<Object|null>} The matching request, or null if not found
 */
export function getRequestById(id) {
  return Promise.resolve(getMockRequestById(id));
}

/**
 * Formats a date-like value into a short "Mon D, YYYY" string.
 * Falls back to the original value if it can't be parsed as a date.
 *
 * @param {string|Date} date - Date value to format
 * @returns {string} Formatted date, or the original value if unparseable
 */
export function formatDate(date) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * RequestDetails Component
 *
 * Displays full details of a specific onboarding/offboarding request.
 * Shows employee info, request status, platform sync status, and timeline.
 *
 * @component
 * @returns {React.ReactElement} RequestDetails component
 */
function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    getRequestById(id).then((data) => {
      if (!isMounted) {
        return;
      }
      if (data) {
        setRequestData(data);
      } else {
        setError(`No request found with id "${id}".`);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    navigate('/requests');
  };

  const handleApprove = () => {
    // TODO: Call the real approve-request API once it exists.
    console.log(`Approve request: ${id}`);
  };

  const handleReject = () => {
    // TODO: Call the real reject-request API once it exists.
    console.log(`Reject request: ${id}`);
  };

  const backButton = (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Back to requests"
      className="mb-4 rounded-lg border border-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#d4a574] transition-colors duration-200 hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
    >
      &larr; Back to Requests
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 sm:px-6 lg:px-8">
        {backButton}
        <div role="status" className="flex items-center justify-center gap-3 py-24">
          <svg
            className="h-8 w-8 animate-spin text-[#d4a574]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-gray-300">Loading request details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 sm:px-6 lg:px-8">
        {backButton}
        <div role="alert" className="rounded-xl border border-[#f56565]/40 bg-[#f56565]/10 p-6">
          <p className="text-sm text-[#f56565]">{error}</p>
        </div>
      </div>
    );
  }

  const detailData = {
    Email: requestData.email,
    'Request Type': requestData.requestType,
    'Start Date': formatDate(requestData.startDate),
    Department: requestData.department,
    Manager: requestData.manager,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 sm:px-6 lg:px-8">
      {backButton}

      <div className="rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-lg">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{requestData.employeeName}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              STATUS_BADGE_STYLES[requestData.status] || STATUS_BADGE_STYLES.pending
            }`}
          >
            {STATUS_LABELS[requestData.status] || requestData.status}
          </span>
        </header>

        <div className="space-y-6">
          <DetailSection title="Request Information" data={detailData} />
          <PlatformStatus platforms={requestData.platforms} />
          <Timeline events={requestData.timeline} />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleApprove}
              className="rounded-lg bg-[#d4a574] px-5 py-2 text-sm font-bold text-[#1a365d] transition-colors duration-200 hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="rounded-lg border border-[#f56565] px-5 py-2 text-sm font-bold text-[#f56565] transition-colors duration-200 hover:bg-[#f56565] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f56565]"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestDetails;
