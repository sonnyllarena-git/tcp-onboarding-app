import React from 'react';
import PropTypes from 'prop-types';

/**
 * DetailSection Component
 *
 * Reusable section for displaying key-value information.
 *
 * @component
 * @param {string} title - Section title
 * @param {Object} data - Key-value pairs to display
 * @returns {React.ReactElement} DetailSection component
 */
function DetailSection({ title, data }) {
  return (
    <section className="rounded-lg border border-[#d4a574]/20 p-4">
      <h2 className="mb-3 text-lg font-bold text-[#d4a574]">{title}</h2>
      <dl className="space-y-2">
        {Object.entries(data).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-gray-400">{label}</dt>
            <dd className="font-medium text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

DetailSection.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
};

export default DetailSection;
