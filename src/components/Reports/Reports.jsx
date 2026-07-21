import React, { useState, useMemo, useEffect } from 'react';
import {
  getAllRequests,
  calculateRequestSLA,
  PLATFORMS,
  getMonthRange,
  getLast12MonthRanges,
  getQuarterRange,
  getYearToDateRange,
  getMonthsInRange,
  getRequestsInDateRange,
  compareMetrics,
} from '../../mockData';
import { getAllAuditLogs } from '../AuditLogs';
import { getAllUsers as getAllUsersReal } from '../../services/userService';
import { listRequests } from '../../services/requestService';
import { listAuditLogs } from '../../services/auditService';

const PERIOD_OPTIONS = [
  { id: 'thisMonth', label: 'This Month' },
  { id: 'selectMonth', label: 'Select Month' },
  { id: 'thisQuarter', label: 'This Quarter' },
  { id: 'thisYear', label: 'This Year' },
];

/**
 * Resolves a period id to its current and comparison date ranges.
 * 'selectMonth' resolves the chosen month (monthsAgo, 1-12) against the
 * month immediately before it.
 *
 * @param {string} periodId
 * @param {number} [selectedMonthsAgo] - Only used for 'selectMonth'
 * @returns {{ current: {start: Date, end: Date, label: string}, previous: {start: Date, end: Date, label: string}, supportsMonthlyBreakdown: boolean }}
 */
export function resolvePeriodRanges(periodId, selectedMonthsAgo = 1) {
  switch (periodId) {
    case 'selectMonth':
      return {
        current: getMonthRange(selectedMonthsAgo),
        previous: getMonthRange(selectedMonthsAgo + 1),
        supportsMonthlyBreakdown: false,
      };
    case 'thisQuarter':
      return { current: getQuarterRange(0), previous: getQuarterRange(1), supportsMonthlyBreakdown: true };
    case 'thisYear':
      return { current: getYearToDateRange(0), previous: getYearToDateRange(1), supportsMonthlyBreakdown: true };
    case 'thisMonth':
    default:
      return { current: getMonthRange(0), previous: getMonthRange(1), supportsMonthlyBreakdown: false };
  }
}

const STATUS_COLORS = {
  active: '#48bb78',
  pending: '#4299e1',
  inactive: '#a0aec0',
  compliant: '#48bb78',
  violated: '#f56565',
};

const REPORT_TABS = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'onboarding', label: 'Onboarding Performance' },
  { id: 'offboarding', label: 'Offboarding Performance' },
  { id: 'transition', label: 'Transition Performance' },
  { id: 'platformStatus', label: 'Platform Provisioning Status' },
  { id: 'userSummary', label: 'User Summary' },
  { id: 'volumeTrend', label: 'Request Volume Trend' },
  { id: 'errorAnalysis', label: 'Error Analysis' },
  { id: 'adminPerformance', label: 'Admin Performance' },
  { id: 'platformReadiness', label: 'Platform Readiness' },
  { id: 'compliance', label: 'Compliance & Audit' },
  { id: 'slaStatus', label: 'SLA Status Report' },
  { id: 'departmentBreakdown', label: 'Department Breakdown' },
];

/**
 * Builds the onboarding or offboarding performance summary: counts,
 * completion/failure rate, average completion time (hours, completed
 * requests only), and a department breakdown.
 *
 * @param {Array} requests - All requests
 * @param {'Onboarding'|'Offboarding'} type
 * @returns {Object}
 */
export function buildPerformanceReport(requests, type) {
  const scoped = requests.filter((r) => r.type === type);
  const completed = scoped.filter((r) => r.status === 'completed');
  const pending = scoped.filter((r) => r.status !== 'completed');

  const completedHours = completed
    .map((r) => calculateRequestSLA(r))
    .filter(Boolean)
    .map((sla) => sla.elapsedMs / 3600000);
  const avgCompletionHours = completedHours.length
    ? completedHours.reduce((sum, h) => sum + h, 0) / completedHours.length
    : 0;

  const departmentBreakdown = scoped.reduce((acc, r) => {
    const dept = r.departmentName || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  return {
    totalRequests: scoped.length,
    completedRequests: completed.length,
    pendingRequests: pending.length,
    completionRate: scoped.length ? ((completed.length / scoped.length) * 100).toFixed(1) : '0.0',
    pendingRate: scoped.length ? ((pending.length / scoped.length) * 100).toFixed(1) : '0.0',
    avgCompletionHours: avgCompletionHours.toFixed(1),
    departmentBreakdown,
  };
}

/**
 * Per-platform stats across every request that includes it: how many
 * completions were automated vs. manual vs. still failed, and a success
 * rate (completed / total appearances).
 *
 * @param {Array} requests
 * @returns {Object} Keyed by platform name
 */
export function buildPlatformStatusReport(requests) {
  const stats = {};
  PLATFORMS.forEach((name) => {
    stats[name] = { total: 0, automated: 0, manual: 0, failed: 0 };
  });

  requests.forEach((request) => {
    (request.platforms || []).forEach((p) => {
      if (!stats[p.name]) {
        stats[p.name] = { total: 0, automated: 0, manual: 0, failed: 0 };
      }
      stats[p.name].total += 1;
      if (p.status === 'completed' && p.completedBy) {
        stats[p.name].manual += 1;
      } else if (p.status === 'completed' && !p.completedBy) {
        stats[p.name].automated += 1;
      } else if (p.status === 'failed') {
        stats[p.name].failed += 1;
      }
    });
  });

  Object.keys(stats).forEach((name) => {
    const s = stats[name];
    s.successRate = s.total ? (((s.automated + s.manual) / s.total) * 100).toFixed(1) : '0.0';
  });

  return stats;
}

/**
 * SLA compliance across every request: how many completed requests met
 * their SLA vs. violated it, how many pending requests are already
 * overdue, and the full list of violations with per-platform detail.
 *
 * @param {Array} requests
 * @returns {Object}
 */
export function buildSLAStatusReport(requests) {
  const metrics = requests.map((r) => ({ request: r, sla: calculateRequestSLA(r) })).filter((m) => m.sla);
  const completed = metrics.filter((m) => m.sla.isCompleted);
  const violations = completed.filter((m) => m.sla.isViolated);
  const compliant = completed.filter((m) => !m.sla.isViolated);
  const pending = metrics.filter((m) => !m.sla.isCompleted);
  const atRisk = pending.filter((m) => m.sla.atRisk);

  return {
    complianceRate: completed.length ? ((compliant.length / completed.length) * 100).toFixed(1) : '0.0',
    totalCompleted: completed.length,
    compliant: compliant.length,
    violations: violations.length,
    pendingRequests: pending.length,
    atRiskRequests: atRisk.length,
    violationDetails: violations.map(({ request, sla }) => ({
      requestId: request.id,
      employeeName: request.employeeName,
      type: request.type,
      elapsedHours: (sla.elapsedMs / 3600000).toFixed(1),
      slaHours: sla.slaLimitMs / 3600000,
      overHours: ((sla.elapsedMs - sla.slaLimitMs) / 3600000).toFixed(1),
    })),
  };
}

/**
 * Requests completed per admin (grouped by `approvedBy`), with average
 * completion time.
 * @param {Array} requests
 * @returns {Object} Keyed by admin name
 */
export function buildAdminPerformanceReport(requests) {
  const stats = {};
  requests
    .filter((r) => r.status === 'completed')
    .forEach((request) => {
      const admin = request.approvedBy || 'Unknown';
      const sla = calculateRequestSLA(request);
      if (!stats[admin]) {
        stats[admin] = { completed: 0, totalHours: 0 };
      }
      stats[admin].completed += 1;
      stats[admin].totalHours += sla ? sla.elapsedMs / 3600000 : 0;
    });

  Object.keys(stats).forEach((admin) => {
    stats[admin].avgHours = (stats[admin].totalHours / stats[admin].completed).toFixed(1);
  });

  return stats;
}

/**
 * How "automation-ready" each platform is: the share of its completions
 * that happened without manual intervention. 80%+ is considered ready.
 * @param {Array} requests
 * @returns {Object} Keyed by platform name
 */
export function buildPlatformReadinessReport(requests) {
  const platformStats = buildPlatformStatusReport(requests);
  const readiness = {};
  Object.entries(platformStats).forEach(([name, stats]) => {
    const totalCompleted = stats.automated + stats.manual;
    const readinessPct = totalCompleted ? ((stats.automated / totalCompleted) * 100).toFixed(1) : '0.0';
    readiness[name] = {
      total: stats.total,
      automated: stats.automated,
      manual: stats.manual,
      readinessPct,
      status: parseFloat(readinessPct) >= 80 ? 'Ready' : 'Needs Work',
    };
  });
  return readiness;
}

/**
 * Counts of PLATFORM_PROVISION_FAILED audit entries, grouped by error
 * message, so the most common failure reasons stand out.
 * @param {Array} auditLogs
 * @returns {Object}
 */
export function buildErrorAnalysisReport(auditLogs) {
  const errors = {};
  auditLogs.forEach((log) => {
    if (log.action === 'PLATFORM_PROVISION_FAILED' && log.errorMessage) {
      errors[log.errorMessage] = (errors[log.errorMessage] || 0) + 1;
    }
  });
  return {
    totalErrors: Object.values(errors).reduce((a, b) => a + b, 0),
    errorBreakdown: errors,
  };
}

/**
 * Total request volume grouped by department, split by type and status.
 * @param {Array} requests
 * @returns {Object} Keyed by department
 */
export function buildDepartmentBreakdownReport(requests) {
  const departments = {};
  requests.forEach((request) => {
    const dept = request.departmentName || 'Unknown';
    if (!departments[dept]) {
      departments[dept] = { total: 0, onboarding: 0, offboarding: 0, transition: 0, reactivation: 0, completed: 0, pending: 0 };
    }
    departments[dept].total += 1;
    if (request.type === 'Onboarding') {
      departments[dept].onboarding += 1;
    } else if (request.type === 'Offboarding') {
      departments[dept].offboarding += 1;
    } else if (request.type === 'Transition') {
      departments[dept].transition += 1;
    } else {
      departments[dept].reactivation += 1;
    }
    if (request.status === 'completed') {
      departments[dept].completed += 1;
    } else {
      departments[dept].pending += 1;
    }
  });
  return departments;
}

/**
 * Overall (onboarding + offboarding combined) completion rate, average
 * completion time, and SLA compliance rate for a set of requests - the
 * three metrics the period-over-period comparison tracks.
 *
 * @param {Array} requestsSubset
 * @returns {{completionRate: number, avgCompletionHours: number, slaComplianceRate: number}}
 */
export function buildOverallSummary(requestsSubset) {
  const completed = requestsSubset.filter((r) => r.status === 'completed');
  const hours = completed
    .map((r) => calculateRequestSLA(r))
    .filter(Boolean)
    .map((sla) => sla.elapsedMs / 3600000);
  const avgCompletionHours = hours.length ? hours.reduce((sum, h) => sum + h, 0) / hours.length : 0;
  const sla = buildSLAStatusReport(requestsSubset);

  return {
    completionRate: requestsSubset.length ? (completed.length / requestsSubset.length) * 100 : 0,
    avgCompletionHours,
    slaComplianceRate: parseFloat(sla.complianceRate),
  };
}

/** A single stat tile used throughout every report tab. */
function MetricTile({ label, value, tone }) {
  const toneClass =
    tone === 'success' ? 'text-green-400' : tone === 'warning' ? 'text-yellow-400' : tone === 'error' ? 'text-red-400' : 'text-[#d4a574]';
  return (
    <div className="rounded-lg bg-[#0d1b30] p-4 text-center">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

/**
 * Current-vs-previous-period metric tile with a trend arrow and %
 * change. `invert` flips "higher is better" to "lower is better" (e.g.
 * average completion time, where a smaller number is the improvement).
 */
function ComparisonTile({ label, current, previous, suffix = '', invert = false }) {
  const cmp = compareMetrics(current, previous, invert);
  const arrow = cmp.trend === 'up' ? '▲' : cmp.trend === 'down' ? '▼' : '—';
  const arrowClass = cmp.trend === 'up' ? 'text-green-400' : cmp.trend === 'down' ? 'text-red-400' : 'text-gray-400';
  return (
    <div className="rounded-lg bg-[#0d1b30] p-4">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          {current.toFixed(1)}
          {suffix}
        </span>
        <span className={`text-sm font-bold ${arrowClass}`} aria-hidden="true">
          {arrow} {cmp.changePct === null ? 'n/a' : `${Math.abs(cmp.changePct).toFixed(1)}%`}
        </span>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        Previous period: {previous.toFixed(1)}
        {suffix}
      </div>
    </div>
  );
}

/**
 * Minimal donut chart built from stroke-dasharray circles (no arc/path
 * trig - avoids label-collision bugs entirely). Segments aren't
 * text-labeled inside the chart; the legend beside it carries the
 * identity + value, which stays legible at any slice size.
 */
function DonutChart({ title, data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 60;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="rounded-lg border border-[#d4a574]/20 bg-[#0d1b30] p-4">
      <h3 className="mb-3 text-sm font-bold text-white">{title}</h3>
      {total === 0 ? (
        <p className="text-xs text-gray-400">No data yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={title}>
            <g transform="rotate(-90 70 70)">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#1a365d" strokeWidth={strokeWidth} />
              {data.map((d, i) => {
                const fraction = d.value / total;
                // A small gap between adjacent segments (surface color shows
                // through) so slices stay distinguishable independent of hue.
                const gapPx = data.length > 1 ? 3 : 0;
                const dashLength = Math.max(0, fraction * circumference - gapPx);
                const dashArray = `${dashLength} ${circumference - dashLength}`;
                const dashOffset = -cumulative * circumference;
                cumulative += fraction;
                return (
                  <circle
                    key={i}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </g>
            <text x="70" y="75" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">
              {total}
            </text>
          </svg>
          <ul className="flex-1 space-y-1.5 text-xs">
            {data.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-gray-300">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.label}
                </span>
                <span className="font-semibold text-white">
                  {d.value} ({total ? ((d.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Horizontal single-hue bars for a magnitude-across-categories comparison. */
function BarList({ title, data }) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-lg border border-[#d4a574]/20 bg-[#0d1b30] p-4">
      <h3 className="mb-3 text-sm font-bold text-white">{title}</h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 truncate text-gray-300">{d.label}</span>
            <div className="h-3 flex-1 rounded-full bg-[#1a365d]">
              <div
                className="h-3 rounded-full bg-[#d4a574]"
                style={{ width: `${Math.max(2, (d.value / maxValue) * 100)}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-semibold text-white">{d.value.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('thisMonth');
  const [selectedMonthsAgo, setSelectedMonthsAgo] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);
  const [show12MonthTrend, setShow12MonthTrend] = useState(false);

  const [allRequests, setAllRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [allAuditLogs, setAllAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [realRequests, realUsers, realAuditLogs] = await Promise.all([
          listRequests(),
          getAllUsersReal(),
          listAuditLogs(),
        ]);
        if (cancelled) return;
        setAllRequests([...realRequests, ...getAllRequests()]);
        setUsers(realUsers);
        setAllAuditLogs([...realAuditLogs, ...getAllAuditLogs()]);
      } catch (error) {
        console.error('[Reports] failed to load data:', error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const last12Months = useMemo(() => getLast12MonthRanges(), []);

  const { current: currentRange, previous: previousRange, supportsMonthlyBreakdown } = useMemo(
    () => resolvePeriodRanges(period, selectedMonthsAgo),
    [period, selectedMonthsAgo]
  );

  const requests = useMemo(() => getRequestsInDateRange(allRequests, currentRange), [allRequests, currentRange]);
  const previousPeriodRequests = useMemo(
    () => getRequestsInDateRange(allRequests, previousRange),
    [allRequests, previousRange]
  );
  const auditLogs = useMemo(
    () => getRequestsInDateRange(allAuditLogs, currentRange, 'timestampIso'),
    [allAuditLogs, currentRange]
  );

  const onboarding = useMemo(() => buildPerformanceReport(requests, 'Onboarding'), [requests]);
  const offboarding = useMemo(() => buildPerformanceReport(requests, 'Offboarding'), [requests]);
  const transition = useMemo(() => buildPerformanceReport(requests, 'Transition'), [requests]);
  const reactivation = useMemo(() => buildPerformanceReport(requests, 'Reactivation'), [requests]);
  const departmentMovements = useMemo(() => {
    const counts = {};
    requests
      .filter((r) => r.type === 'Transition' && r.status === 'completed')
      .forEach((r) => {
        const key = `${r.oldDepartment} → ${r.newDepartment}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([movement, count]) => ({ movement, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);
  const platformStatus = useMemo(() => buildPlatformStatusReport(requests), [requests]);
  const slaStatus = useMemo(() => buildSLAStatusReport(requests), [requests]);
  const adminPerformance = useMemo(() => buildAdminPerformanceReport(requests), [requests]);
  const platformReadiness = useMemo(() => buildPlatformReadinessReport(requests), [requests]);
  const errorAnalysis = useMemo(() => buildErrorAnalysisReport(auditLogs), [auditLogs]);
  const departmentBreakdown = useMemo(() => buildDepartmentBreakdownReport(requests), [requests]);

  const currentSummary = useMemo(() => buildOverallSummary(requests), [requests]);
  const previousSummary = useMemo(() => buildOverallSummary(previousPeriodRequests), [previousPeriodRequests]);

  const monthlyBreakdown = useMemo(() => {
    if (!supportsMonthlyBreakdown) return [];
    return getMonthsInRange(currentRange.start, currentRange.end).map((month) => {
      const monthRequests = getRequestsInDateRange(allRequests, month);
      return {
        label: month.label,
        onboarding: monthRequests.filter((r) => r.type === 'Onboarding').length,
        offboarding: monthRequests.filter((r) => r.type === 'Offboarding').length,
        completed: monthRequests.filter((r) => r.status === 'completed').length,
      };
    });
  }, [allRequests, currentRange, supportsMonthlyBreakdown]);

  const trendData = useMemo(() => {
    if (period !== 'selectMonth' || !show12MonthTrend) return [];
    return last12Months.map((range) => {
      const monthRequests = getRequestsInDateRange(allRequests, range);
      const summary = buildOverallSummary(monthRequests);
      return {
        label: range.label,
        total: monthRequests.length,
        completed: monthRequests.filter((r) => r.status === 'completed').length,
        pending: monthRequests.filter((r) => r.status !== 'completed').length,
        completionRate: summary.completionRate,
        avgCompletionHours: summary.avgCompletionHours,
      };
    });
  }, [allRequests, last12Months, period, show12MonthTrend]);

  // User status is a point-in-time snapshot, not tied to a request date, so
  // it intentionally isn't scoped to the selected reporting period.
  const userSummary = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const deptBreakdown = users.reduce((acc, u) => {
      const dept = u.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return { totalUsers: users.length, active, pending, inactive, deptBreakdown };
  }, [users]);

  const volumeByDay = useMemo(() => {
    const byDay = {};
    requests.forEach((r) => {
      if (!r.createdAt) return;
      const day = new Date(r.createdAt).toLocaleDateString();
      if (!byDay[day]) byDay[day] = { onboarding: 0, offboarding: 0, transition: 0, reactivation: 0 };
      if (r.type === 'Onboarding') byDay[day].onboarding += 1;
      else if (r.type === 'Offboarding') byDay[day].offboarding += 1;
      else if (r.type === 'Transition') byDay[day].transition += 1;
      else byDay[day].reactivation += 1;
    });
    return byDay;
  }, [requests]);

  const complianceSummary = useMemo(() => {
    const actionBreakdown = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});
    return { totalActions: auditLogs.length, actionBreakdown };
  }, [auditLogs]);

  const handleExportCSV = () => {
    const rows = [
      ['Report Period', currentRange.label],
      ['Metric', 'Value'],
      ['Total Users', userSummary.totalUsers],
      ['Active Users', userSummary.active],
      ['Pending Users', userSummary.pending],
      ['Inactive Users', userSummary.inactive],
      ['Onboarding Completion Rate (%)', onboarding.completionRate],
      ['Offboarding Completion Rate (%)', offboarding.completionRate],
      ['Transition Completion Rate (%)', transition.completionRate],
      ['SLA Compliance Rate (%)', slaStatus.complianceRate],
      ['SLA Violations', slaStatus.violations],
      ['SLA At-Risk Requests', slaStatus.atRiskRequests],
      [],
      ['SLA Violation Details'],
      ['Request ID', 'Employee', 'Type', 'Hours Taken', 'SLA Hours', 'Hours Over'],
      ...slaStatus.violationDetails.map((v) => [v.requestId, v.employeeName, v.type, v.elapsedHours, v.slaHours, v.overHours]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tcp_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6 text-white">Loading reports...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] px-4 py-6 dark:from-[#0a0f1e] dark:to-[#0a0f1e] sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-white">📊 Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-gray-300">Operational metrics, SLA compliance, and audit summaries.</p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63]"
        >
          📥 Export as CSV
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[#d4a574]/30 bg-white/5 p-4">
        <div>
          <label htmlFor="report-period" className="mb-1 block text-xs font-semibold text-gray-300">
            Choose Report Period
          </label>
          <select
            id="report-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2 text-sm text-white focus:border-[#d4a574] focus:outline-none"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">{currentRange.label}</p>
        </div>

        {period === 'selectMonth' && (
          <div>
            <label htmlFor="report-select-month" className="mb-1 block text-xs font-semibold text-gray-300">
              Select Month
            </label>
            <select
              id="report-select-month"
              value={selectedMonthsAgo}
              onChange={(event) => setSelectedMonthsAgo(Number(event.target.value))}
              className="rounded-lg border border-[#d4a574]/40 bg-[#0d1b30] px-4 py-2 text-sm text-white focus:border-[#d4a574] focus:outline-none"
            >
              {last12Months.map((range) => (
                <option key={range.monthsAgo} value={range.monthsAgo}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 pb-2 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={showComparison}
            onChange={(event) => setShowComparison(event.target.checked)}
            className="h-4 w-4 rounded border-[#d4a574]/40 bg-[#0d1b30] text-[#d4a574] focus:ring-[#d4a574]"
          />
          Compare to Previous Period
        </label>

        {supportsMonthlyBreakdown && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={showMonthlyBreakdown}
              onChange={(event) => setShowMonthlyBreakdown(event.target.checked)}
              className="h-4 w-4 rounded border-[#d4a574]/40 bg-[#0d1b30] text-[#d4a574] focus:ring-[#d4a574]"
            />
            Show Monthly Breakdown
          </label>
        )}

        {period === 'selectMonth' && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={show12MonthTrend}
              onChange={(event) => setShow12MonthTrend(event.target.checked)}
              className="h-4 w-4 rounded border-[#d4a574]/40 bg-[#0d1b30] text-[#d4a574] focus:ring-[#d4a574]"
            />
            Show 12-Month Trend
          </label>
        )}
      </div>

      {showComparison && (
        <div className="mb-6 rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">
            {currentRange.label} vs. {previousRange.label}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ComparisonTile
              label="Completion Rate"
              current={currentSummary.completionRate}
              previous={previousSummary.completionRate}
              suffix="%"
            />
            <ComparisonTile
              label="Avg Completion Time"
              current={currentSummary.avgCompletionHours}
              previous={previousSummary.avgCompletionHours}
              suffix="h"
              invert
            />
            <ComparisonTile
              label="SLA Compliance"
              current={currentSummary.slaComplianceRate}
              previous={previousSummary.slaComplianceRate}
              suffix="%"
            />
          </div>
        </div>
      )}

      {showMonthlyBreakdown && supportsMonthlyBreakdown && (
        <div className="mb-6 rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">Monthly Breakdown</h2>
          <SimpleTable
            columns={['Month', 'Onboarding', 'Offboarding', 'Completed']}
            rows={monthlyBreakdown.map((m) => [m.label, m.onboarding, m.offboarding, m.completed])}
          />
        </div>
      )}

      {period === 'selectMonth' && show12MonthTrend && (
        <div className="mb-6 rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">12-Month Trend</h2>
          <div className="mb-4">
            <BarList
              title="Completion Rate by Month"
              data={trendData.map((m) => ({ label: m.label, value: m.completionRate }))}
            />
          </div>
          <SimpleTable
            columns={['Month', 'Total', 'Completed', 'Pending', 'Completion Rate', 'Avg Time (hrs)']}
            rows={trendData.map((m) => [
              m.label,
              m.total,
              m.completed,
              m.pending,
              `${m.completionRate.toFixed(1)}%`,
              m.avgCompletionHours.toFixed(1),
            ])}
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#d4a574] text-[#1a365d]'
                : 'border border-[#d4a574]/30 text-gray-300 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <MetricTile label="Total Users" value={userSummary.totalUsers} />
            <MetricTile label="Active Users" value={userSummary.active} tone="success" />
            <MetricTile label="Pending Users" value={userSummary.pending} tone="warning" />
            <MetricTile label="SLA Compliance" value={`${slaStatus.complianceRate}%`} />
            <MetricTile label="Onboarding Completion" value={`${onboarding.completionRate}%`} />
            <MetricTile label="Offboarding Completion" value={`${offboarding.completionRate}%`} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DonutChart
              title="User Distribution"
              data={[
                { label: 'Active', value: userSummary.active, color: STATUS_COLORS.active },
                { label: 'Pending', value: userSummary.pending, color: STATUS_COLORS.pending },
                { label: 'Inactive', value: userSummary.inactive, color: STATUS_COLORS.inactive },
              ]}
            />
            <DonutChart
              title="Request Volume"
              data={[
                { label: 'Onboarding', value: onboarding.totalRequests, color: '#4299e1' },
                { label: 'Offboarding', value: offboarding.totalRequests, color: '#d4a574' },
                { label: 'Transition', value: transition.totalRequests, color: '#9f7aea' },
                { label: 'Reactivation', value: reactivation.totalRequests, color: '#38b2ac' },
              ]}
            />
            <DonutChart
              title="SLA Status"
              data={[
                { label: 'Compliant', value: slaStatus.compliant, color: STATUS_COLORS.compliant },
                { label: 'Violations', value: slaStatus.violations, color: STATUS_COLORS.violated },
              ]}
            />
            <BarList
              title="Platform Success Rate"
              data={Object.entries(platformStatus).map(([name, stats]) => ({ label: name, value: parseFloat(stats.successRate) }))}
            />
          </div>
        </div>
      )}

      {activeTab === 'onboarding' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Onboarding Performance</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Total" value={onboarding.totalRequests} />
            <MetricTile label="Completed" value={onboarding.completedRequests} tone="success" />
            <MetricTile label="Pending" value={onboarding.pendingRequests} tone="warning" />
            <MetricTile label="Completion Rate" value={`${onboarding.completionRate}%`} />
            <MetricTile label="Pending Rate" value={`${onboarding.pendingRate}%`} />
            <MetricTile label="Avg Completion" value={`${onboarding.avgCompletionHours}h`} />
          </div>
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">By Department</h3>
          <SimpleTable columns={['Department', 'Count']} rows={Object.entries(onboarding.departmentBreakdown)} />
        </div>
      )}

      {activeTab === 'offboarding' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Offboarding Performance</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Total" value={offboarding.totalRequests} />
            <MetricTile label="Completed" value={offboarding.completedRequests} tone="success" />
            <MetricTile label="Pending" value={offboarding.pendingRequests} tone="warning" />
            <MetricTile label="Completion Rate" value={`${offboarding.completionRate}%`} />
            <MetricTile label="Pending Rate" value={`${offboarding.pendingRate}%`} />
            <MetricTile label="Avg Completion" value={`${offboarding.avgCompletionHours}h`} />
          </div>
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">By Department</h3>
          <SimpleTable columns={['Department', 'Count']} rows={Object.entries(offboarding.departmentBreakdown)} />
        </div>
      )}

      {activeTab === 'platformStatus' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Platform Provisioning Status</h2>
          <SimpleTable
            columns={['Platform', 'Total', 'Automated', 'Manual', 'Failed', 'Success Rate']}
            rows={Object.entries(platformStatus).map(([name, s]) => [name, s.total, s.automated, s.manual, s.failed, `${s.successRate}%`])}
          />
        </div>
      )}

      {activeTab === 'userSummary' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">User Summary</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricTile label="Total" value={userSummary.totalUsers} />
            <MetricTile label="Active" value={userSummary.active} tone="success" />
            <MetricTile label="Pending" value={userSummary.pending} tone="warning" />
            <MetricTile label="Inactive" value={userSummary.inactive} />
          </div>
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">By Department</h3>
          <SimpleTable columns={['Department', 'Count']} rows={Object.entries(userSummary.deptBreakdown)} />
        </div>
      )}

      {activeTab === 'volumeTrend' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Request Volume Trend</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricTile label="Total Requests" value={requests.length} />
            <MetricTile label="Days With Activity" value={Object.keys(volumeByDay).length} />
          </div>
          <SimpleTable
            columns={['Date', 'Onboarding', 'Offboarding', 'Transition', 'Reactivation']}
            rows={Object.entries(volumeByDay).map(([day, v]) => [day, v.onboarding, v.offboarding, v.transition, v.reactivation])}
          />
        </div>
      )}

      {activeTab === 'errorAnalysis' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Error Analysis</h2>
          <MetricTile label="Total Automation Failures" value={errorAnalysis.totalErrors} tone="error" />
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">Error Breakdown</h3>
          {Object.keys(errorAnalysis.errorBreakdown).length === 0 ? (
            <p className="text-sm text-gray-400">No automation failures recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(errorAnalysis.errorBreakdown).map(([error, count]) => (
                <li key={error} className="rounded border-l-2 border-red-400 bg-red-400/10 p-3 text-sm text-red-200">
                  {error} — {count} occurrence{count === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'adminPerformance' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Admin Performance</h2>
          <SimpleTable
            columns={['Admin', 'Completed', 'Avg Time (hrs)']}
            rows={Object.entries(adminPerformance).map(([admin, s]) => [admin, s.completed, s.avgHours])}
          />
        </div>
      )}

      {activeTab === 'platformReadiness' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Platform Readiness</h2>
          <SimpleTable
            columns={['Platform', 'Total', 'Automated', 'Readiness %', 'Status']}
            rows={Object.entries(platformReadiness).map(([name, s]) => [
              name,
              s.total,
              s.automated,
              `${s.readinessPct}%`,
              s.status,
            ])}
          />
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Compliance &amp; Audit</h2>
          <MetricTile label="Total Actions Logged" value={complianceSummary.totalActions} />
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">Action Breakdown</h3>
          <SimpleTable columns={['Action', 'Count']} rows={Object.entries(complianceSummary.actionBreakdown)} />
          <p className="mt-4 text-xs text-gray-400">
            For the full, filterable event-by-event trail, see the{' '}
            <a href="/audit-logs" className="text-[#d4a574] underline">
              Audit Logs
            </a>{' '}
            page.
          </p>
        </div>
      )}

      {activeTab === 'slaStatus' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">SLA Status Report</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <MetricTile label="Compliance Rate" value={`${slaStatus.complianceRate}%`} tone="success" />
            <MetricTile label="Completed" value={slaStatus.totalCompleted} />
            <MetricTile label="Compliant" value={slaStatus.compliant} tone="success" />
            <MetricTile label="Violations" value={slaStatus.violations} tone="error" />
            <MetricTile label="At Risk" value={slaStatus.atRiskRequests} tone="warning" />
          </div>
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">Violation Details</h3>
          {slaStatus.violationDetails.length === 0 ? (
            <p className="text-sm text-gray-400">No SLA violations recorded.</p>
          ) : (
            <SimpleTable
              columns={['Request ID', 'Employee', 'Type', 'Hours Taken', 'SLA Hours', 'Over By']}
              rows={slaStatus.violationDetails.map((v) => [
                v.requestId,
                v.employeeName,
                v.type,
                `${v.elapsedHours}h`,
                `${v.slaHours}h`,
                `${v.overHours}h`,
              ])}
            />
          )}
        </div>
      )}

      {activeTab === 'departmentBreakdown' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Department Breakdown</h2>
          <SimpleTable
            columns={['Department', 'Total', 'Onboarding', 'Offboarding', 'Transition', 'Reactivation', 'Completed', 'Pending']}
            rows={Object.entries(departmentBreakdown).map(([dept, s]) => [
              dept,
              s.total,
              s.onboarding,
              s.offboarding,
              s.transition,
              s.reactivation,
              s.completed,
              s.pending,
            ])}
          />
        </div>
      )}

      {activeTab === 'transition' && (
        <div className="rounded-lg border border-[#d4a574]/30 bg-[#1a365d] p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Transition Performance</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Total" value={transition.totalRequests} />
            <MetricTile label="Completed" value={transition.completedRequests} tone="success" />
            <MetricTile label="Pending" value={transition.pendingRequests} tone="warning" />
            <MetricTile label="Completion Rate" value={`${transition.completionRate}%`} />
            <MetricTile label="Pending Rate" value={`${transition.pendingRate}%`} />
            <MetricTile label="Avg Completion" value={`${transition.avgCompletionHours}h`} />
          </div>
          <h3 className="mb-2 mt-6 text-sm font-bold text-gray-300">Department Movements</h3>
          {departmentMovements.length === 0 ? (
            <p className="text-sm text-gray-400">No completed transitions yet.</p>
          ) : (
            <SimpleTable columns={['Movement', 'Count']} rows={departmentMovements.map((m) => [m.movement, m.count])} />
          )}
        </div>
      )}
    </div>
  );
}

/** Small generic table for the report tabs that are just rows of counts. */
function SimpleTable({ columns, rows }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#d4a574]/20">
      <table className="w-full min-w-[500px] border-collapse text-sm">
        <thead className="bg-[#0d1b30]">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-[#d4a574]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#d4a574]/10">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;
