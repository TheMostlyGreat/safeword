**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

# SAFEWORD - AI Agent Configuration CLI

A CLI tool that installs AI coding agent configurations into projects. **This repo is safeword's source code AND uses safeword itself (dogfooding).**

## Design Philosophy

1. **Schema as Single Source of Truth**: All managed files/directories defined in `packages/cli/src/schema.ts`. No magic strings scattered across codebase.

2. **Reconciliation Over Copy**: The CLI computes diffs between installed and template versions, enabling clean upgrades without clobbering user changes.

3. **IDE Parity**: Claude Code and Cursor get equivalent skills/commands. Same capabilities, different formats. Parity enforced by tests.

4. **Dogfooding**: This repo runs safeword on itself. Template changes are tested in real usage before release.

## Architecture Decisions

### Reconciliation Engine (`reconcile.ts`)

**Decision**: Compute install/upgrade/uninstall plans rather than blindly copying files.

**Why**: Users customize their configs. Blind copy destroys customizations. Reconciliation preserves user changes while updating framework files.

**Trade-off**: More complex than `cp -r`, but essential for upgrade path.

### Template Separation

**Decision**: Source templates in `packages/cli/templates/`, installed configs in `.safeword/`.

**Why**: Clear separation between "what we ship" and "what's installed". Enables `bunx safeword upgrade` to sync changes.

## Directory Roles

See `ARCHITECTURE.md` for full structure including all packages and templates.

| Directory                 | Role                                          |
| ------------------------- | --------------------------------------------- |
| `packages/cli/`           | CLI source code                               |
| `packages/cli/templates/` | Source templates (what CLI installs)          |
| `.safeword/`              | Installed config (dogfooding, tracked in git) |
| `.claude/`, `.cursor/`    | IDE-specific configs synced from templates    |

## Common Gotchas

1. **templates/ vs .safeword/**: Edit `packages/cli/templates/` first, then `bunx safeword upgrade` to sync. Never edit `.safeword/` directly for framework changes.

2. **Eval failures**: Usually means the guide needs clearer instructions, not that the test is wrong. Fix the guide.

3. **Hook paths**: Always use `"$CLAUDE_PROJECT_DIR"/.safeword/hooks/...` format (quoted variable) for Claude Code hooks.

## Project-Specific Content

**Location**: `.safeword-project/` (never touched by CLI reset/upgrade)

Use for project-specific guides that shouldn't be overwritten by framework updates.
