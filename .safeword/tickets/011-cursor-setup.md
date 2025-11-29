---
id: 011
status: pending
created: 2025-11-27
github: https://github.com/TheMostlyGreat/safeword/issues/7
---

# Add Cursor Setup Support

**Goal:** Create `setup-cursor.sh` script that sets up Cursor IDE with SAFEWORD patterns, parallel to `setup-claude.sh`.

**Why:** Cursor is a popular AI-powered IDE. Teams using Cursor need the same SAFEWORD enforcement (TDD workflow, quality standards, guides) that Claude Code users get.

## Scope

**In scope:**

- `setup-cursor.sh` - Sets up Cursor-specific configurations
- `.cursorrules` file with SAFEWORD trigger
- `.cursor/mcp.json` for MCP server configurations (Context7, etc.)
- `CURSOR.md` project context file (optional, when CLAUDE.md doesn't exist)
- Integration with existing `setup-safeword.sh` (detect and offer Cursor setup)

**Out of scope:**

- Cursor-specific hooks (Cursor doesn't support hooks like Claude Code)
- Linting setup (already handled by `setup-linting.sh`, works for any editor)
- CLI integration (`safeword init --cursor` - that's for the CLI ticket)

## Technical Notes

Cursor uses these files:

- `.cursorrules` - Project-level rules (like `.claude/settings.json` but simpler)
- `.cursor/mcp.json` - MCP server configurations
- `.cursor/rules/` - Directory for multiple rule files (alternative to single `.cursorrules`)

Key differences from Claude setup:

- No hooks system (Cursor doesn't have pre/post command hooks)
- Rules are simpler - just instructions, no JSON config
- MCP config format differs from Claude's

## Acceptance Criteria

- [ ] `bash setup-cursor.sh` creates `.cursorrules` with SAFEWORD trigger
- [ ] `.cursorrules` references `@./.safeword/SAFEWORD.md`
- [ ] Script creates `.cursor/mcp.json` with Context7 config
- [ ] Script is idempotent (safe to run multiple times)
- [ ] Script detects existing `.cursorrules` and appends (doesn't overwrite)
- [ ] `setup-safeword.sh` mentions Cursor setup as next step
- [ ] README updated with Cursor setup instructions

## Implementation Notes

`.cursorrules` content should include:

```markdown
# Project Rules

**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

[Project-specific Cursor rules go here]
```

`.cursor/mcp.json` should include Context7 (and optionally Arcade):

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## Work Log

- 2025-11-27 Created ticket
