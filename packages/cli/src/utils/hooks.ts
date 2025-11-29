/**
 * Hook utilities for Claude Code settings
 */

/**
 * Type guard to check if a value is a hook object with a command property
 */
export function isHookObject(h: unknown): h is { command: string } {
  return (
    typeof h === 'object' &&
    h !== null &&
    'command' in h &&
    typeof (h as { command: string }).command === 'string'
  );
}

/**
 * Check if a hook is a safeword hook (command contains '.safeword')
 */
export function isSafewordHook(h: unknown): boolean {
  return isHookObject(h) && h.command.includes('.safeword');
}

/**
 * Filter out safeword hooks from an array of hooks
 */
export function filterOutSafewordHooks(hooks: unknown[]): unknown[] {
  return hooks.filter((h) => !isSafewordHook(h));
}
