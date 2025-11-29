# User Stories: CLI Self-Contained Templates

**Guide**: `@./.safeword/guides/user-story-guide.md`
**Template**: `@./.safeword/templates/user-stories-template.md`

**Feature**: Bundle all templates into CLI package so `npx safeword` works without external dependencies

**Related Issue**: N/A (internal)
**Status**: 🟡 In Progress (5/6 stories implemented, Story 1 partial)

---

## Technical Constraints

### Performance
- [ ] `safeword setup` completes in < 5s on SSD
- [ ] `safeword upgrade` completes in < 3s (no network calls)

### Security
- [ ] Hook scripts use `jq` for JSON output (no shell injection via echo)
- [ ] No secrets in bundled templates

### Compatibility
- [ ] Node.js 18+ (ESM-only)
- [ ] Works on macOS, Linux, Windows (Git Bash)
- [ ] Package managers: npm, yarn, pnpm, bun

### Dependencies
- [ ] Must use existing Claude Code hook format (nested `hooks` array)
- [ ] Must preserve user's existing `.claude/settings.json` hooks
- [ ] ESLint 9.x flat config with `defineConfig()` and `extends`

### Infrastructure
- [ ] CLI package < 500KB (excluding node_modules)
- [ ] Templates bundled as files (not string constants)
- [ ] `jq` required on system for hooks (`safeword check` warns if missing)

---

## Story 1: Setup Installs Complete Templates

**As a** developer running `safeword setup`
**I want** all safeword templates installed to my project
**So that** I have the full methodology without manual copying

**Acceptance Criteria**:
- [ ] `.safeword/SAFEWORD.md` is the full ~31KB file (not a stub)
- [ ] `.safeword/guides/` contains 13 methodology guides
- [ ] `.safeword/doc-templates/` contains 5 document templates
- [ ] `.safeword/prompts/` contains 2 review prompts
- [ ] Empty directories created: `.safeword/planning/user-stories/`, `.safeword/planning/design/`, `.safeword/tickets/completed/`, `.safeword/learnings/`
- [ ] `AGENTS.md` created (if missing) with link to `.safeword/SAFEWORD.md`; existing AGENTS.md untouched
- [ ] Running setup again overwrites safeword-owned files, preserves user content in `learnings/`

**Implementation Status**: 🟡 Partial (stub installed, full templates not bundled)
**Tests**: `packages/cli/tests/commands/setup-templates.test.ts`

---

## Story 2: Setup Installs Hook System

**As a** developer running `safeword setup`
**I want** Claude Code hooks installed and registered
**So that** quality automation works immediately

**Acceptance Criteria**:
- [ ] `.safeword/hooks/` contains 7 hook scripts with `{event}-{action}.sh` naming
- [ ] `.safeword/lib/` contains 2 shared scripts with `_lib-` prefix
- [ ] `.safeword/git/git-pre-commit.sh` exists for git hooks
- [ ] `.claude/settings.json` has hooks registered with correct nested format
- [ ] Hooks marked with `_safeword: true` for upgrade identification
- [ ] Existing user hooks in settings.json preserved (merged, not replaced)
- [ ] `.mcp.json` updated with context7 and playwright servers (merged, not replaced)
- [ ] Running setup again: safeword hooks replaced, user hooks preserved

**Implementation Status**: ✅ Implemented
**Tests**: `packages/cli/tests/commands/setup-hooks.test.ts`

---

## Story 3: Setup Installs Skills and Commands

**As a** developer running `safeword setup`
**I want** Claude Code skills and slash commands installed
**So that** I can use quality review features

**Acceptance Criteria**:
- [ ] `.claude/skills/quality-reviewer/SKILL.md` has full content with YAML frontmatter
- [ ] `.claude/commands/` contains quality-review.md, arch-review.md, lint.md
- [ ] Skill frontmatter includes `name`, `description`, `allowed-tools`

**Implementation Status**: ✅ Implemented
**Tests**: `packages/cli/tests/commands/setup-hooks.test.ts`

---

## Story 4: Setup Configures Linting

**As a** developer running `safeword setup`
**I want** ESLint and Prettier configured automatically
**So that** code quality is enforced from the start

**Acceptance Criteria**:
- [ ] `.safeword/eslint.config.js` generated with detected plugins (React, Vitest, etc.)
- [ ] `.safeword/prettier.config.js` generated with defaults
- [ ] `.safeword/.markdownlint.jsonc` created for markdown linting
- [ ] Root `eslint.config.js` created (if none exists) importing safeword config via `extends`
- [ ] Root `prettier.config.js` created (if none exists) spreading safeword config
- [ ] Existing lint configs preserved (not overwritten)
- [ ] ESLint plugins + `markdownlint-cli2` installed to project devDependencies
- [ ] `package.json` scripts added: `lint`, `lint:md`, `format`, `format:check` (if missing)

**Implementation Status**: ✅ Implemented (configs at root, not .safeword/)
**Tests**: `packages/cli/tests/commands/setup-linting.test.ts`

---

## Story 5: Upgrade Updates Safeword-Owned Files

**As a** developer running `safeword upgrade`
**I want** safeword templates updated without losing my customizations
**So that** I get improvements without merge conflicts

**Acceptance Criteria**:
- [ ] `.safeword/` contents replaced with latest templates
- [ ] User's `eslint.config.js` and `prettier.config.js` untouched
- [ ] Hooks with `_safeword: true` in settings.json replaced; user hooks preserved
- [ ] `learnings/` directory preserved (user content)
- [ ] Backup created before upgrade (`.safeword.backup/`)
- [ ] Backup deleted on success

**Implementation Status**: ✅ Implemented
**Tests**: `packages/cli/tests/commands/upgrade.test.ts`

---

## Story 6: Reset Removes Safeword Cleanly

**As a** developer running `safeword reset`
**I want** all safeword artifacts removed from my project
**So that** I can start fresh or remove safeword completely

**Acceptance Criteria**:
- [ ] `.safeword/` directory deleted
- [ ] Hooks with `_safeword: true` removed from `.claude/settings.json`
- [ ] `.claude/skills/quality-reviewer/` deleted
- [ ] `.claude/commands/` safeword commands deleted
- [ ] MCP servers `context7` and `playwright` removed from `.mcp.json`
- [ ] User's other hooks, skills, commands preserved
- [ ] User's lint configs untouched

**Implementation Status**: ✅ Implemented
**Tests**: `packages/cli/tests/commands/reset.test.ts`

---

## Summary

**Completed**: 5/6 stories (83%)
**Remaining**: Story 1 template bundling

### Core Setup
- Story 1: Complete templates - 🟡 Partial (stub only)
- Story 2: Hook system - ✅ Implemented
- Story 3: Skills and commands - ✅ Implemented
- Story 4: Linting configuration - ✅ Implemented

### Lifecycle
- Story 5: Upgrade - ✅ Implemented
- Story 6: Reset - ✅ Implemented

**Next Step**: Implement Story 1 - bundle full template files into CLI package
