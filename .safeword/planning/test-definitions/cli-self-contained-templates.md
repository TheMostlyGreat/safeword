# Test Definitions: CLI Self-Contained Templates

**Feature**: Bundle all templates into CLI package so `npx safeword` works without external dependencies

**Test Files**: `packages/cli/tests/commands/*.test.ts`
**Total Tests**: 112 (94 passing, 16 failing, 2 skipped)

---

## Implementation Status

| Story | Acceptance Criteria | Test Coverage | Status |
|-------|---------------------|---------------|--------|
| Story 1: Templates | 7 ACs | 4 failing tests | ❌ Not Implemented |
| Story 2: Hooks | 8 ACs | 4 failing (lib, MCP, commands) | 🟡 Partial |
| Story 3: Skills | 3 ACs | Covered | ✅ Implemented |
| Story 4: Linting | 8 ACs | 3 failing (markdownlint) | 🟡 Partial |
| Story 5: Upgrade | 6 ACs | Covered | ✅ Implemented |
| Story 6: Reset | 7 ACs | 3 failing (MCP, commands) | 🟡 Partial |

---

## Failing Tests Summary

**14 failing tests** across 4 feature areas:

### Story 1 - Template Bundling (4 tests)

| Test | Current | Expected |
|------|---------|----------|
| Full SAFEWORD.md | 935 bytes (stub) | >1KB (full ~31KB) |
| Methodology guides | 0 files in guides/ | 13+ markdown files |
| Document templates | 0 files in templates/ | 5+ markdown files |
| Review prompts | No prompts/ dir | 2+ markdown files |

### Story 2 - Hooks (4 tests)

| Test | Issue |
|------|-------|
| Lib scripts | `.safeword/lib/` not created |
| MCP server setup | `.mcp.json` not created |
| MCP server preservation | Merge logic not implemented |
| Slash commands | `.claude/commands/` not created |

### Story 4 - Linting (3 tests)

| Test | Issue |
|------|-------|
| markdownlint config | `.markdownlint.jsonc` not created |
| lint:md script | Script not added to package.json |
| format:check script | Script not added to package.json |

### Story 6 - Reset (3 tests)

| Test | Issue |
|------|-------|
| Remove slash commands | Commands not being deleted |
| Remove MCP servers | MCP cleanup not implemented |
| Delete empty .mcp.json | Not removing empty config |

---

## Test Coverage by Story

### Story 1: Template Installation

**Covered by**: `setup-core.test.ts`, `setup-templates.test.ts`

| AC | Test | Status |
|----|------|--------|
| Full SAFEWORD.md | `setup-templates.test.ts` | ❌ Failing |
| 13 guides | `setup-templates.test.ts` | ❌ Failing |
| 5 doc-templates | `setup-templates.test.ts` | ❌ Failing |
| 2 prompts | `setup-templates.test.ts` | ❌ Failing |
| Empty planning dirs | `setup-core.test.ts` | ✅ Passing |
| AGENTS.md created | `setup-core.test.ts` Test 2.2 | ✅ Passing |
| Existing AGENTS.md preserved | `setup-core.test.ts` Test 2.3 | ✅ Passing |
| Idempotent learnings | `setup-templates.test.ts` | ✅ Passing |

### Story 2: Hook System

**Covered by**: `setup-hooks.test.ts`

| AC | Test | Status |
|----|------|--------|
| 7 hook scripts | Test 3.1 | ✅ Passing |
| 2 lib scripts | Test 3.7 | ❌ Failing |
| git-pre-commit.sh | `setup-git.test.ts` | ✅ Passing |
| Hooks in settings.json | Test 3.1 | ✅ Passing |
| _safeword marker | Implicit (path-based) | ✅ Passing |
| Preserve user hooks | Test 3.3 | ✅ Passing |
| MCP servers setup | Test 3.8 | ❌ Failing |
| MCP servers preservation | Test 3.9 | ❌ Failing |
| Slash commands | Test 3.10 | ❌ Failing |
| Idempotent hooks | Implicit | ✅ Passing |

### Story 3: Skills and Commands

**Covered by**: `setup-hooks.test.ts`

| AC | Test | Status |
|----|------|--------|
| quality-reviewer skill | Test 3.2 | ✅ Passing |
| Slash commands | Test 3.10 | ❌ Failing (same as Story 2) |
| Skill frontmatter | Test 3.2 | ✅ Passing |

### Story 4: Linting Configuration

**Covered by**: `setup-linting.test.ts`, `project-detector.test.ts`

| AC | Test | Status |
|----|------|--------|
| .safeword/eslint.config.js | Not in .safeword/ | ⚠️ Different impl |
| .safeword/prettier.config.js | Not in .safeword/ | ⚠️ Different impl |
| .markdownlint.jsonc | Test 4.9 | ❌ Failing |
| Root eslint.config | Test 4.4 | ✅ Passing |
| Root prettier config | Test 4.5 | ✅ Passing |
| Preserve existing | Test 4.6 | ✅ Passing |
| lint:md script | Test 4.10 | ❌ Failing |
| format:check script | Test 4.11 | ❌ Failing |
| Add lint/format scripts | Test 4.6, 4.7 | ✅ Passing |

### Story 5: Upgrade

**Covered by**: `upgrade.test.ts`

| AC | Test | Status |
|----|------|--------|
| Replace .safeword/ | Test 9.1 | ✅ Passing |
| Preserve user configs | Implicit | ✅ Passing |
| Replace _safeword hooks | Test 9.3 | ✅ Passing |
| Preserve learnings/ | Test 9.8 | ✅ Passing |
| Backup created | Test 9.9 | ✅ Passing |
| Backup deleted | Test 9.9 | ✅ Passing |

### Story 6: Reset

**Covered by**: `reset.test.ts`

| AC | Test | Status |
|----|------|--------|
| Delete .safeword/ | Test 11.4 | ✅ Passing |
| Remove safeword hooks | Test 11.5 | ✅ Passing |
| Delete skill | Test 11.6 | ✅ Passing |
| Delete commands | Test 11.11 | ❌ Failing |
| Remove MCP servers | Test 11.12 | ❌ Failing |
| Delete empty .mcp.json | Test 11.12 | ❌ Failing |
| Preserve user hooks | Test 11.5 | ✅ Passing |
| Preserve lint configs | Test 11.9 | ✅ Passing |

---

## Technical Constraints Coverage

| Constraint | Test | Status |
|------------|------|--------|
| Setup < 5s | `technical-constraints.test.ts` | ✅ Passing |
| Upgrade < 3s | `technical-constraints.test.ts` | ✅ Passing |
| CLI < 500KB | `technical-constraints.test.ts` | ⏭️ Skipped |
| jq check | `technical-constraints.test.ts` | ✅ Passing |

---

## Gaps Summary

All acceptance criteria now have test coverage. The 13 failing tests represent features not yet implemented:

**Priority 1 - Story 1 (Template Bundling)**:
- Full SAFEWORD.md bundling
- Guides bundling
- Templates bundling
- Prompts bundling

**Priority 2 - Story 2/6 (Lib, MCP & Commands)**:
- Lib scripts installation (`.safeword/lib/`)
- MCP server setup (`.mcp.json` creation)
- MCP server preservation (merge logic)
- MCP server cleanup on reset
- Slash commands installation
- Slash commands cleanup on reset

**Priority 3 - Story 4 (Linting)**:
- markdownlint config creation
- lint:md script addition
- format:check script addition

---

## Test Execution

```bash
# Run all CLI tests
cd packages/cli && npm test

# Run failing tests only
cd packages/cli && npm test -- setup-templates

# Run with verbose output
cd packages/cli && npm test -- --reporter=verbose
```

---

**Last Updated**: 2025-11-29
**Test Count**: 112 total (94 passing, 16 failing, 2 skipped)
