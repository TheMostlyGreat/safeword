/**
 * Shared installation constants
 *
 * These constants are used by schema.ts to define the single source of truth.
 * Operations are handled by reconcile() in src/reconcile.ts.
 */

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
