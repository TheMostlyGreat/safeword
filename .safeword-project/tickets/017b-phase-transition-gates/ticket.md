---
id: 017b
type: feature
phase: intake
status: ready
parent: 017
created: 2026-01-10T20:23:00Z
last_modified: 2026-01-10T20:23:00Z
---

# Phase Transition Quality Gates

**User Story:** When I run `/bdd` and the agent moves from scenario definition to implementation, I want a quality gate so I can validate the plan before coding begins.

**Goal:** Trigger quality review at BDD phase boundaries, ensuring work is validated before moving to the next phase.

**Parent:** [017 - Continuous Quality Monitoring](../017-continuous-quality-monitoring/ticket.md)

## The Problem

Phase transitions are natural review points, but currently:

1. **No phase change detection** - PostToolUse doesn't know when phase changes
2. **No explicit gate** - Agent can flow from `decomposition` → `implement` without pause
3. **Cursor not phase-aware** - `cursor/stop.ts` uses generic message, not phase-specific

## Solution

### 1. Detect Phase Changes in PostToolUse

Track last known phase in `quality-state.json`:

```typescript
interface QualityMetrics {
  // ... existing fields from 017a
  lastKnownPhase: BddPhase | null;
}

function detectPhaseChange(currentPhase: BddPhase | undefined, state: QualityMetrics): boolean {
  if (!currentPhase) return false;
  if (state.lastKnownPhase === currentPhase) return false;

  // Phase changed
  state.lastKnownPhase = currentPhase;
  saveState(stateFile, state);
  return true;
}
```

### 2. Key Transitions That Require Gates

| From            | To        | Why Gate Here                      |
| --------------- | --------- | ---------------------------------- |
| define-behavior | scenario  | Scenarios ready for review         |
| decomposition   | implement | Plan ready, last chance to adjust  |
| implement       | done      | Code complete, verify before close |

### 3. Inject Phase-Appropriate Gate Message

```typescript
const PHASE_GATE_MESSAGES: Partial<Record<BddPhase, string>> = {
  'scenario-gate': `SAFEWORD: Entering scenario gate.

Validate each scenario before proceeding:
- Atomic: Tests ONE behavior?
- Observable: Externally visible outcome?
- Deterministic: Same result on repeat?

Type "scenarios validated" to proceed.`,

  implement: `SAFEWORD: Entering implement phase.

Review your decomposition:
- All components identified?
- Test layers assigned (unit/integration/E2E)?
- Task order by dependency?

Type "ready to implement" to proceed.`,

  done: `SAFEWORD: Entering done phase.

Before closing, verify:
- All scenarios marked [x]?
- Tests passing?
- Build passing?
- Lint clean?

Run /done for verification checklist.`,
};

function getPhaseGateMessage(phase: BddPhase): string | null {
  return PHASE_GATE_MESSAGES[phase] ?? null;
}
```

### 4. Fix Cursor Stop Hook Phase-Awareness

Current bug: `cursor/stop.ts` uses `QUALITY_REVIEW_MESSAGE` directly.

Fix:

```typescript
// cursor/stop.ts - BEFORE
import { QUALITY_REVIEW_MESSAGE } from '../lib/quality.ts';
// ...
followup_message: QUALITY_REVIEW_MESSAGE;

// cursor/stop.ts - AFTER
import { getQualityMessage } from '../lib/quality.ts';
// ...
const currentPhase = getCurrentPhase(); // same function as stop-quality.ts
followup_message: getQualityMessage(currentPhase);
```

This requires extracting `getCurrentPhase()` to `lib/quality.ts` for reuse.

## Implementation Steps

1. **Extract `getCurrentPhase()` to lib/quality.ts**
   - Move from `stop-quality.ts`
   - Export for use by both Claude Code and Cursor hooks

2. **Add phase tracking to quality-state.json**
   - Add `lastKnownPhase` field
   - Update on each PostToolUse

3. **Add phase gate messages**
   - Create `PHASE_GATE_MESSAGES` in `lib/quality.ts`
   - Add `getPhaseGateMessage()` function

4. **Wire phase detection into PostToolUse**
   - Detect phase changes
   - Inject gate message when entering key phases

5. **Fix Cursor stop.ts**
   - Use `getCurrentPhase()` and `getQualityMessage()`
   - Test phase-awareness in Cursor

## Acceptance Criteria

- [ ] Phase changes detected in PostToolUse
- [ ] Gate message injected when entering scenario-gate, implement, done
- [ ] `getCurrentPhase()` extracted to lib/quality.ts
- [ ] Cursor stop.ts uses phase-aware quality messages
- [ ] Phase tracked in quality-state.json
- [ ] No latency impact (phase read is fast)

## Testing

1. Create ticket in define-behavior phase
2. Change phase to scenario-gate → gate message appears
3. Change phase to decomposition → no gate (not a key transition)
4. Change phase to implement → gate message appears
5. Change phase to done → gate message appears
6. In Cursor: trigger stop hook → phase-appropriate message shown

## Work Log

---

- 2026-01-10T20:23:00Z Created: Phase transition gates and Cursor parity fix

---
