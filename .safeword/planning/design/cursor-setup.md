# Design: Cursor IDE Setup for Safeword

**Research Date**: December 2025

## Executive Summary

Add Cursor IDE support to safeword, parallel to Claude Code. Uses `@file` references to point to `.safeword/` content - no duplication, no drift.

## Files Created

````text
.cursor/
├── rules/
│   ├── safeword-core.mdc          # @.safeword/SAFEWORD.md
│   └── safeword-testing.mdc       # @.safeword/guides/tdd-best-practices.md
├── commands/
│   ├── lint.md                    # Same as .claude/commands/lint.md
│   ├── quality-review.md          # Same as .claude/commands/quality-review.md
│   └── architecture.md            # Same as .claude/commands/architecture.md
├── mcp.json                       # Same MCP servers as .mcp.json
└── hooks.json                     # Cursor hook config

AGENTS.md                          # Points to .safeword/SAFEWORD.md
```text

## Rule Files (Pure References)

### safeword-core.mdc

```markdown
---
alwaysApply: true
---

@.safeword/SAFEWORD.md
```text

### safeword-testing.mdc

```markdown
---
globs: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx']
---

@.safeword/guides/tdd-best-practices.md
```text

## Commands

Cursor commands don't support `@file` references (per [docs](https://cursor.com/docs/agent/chat/commands) - plain markdown only).

**Options**:

1. Duplicate content from `.claude/commands/` (drift risk)
2. Share source files in `.safeword/prompts/` that both reference
3. Keep commands in `.claude/commands/`, symlink or copy during setup

**Decision**: Option 2 - Move command content to `.safeword/prompts/`, have both Claude and Cursor commands be copies of those source files. Single source of truth in `.safeword/`.

## AGENTS.md

```markdown
**Read first:** .safeword/SAFEWORD.md

This project uses safeword for development workflows.
```text

## MCP Configuration

Same servers as Claude, different location:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```text

## Hooks

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": "./.safeword/hooks/cursor/after-file-edit.sh" }],
    "stop": [{ "command": "./.safeword/hooks/cursor/stop.sh" }]
  }
}
```text

Cursor adapters in `.safeword/hooks/cursor/` call shared core logic in `.safeword/lib/`.

## What We Removed (vs earlier draft)

1. **safeword-typescript.mdc** - Deleted. TS guidelines are in SAFEWORD.md already.
2. **safeword-guides-agent.mdc** - Deleted. Guide triggers are in SAFEWORD.md already.
3. **Inline content in rules** - All rules are now pure `@file` references.

## Schema Changes

```typescript
// ownedDirs additions:
'.cursor',
'.cursor/rules',
'.cursor/commands',
'.safeword/hooks/cursor',
'.safeword/prompts',  // NEW: shared command content

// ownedFiles additions:
'.cursor/rules/safeword-core.mdc': { template: 'cursor/rules/safeword-core.mdc' },
'.cursor/rules/safeword-testing.mdc': { template: 'cursor/rules/safeword-testing.mdc' },
'.cursor/commands/lint.md': { template: 'prompts/lint.md' },
'.cursor/commands/quality-review.md': { template: 'prompts/quality-review.md' },
'.cursor/commands/architecture.md': { template: 'prompts/architecture.md' },
'.claude/commands/lint.md': { template: 'prompts/lint.md' },  // UPDATE existing
'.claude/commands/quality-review.md': { template: 'prompts/quality-review.md' },
'.claude/commands/architecture.md': { template: 'prompts/architecture.md' },
'AGENTS.md': { template: 'cursor/AGENTS.md' },
'.safeword/hooks/cursor/after-file-edit.sh': { template: 'hooks/cursor/after-file-edit.sh' },
'.safeword/hooks/cursor/stop.sh': { template: 'hooks/cursor/stop.sh' },

// jsonMerges additions:
'.cursor/mcp.json': { /* same pattern as .mcp.json */ },
'.cursor/hooks.json': { /* merge hooks */ },
```text

## Implementation Plan

### Phase 1: Consolidate Commands

1. Move command content to `packages/cli/templates/prompts/`
2. Update Claude commands to use shared templates
3. Create Cursor commands from same templates

### Phase 2: Create Cursor Templates

1. `cursor/rules/safeword-core.mdc` (5 lines)
2. `cursor/rules/safeword-testing.mdc` (6 lines)
3. `cursor/AGENTS.md` (3 lines)
4. `hooks/cursor/after-file-edit.sh`
5. `hooks/cursor/stop.sh`

### Phase 3: Schema & Setup

1. Add Cursor entries to schema
2. Add editor selection prompt to setup
3. Add `safeword add cursor` / `safeword remove cursor`

## References

- [Cursor Rules Docs](https://cursor.com/docs/context/rules)
- [Cursor Commands Docs](https://cursor.com/docs/agent/chat/commands)
- [Cursor MCP Docs](https://cursor.com/docs/context/mcp)
- [Cursor Hooks Docs](https://cursor.com/docs/agent/hooks)
````
