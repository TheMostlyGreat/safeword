// Shared quality review message for Claude Code and Cursor hooks
// Used by: stop-quality.ts, cursor/stop.ts

/**
 * The quality review prompt shown when changes are made.
 * Used by both Claude Code Stop hook and Cursor stop hook.
 */
export const QUALITY_REVIEW_MESSAGE = `SAFEWORD Quality Review:

Double check and critique your work again just in case.
Assume you've never seen it before.

- Is it correct?
- Is it elegant?
- Does it follow latest docs/best practices?
- Ask me any non-obvious questions.
- Avoid bloat.`;
