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
- Avoid bloat.
- If you asked a question above that's still relevant after review, re-ask it.`;

export const QUESTION_RESEARCH_MESSAGE = `SAFEWORD Research Prompt:

Before asking this question, do your research and investigate.
Explore and debate the options.

- What's most correct?
- What's most elegant?
- What's most in line with latest docs and best practices?
- Think hard and avoid bloat.

Then re-ask your question with the context you've gathered.`;
