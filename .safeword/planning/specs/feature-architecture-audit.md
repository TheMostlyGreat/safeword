# Feature Spec: Architecture Audit System

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Comprehensive architecture purity enforcement and code health auditing

**Status**: ❌ Not Started (0/5 stories complete, 1 deferred)

---

## Overview

Add architecture purity enforcement to safeword that:

1. Keeps LLM-generated code tight and architecturally sound
2. Doesn't interrupt human developers during exploratory coding
3. Works with smart defaults but allows customization
4. Uses **errors** (not warnings) for LLM enforcement

**Key insight**: LLMs ignore warnings. Only errors force compliance.

---

## Relationship to eslint-plugin-safeword

This system **complements** (not replaces) eslint-plugin-safeword:

| Concern                   | Tool                   | Scope         |
| ------------------------- | ---------------------- | ------------- |
| Code quality, style, bugs | eslint-plugin-safeword | Single file   |
| **Circular dependencies** | dependency-cruiser     | Cross-file    |
| **Layer violations**      | dependency-cruiser     | Cross-file    |
| **Dead code/exports**     | knip                   | Whole project |
| **Unused dependencies**   | knip                   | Whole project |

ESLint analyzes individual files. Architecture tools analyze relationships between files.

---

## Technical Constraints

### Performance

- [ ] Full `/audit` scan completes in <60s for typical projects

### Compatibility

- [ ] Works with existing `eslint-plugin-boundaries` setup
- [ ] Supports monorepos (packages/\*, apps/\*)
- [ ] Framework-agnostic (React, Vue, Svelte, vanilla)

### Dependencies

- [ ] `dependency-cruiser` for circular dep detection
- [ ] `knip` for dead code detection
- [ ] Must not break existing safeword setup flow

### Infrastructure

- [ ] Config files are human-readable and editable
- [ ] Generated rules can be overridden without losing updates

---

## Story 1: Auto-detect architecture and generate dependency-cruiser config

**As a** developer setting up safeword
**I want** dependency-cruiser rules auto-generated from my project structure
**So that** I get architecture enforcement without manual configuration

**Acceptance Criteria**:

- [ ] Detect architecture directories (types/, utils/, components/, services/, etc.)
- [ ] Generate `.dependency-cruiser.js` with forbidden dependency rules
- [ ] Rules match existing `boundaries.ts` hierarchy logic
- [ ] Generated config is readable with inline comments explaining each rule
- [ ] Existing `.dependency-cruiser.js` is not overwritten (skip or merge)
- [ ] **Monorepo detection**: Parse `workspaces` field from package.json (falls back to scanning common dirs)
- [ ] **Monorepo hierarchy**: libs/ → packages/ → apps/ (lower can't import higher)
- [ ] **Circular deps**: Always included regardless of project structure
- [ ] **`safeword sync-config` command**: Regenerates `.safeword/depcruise-config.js`, creates `.dependency-cruiser.js` if missing

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Notes**: Reuse logic from `packages/cli/src/utils/boundaries.ts`. The `sync-config` command allows `/audit` to refresh config without running full upgrade - prevents architecture drift. Single generated file (`.safeword/depcruise-config.js`) contains both rules and options.

---

## Story 2: Circular dependency detection in stop hook (DEFERRED)

**Status**: ⏸️ Deferred to v2

**As an** LLM generating code
**I want** feedback on architecture violations at end of my response
**So that** I fix them before the user continues

**Acceptance Criteria**:

- [ ] Stop hook runs dependency-cruiser on all changed files (batched, once per response)
- [ ] Circular dependencies reported as **errors** (not warnings)
- [ ] Layer violations reported as **errors**
- [ ] Output includes the cycle path (A → B → C → A)
- [ ] Only triggers for .ts/.js/.tsx/.jsx files
- [ ] Skips if no JS/TS files were modified in the response

**Implementation Status**: ⏸️ Deferred
**Tests**: TBD

**Notes**: Deferred to v2. Start with on-demand `/audit` command; add real-time feedback via stop hook later if needed. Stop hook is better than post-tool hook - runs once per response, not per file edit.

---

## Story 3: `/audit` slash command - umbrella for code health

**As a** developer preparing code for commit/PR
**I want** a single command to check all code health issues
**So that** I catch problems before they reach CI

**Implementation**: Slash command (`.safeword/commands/audit.md`) - works in both Claude Code and Cursor.

**Acceptance Criteria**:

- [ ] `/audit` calls `safeword sync-config` first (prevents architecture drift)
- [ ] `/audit` runs all checks (architecture, dead code, dependencies)
- [ ] Auto-fixes safe issues (unused exports, unused dependencies)
- [ ] Reports errors for issues requiring manual intervention
- [ ] Output is LLM-friendly (clear, structured, actionable)
- [ ] No flags needed - single command does everything

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Report format example**:

```text
🔍 Code Audit

Fixed:
  ✓ Removed 3 unused exports
  ✓ Removed 1 unused dependency (lodash)

Errors (manual fix required):
  ✗ Circular: utils/a.ts → utils/b.ts → utils/a.ts
  ✗ Layer violation: utils/helper.ts imports components/Button.tsx

1 unused file: src/deprecated.ts (delete manually if not needed)
2 outdated packages (run npm update if desired)
```

---

## Story 4: Knip integration for dead code detection

**As a** developer
**I want** to find and remove unused exports, files, and dependencies
**So that** my codebase stays lean

**Acceptance Criteria**:

- [ ] `/audit` includes knip dead code scan
- [ ] Detects: unused exports, unused files, unused dependencies
- [ ] `/audit` auto-removes unused exports and dependencies (knip --fix)
- [ ] Respects existing `knip.json` if present
- [ ] Generates sensible `knip.json` defaults via reconcile schema

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Notes**: Knip config is simple JSON, generated via reconcile schema (no separate component needed)

---

## Story 5: Hybrid config approach (generated + editable)

**As a** developer with custom architecture rules
**I want** to customize auto-generated rules without losing them on upgrade
**So that** I can enforce project-specific constraints

**Acceptance Criteria**:

- [ ] Generated config in `.safeword/depcruise-config.js` (rules + options)
- [ ] User's `.dependency-cruiser.js` imports and extends generated config
- [ ] User additions in main config are preserved (sync-config never overwrites existing main config)
- [ ] Clear comments explain how to override/extend

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Config structure**:

```javascript
// .dependency-cruiser.js (user-editable, created once by sync-config)
const generated = require('./.safeword/depcruise-config.js');

module.exports = {
  forbidden: [
    ...generated.forbidden,
    // ADD YOUR CUSTOM RULES BELOW:
    // { from: { path: 'legacy/' }, to: { path: 'new/' } },
  ],
  options: { ...generated.options },
};
```

---

## Story 6: Setup integration and detection prompt

**As a** developer running `safeword setup`
**I want** to be prompted about architecture checks when structure is detected
**So that** I consciously opt-in to enforcement

**Acceptance Criteria**:

- [ ] During setup, detect if architecture directories exist
- [ ] If detected, prompt: "Enable architecture checks? (recommended)"
- [ ] If yes: install dependency-cruiser, knip; generate configs; write /audit command
- [ ] If no: skip architecture setup (can enable later with `safeword upgrade`)
- [ ] Show what was detected: "Found: components/, services/, utils/"

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Out of Scope

- **Bundle analysis** - different problem (size vs architecture)
- **Type coverage** - TypeScript handles this
- **Security scanning** - use dedicated tools (npm audit, snyk)
- **Custom DSL for rules** - use dependency-cruiser's existing format

---

## Summary

**Completed**: 0/5 stories (0%)
**Deferred**: 1 story (Story 2: stop hook)
**Remaining**: 5 stories

### Phase 1: Foundation

- Story 1: Auto-generate dependency-cruiser config
- Story 5: Hybrid config approach

### Phase 2: Audit Command

- Story 3: `/audit` umbrella command
- Story 4: Knip integration

### Phase 3: Setup Flow

- Story 6: Setup integration and detection prompt

### Deferred to v2

- Story 2: Stop hook for real-time feedback

**Next Steps**: Implement Phase 1 (Stories 1 & 5)

**Design Doc**: `.safeword/planning/design/architecture-audit.md`
