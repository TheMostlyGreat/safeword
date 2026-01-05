// Shared quality review message for Claude Code and Cursor hooks
// Used by: stop-quality.ts, cursor/stop.ts

export type BddPhase =
  | 'intake'
  | 'define-behavior'
  | 'scenario-gate'
  | 'decomposition'
  | 'implement'
  | 'done';

const JSON_SUFFIX = `

End your response with: {"proposedChanges": boolean, "madeChanges": boolean}
- proposedChanges: true if THIS response suggests new code/changes to implement
- madeChanges: true if THIS response used Edit/Write tools
- Review confirmations (like this) should report both as false`;

const PHASE_MESSAGES: Record<BddPhase, string> = {
  intake: `SAFEWORD Quality Review (Discovery Phase):

Check your discovery work:
- Are edge cases covered?
- Is scope clear and bounded?
- Are failure modes identified?
- Is there anything the user hasn't considered?

Research before asking. Avoid bloat.${JSON_SUFFIX}`,

  'define-behavior': `SAFEWORD Quality Review (Scenario Phase):

Check your scenarios:
- Is each scenario atomic (tests ONE behavior)?
- Is each outcome observable (externally visible)?
- Is each scenario deterministic (same result on repeat)?
- Are happy path, failure modes, and edge cases covered?

Research before asking. Avoid bloat.${JSON_SUFFIX}`,

  'scenario-gate': `SAFEWORD Quality Review (Scenario Gate):

Validate scenarios against testability criteria:
- Atomic: Does it test ONE behavior? (Red flag: multiple When/Then pairs)
- Observable: Is outcome externally visible? (Red flag: internal state only)
- Deterministic: Same result on repeat? (Red flag: time/random/external dependency)

If issues found, suggest specific fixes.${JSON_SUFFIX}`,

  decomposition: `SAFEWORD Quality Review (Decomposition Phase):

Check your technical breakdown:
- Right test layer for each component? (unit/integration/E2E)
- Missing components or seams?
- Dependencies ordered correctly?
- Task breakdown clear and implementable?

Research before asking. Avoid bloat.${JSON_SUFFIX}`,

  implement: `SAFEWORD Quality Review:

Double check and critique your work again just in case.
Assume you've never seen it before.

- Is it correct?
- Is it elegant?
- Does it follow latest docs/best practices?
- If questions remain: research first, then ask targeted questions.
- Avoid bloat.
- If you asked a question above that's still relevant after review, re-ask it.${JSON_SUFFIX}`,

  done: `SAFEWORD Quality Review (Done Phase):

Final cleanup check:
- Any dead code to remove?
- Any flaky tests detected?
- Are docs updated to match implementation?
- Cross-scenario duplication to extract?
- Architecture drift from Phase 5 design?

Run /verify and /audit if not already done.${JSON_SUFFIX}`,
};

/**
 * The default quality review prompt (backwards compatible).
 * Used when no phase is detected.
 */
export const QUALITY_REVIEW_MESSAGE = PHASE_MESSAGES.implement;

/**
 * Get phase-appropriate quality review message.
 * Falls back to default (implement) if phase unknown.
 */
export function getQualityMessage(phase?: BddPhase | string): string {
  if (phase && phase in PHASE_MESSAGES) {
    return PHASE_MESSAGES[phase as BddPhase];
  }
  return QUALITY_REVIEW_MESSAGE;
}
