# Design: Cursor IDE Setup for Safeword

**Research Date**: December 2025

## Executive Summary

Add Cursor IDE support to safeword, parallel to Claude Code. Uses `@file` references to point to `.safeword/` content - no duplication, no drift.

## Files Created

```text
.cursor/
├── rules/
│   └── safeword-core.mdc          # @.safeword/SAFEWORD.md
├── commands/
│   ├── lint.md                    # Same as .claude/commands/
│   ├── quality-review.md
│   └── architecture.md
├── mcp.json                       # Same MCP servers as .mcp.json
└── hooks.json                     # Cursor hook config
```

## Rule Files (Pure References)

### safeword-core.mdc

```markdown
---
alwaysApply: true
---

@.safeword/SAFEWORD.md
```

Only one rule needed. TDD guide triggers are already in SAFEWORD.md - no separate testing rule required.

## Commands

| Platform    | @file in Commands           |
| ----------- | --------------------------- |
| Claude Code | ✅ Yes                      |
| Cursor      | ❌ No (plain markdown only) |

**Note:** `.safeword/prompts/` contains programmatic prompts (JSON output format) for code consumption. Slash commands are different - they're human-readable instructions. These serve different purposes and should stay separate.

**Decision**: Cursor commands copy Claude command content. Both platforms use the same templates.

```text
packages/cli/templates/commands/
├── lint.md              # Source template (with frontmatter)
├── quality-review.md
└── architecture.md

.claude/commands/         # Installed from templates/commands/
├── lint.md
├── quality-review.md
└── architecture.md

.cursor/commands/         # Installed from same templates/commands/
├── lint.md
├── quality-review.md
└── architecture.md
```

Frontmatter (Claude-specific `---` block) is harmless in Cursor - it's just ignored as markdown content.

## AGENTS.md

```markdown
**Read first:** .safeword/SAFEWORD.md

This project uses safeword for development workflows.
```

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
```

## Hooks

**Available Cursor hook events (Dec 2025):**

- `beforeSubmitPrompt` - Before prompt sent
- `afterFileEdit` - After file changes
- `afterAgentResponse` - After assistant message
- `stop` - Agent loop completion
- `beforeShellExecution` / `afterShellExecution` - Shell commands
- `beforeMCPExecution` / `afterMCPExecution` - MCP tool calls
- `beforeReadFile` - Before file read
- `afterAgentThought` - After reasoning blocks
- `beforeTabFileRead` / `afterTabFileEdit` - Tab completions

**Hook mapping (Claude → Cursor):**

| Claude Hook              | Cursor Hook     | Notes                                           |
| ------------------------ | --------------- | ----------------------------------------------- |
| SessionStart             | ❌ None         | Covered by `alwaysApply` rule                   |
| UserPromptSubmit         | ❌ None         | `beforeSubmitPrompt` can only block, not inject |
| PostToolUse (Write/Edit) | `afterFileEdit` | Lint check (observation only)                   |
| Stop                     | `stop`          | Inject followup if files were edited            |

**Key Cursor limitation:** Only the `stop` hook can inject messages via `followup_message`. Other hooks are observation-only or can only block.

### Decision: Marker File Approach

**Rejected alternatives:**

1. **Two-hook system** (`afterAgentResponse` → parse JSON → `stop`): Requires parsing response text, complex regex, no precedent
2. **Pure loop_count heuristic**: Would trigger on any multi-tool response (e.g., reading files), false positives
3. **Unconditional review**: Noisy UX, reviews trivial responses
4. **No automatic review**: Defeats safeword's purpose

**Chosen approach:** Marker file communication between `afterFileEdit` and `stop`:

1. `afterFileEdit` → creates `/tmp/safeword-cursor-edited-{conversation_id}`
2. `stop` → checks for marker, injects review if found, cleans up marker

**Rationale:**

- Only triggers when files are actually edited (not just reads)
- Simple file-based communication (no JSON parsing)
- Marker cleanup on each stop prevents stale state
- User can always invoke `/quality-review` manually for edge cases

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": "./.safeword/hooks/cursor/after-file-edit.sh" }],
    "stop": [{ "command": "./.safeword/hooks/cursor/stop.sh" }]
  }
}
```

## What We Removed (vs earlier draft)

1. **safeword-typescript.mdc** - Deleted. TS guidelines are in SAFEWORD.md already.
2. **safeword-guides-agent.mdc** - Deleted. Guide triggers are in SAFEWORD.md already.
3. **safeword-testing.mdc** - Deleted. TDD triggers are in SAFEWORD.md already.
4. **Inline content in rules** - All rules are now pure `@file` references.

## Schema Changes

```typescript
// ownedDirs additions:
'.cursor',
'.cursor/rules',
'.cursor/commands',
'.safeword/hooks/cursor',

// ownedFiles additions:
'.cursor/rules/safeword-core.mdc': { template: 'cursor/rules/safeword-core.mdc' },
'.cursor/commands/lint.md': { template: 'commands/lint.md' },  // Same as Claude
'.cursor/commands/quality-review.md': { template: 'commands/quality-review.md' },
'.cursor/commands/architecture.md': { template: 'commands/architecture.md' },
'.safeword/hooks/cursor/after-file-edit.sh': { template: 'hooks/cursor/after-file-edit.sh' },
'.safeword/hooks/cursor/stop.sh': { template: 'hooks/cursor/stop.sh' },

// jsonMerges additions:
'.cursor/mcp.json': { /* same pattern as .mcp.json */ },
'.cursor/hooks.json': { /* merge hooks */ },
```

Note: Claude commands already use `templates/commands/*.md` - no changes needed there.

## Implementation Plan

### Phase 1: Create Cursor Templates

1. `cursor/rules/safeword-core.mdc` (5 lines - @file ref)
2. `hooks/cursor/after-file-edit.sh` (adapter for lint)
3. `hooks/cursor/stop.sh` (loop_count heuristic, inject followup_message)

### Phase 2: Schema & Setup

1. Add Cursor entries to schema (ownedDirs, ownedFiles, jsonMerges)
2. Add editor selection prompt to setup ("Claude Code", "Cursor", "Both")
3. Add `safeword add cursor` / `safeword remove cursor` commands

### Notes

- Commands: Both platforms use same `templates/commands/*.md` (no changes needed)
- AGENTS.md: Already handled by existing textPatches in schema
- Frontmatter in Cursor commands: Harmless, just renders as text

## References

- [Cursor Rules Docs](https://cursor.com/docs/context/rules)
- [Cursor Commands Docs](https://cursor.com/docs/agent/chat/commands)
- [Cursor MCP Docs](https://cursor.com/docs/context/mcp)
- [Cursor Hooks Docs](https://cursor.com/docs/agent/hooks)
