# CLI UX Vision: Safeword

**Status:** 🟢 Complete

---

## Philosophy

- **Natural language** — Commands read like sentences
- **Progressive discovery** — Capabilities via `--help`
- **No modes** — Stateless commands
- **npx-first** — Always latest
- **Dual-audience** — Human + LLM readable

---

## Decisions

| Decision             | Choice                                         |
| -------------------- | ---------------------------------------------- |
| Package              | `safeword`                                     |
| Setup cmd            | `setup` (not `init`)                           |
| Bare cmd             | Show help                                      |
| Errors               | Medium verbosity                               |
| Versions             | Coupled (project = CLI)                        |
| Downgrade            | Refuse                                         |
| Hooks                | `$CLAUDE_PROJECT_DIR/.safeword/hooks/`         |
| Skills               | Copy to `.claude/skills/safeword-*/`           |
| Git hooks            | Marker-based append/remove                     |
| Linting              | Full install + configure                       |
| Linting failure      | Core failure, exit 1                           |
| Existing config      | Error: "Run `safeword upgrade`"                |
| Root file            | AGENTS.md only, **prepend** link               |
| AGENTS.md check      | SessionStart hook verifies, re-adds if missing |
| Offline check        | Graceful degradation                           |
| Non-git              | Prompt (auto-skip with `--yes`)                |
| Monorepo             | Root only                                      |
| User edits           | Overwritten on upgrade                         |
| Same-version upgrade | Force reinstall                                |
| Partial fail         | Exit 0 + warnings                              |
| Non-interactive      | Auto-TTY + `--yes`                             |
| Skill conflict       | Overwrite silently                             |
| Diff output          | Summary + `--verbose`                          |
| Reset AGENTS.md      | Search exact string, remove                    |
| Reset confirm        | Prompt (auto-confirm with `--yes`)             |
| package.json         | Add lint/format scripts                        |

---

## Commands (v1)

| Command            | Purpose                              |
| ------------------ | ------------------------------------ |
| `safeword`         | Show help                            |
| `safeword setup`   | Initialize (full setup with linting) |
| `safeword check`   | Health + versions                    |
| `safeword upgrade` | Update project (always reinstalls)   |
| `safeword diff`    | Preview changes                      |
| `safeword reset`   | Remove (prompts for confirm)         |

**Global Flags:**

- `--version` — Show CLI version
- `--help` — Show help

**Command Flags:**

- `--yes` — Accept defaults (no prompts)
- `--verbose` — Detailed output (for `diff`)
- `--offline` — Skip version check (for `check`)

**Deferred:** `doctor` (v1.x)

---

## File Structure

```
.safeword/
  SAFEWORD.md              # Core patterns
  version                  # "1.2.0"
  README.md                # "Managed by CLI"
  hooks/
  skills/
  guides/
  scripts/
  prompts/
  templates/

.claude/
  settings.json
  skills/safeword-*/

.git/hooks/
  pre-commit               # If git repo

AGENTS.md                  # With link prepended at top
```

---

## Setup Flow

1. Check for existing `.safeword/`
   - If exists → Error: "Already configured. Run `safeword upgrade` to update."
2. Detect project type (Next.js, React, TS, etc.)
3. Copy templates to `.safeword/`
4. Register hooks in `.claude/settings.json`
   - Includes SessionStart hook to verify AGENTS.md
5. Copy skills to `.claude/skills/safeword-*/`
6. Install + configure linting
   - Add `lint` and `format` scripts to package.json
   - If fails → Exit 1 (core failure)
7. Check for `.git/`
   - TTY: Prompt — Initialize git?
   - No TTY or `--yes`: Auto-skip with warning
8. Prepend link to `AGENTS.md` (create if missing)
9. Print summary

---

## Upgrade Flow

1. Check `.safeword/version` exists
   - If missing → Error: "Not configured. Run `safeword setup`."
2. Compare versions (for display only)
3. Overwrite all `.safeword/` files with CLI's templates
4. Update `.claude/skills/safeword-*/`
5. Update hooks if needed
6. Update `.safeword/version`
7. Print summary of changes

**Note:** Always reinstalls, even if same version.

---

## Commands on Unconfigured Project

| Command   | Behavior                                              |
| --------- | ----------------------------------------------------- |
| `check`   | Show "Not configured. Run `safeword setup`." (exit 0) |
| `diff`    | Error: "Not configured." (exit 1)                     |
| `reset`   | "Nothing to remove." (exit 0)                         |
| `upgrade` | Error: "Not configured." (exit 1)                     |

---

## Non-Interactive Behavior

**Auto-TTY detection:**

- Terminal (TTY) → Show prompts
- CI/pipe (no TTY) → Use defaults automatically

**`--yes` flag:**

- Force defaults even in terminal
- Defaults: skip git init, auto-confirm reset

---

## Hooks

**Claude Code:**

- Append to `.claude/settings.json` arrays
- Reference via `$CLAUDE_PROJECT_DIR/.safeword/hooks/`
- Remove by path pattern

**SessionStart hook** (new):

- Checks if AGENTS.md still has safeword link
- If missing, re-adds and alerts user

**Git pre-commit:**

- Marker-based: `SAFEWORD_ARCH_CHECK_START/END`
- Append or create
- Remove only between markers

---

## Skills

- Source: `.safeword/skills/X/SKILL.md`
- Destination: `.claude/skills/safeword-X/SKILL.md`
- Overwrite silently (we own this namespace)

---

## Root File Strategy

**Setup:**

1. Create `.safeword/SAFEWORD.md`
2. **Prepend** to `AGENTS.md` (create if missing):
   ```markdown
   **⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**
   ```
3. Check if link already exists (avoid duplicates)

**SessionStart Hook:**

- Verifies link still in AGENTS.md
- If removed, re-adds and shows warning

**Reset:**

- Search for exact string in `AGENTS.md`
- Remove the line

**Note:** Only handles AGENTS.md, not CLAUDE.md. Prepend for LLM primacy effect.

---

## package.json Updates

Setup adds these scripts:

```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

Also adds devDependencies for ESLint/Prettier.

---

## Reset Flow

1. Check `.safeword/` exists
   - If missing → "Nothing to remove." (exit 0)
2. Prompt: "This will remove safeword. Continue? [y/N]"
   - With `--yes`: auto-confirm
3. Remove `.safeword/`
4. Remove safeword hooks from `.claude/settings.json`
5. Remove safeword skills from `.claude/skills/`
6. Remove git hook markers from `.git/hooks/pre-commit`
7. Remove link from `AGENTS.md`
8. Print summary

**What reset leaves intact (by design):**

- `lint`/`format` scripts in package.json
- ESLint/Prettier devDependencies
- `eslint.config.mjs`, `.prettierrc`

**Rationale:** Linting config is useful independently. User may have customized. Standard CLI behavior is to leave configuration artifacts.

---

## Diff Command

**Default:** Summary only

```
Changes from v1.0.0 → v1.2.0:

Modified: 3 files
  .safeword/SAFEWORD.md
  .safeword/guides/testing-methodology.md
  .safeword/hooks/auto-quality-review.sh

Added: 1 file
  .safeword/guides/zombie-process-cleanup.md
```

**With `--verbose`:** Full unified diff

---

## Version Check

**Online (default):**

```
Safeword CLI: v1.2.0 (latest)
Project config: v1.0.0 (v1.2.0 available)
```

**Offline/timeout:**

```
Safeword CLI: v1.2.0
Project config: v1.0.0

Note: Couldn't check for updates (offline?)
```

---

## Exit Codes

| Code | Meaning                             |
| ---- | ----------------------------------- |
| 0    | Success (may have warnings)         |
| 1    | Failure (core functionality failed) |

**Core failures (exit 1):**

- Can't write to `.safeword/`
- Linting install fails
- Can't register hooks
- `diff`/`upgrade` on unconfigured

**Warnings (exit 0):**

- Git hooks skipped (no git)
- Version check failed (offline)
- `reset` on unconfigured

---

## Output Design

- Labeled values: `Project: v1.0.0`
- Explicit status: `(v1.2.0 available)`
- Symbols: `✓` `✗` `⚠`
- Action blocks: `To fix: safeword setup`

---

## Related

- [Ticket #005](../tickets/005-cli-implementation.md)
- [Implementation Plan](../../docs/001-cli-implementation-plan.md)
