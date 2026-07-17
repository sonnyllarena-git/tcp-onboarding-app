import React from 'react';
import PropTypes from 'prop-types';

// Status colors are reserved and always paired with an icon + label — never
// used as the only signal — so each slot gets a light background tint for
// the icon badge, not for body text (these hexes don't carry enough contrast
// as solid text/fill on either a white or navy surface to stand alone).
const STAT_COLOR_CLASSES = {
  green: 'bg-[#48bb78]/10 text-[#48bb78]',
  orange: 'bg-[#f6ad55]/10 text-[#f6ad55]',
  red: 'bg-[#f56565]/10 text-[#f56565]',
  blue: 'bg-[#4299e1]/10 text-[#4299e1]',
};

/**
 * Returns the Tailwind classes for a StatBox color variant.
 * Falls back to the "blue" (info) variant for an unrecognized color.
 *
 * @param {string} color - Color variant (green/orange/red/blue)
 * @returns {string} Tailwind background/text classes for the icon badge
 */
export function getStatColor(color) {
  return STAT_COLOR_CLASSES[color] || STAT_COLOR_CLASSES.blue;
}

/**
 * StatBox Component
 *
 * Reusable statistic card showing key metrics.
 *
 * @component
 * @param {string} label - Stat label
 * @param {number} value - Stat value to display
 * @param {string} icon - Icon/emoji to show
 * @param {'up'|'down'} trend - Trend direction
 * @param {'green'|'orange'|'red'|'blue'} color - Color variant
 * @returns {React.ReactElement} StatBox component
 */
function StatBox({ label, value, icon, trend, color }) {
  const isTrendingUp = trend === 'up';

  return (
    <div className="rounded-xl bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${getStatColor(color)}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span
          className={`flex items-center gap-1 text-sm font-semibold ${
            isTrendingUp ? 'text-[#48bb78]' : 'text-[#f56565]'
          }`}
        >
          <span aria-hidden="true">{isTrendingUp ? '▲' : '▼'}</span>
          <span className="sr-only">{isTrendingUp ? 'Trending up' : 'Trending down'}</span>
        </span>
      </div>
      <p className="mt-4 text-sm text-gray-600">{label}</p>
      <p className="text-[28px] font-bold leading-tight text-[#1a365d]">{value}</p>
    </div>
  );
}

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['up', 'down']).isRequired,
  color: PropTypes.oneOf(['green', 'orange', 'red', 'blue']).isRequired,
};

export default StatBox;
