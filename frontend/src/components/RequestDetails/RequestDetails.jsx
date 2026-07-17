import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailSection from './DetailSection';
import PlatformStatus from './PlatformStatus';
import Timeline from './Timeline';

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

const ALL_PLATFORMS_COMPLETED = [
  { name: 'Azure', status: 'completed' },
  { name: 'Keeper', status: 'completed' },
  { name: 'Hodu', status: 'completed' },
  { name: 'Krisp', status: 'completed' },
  { name: 'Jira', status: 'completed' },
  { name: 'Zoho Desk', status: 'completed' },
  { name: 'Acuity', status: 'completed' },
];

const ALL_PLATFORMS_PENDING = ALL_PLATFORMS_COMPLETED.map((platform) => ({
  ...platform,
  status: 'pending',
}));

const MOCK_REQUEST_DETAILS = [
  {
    id: 1,
    employeeName: 'John Doe',
    email: 'john.doe@thecreditpros.com',
    requestType: 'Onboarding',
    status: 'completed',
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
    id: 2,
    employeeName: 'Jane Smith',
    email: 'jane.smith@thecreditpros.com',
    requestType: 'Offboarding',
    status: 'completed',
    startDate: 'Jul 14, 2026',
    department: 'Customer Support',
    manager: 'Priya Patel',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 14, 2026 09:00 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 14, 2026 09:30 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 14, 2026 04:00 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
  {
    id: 3,
    employeeName: 'Bob Johnson',
    email: 'bob.johnson@thecreditpros.com',
    requestType: 'Onboarding',
    status: 'in-progress',
    startDate: 'Jul 16, 2026',
    department: 'Sales',
    manager: 'David Kim',
    platforms: [
      { name: 'Azure', status: 'completed' },
      { name: 'Keeper', status: 'in-progress' },
      { name: 'Hodu', status: 'pending' },
      { name: 'Krisp', status: 'pending' },
      { name: 'Jira', status: 'completed' },
      { name: 'Zoho Desk', status: 'pending' },
      { name: 'Acuity', status: 'pending' },
    ],
    timeline: [
      { timestamp: 'Jul 16, 2026 08:00 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 16, 2026 09:00 AM', action: 'Review Started', status: 'completed' },
    ],
  },
  {
    id: 4,
    employeeName: 'Alice Brown',
    email: 'alice.brown@thecreditpros.com',
    requestType: 'Onboarding',
    status: 'completed',
    startDate: 'Jul 10, 2026',
    department: 'Marketing',
    manager: 'Laura Chen',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 10, 2026 10:00 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 10, 2026 10:30 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 10, 2026 03:00 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
  {
    id: 5,
    employeeName: 'Charlie Wilson',
    email: 'charlie.wilson@thecreditpros.com',
    requestType: 'Offboarding',
    status: 'pending',
    startDate: 'Jul 17, 2026',
    department: 'Finance',
    manager: 'Mark Anderson',
    platforms: ALL_PLATFORMS_PENDING,
    timeline: [{ timestamp: 'Jul 17, 2026 09:00 AM', action: 'Request Created', status: 'completed' }],
  },
  {
    id: 6,
    employeeName: 'Emma Davis',
    email: 'emma.davis@thecreditpros.com',
    requestType: 'Onboarding',
    status: 'completed',
    startDate: 'Jul 8, 2026',
    department: 'HR',
    manager: 'Nina Rodriguez',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 8, 2026 08:30 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 8, 2026 09:00 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 8, 2026 01:00 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
  {
    id: 7,
    employeeName: 'Michael Lee',
    email: 'michael.lee@thecreditpros.com',
    requestType: 'Onboarding',
    status: 'in-progress',
    startDate: 'Jul 16, 2026',
    department: 'Operations',
    manager: 'Steve Park',
    platforms: [
      { name: 'Azure', status: 'completed' },
      { name: 'Keeper', status: 'completed' },
      { name: 'Hodu', status: 'in-progress' },
      { name: 'Krisp', status: 'pending' },
      { name: 'Jira', status: 'in-progress' },
      { name: 'Zoho Desk', status: 'pending' },
      { name: 'Acuity', status: 'pending' },
    ],
    timeline: [
      { timestamp: 'Jul 16, 2026 08:15 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 16, 2026 08:45 AM', action: 'Review Started', status: 'completed' },
    ],
  },
  {
    id: 8,
    employeeName: 'Sarah Miller',
    email: 'sarah.miller@thecreditpros.com',
    requestType: 'Offboarding',
    status: 'completed',
    startDate: 'Jul 12, 2026',
    department: 'IT',
    manager: 'Angela Cruz',
    platforms: ALL_PLATFORMS_COMPLETED,
    timeline: [
      { timestamp: 'Jul 12, 2026 09:00 AM', action: 'Request Created', status: 'completed' },
      { timestamp: 'Jul 12, 2026 09:30 AM', action: 'Review Started', status: 'completed' },
      { timestamp: 'Jul 12, 2026 05:00 PM', action: 'Request Completed', status: 'completed' },
    ],
  },
];

/**
 * Looks up a mock request record by id.
 * TODO: Replace with a real API call once the backend exists.
 *
 * @param {string|number} id - Request id, typically read from the URL
 * @returns {Promise<Object|null>} The matching request, or null if not found
 */
export function getRequestById(id) {
  const numericId = Number(id);
  const record = MOCK_REQUEST_DETAILS.find((request) => request.id === numericId);
  return Promise.resolve(record || null);
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
