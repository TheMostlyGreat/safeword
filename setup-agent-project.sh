#!/bin/bash
# setup-agent-project.sh
# Sets up standardized agent project structure

set -e

PROJECT_ROOT=$(pwd)
AGENTS_DIR="$PROJECT_ROOT/.agents"
GLOBAL_AGENTS_DIR="$HOME/.agents/coding"
TEMPLATE_PATH="$GLOBAL_AGENTS_DIR/templates/agents-template.md"
USE_CLAUDE_CODE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --use-claude-code) USE_CLAUDE_CODE=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

echo "Setting up agent project structure..."

# Create directory structure with archive folders
mkdir -p "$AGENTS_DIR"/planning/{user-stories/{,archive},test-definitions/{,archive},design/{,archive},issues/{,archive}}
mkdir -p "$AGENTS_DIR"/tickets/{,completed,archived}
mkdir -p "$AGENTS_DIR"/{hooks,skills}

# Create AGENTS.md at project root
if [ "$USE_CLAUDE_CODE" = true ]; then
  echo "Creating minimal AGENTS.md stub for Claude Code..."
  cat > "$PROJECT_ROOT/AGENTS.md" << 'EOF'
# [Project Name] - Developer Context

**CRITICAL: Before proceeding, ALWAYS read the global agent instructions:**
**→ `~/.agents/coding/AGENTS.md`**

This global file contains the core workflow for all development tasks. Read it FIRST, then return here for project-specific context.

---

**TODO: Use Claude Code to fill in project-specific context:**
1. Open this file in Claude Code
2. Ask: "Review the global AGENTS.md and help me fill in project-specific context for this AGENTS.md"
3. Claude Code will read global guidelines and populate appropriate sections

## Sections to Add:
- Project Overview
- Design Philosophy
- Architecture Decisions
- Common Gotchas
- File Organization
EOF
  echo ""
  echo "⚠️  AGENTS.md created with stub. Next step:"
  echo "   Open AGENTS.md in Claude Code and ask it to fill in project-specific context"
  echo "   It will read ~/.agents/coding/AGENTS.md and populate appropriate sections"
elif [ -f "$TEMPLATE_PATH" ]; then
  echo "Creating AGENTS.md from template..."
  cp "$TEMPLATE_PATH" "$PROJECT_ROOT/AGENTS.md"
else
  echo "Creating AGENTS.md with standard template..."
  cat > "$PROJECT_ROOT/AGENTS.md" << 'EOF'
# [Project Name] - Developer Context

**CRITICAL: Before proceeding, ALWAYS read the global agent instructions:**
**→ `~/.agents/coding/AGENTS.md`**

This global file contains the core workflow for all development tasks. Read it FIRST, then return here for project-specific context.

---

## Project Overview

[Brief description. Current status.]

## Design Philosophy

1. **Principle 1:** [Why we chose this approach]
2. **Principle 2:** [Trade-offs we accepted]

## Architecture Decisions

### [Tech Choice]
**Decision:** [What we chose]
**Why:** [Specific reasoning with numbers if applicable]
**Trade-off:** [What we gave up]
**Gotcha:** [Common mistake to avoid]

## Common Gotchas

1. **[Thing]:** [Why it breaks and how to fix]

## File Organization

**Dir** (`path/`) - Purpose. See `path/AGENTS.md` if complex.
EOF
fi

# Link global hooks if they exist
if [ -d "$GLOBAL_AGENTS_DIR/hooks" ]; then
  echo "Linking global hooks..."
  for hook in "$GLOBAL_AGENTS_DIR/hooks"/*; do
    if [ -f "$hook" ]; then
      ln -sf "$hook" "$AGENTS_DIR/hooks/$(basename "$hook")"
    fi
  done
else
  echo "Note: Global hooks directory not found at $GLOBAL_AGENTS_DIR/hooks"
fi

# Link global skills if they exist
if [ -d "$GLOBAL_AGENTS_DIR/skills" ]; then
  echo "Linking global skills..."
  for skill in "$GLOBAL_AGENTS_DIR/skills"/*; do
    if [ -d "$skill" ] || [ -f "$skill" ]; then
      ln -sf "$skill" "$AGENTS_DIR/skills/$(basename "$skill")"
    fi
  done
else
  echo "Note: Global skills directory not found at $GLOBAL_AGENTS_DIR/skills"
fi

# Create README for planning
cat > "$AGENTS_DIR/planning/README.md" << 'EOF'
# Planning

## Structure

- `user-stories/` - User stories for features (As a X / I want Y / So that Z)
  - `user-stories/archive/` - Completed/obsolete user stories
- `test-definitions/` - Test scenarios and acceptance criteria
  - `test-definitions/archive/` - Completed/obsolete test definitions
- `design/` - Design docs for complex features (>3 components, new data model, architectural decisions)
  - `design/archive/` - Completed/obsolete design docs
- `issues/` - Issue tracking and requirements
  - `issues/archive/` - Completed/obsolete issues

## Naming Convention

**Planning docs share the same prefix as their ticket:**

Example for ticket `001-user-authentication.md`:
- `user-stories/001-user-authentication.md`
- `test-definitions/001-user-authentication.md`
- `design/001-user-authentication.md`

This makes it easy to find all related docs: `ls **/001-user-authentication.md`

## Archiving

When planning docs are completed and no longer actively referenced:
- Move to corresponding `archive/` subfolder
- Preserves history while preventing bloat in active folders

## Workflow

1. **User stories** → Define what we're building
2. **Test definitions** → Define how we'll verify it works
3. **Design docs** (optional for complex features) → Plan implementation
4. **Implementation (TDD)** → RED → GREEN → REFACTOR
5. **Archive** → Move completed docs to archive/

See `~/.agents/coding/AGENTS.md` for full workflow.
EOF

# Create README for tickets
cat > "$AGENTS_DIR/tickets/README.md" << 'EOF'
# Tickets

Higher-level feature/epic tracking. Each ticket references planning docs.

## Structure

- `./` - Active tickets (in progress or todo)
- `completed/` - Verified completed tickets (user confirmed)
- `archived/` - Blocked or cancelled tickets

## Naming Convention

**Tickets:** `{id}-{feature-slug}.md`
- Example: `001-user-authentication.md`, `002-payment-flow.md`

**Planning docs share same prefix:**
- User stories: `./agents/planning/user-stories/001-user-authentication.md`
- Test definitions: `./agents/planning/test-definitions/001-user-authentication.md`
- Design doc: `./agents/planning/design/001-user-authentication.md`

This makes it easy to find all related docs by prefix.

## Format

```markdown
---
id: 001
status: todo|in_progress|done|blocked
created: 2025-01-19T14:30:00Z
priority: low|medium|high
planning_refs:
  - ./agents/planning/user-stories/001-user-authentication.md
  - ./agents/planning/test-definitions/001-user-authentication.md
  - ./agents/planning/design/001-user-authentication.md (if complex)
---

# User Authentication System

## Description
{High-level feature description}

## Scope
{What's included in this ticket}

## Acceptance Criteria
- [ ] All user stories completed
- [ ] All tests passing
- [ ] Documentation updated

## Work Log
{Progress notes, decisions, blockers}
```

## Completion Process

**CRITICAL:** Never mark ticket as done or archive without user confirmation.

1. Update status to `done` when work complete
2. **Ask user to confirm** all acceptance criteria met
3. User verifies:
   - All tests passing
   - Feature works as expected
   - No regressions introduced
4. After confirmation: Move to `completed/`
5. Blocked/cancelled tickets: Move to `archived/`

## Relationship

- **Ticket** = Higher-level feature/epic
- **Planning docs** = Detailed specs (user stories, test definitions, design)
- **TodoWrite** = Task-level tracking in current session

See `~/.agents/coding/AGENTS.md` → Ticket System for details.
EOF

# Create .gitignore if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.gitignore" ]; then
  touch "$PROJECT_ROOT/.gitignore"
fi

# Add .agents to gitignore (prevents accidentally committing agent-specific state)
if ! grep -q "^\.agents/$" "$PROJECT_ROOT/.gitignore"; then
  echo ".agents/" >> "$PROJECT_ROOT/.gitignore"
  echo "Added .agents/ to .gitignore"
fi

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Structure created:"
echo "  /AGENTS.md                                  - Agent configuration (with global link)"
echo "  /.agents/planning/user-stories/             - Active user stories"
echo "  /.agents/planning/user-stories/archive/     - Completed user stories"
echo "  /.agents/planning/test-definitions/         - Active test definitions"
echo "  /.agents/planning/test-definitions/archive/ - Completed test definitions"
echo "  /.agents/planning/design/                   - Active design docs"
echo "  /.agents/planning/design/archive/           - Completed design docs"
echo "  /.agents/planning/issues/                   - Active issues"
echo "  /.agents/planning/issues/archive/           - Completed issues"
echo "  /.agents/tickets/                           - Active tickets"
echo "  /.agents/tickets/completed/                 - Verified completed tickets"
echo "  /.agents/tickets/archived/                  - Blocked/cancelled tickets"
echo "  /.agents/hooks/                             - Symlinked from ~/.agents/coding/hooks"
echo "  /.agents/skills/                            - Symlinked from ~/.agents/coding/skills"
echo "  .gitignore                                  - Updated to exclude .agents/"
echo ""
echo "Next steps:"
if [ "$USE_CLAUDE_CODE" = true ]; then
  echo "1. Open /AGENTS.md in Claude Code"
  echo "2. Ask: 'Review the global AGENTS.md and help me fill in project-specific context'"
  echo "3. Create tickets in /.agents/tickets/ for major features"
  echo "4. Create planning docs in /.agents/planning/"
else
  echo "1. Review and customize /AGENTS.md (add project-specific context)"
  echo "2. Create tickets in /.agents/tickets/ for major features"
  echo "3. Create planning docs in /.agents/planning/"
  echo "4. Set up tests/AGENTS.md if testing setup is complex"
fi
echo ""
echo "Workflow:"
echo "  Ticket → User stories → Test definitions → TDD → User confirms → Archive"
echo ""
echo "Usage:"
echo "  ./setup-agent-project.sh                  # Standard template"
echo "  ./setup-agent-project.sh --use-claude-code # Minimal stub for Claude Code to fill"
