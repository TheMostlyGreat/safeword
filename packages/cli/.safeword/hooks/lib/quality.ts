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
- If questions remain: research first, then ask targeted questions.
- Avoid bloat.
- If you asked a question above that's still relevant after review, re-ask it.

End your response with: {"proposedChanges": boolean, "madeChanges": boolean}
- proposedChanges: true if THIS response suggests new code/changes to implement
- madeChanges: true if THIS response used Edit/Write tools
- Review confirmations (like this) should report both as false`;
