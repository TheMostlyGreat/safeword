/**
 * Pinned versions for bunx-invoked tools.
 *
 * These ensure deterministic behavior across all users.
 * Update these when releasing new safeword versions.
 *
 * Why pin versions?
 * - bunx/npx cache packages forever with no auto-expiry
 * - Without exact version pins, behavior varies by when each user first ran the command
 * - Pinning ensures all users get the same tool version regardless of cache state
 */
export const TOOL_VERSIONS = {
  /** Copy/paste detection - finds duplicated code blocks */
  jscpd: "4.0.5",
  /** Package publishing validation - checks package.json exports and files */
  publint: "0.3.16",
} as const;

/**
 * Get the bunx command with pinned version for a tool.
 *
 * @example
 * getBunxCommand('jscpd') // 'bunx jscpd@4.0.5'
 * getBunxCommand('publint') // 'bunx publint@0.3.16'
 */
export function getBunxCommand(tool: keyof typeof TOOL_VERSIONS): string {
  return `bunx ${tool}@${TOOL_VERSIONS[tool]}`;
}
