---
id: 016a
type: task
phase: implement
status: ready
parent: '016'
created: 2026-01-10T18:40:00Z
last_modified: 2026-01-10T19:51:00Z
---

# Block unsafe git operations from LLMs

**Goal:** Add `permissions.deny` section to `.claude/settings.json` to block unsafe operations.

**Why:** LLMs can bypass pre-commit hooks with `--no-verify`, skip tests with `--skip`, or force-push. These should require explicit override.

## Operations to Deny

| Pattern                  | Risk                      | Why Block                 |
| ------------------------ | ------------------------- | ------------------------- |
| `git commit --no-verify` | Bypasses pre-commit hooks | Skips lint-staged, tests  |
| `git commit -n`          | Same as --no-verify       | Short form alias          |
| `git push --force`       | Destructive               | Can overwrite team's work |
| `git push -f`            | Same as --force           | Short form alias          |
| `npm test -- --skip`     | Skips tests               | False confidence          |
| `bun test --skip`        | Skips tests               | False confidence          |

## Implementation Plan

Add to `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": [
      "Bash(git commit --no-verify*)",
      "Bash(git commit -n*)",
      "Bash(git push --force*)",
      "Bash(git push -f*)",
      "Bash(*--no-verify*)",
      "Bash(*--skip*)"
    ]
  }
}
```

## Alternative: Regex Patterns

If Claude Code supports regex in deny patterns:

```json
{
  "permissions": {
    "deny": [
      "Bash(git commit.*(--no-verify|-n))",
      "Bash(git push.*(--force|-f))",
      "Bash(.*--skip.*)"
    ]
  }
}
```

## Acceptance Criteria

- [ ] `permissions.deny` section added to settings.json
- [ ] Blocks `git commit --no-verify` and `-n`
- [ ] Blocks `git push --force` and `-f`
- [ ] Blocks `--skip` flag in test commands
- [ ] Added to SETTINGS_JSON constant in schema.ts for customer projects
- [ ] Tested that deny patterns actually block (manual verification)

## Research Needed

- [ ] Verify exact syntax for Claude Code permissions.deny patterns
- [ ] Check if regex patterns are supported
- [ ] Determine if wildcards use glob or regex syntax

## Work Log

---

- 2026-01-10T19:51:00Z Renumbered: 016c → 016a (execution priority - quick win first)
- 2026-01-10T18:40:00Z Created: Split from ticket 015 audit findings

---
