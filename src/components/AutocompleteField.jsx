import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * AutocompleteField Component
 *
 * A typeahead text input backed by a fixed option list (role, job
 * title, manager, ...). Filters case-insensitively as the user types,
 * supports arrow-key navigation + Enter to select + Escape to close,
 * and click-to-select. No free text is accepted - on blur, if the
 * typed value doesn't exactly match an option (case-insensitive),
 * the value reverts and a "select from the list" error is shown.
 *
 * @component
 * @param {string} label
 * @param {string} value - Currently selected option (or in-progress typed text)
 * @param {Function} onChange - Called with the newly selected option's exact string
 * @param {Array<string>} options - Full list of selectable values (include 'N/A' if applicable)
 * @param {string} [placeholder]
 * @param {string} [error] - Error message to show; also drives the red border
 * @param {boolean} [required]
 * @param {boolean} [disabled]
 * @returns {React.ReactElement}
 */
function AutocompleteField({ label, value, onChange, onBlur, options, placeholder, error, required, disabled }) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        commitOrRevert(query);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, query]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((option) => option.toLowerCase().includes(normalizedQuery))
    : options;

  function commitOrRevert(candidate) {
    const exactMatch = options.find((option) => option.toLowerCase() === candidate.trim().toLowerCase());
    if (exactMatch) {
      onChange(exactMatch);
      setQuery(exactMatch);
    } else {
      onChange('');
      setQuery(candidate);
    }
  }

  const handleFocus = () => {
    setIsOpen(true);
    setHighlightIndex(0);
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setIsOpen(true);
    setHighlightIndex(0);
  };

  const handleSelect = (option) => {
    onChange(option);
    setQuery(option);
    setIsOpen(false);
  };

  const handleBlur = () => {
    // Deferred so a click on an option (which also fires blur) still
    // registers as a selection before we validate/revert.
    setTimeout(() => {
      if (!containerRef.current || !containerRef.current.contains(document.activeElement)) {
        commitOrRevert(query);
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    }, 120);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[highlightIndex]) {
        handleSelect(filtered[highlightIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      commitOrRevert(query);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#d4a574]">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={handleFocus}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-lg border bg-[#0d1b30] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-red-500 focus:border-red-500' : 'border-[#d4a574]/30 focus:border-[#d4a574]'
        }`}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[#d4a574]/30 bg-[#0d1b30] shadow-xl"
        >
          {filtered.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  index === highlightIndex ? 'bg-[#d4a574]/20 text-[#d4a574]' : 'text-gray-200 hover:bg-white/5'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#d4a574]/30 bg-[#0d1b30] px-3 py-2 text-sm text-gray-400 shadow-xl">
          No matches
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

AutocompleteField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default AutocompleteField;
