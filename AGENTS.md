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

## Agent Behavior Principles

### Fire-and-Forget by Default, Power User Escape Hatches

Users shouldn't have to "learn" safeword. It should feel automatic—like working with an experienced engineering team. You don't tell a good team how to do things; they just do them well.

- **Default behavior is invisible**: Agent detects work type (patch/task/feature) and applies the right process automatically
- **No teaching required**: User says "build X" and gets a quality process without asking for it
- **Power users can override**: Explicit commands exist (`/bdd`, `/tdd-only`, etc.) but 90% of users never need them

### Teammate Voice, Not System Logs

Announcements should sound like a colleague updating you, not a system logging state.

| System-y ❌                           | Teammate-y ✅                                                               |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `→ Feature detected. Using BDD flow.` | `Starting feature work — I'll define behaviors first, then build with TDD.` |
| `→ Phase 4: Scenario Quality Gate`    | `Let me check these scenarios are testable...`                              |
| `→ Override: TDD only`                | `Got it — skipping behaviors, straight to TDD.`                             |

Power users still understand what's happening. Newbies just hear a colleague explaining their approach.

### Progressive Disclosure

Don't front-load complexity. Gather minimum viable context, then offer to go deeper.

- **Minimum first**: Get enough to start (goal, scope, out-of-scope)
- **Offer discovery**: "I can start now, but want to spitball edge cases first?"
- **User controls depth**: They choose how many rounds of refinement, then say "ready"

### PM-Style Questions

When gathering context, ask like a good PM—not like a system collecting form fields.

| Category        | Question Style                                              |
| --------------- | ----------------------------------------------------------- |
| User experience | "What does success feel like? What does failure feel like?" |
| Failure modes   | "What breaks? What are the consequences?"                   |
| Boundaries      | "What's the minimum? Maximum? Where are the edges?"         |
| Scenarios       | "Walk through a concrete situation. What happens?"          |
| Regret          | "If we skip this, what support tickets will we get?"        |

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

## Project-Specific Content

**Location**: `.safeword-project/` (never touched by CLI reset/upgrade)

Use for project-specific guides that shouldn't be overwritten by framework updates.

## Common Gotchas

1. **templates/ vs .safeword/**: Edit `packages/cli/templates/` first, then `bunx safeword upgrade` to sync. Never edit `.safeword/` directly for framework changes.

2. **Schema registration**: Every file in `packages/cli/templates/` MUST have an entry in `packages/cli/src/schema.ts`. Without it, the file exists but never gets installed. Run `bun run test -- --testNamePattern="should have entry"` to verify.

3. **Eval failures**: Usually means the guide needs clearer instructions, not that the test is wrong. Fix the guide.

4. **Hook paths**: Always use `"$CLAUDE_PROJECT_DIR"/.safeword/hooks/...` format (quoted variable) for Claude Code hooks.

5. **Monorepo publishing**: `workspace:^` resolves at `bun install` time, not publish time. For 0.x packages, `^0.6.0` excludes 0.7.0. Run `bun install` after version bumps, or use explicit versions for cross-package deps.
