import React from 'react';
import PropTypes from 'prop-types';

const DOT_COLORS = {
  completed: 'bg-[#48bb78]',
  'in-progress': 'bg-[#f6ad55]',
  pending: 'bg-[#4299e1]',
};

/**
 * Timeline Component
 *
 * Displays timeline of events for the request.
 *
 * @component
 * @param {Array<{timestamp: string, action: string, status: string}>} events - Array of timeline events
 * @returns {React.ReactElement} Timeline component
 */
function Timeline({ events }) {
  return (
    <section className="rounded-lg border border-[#d4a574]/20 p-4">
      <h2 className="mb-3 text-lg font-bold text-[#d4a574]">Timeline</h2>
      {events.length === 0 ? (
        <p className="text-sm text-gray-400">No timeline events yet.</p>
      ) : (
        <ol className="relative ml-2 space-y-6 border-l-2 border-[#d4a574]/40 pl-6">
          {events.map((event) => (
            <li key={`${event.timestamp}-${event.action}`} className="relative">
              <span
                className={`absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full ring-4 ring-[#1a365d] ${
                  DOT_COLORS[event.status] || DOT_COLORS.pending
                }`}
                aria-hidden="true"
              />
              <p className="text-xs text-gray-400">{event.timestamp}</p>
              <p className="text-sm font-semibold text-white">{event.action}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

Timeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['completed', 'in-progress', 'pending']).isRequired,
    })
  ).isRequired,
};

export default Timeline;
