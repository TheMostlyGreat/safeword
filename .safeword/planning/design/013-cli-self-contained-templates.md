# CLI Self-Contained Templates

**Date:** 2025-11-28
**Status:** Planning
**Ticket:** TBD

---

## Problem & Goal

**Problem:** CLI embeds stub templates; full content (guides, SAFEWORD.md) lives in `framework/` and isn't bundled.

**Goal:** Make `npx safeword` fully self-contained by bundling all templates.

---

## Current State

```
packages/cli/
├── src/templates/
│   ├── content.ts      # Hardcoded string constants (stubs only)
│   └── config.ts       # ESLint configs
├── templates/
│   ├── doc-templates/
│   │   └── ticket-template.md
│   └── hooks/
│       └── inject-timestamp.sh
```

**Problems:**
- `SAFEWORD_MD` in content.ts is a 38-line stub, not the full 31KB file
- No guides copied to user projects
- No doc templates copied
- Maintaining markdown as escaped TS strings is error-prone

---

## Proposed Structure

```
packages/cli/
├── src/
│   ├── cli.ts                    # Entry point with shebang
│   ├── index.ts                  # Library exports
│   ├── version.ts
│   ├── commands/
│   │   ├── check.ts
│   │   ├── diff.ts
│   │   ├── reset.ts
│   │   ├── setup.ts
│   │   └── upgrade.ts
│   ├── utils/
│   │   ├── fs.ts
│   │   ├── git.ts
│   │   ├── output.ts
│   │   ├── project-detector.ts
│   │   ├── templates.ts          # NEW: Template file reader
│   │   └── version.ts
│   └── config/                   # RENAMED from src/templates/
│       ├── eslint.ts             # ESLint config generation
│       ├── hooks.ts              # SETTINGS_HOOKS for .claude/settings.json
│       └── index.ts
├── templates/
│   ├── README.md                 # Documents bundled assets
│   ├── safeword/                 # → .safeword/ (no dot to avoid npm issues)
│   │   ├── SAFEWORD.md           # Full 31KB version
│   │   ├── guides/               # 13 methodology guides
│   │   ├── doc-templates/        # 5 doc templates (renamed from templates/)
│   │   ├── prompts/              # 2 review prompts
│   │   ├── hooks/                # Claude Code hooks (registered in .claude/settings.json)
│   │   │   ├── session-verify-agents.sh  # SessionStart: verify AGENTS.md
│   │   │   ├── session-version.sh        # SessionStart: display version
│   │   │   ├── session-lint-check.sh     # SessionStart: linting sync check
│   │   │   ├── prompt-timestamp.sh       # UserPromptSubmit: inject timestamp
│   │   │   ├── prompt-questions.sh       # UserPromptSubmit: guide questions
│   │   │   ├── stop-quality.sh           # Stop: trigger quality review
│   │   │   └── post-tool-lint.sh         # PostToolUse: auto-lint files
│   │   ├── lib/                  # Shared scripts (called by hooks, not registered)
│   │   │   ├── _lib-quality-prompt.sh    # Quality review prompt content
│   │   │   └── _lib-run-linters.sh       # Prettier + ESLint runner
│   │   └── git/                  # Git hooks (installed to .git/hooks/)
│   │       └── git-pre-commit.sh         # Pre-commit linting
│   └── claude/                   # → .claude/ (MUST be .claude/ per Claude Code docs)
│       ├── commands/             # Slash commands (must be in .claude/commands/)
│       │   ├── quality-review.md
│       │   ├── arch-review.md
│       │   └── lint.md
│       └── skills/               # Skills (must be in .claude/skills/)
│           └── quality-reviewer/
│               └── SKILL.md      # Full skill with YAML frontmatter
│   # Note: MCP configs go in .mcp.json at project root, not in .claude/
├── tests/
├── dist/
├── ARCHITECTURE.md
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

**Key decisions:**
- Use `safeword/` and `claude/` (no dots) to avoid npm ignore issues, rename to `.safeword/` and `.claude/` at copy time
- Rename `templates/` → `doc-templates/` to avoid `templates/templates/` confusion
- **Hooks live in `.safeword/hooks/`** - scripts are stored here, referenced from `.claude/settings.json`
- **Commands MUST go to `.claude/commands/`** - Claude Code hardcodes this path
- **Skills MUST go to `.claude/skills/`** - Claude Code hardcodes this path
- **No CLAUDE.md creation** - Only update existing AGENTS.md or create minimal one with link
- **`learnings/` folder** - Created on setup, preserved on upgrade/reset (user content)
- **Merge settings.json** - Don't overwrite existing settings, merge hooks into existing file
- Use full skill file from `framework/skills/`, not the stub
- Don't bundle `framework/scripts/` - these are legacy bash scripts replaced by CLI
- Create empty planning/tickets/learnings directories programmatically
- Keep `src/config/hooks.ts` for `SETTINGS_HOOKS` constant (writes to `.claude/settings.json`)
- **ESM-only** - No CJS support needed for CLI targeting Node 18+
- **ESLint/Prettier always set up** - Core part of safeword, but preserve existing configs if present

---

## Files to Migrate

### To `.safeword/`

| From | To | Count |
|------|-----|-------|
| `framework/SAFEWORD.md` | `templates/safeword/SAFEWORD.md` | 1 |
| `framework/guides/*.md` | `templates/safeword/guides/` | 13 |
| `framework/templates/*.md` | `templates/safeword/doc-templates/` | 5 |
| `framework/prompts/*.md` | `templates/safeword/prompts/` | 2 |

### To `.safeword/hooks/`, `.safeword/lib/`, `.safeword/git/`

All hooks consolidated from legacy setup scripts with new naming convention:

| Source | Old Name | New Name | Location | Hook Event |
|--------|----------|----------|----------|------------|
| CLI existing | `agents-md-check.sh` | `session-verify-agents.sh` | `hooks/` | SessionStart |
| `setup-quality.sh` | `version-check.sh` | `session-version.sh` | `hooks/` | SessionStart |
| `setup-linting.sh` | `check-linting-sync.sh` | `session-lint-check.sh` | `hooks/` | SessionStart |
| `setup-safeword.sh` | `inject-timestamp.sh` | `prompt-timestamp.sh` | `hooks/` | UserPromptSubmit |
| `.claude/hooks/` | `question-protocol.sh` | `prompt-questions.sh` | `hooks/` | UserPromptSubmit |
| `setup-quality.sh` | `auto-quality-review.sh` | `stop-quality.sh` | `hooks/` | Stop |
| `setup-linting.sh` | `auto-lint.sh` | `post-tool-lint.sh` | `hooks/` | PostToolUse |
| `setup-quality.sh` | `run-quality-review.sh` | `_lib-quality-prompt.sh` | `lib/` | (shared) |
| `setup-linting.sh` | `run-linters.sh` | `_lib-run-linters.sh` | `lib/` | (shared) |
| CLI existing | `pre-commit.sh` | `git-pre-commit.sh` | `git/` | (git hook) |

### To `.claude/commands/` (must be .claude/ per Claude Code docs)

| Source | File | Purpose |
|--------|------|---------|
| `setup-quality.sh` | `quality-review.md` | Manual quality review trigger |
| existing | `arch-review.md` | Trigger architecture review |
| `setup-linting.sh` | `lint.md` | Run linting on all files |

### To `.claude/skills/`

| From | To |
|------|-----|
| `framework/skills/quality-reviewer/` | `templates/claude/skills/quality-reviewer/` |

**Not bundled:**
- `framework/scripts/` - Legacy bash scripts (replaced by CLI)
- `framework/README.md` - Documentation only
- Empty directory structures (created programmatically)

**Total:** 35 files (21 in `.safeword/` + 7 hooks + 2 lib + 1 git + 3 commands + 1 skill)

**Note:** Commands and skills MUST be in `.claude/` - Claude Code does not support custom paths.
**Note:** MCP configs go in `.mcp.json` at project root (not in `.claude/`).

---

## Hook System

**Architecture:** Scripts in `.safeword/hooks/` are registered in `.claude/settings.json`. Naming pattern: `{event}-{action}.sh`

### Directory Structure

```
.safeword/
├── hooks/           # Claude Code hooks (registered in settings.json)
│   ├── session-verify-agents.sh   # SessionStart: verify AGENTS.md
│   ├── session-version.sh         # SessionStart: display version
│   ├── session-lint-check.sh      # SessionStart: linting sync check
│   ├── prompt-questions.sh        # UserPromptSubmit: guide questions
│   ├── prompt-timestamp.sh        # UserPromptSubmit: inject timestamp
│   ├── stop-quality.sh            # Stop: trigger quality review
│   └── post-tool-lint.sh          # PostToolUse: auto-lint (matcher supported)
├── lib/             # Shared scripts (not registered, called by hooks)
│   ├── _lib-quality-prompt.sh     # Quality review prompt content
│   └── _lib-run-linters.sh        # Prettier + ESLint runner
└── git/             # Git hooks (installed to .git/hooks/)
    └── git-pre-commit.sh          # Pre-commit linting
```

### SETTINGS_HOOKS (Canonical)

⚠️ **CRITICAL:** Current CLI uses incorrect flat format. Must use nested format with `_safeword: true` marker:

```typescript
// src/config/hooks.ts - writes to .claude/settings.json
export const SETTINGS_HOOKS = {
  SessionStart: [
    { _safeword: true, hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/session-verify-agents.sh', timeout: 5000 }] },
    { _safeword: true, hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/session-version.sh', timeout: 5000 }] },
    { _safeword: true, hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/session-lint-check.sh', timeout: 5000 }] },
  ],
  UserPromptSubmit: [
    // Note: matcher not supported on UserPromptSubmit - runs on all prompts
    { _safeword: true, hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/prompt-questions.sh', timeout: 2000 }] },
    { _safeword: true, hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/prompt-timestamp.sh', timeout: 2000 }] },
  ],
  Stop: [
    { _safeword: true, hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/stop-quality.sh', timeout: 120000 }] },
  ],
  PostToolUse: [
    // matcher IS supported on PostToolUse - filters by tool name
    { _safeword: true, matcher: 'Write|Edit|MultiEdit|NotebookEdit', hooks: [{ type: 'command', command: '$CLAUDE_PROJECT_DIR/.safeword/hooks/post-tool-lint.sh', timeout: 10000 }] },
  ],
};
```

---

## Claude Code Skills Configuration

**Current issue:** The skill installed by CLI (`safeword-quality-reviewer/SKILL.md`) is a 12-line stub missing YAML frontmatter.

**Required format per Claude Code docs:**

```yaml
---
name: safeword-quality-reviewer
description: Deep code quality review with web research. Use when user explicitly requests verification against latest docs, needs deeper analysis, or is working on projects without SAFEWORD.md/CLAUDE.md.
allowed-tools: '*'
---

# Quality Reviewer

[Full skill content - 208 lines from framework/skills/quality-reviewer/SKILL.md]
```

**Required YAML frontmatter fields:**
| Field | Required | Format |
|-------|----------|--------|
| `name` | Yes | Lowercase letters, numbers, hyphens only (max 64 chars) |
| `description` | Yes | What it does AND when Claude should use it (max 1024 chars) |
| `allowed-tools` | No | Comma-separated tool list or `'*'` for all |

**Implementation:** Copy the full `framework/skills/quality-reviewer/SKILL.md` (208 lines with proper frontmatter) to `templates/claude/skills/safeword-quality-reviewer/SKILL.md`.

---

## Claude Code Commands (Not Currently Installed)

The CLI currently does NOT install slash commands. Consider adding in future:

**Storage location:** `.claude/commands/`

**Potential commands to bundle:**
| Command | Purpose |
|---------|---------|
| `quality-review.md` | Trigger manual quality review |
| `arch-review.md` | Trigger architecture review |

**Format:**
```yaml
---
description: Brief command description
---

Command instructions...
```

**Decision:** Commands are optional for MVP. Focus on skills and hooks first.

---

## Package.json Updates

The current `package.json` needs these improvements per [2024/2025 npm best practices](https://snyk.io/blog/building-npm-package-compatible-with-esm-and-cjs-2024/):

### Current
```json
{
  "name": "safeword",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "safeword": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "templates"],
  "engines": { "node": ">=18" }
}
```

### Updated
```json
{
  "name": "safeword",
  "version": "0.1.0",
  "description": "CLI for setting up AI coding agent configurations",
  "type": "module",
  "bin": {
    "safeword": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "templates"],
  "sideEffects": false,
  "engines": { "node": ">=18" },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/safeword"
  },
  "homepage": "https://github.com/your-org/safeword#readme",
  "bugs": {
    "url": "https://github.com/your-org/safeword/issues"
  }
}
```

**Changes:**
1. **`types` first in exports** - TypeScript resolution requires types condition before import
2. **`sideEffects: false`** - Enables tree-shaking for bundlers
3. **`repository`, `homepage`, `bugs`** - Proper npm registry display

---

## Implementation Snippets

See **[013b-implementation-snippets.md](./013b-implementation-snippets.md)** for all code examples:
- Template reader (`src/utils/templates.ts`)
- Setup/upgrade usage patterns
- Settings.json merge logic
- Linting setup (preserve existing)
- Error handling & rollback
- ESLint plugin installation
- MCP config setup & cleanup
- Hook output format (`hookSpecificOutput`)
- Slash command templates
- Testing examples (unit, integration, promptfoo)

---

## Migration Steps

> **Goal:** Bundle all templates into CLI, fix hooks format, verify all internal references work.

### 1.1 Structure Setup
1. [ ] Create `packages/cli/templates/safeword/` directory structure (no dot - npm ignores dotfiles)
2. [ ] Create `packages/cli/templates/claude/` directory structure
3. [ ] Create `packages/cli/templates/README.md` documenting the mapping:
   - `templates/safeword/` → `.safeword/`
   - `templates/claude/` → `.claude/`

### 1.2 Content Migration
4. [ ] Copy from `framework/`:
   - `SAFEWORD.md` → `templates/safeword/SAFEWORD.md`
   - `guides/` → `templates/safeword/guides/`
   - `templates/` → `templates/safeword/doc-templates/`
   - `prompts/` → `templates/safeword/prompts/`
5. [ ] Copy hooks to `templates/safeword/hooks/`:
   - From `setup-safeword.sh`: extract `inject-timestamp.sh` (lines ~102-109)
   - From `setup-quality.sh`: extract `auto-quality-review.sh` (lines ~74-252), `run-quality-review.sh` (lines ~256-334), `version-check.sh` (lines ~338-372)
   - From `setup-linting.sh`: extract `auto-lint.sh` (lines ~459-466), `run-linters.sh` (lines ~447-456), `check-linting-sync.sh` (lines ~494-512)
   - Copy existing: `.claude/hooks/question-protocol.sh`
   - Copy existing: `.safeword/hooks/agents-md-check.sh`, `.safeword/hooks/pre-commit.sh`
6. [ ] Copy skill: `framework/skills/quality-reviewer/` → `templates/claude/skills/quality-reviewer/`
7. [ ] Copy commands to `templates/claude/commands/`:
   - From `setup-quality.sh`: extract `/quality-review` command (lines ~341-350)
   - From `setup-linting.sh`: extract `/lint` command
   - Copy existing: `.claude/commands/arch-review.md`
8. [ ] Copy MCP configs: `framework/mcp/*.sample.json` → `templates/claude/mcp/`
9. [ ] Rename scripts during copy using new naming convention (see Hook System section)
10. [ ] Update internal `source` calls in hooks to use new lib paths:
    - `source "$CLAUDE_PROJECT_DIR/.safeword/lib/_lib-quality-prompt.sh"`
    - `source "$CLAUDE_PROJECT_DIR/.safeword/lib/_lib-run-linters.sh"`

### 1.3 Link & Import Verification
11. [ ] Audit all markdown files for internal links - update paths:
    - `@./framework/` → `@./.safeword/`
    - Relative links between guides
12. [ ] Audit hook scripts for path references:
    - `$CLAUDE_PROJECT_DIR/.safeword/hooks/` paths
    - `$CLAUDE_PROJECT_DIR/.safeword/prompts/` paths
    - Calls between hooks (e.g., `stop-quality.sh` → `_lib-quality-prompt.sh`)
13. [ ] Audit skill files for path references
14. [ ] Verify all `source` or `bash` calls use correct paths

### 1.4 Code Updates
15. [ ] Create `src/utils/templates.ts` with file reading utilities
16. [ ] Rename `src/templates/` → `src/config/`
17. [ ] Update `SETTINGS_HOOKS` in `src/config/hooks.ts` (new names + nested format + timeouts)
18. [ ] Update `setup.ts` to use new template system
19. [ ] Update `upgrade.ts` to use new template system
20. [ ] Update setup/upgrade to create empty planning/tickets directories
21. [ ] Delete `src/config/content.ts` (move remaining content to templates)

### 1.5 Package Updates
22. [ ] Update `package.json`:
    - `types` first in exports
    - Add `sideEffects: false`
    - Add `repository`, `homepage`, `bugs`
23. [ ] Create `packages/cli/README.md` with:
    - Installation instructions (`npx safeword setup`)
    - What it installs
    - Commands reference
    - Link to main project docs

### 1.6 Testing & Cleanup
24. [ ] Test: `cd packages/cli && npm run build && npm pack`
25. [ ] Test: `npm pack --dry-run` shows all templates
26. [ ] Test: Install in fresh project, verify:
    - All files present in `.safeword/` and `.claude/`
    - All hooks execute without path errors
    - Hook-to-hook calls work (stop-quality → _lib-quality-prompt)
    - Skills load correctly
    - Commands work
    - MCP configs present
27. [ ] Delete `framework/` directory
28. [ ] Update root `README.md` with project overview
29. [ ] Update `AGENTS.md` to remove framework/ references

---

## Verification

After migration, verify:

1. **Build works:** `npm run build` succeeds
2. **Package includes templates:** `npm pack --dry-run` shows templates
3. **Setup works:** `npx safeword setup` in fresh project installs all files
4. **Upgrade works:** `npx safeword upgrade` updates all files
5. **Guides present:** `.safeword/guides/` has 13 files
6. **Full SAFEWORD.md:** File is ~31KB, not stub
7. **Planning dirs created:** Empty planning/tickets structure exists

---

## Rollback

If issues arise, revert to string constants approach by:
1. Restore `src/templates/content.ts`
2. Remove `templates/.safeword/` and `templates/.claude/`
3. Revert `setup.ts` and `upgrade.ts` changes

---

## ESLint Plugin Suite

See **[013a-eslint-plugin-suite.md](./013a-eslint-plugin-suite.md)** for full details.

**Summary:**
- **Core (always):** SonarJS, Microsoft SDL (superset of eslint-plugin-security)
- **Auto-detected:** React, Next.js, Astro, Electron, Vitest, Playwright, Drizzle
- **Boundaries:** Auto-generates config when 3+ architecture dirs detected (warn severity)
- **Containers:** Hadolint (separate tool, added to pre-commit if Dockerfile exists)

---

## Markdown Linting

Safeword includes markdown linting for `.safeword/` documentation using `markdownlint-cli2`.

### Why markdownlint-cli2?

| Tool | Verdict |
|------|---------|
| `markdownlint-cli2` | ✅ **Chosen** - Industry standard, fast, simple config |
| `eslint-plugin-markdownlint` | ❌ Less mature, adds ESLint complexity |
| `remark-lint` | ❌ Overkill, slow AST parsing |
| `textlint` | ❌ Prose-focused, not needed |

### Scope

Markdown linting applies to safeword documentation only:
- `.safeword/**/*.md`
- `AGENTS.md`
- `CLAUDE.md` (if present)

**Not linted:** User's project markdown (README, docs/) - too opinionated for general use.

### Configuration

```jsonc
// .safeword/.markdownlint.jsonc (SAFEWORD OWNS)
{
  "default": true,
  "MD013": false,         // Disable line length (docs have long lines)
  "MD033": false,         // Allow inline HTML (badges, details tags)
  "MD041": false,         // First line doesn't need to be h1
  "MD024": {              // Allow duplicate headings in different sections
    "siblings_only": true
  }
}
```

**Note:** Using `.jsonc` extension allows comments. Alternatively, use `.markdownlint.yaml`.

**Rationale for disabled rules:**
- **MD013 (line-length)**: AI-generated docs often have long lines; breaking them hurts readability
- **MD033 (no-inline-html)**: Badges, collapsible sections need HTML
- **MD041 (first-line-heading)**: SAFEWORD.md starts with frontmatter comment

### Integration

**Pre-commit hook** (in `git-pre-commit.sh`):
```bash
# Lint markdown in .safeword/
npx markdownlint-cli2 ".safeword/**/*.md" "AGENTS.md" --config .safeword/.markdownlint.jsonc
```

**npm script** (added to package.json):
```json
{
  "scripts": {
    "lint:md": "markdownlint-cli2 '.safeword/**/*.md' 'AGENTS.md' --config .safeword/.markdownlint.jsonc"
  }
}
```

### Installation

Added to project devDependencies during `safeword init`:
```typescript
plugins.push('markdownlint-cli2');
```

---

## Config Isolation Strategy

See **[013c-config-isolation-strategy.md](./013c-config-isolation-strategy.md)** for full details.

**Summary:** Safeword keeps its configs separate from user customizations for clean upgrades:
- **ESLint:** User imports `.safeword/eslint.config.js` via `extends`
- **Prettier:** User spreads `.safeword/prettier.config.js`
- **Claude hooks:** Safeword hooks marked with `_safeword: true` for upgrade identification
- **package.json scripts:** Add if missing, never overwrite existing

---

## Design Decisions

See **[013b-implementation-snippets.md](./013b-implementation-snippets.md)** for code examples.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Error handling** | Hybrid (fatal vs non-fatal) | Fatal for core (filesystem, package.json), warn for optional (boundaries, MCP) |
| **Rollback** | `withRollback()` + `.backup/` dirs | Atomic operations, restore on failure, delete backup on success |
| **ESLint plugins** | Project devDependencies | Not bundled with CLI; auto-detect package manager (npm/yarn/pnpm/bun) |
| **MCP configs** | `.mcp.json` at root | Auto-add free (Context7, Playwright), sample for API-key (Arcade) |
| **Hook output** | `hookSpecificOutput` JSON via `jq` | Required format per Claude Code docs; `safeword check` verifies jq installed |
| **Command frontmatter** | `description` + `allowed-tools` | Per Claude Code slash command docs |
| **Testing** | Unit + integration + snapshot + promptfoo | Vitest for code, promptfoo for LLM evals |
| **Reset cleanup** | Add MCP cleanup to `reset.ts` | Remove context7/playwright from `.mcp.json`, delete `.mcp.json.sample` |

### hookSpecificOutput Format

Hooks must output JSON with `jq` (not plain echo):

```bash
# Example: session-verify-agents.sh
jq -n '{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "AGENTS.md verified"}}'
# Or for errors:
jq -n '{"hookSpecificOutput": {"hookEventName": "SessionStart", "blockReason": "AGENTS.md not found"}}'
exit 2
```

### Key Implementation Notes

- **SafewordError class:** `new SafewordError(msg, fatal: boolean)` - fatal exits, non-fatal warns
- **Package manager detection:** Check for lock files (yarn.lock, pnpm-lock.yaml, bun.lockb)
- **MCP merge strategy:** Use `??=` to add servers without overwriting existing

---

## References

- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Building npm packages compatible with ESM and CJS in 2024](https://snyk.io/blog/building-npm-package-compatible-with-esm-and-cjs-2024/)
- [TypeScript and NPM package.json exports the 2024 way](https://www.velopen.com/blog/typescript-npm-package-json-exports/)
- [Tutorial: publishing ESM-based npm packages with TypeScript](https://2ality.com/2025/02/typescript-esm-packages.html)
- [TypeScript ESM Publishing Documentation](https://www.typescriptlang.org/docs/handbook/esm-node.html)
