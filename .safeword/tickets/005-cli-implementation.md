---
id: 005
status: pending
created: 2025-11-27
github: https://github.com/TheMostlyGreat/safeword/issues/1
---

# Implement TypeScript CLI

**Goal:** Ship TypeScript CLI (`safeword`) that replaces bash scripts with elite developer experience.

**Why:** Bash scripts are hard to maintain, test, and extend. CLI improves DX for setup, verification, and team onboarding.

## Planning Docs

- [CLI UX Vision](../planning/011-cli-ux-vision.md) — All decisions and architecture

## Key Decisions

| Decision             | Choice                                         |
| -------------------- | ---------------------------------------------- |
| Package              | `safeword`                                     |
| Commands             | setup, check, upgrade, diff, reset             |
| Global flags         | `--version`, `--help`                          |
| Non-interactive      | Auto-TTY + `--yes`                             |
| Existing config      | Error: "Run `safeword upgrade`"                |
| Same-version upgrade | Force reinstall                                |
| Linting failure      | Core failure, exit 1                           |
| No git               | Prompt (auto-skip with `--yes`)                |
| AGENTS.md            | Prepend link (LLM primacy)                     |
| AGENTS.md check      | SessionStart hook verifies, re-adds if missing |
| package.json         | Add lint/format scripts                        |
| Reset confirm        | Prompt (auto-confirm with `--yes`)             |
| Skill conflict       | Overwrite silently                             |
| Diff output          | Summary + `--verbose`                          |

## Scope

### v1 Commands

| Command              | Purpose                            |
| -------------------- | ---------------------------------- |
| `safeword`           | Show help                          |
| `safeword --version` | Show CLI version                   |
| `safeword setup`     | Full setup (error if exists)       |
| `safeword check`     | Health + versions                  |
| `safeword upgrade`   | Update project (always reinstalls) |
| `safeword diff`      | Preview changes                    |
| `safeword reset`     | Remove (prompts confirm)           |

### Flags

- `--version` — Show CLI version (global)
- `--help` — Show help (global)
- `--yes` — Accept defaults (skip prompts, auto-confirm)
- `--verbose` — Detailed output (diff)
- `--offline` — Skip version check (check)

### Setup Flow

1. Check existing → error if found
2. Detect project type
3. Copy templates to `.safeword/`
4. Register Claude Code hooks (incl. SessionStart for AGENTS.md check)
5. Copy skills to `.claude/skills/safeword-*/`
6. Install + configure linting (exit 1 if fails)
7. Add lint/format scripts to package.json
8. Handle git (prompt or auto-skip)
9. Prepend link to `AGENTS.md` (create if missing)

### Commands on Unconfigured

| Command   | Behavior                     |
| --------- | ---------------------------- |
| `check`   | "Not configured" (exit 0)    |
| `diff`    | Error (exit 1)               |
| `reset`   | "Nothing to remove" (exit 0) |
| `upgrade` | Error (exit 1)               |

### Out of Scope (v1.x)

- `safeword doctor`
- Claude Code plugin wrapper
- MCP server management
- Per-package monorepo support
- CLAUDE.md handling (only AGENTS.md)

## Acceptance Criteria

- [ ] `npx safeword --version` shows version
- [ ] `npx safeword setup` works (interactive)
- [ ] `npx safeword setup --yes` works (non-interactive)
- [ ] Auto-detects no-TTY and uses defaults
- [ ] Setup errors if `.safeword/` exists
- [ ] Prompts to init git if missing
- [ ] Prepends link to `AGENTS.md`
- [ ] SessionStart hook checks AGENTS.md, re-adds if missing
- [ ] Full linting setup (exit 1 if fails)
- [ ] Adds lint/format scripts to package.json
- [ ] `npx safeword check` shows health + versions
- [ ] `check` on unconfigured shows "Not configured"
- [ ] Version check gracefully handles offline
- [ ] `npx safeword upgrade` always reinstalls
- [ ] `npx safeword diff` shows summary
- [ ] `npx safeword diff --verbose` shows full diff
- [ ] `diff` on unconfigured errors
- [ ] `npx safeword reset` prompts for confirm
- [ ] `npx safeword reset --yes` auto-confirms
- [ ] `reset` on unconfigured says "Nothing to remove"
- [ ] Reset removes line from `AGENTS.md`
- [ ] Preserves existing Claude Code hooks
- [ ] Preserves existing git pre-commit hooks
- [ ] Refuses to downgrade project
- [ ] Exit 0 with warnings for partial success
- [ ] Exit 1 for core failures
- [ ] Published to npm as `safeword`
- [ ] README updated
- [ ] Tested in 3+ real projects

## Technical Notes

### File Structure

```
.safeword/
  SAFEWORD.md, version, README.md
  hooks/, skills/, guides/, scripts/, prompts/, templates/

.claude/
  settings.json
  skills/safeword-*/

.git/hooks/
  pre-commit (if git)

AGENTS.md (link prepended at top)
```

### Non-Interactive Behavior

- No TTY → auto-defaults
- `--yes` → force defaults in terminal
- Defaults: skip git init, auto-confirm reset

### Exit Codes

- 0 = Success (warnings OK)
- 1 = Core failure

### Hook Coexistence

- Claude: Append/remove by path pattern
- Git: Marker-based (`SAFEWORD_ARCH_CHECK_START/END`)

### AGENTS.md Handling

- Setup: Prepend link (check for duplicates first)
- SessionStart: Verify link exists, re-add with alert if missing
- Reset: Search exact string, remove
- Only AGENTS.md (not CLAUDE.md)

### package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

**Note:** Reset leaves these intact (standard CLI behavior). User removes manually if wanted.

## Refactor Plan

Minimal refactoring to improve code quality while keeping all 88 tests green.

### 1. Extract Version Utilities

**Why:** `compareVersions` in `upgrade.ts` and `isNewerVersion` in `check.ts` duplicate semver comparison logic.

**Changes:**

- Create `src/utils/version.ts` with:
  - `compareVersions(a: string, b: string): -1 | 0 | 1`
  - `isNewerVersion(current: string, latest: string): boolean`
- Update `upgrade.ts` to import `compareVersions`
- Update `check.ts` to import `isNewerVersion`
- Remove duplicate implementations

**Files affected:**

- `src/utils/version.ts` (new)
- `src/commands/upgrade.ts` (remove local function)
- `src/commands/check.ts` (remove local function)

### 2. Split Templates File

**Why:** `src/templates/index.ts` at 180+ lines mixes content templates with configuration objects.

**Changes:**

- Create `src/templates/content.ts` for markdown/script content:
  - `SAFEWORD_MD`, `AGENTS_MD_LINK`, `PRETTIERRC`
  - `HOOK_AGENTS_CHECK`, `HOOK_PRE_COMMIT`, `HOOK_POST_TOOL`
  - `SKILL_QUALITY_REVIEWER`
- Create `src/templates/config.ts` for configuration:
  - `getEslintConfig()`
  - `SETTINGS_HOOKS`
- Update `src/templates/index.ts` to re-export all

**Files affected:**

- `src/templates/content.ts` (new)
- `src/templates/config.ts` (new)
- `src/templates/index.ts` (becomes re-export barrel)

### Verification

After each refactor:

1. `npx tsup` - must build successfully
2. `npx vitest run` - all 88 tests must pass

### Out of Scope

- Command structure changes (not worth the churn)
- Type improvements for hook filtering (works fine)
- Adding new abstractions (avoid over-engineering)

### Refactor Checklist

- [ ] Extract version utilities
- [ ] Verify tests pass
- [ ] Split templates file
- [ ] Verify tests pass
- [ ] Final review

## Work Log

- 2025-11-27 Created ticket
- 2025-11-27 Added UX vision decisions
- 2025-11-27 Final: TTY detection, `--yes` defaults, diff format, skill conflicts
- 2025-11-27 Final: --version, setup errors if exists, linting=exit 1, upgrade reinstalls
- 2025-11-27 Final: AGENTS.md prepend, SessionStart hook, package.json scripts, reset confirm, unconfigured behavior
- 2025-11-28 GREEN phase complete: All 88 tests passing
- 2025-11-28 Added refactor plan
