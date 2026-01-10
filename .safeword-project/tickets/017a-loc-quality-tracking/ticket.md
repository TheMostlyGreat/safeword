---
id: 017a
type: feature
phase: intake
status: ready
parent: 017
created: 2026-01-10T20:23:00Z
last_modified: 2026-01-10T20:23:00Z
---

# LOC-Based Quality Tracking in PostToolUse

**User Story:** When I run `/bdd` and the agent implements for 30+ minutes straight, I want quality checks to happen automatically so I don't discover compounding errors at the end.

**Goal:** Trigger quality reviews based on cumulative lines of code changed, catching issues before they compound.

**Parent:** [017 - Continuous Quality Monitoring](../017-continuous-quality-monitoring/ticket.md)

## The Solution

Enhance `post-tool-lint.ts` to track cumulative LOC changed and inject quality reminders at thresholds.

```typescript
// .safeword-project/quality-state.json
interface QualityMetrics {
  linesAdded: number;
  linesRemoved: number;
  totalLinesChanged: number; // linesAdded + linesRemoved
  lintWarnings: number;
  lastQualityReview: string; // ISO timestamp
  lastCommitHash: string;
  sessionStart: string; // ISO timestamp
}
```

## Thresholds

| Trigger       | Threshold            | Action                                             |
| ------------- | -------------------- | -------------------------------------------------- |
| LOC soft      | 200 lines changed    | Inject reminder: "Consider quality checkpoint"     |
| LOC hard      | 400 lines changed    | Block: "Quality review required before continuing" |
| Time soft     | 20 min (if LOC > 50) | Inject reminder                                    |
| Time hard     | 45 min (regardless)  | Block until acknowledged                           |
| Lint warnings | 3+ warnings          | Accelerate to hard threshold                       |
| Test failure  | Any failure          | Immediate block                                    |

**Why these numbers:**

- Industry research shows 200-400 LOC per review session is optimal
- Beyond 400 LOC, reviewers skim instead of understanding
- Teams with <400 LOC reviews see 40% fewer production defects

## Implementation

### 1. Calculate LOC on Each Edit

```typescript
// In post-tool-lint.ts, after linting
import { execSync } from 'node:child_process';

function getLOCChanged(file: string): { added: number; removed: number } {
  try {
    // Get diff stats for this file (staged + unstaged)
    const diff = execSync(`git diff --numstat HEAD -- "${file}"`, {
      encoding: 'utf-8',
    });
    const [added, removed] = diff.trim().split('\t').map(Number);
    return { added: added || 0, removed: removed || 0 };
  } catch {
    return { added: 0, removed: 0 };
  }
}
```

### 2. Update Quality State

```typescript
const stateFile = `${projectDir}/.safeword-project/quality-state.json`;

function updateQualityState(loc: { added: number; removed: number }) {
  let state: QualityMetrics = loadState(stateFile);

  state.linesAdded += loc.added;
  state.linesRemoved += loc.removed;
  state.totalLinesChanged = state.linesAdded + state.linesRemoved;

  saveState(stateFile, state);
  return state;
}
```

### 3. Check Thresholds and Inject Message

```typescript
function checkThresholds(state: QualityMetrics): string | null {
  const minutesSinceReview = getMinutesSince(state.lastQualityReview);

  // Hard blocks
  if (state.totalLinesChanged >= 400) {
    return 'SAFEWORD: 400+ LOC changed. Quality review required before continuing.';
  }
  if (minutesSinceReview >= 45) {
    return 'SAFEWORD: 45+ minutes since last review. Quality checkpoint required.';
  }

  // Soft reminders
  if (state.totalLinesChanged >= 200) {
    return 'SAFEWORD: 200+ LOC changed. Consider a quality checkpoint.';
  }
  if (minutesSinceReview >= 20 && state.totalLinesChanged > 50) {
    return 'SAFEWORD: 20+ minutes since last review. Consider a quality checkpoint.';
  }

  return null;
}
```

### 4. Reset After Quality Review

When the Stop hook fires (quality review happens), reset the counters:

```typescript
// In stop-quality.ts, after quality review triggers
function resetQualityState() {
  const state: QualityMetrics = {
    linesAdded: 0,
    linesRemoved: 0,
    totalLinesChanged: 0,
    lintWarnings: 0,
    lastQualityReview: new Date().toISOString(),
    lastCommitHash: getCurrentCommitHash(),
    sessionStart: new Date().toISOString(),
  };
  saveState(stateFile, state);
}
```

## Cursor Parity

The same logic works in Cursor's `after-file-edit.ts`:

1. Calculate LOC changed
2. Update `.safeword-project/quality-state.json`
3. Check thresholds
4. Output message if threshold exceeded (Cursor will display to user)

## Edge Cases

| Case                        | Handling                                     |
| --------------------------- | -------------------------------------------- |
| New file (no git diff)      | Count entire file as added                   |
| New repo (no commits yet)   | Skip LOC tracking until first commit         |
| Binary file                 | Skip LOC tracking                            |
| File outside git repo       | Skip LOC tracking                            |
| State file missing          | Initialize with zeros                        |
| Commit happens mid-session  | Reset counters (new baseline)                |
| Agent acknowledges reminder | Reset counters (manual checkpoint)           |
| Multiple files in one edit  | Sum all LOC changes                          |
| Revert (negative net LOC)   | Still count total (added + removed, not net) |

## Acceptance Criteria

- [ ] `quality-state.json` tracks cumulative LOC per session
- [ ] Soft reminder at 200 LOC changed
- [ ] Hard block at 400 LOC changed
- [ ] Time-based fallback at 45 min
- [ ] Counters reset after quality review fires
- [ ] Counters reset after commit
- [ ] Works in both Claude Code and Cursor
- [ ] No noticeable latency (<50ms per edit)
- [ ] State file in `.safeword-project/` (survives upgrade)

## Testing

1. Make 10 small edits (< 200 LOC total) → no reminder
2. Make edits totaling 200 LOC → soft reminder
3. Make edits totaling 400 LOC → hard block
4. Trigger quality review → counters reset
5. Make a commit → counters reset
6. Wait 45 min with any edits → hard block

## Work Log

---

- 2026-01-10T20:23:00Z Created: Core solution for LOC-based quality tracking

---
