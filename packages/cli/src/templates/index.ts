/**
 * Bundled templates for safeword setup
 *
 * Re-exports all templates from organized modules.
 */

// Content templates (static string constants)
// Note: Most templates are now file-based in templates/ directory
export { AGENTS_MD_LINK, PRETTIERRC, LINT_STAGED_CONFIG } from './content.js';

// Configuration templates (ESLint, hooks settings)
export { getEslintConfig, SETTINGS_HOOKS } from './config.js';
