import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * RequestDetails Component
 *
 * Placeholder detail view for a single onboarding/offboarding request,
 * reached via /requests/:id. Reads the id from the URL to prove route
 * param wiring works; the real request lookup lands in a future pass.
 *
 * @component
 * @returns {React.ReactElement} RequestDetails component
 */
function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 text-white shadow-lg">
      <button
        type="button"
        onClick={() => navigate('/requests')}
        className="mb-4 text-sm font-semibold text-[#d4a574] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
      >
        &larr; Back to Requests
      </button>
      <h1 className="text-2xl font-bold text-white">Request Details</h1>
      <p className="mt-2 text-sm text-gray-300">
        Details for request #{id} — TODO: fetch and display the full request record here.
      </p>
    </div>
  );
}

export default RequestDetails;
