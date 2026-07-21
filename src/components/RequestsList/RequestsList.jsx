import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRequests, calculateRequestSLA, getRequestWorkEmail } from '../../mockData';

const INITIAL_FILTERS = {
  nameSearch: '',
  emailSearch: '',
  status: 'all',
  type: 'all',
};

// Pending/in-progress requests need attention first; completed ones are
// just a record. Matches this app's real lowercase status values -
// there's no 'cancelled' status anywhere in this app, unlike the
// uppercase PENDING/COMPLETED/CANCELLED a fictional data model might use.
const STATUS_SORT_ORDER = { pending: 0, 'in-progress': 1, completed: 2 };

/**
 * Filters and sorts requests for display: text search on name/email
 * (matches either the request's email or its Azure AD work email, once
 * created), exact match on status/type, then a default sort - pending
 * first, then in-progress, then completed, newest-created first within
 * each group. Requests missing createdAt sort to the bottom of their
 * group rather than throwing off the rest of the order.
 *
 * @param {Array} requests - Requests to filter (already merged seed + runtime)
 * @param {Object} filters - { nameSearch, emailSearch, status, type }
 * @returns {Array} The filtered, status-then-newest-first requests
 */
export function filterRequests(requests, filters) {
  const nameSearch = filters.nameSearch.trim().toLowerCase();
  const emailSearch = filters.emailSearch.trim().toLowerCase();

  return requests
    .filter((req) => {
      const matchesName = !nameSearch || req.employeeName.toLowerCase().includes(nameSearch);
      const workEmail = getRequestWorkEmail(req);
      const matchesEmail =
        !emailSearch ||
        req.email.toLowerCase().includes(emailSearch) ||
        (workEmail && workEmail.toLowerCase().includes(emailSearch));
      const matchesStatus = filters.status === 'all' || req.status === filters.status;
      const matchesType = filters.type === 'all' || req.type === filters.type;
      return matchesName && matchesEmail && matchesStatus && matchesType;
    })
    .slice()
    .sort((a, b) => {
      const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
}

function RequestsList() {
  const navigate = useNavigate();
  const [requests] = useState(getAllRequests);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const filteredRequests = useMemo(() => filterRequests(requests, filters), [requests, filters]);

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Requests</h1>

      <div className="bg-[#1a365d] border border-[#d4a574]/30 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label htmlFor="filter-name" className="block text-xs text-gray-400 mb-1">Search by Name</label>
          <input
            id="filter-name"
            type="text"
            placeholder="Search by Name..."
            value={filters.nameSearch}
            onChange={(e) => handleFilterChange({ nameSearch: e.target.value })}
            className="bg-[#0d1b30] border border-[#d4a574]/40 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label htmlFor="filter-email" className="block text-xs text-gray-400 mb-1">Search by Email</label>
          <input
            id="filter-email"
            type="text"
            placeholder="Personal or work email..."
            value={filters.emailSearch}
            onChange={(e) => handleFilterChange({ emailSearch: e.target.value })}
            className="bg-[#0d1b30] border border-[#d4a574]/40 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="bg-[#0d1b30] border border-[#d4a574]/40 rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-type" className="block text-xs text-gray-400 mb-1">Type</label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(e) => handleFilterChange({ type: e.target.value })}
            className="bg-[#0d1b30] border border-[#d4a574]/40 rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Types</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Offboarding">Offboarding</option>
            <option value="Transition">Transition</option>
            <option value="Reactivation">Reactivation</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleClearFilters}
          className="rounded-lg border border-[#d4a574] px-4 py-1.5 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d]"
        >
          Clear Filters
        </button>
      </div>

      <p className="text-gray-400 text-xs mb-3">
        Results: {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'}
      </p>

      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <p className="text-gray-400">No requests found</p>
        ) : (
          filteredRequests.map(req => {
            const sla = calculateRequestSLA(req);
            const slaViolated = sla && (sla.isViolated || sla.atRisk);
            const workEmail = getRequestWorkEmail(req);
            return (
              <div
                key={req.id}
                onClick={() => navigate(`/requests/${req.id}`)}
                className="bg-[#1a365d] border border-[#d4a574]/30 p-4 rounded-lg cursor-pointer hover:bg-[#1a365d]/80 transition-colors"
              >
                <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                  <div>
                    <p className="text-white font-semibold">{req.employeeName}</p>
                    {req.type === 'Transition' ? (
                      <p className="text-sm text-gray-400">
                        {req.oldDepartment} <span className="text-[#48bb78]">→</span> {req.newDepartment}
                      </p>
                    ) : (
                      <p className={`text-sm ${workEmail ? 'text-[#48bb78] font-semibold' : 'text-gray-400'}`}>
                        {workEmail || 'Work Email not yet created'}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-center">
                    <span className="inline-block rounded-full bg-[#d4a574]/15 px-4 py-1.5 text-xs font-bold text-[#d4a574]">
                      {req.type}
                    </span>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-2 md:flex-col md:items-end">
                    <div className="flex items-center gap-2">
                      {slaViolated && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                          SLA
                        </span>
                      )}
                      <p className={`font-semibold ${
                        req.status === 'completed' ? 'text-green-400' :
                        req.status === 'pending' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </p>
                    </div>
                    <p className="text-gray-400 text-sm">{req.date}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RequestsList;
