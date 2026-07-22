import AutocompleteField from './AutocompleteField';

/**
 * SearchableDropdown Component
 *
 * The Phase 4 spec describes this and AutocompleteField identically
 * (typed like an autocomplete, filters the option list, shows the
 * full list on focus, no free text allowed) - rather than duplicate
 * ~170 lines of identical filtering/keyboard-nav/blur-validation
 * logic, this re-exports AutocompleteField under the name used by
 * the "searchable dropdown" fields (Working Location, Country,
 * Department, Team, Employee Type) for readability at the call site.
 */
export default AutocompleteField;
