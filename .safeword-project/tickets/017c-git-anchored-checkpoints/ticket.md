---
id: 017c
type: feature
phase: intake
status: ready
parent: 017
created: 2026-01-10T20:23:00Z
last_modified: 2026-01-10T20:23:00Z
---

# Git-Anchored Checkpoints

**User Story:** When I run `/bdd` and quality review catches an issue mid-implementation, I want a clear rollback point so I can undo the problematic work without losing good progress.

**Goal:** Create human-readable checkpoints that enable easy rollback when quality issues are found.

**Parent:** [017 - Continuous Quality Monitoring](../017-continuous-quality-monitoring/ticket.md)

## The Problem

When quality monitoring (017a/017b) catches issues:

1. **No easy rollback** - Agent must manually identify what to undo
2. **No progress record** - Hard to see what was accomplished before the issue
3. **Claude's `/rewind` is opaque** - Works but doesn't explain what's being undone

## Solution: Git-Anchored Checkpoints

Create `.safeword-project/checkpoint.md` with git commit refs and human-readable summaries.

**Key principle:** Don't reinvent rollback. Git already does this perfectly. We just need good documentation.

## Checkpoint Format

```markdown
# Quality Checkpoint - 2026-01-10T19:30:00Z

## Git State

- Branch: `feature/auth-refactor`
- Last commit: `a1b2c3d` "Add OAuth provider interface"
- Uncommitted changes: 3 files (127 LOC)

## Progress Summary

- Phase: implement
- Scenarios: 5/8 complete
- Tests: 42 passing, 3 pending

## Changes Since Last Checkpoint

- Added: `src/auth/oauth.ts` (new provider abstraction)
- Modified: `src/auth/index.ts` (wire up provider)
- Modified: `tests/auth.test.ts` (add OAuth tests)

## Review Notes

- Approach validated
- Consider: extract token refresh to separate module

## Rollback Instructions

To revert to this checkpoint:

git stash && git checkout a1b2c3d
```

## Implementation

### 1. Auto-Commit Before Checkpoint

Ensure all work is captured in git before creating checkpoint:

```typescript
function createCheckpoint(): void {
  const hasChanges = execSync('git status --porcelain').toString().trim();

  if (hasChanges) {
    execSync('git add -A');
    execSync('git commit -m "checkpoint: before quality review"');
  }

  const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  const commitMessage = execSync('git log -1 --format=%s').toString().trim();

  writeCheckpointFile(commitHash, commitMessage);
}
```

### 2. Generate Checkpoint Content

```typescript
function generateCheckpointContent(commitHash: string, commitMessage: string): string {
  const branch = execSync('git branch --show-current').toString().trim();
  const phase = getCurrentPhase();
  const changedFiles = getChangedFilesSinceLastCheckpoint();

  return `# Quality Checkpoint - ${new Date().toISOString()}

## Git State
- Branch: \`${branch}\`
- Last commit: \`${commitHash}\` "${commitMessage}"
- Uncommitted changes: none (auto-committed)

## Progress Summary
- Phase: ${phase ?? 'unknown'}
- Changes: ${changedFiles.length} files

## Changes Since Last Checkpoint
${changedFiles.map((f) => `- ${f.status}: \`${f.path}\``).join('\n')}

## Rollback Instructions
To revert to this checkpoint:
\`\`\`bash
git checkout ${commitHash}
\`\`\`
`;
}
```

### 3. `/checkpoint` Command

Add manual checkpoint command (`.claude/commands/checkpoint.md`):

```yaml
---
description: Create a quality checkpoint with git commit
---
```

```markdown
# Create Checkpoint

Create a checkpoint of current work:

1. Stage and commit all changes
2. Generate `.safeword-project/checkpoint.md`
3. Report checkpoint hash and summary

Use this before risky refactors or when you want a restore point.
```

### 4. Automatic Checkpoint Triggers

Checkpoints created automatically when:

| Trigger                  | Reason                         |
| ------------------------ | ------------------------------ |
| LOC hard threshold (400) | Before quality review required |
| Phase transition         | Before entering new phase      |
| Quality review completes | After agent confirms review    |
| User runs `/checkpoint`  | Manual save point              |

## Checkpoint History

Keep last 5 checkpoints in `.safeword-project/checkpoints/`:

```
.safeword-project/
  checkpoint.md           # Current/latest checkpoint
  checkpoints/
    2026-01-10T19-30-00Z.md
    2026-01-10T18-45-00Z.md
    2026-01-10T17-20-00Z.md
```

## Rollback Flow

When quality issues found:

1. Agent suggests: "Quality issues found. Rollback to checkpoint?"
2. User confirms → Agent runs `git checkout <hash>`
3. Agent reads checkpoint.md for context on what was rolled back
4. Resume from that point

## Acceptance Criteria

- [ ] Auto-commit before checkpoint creation
- [ ] `checkpoint.md` generated with git refs
- [ ] `/checkpoint` command works
- [ ] Checkpoint history kept (last 5)
- [ ] Rollback instructions included and correct
- [ ] Phase and progress included in checkpoint
- [ ] Works in both Claude Code and Cursor
- [ ] No disruption to normal git workflow

## Testing

1. Make changes → run `/checkpoint` → verify commit created
2. Make more changes → run `/checkpoint` → verify history preserved
3. Follow rollback instructions → verify correct state restored
4. Trigger LOC threshold → verify auto-checkpoint created
5. Change phase → verify checkpoint created at transition

## Work Log

---

- 2026-01-10T20:23:00Z Created: Git-anchored checkpoint system

---
