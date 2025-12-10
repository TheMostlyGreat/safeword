/**
 * Shared installation constants
 *
 * These constants are used by schema.ts to define the single source of truth.
 * All functions have been removed - reconcile.ts now handles all operations.
 */

/**
 * Husky pre-commit hook content - lint-staged only
 * This is prepended to existing hooks, preserving user customizations
 */
export const HUSKY_PRE_COMMIT_CONTENT = '# safeword:lint-staged\nnpx lint-staged\n';

/**
 * MCP servers installed by safeword
 */
export const MCP_SERVERS = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
  },
  playwright: {
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  },
} as const;

// NOTE: All other constants and functions were removed in the declarative schema refactor.
// The single source of truth is now SAFEWORD_SCHEMA in src/schema.ts.
// Operations are handled by reconcile() in src/reconcile.ts.
