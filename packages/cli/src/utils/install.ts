/**
 * Shared installation constants
 *
 * These constants are used by schema.ts to define the single source of truth.
 * All functions have been removed - reconcile.ts now handles all operations.
 */

/**
 * Husky pre-commit hook content - includes safeword sync + lint-staged
 * The sync command keeps ESLint plugins aligned with detected frameworks
 */
export const HUSKY_PRE_COMMIT_CONTENT = 'npx safeword sync --quiet --stage\nnpx lint-staged\n';

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
