#!/bin/bash
# setup-agent-project.sh
# Sets up standardized agent project structure

set -e

PROJECT_ROOT=$(pwd)
AGENTS_DIR="$PROJECT_ROOT/.agents"
GLOBAL_AGENTS_DIR="$HOME/.agents/coding"
TEMPLATE_PATH="$GLOBAL_AGENTS_DIR/templates/agents-template.md"

echo "Setting up agent project structure..."

# Create directory structure
mkdir -p "$AGENTS_DIR"/{planning/{user-stories,test-definitions,design,issues},tickets,hooks,skills}

# Create AGENTS.md at project root with mandatory global link
if [ -f "$TEMPLATE_PATH" ]; then
  echo "Creating AGENTS.md from template..."
  cp "$TEMPLATE_PATH" "$PROJECT_ROOT/AGENTS.md"
else
  echo "Creating AGENTS.md with mandatory header..."
  cat > "$PROJECT_ROOT/AGENTS.md" << 'EOF'
# Project Name - Developer Context

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
- `test-definitions/` - Test scenarios and acceptance criteria
- `design/` - Design docs for complex features (>3 components, new data model, architectural decisions)
- `issues/` - Issue tracking and requirements

## Workflow

1. **User stories** → Define what we're building
2. **Test definitions** → Define how we'll verify it works
3. **Design docs** (optional for complex features) → Plan implementation
4. **Implementation (TDD)** → RED → GREEN → REFACTOR

See `~/.agents/coding/AGENTS.md` for full workflow.
EOF

# Create README for tickets
cat > "$AGENTS_DIR/tickets/README.md" << 'EOF'
# Tickets

Higher-level feature/epic tracking. Each ticket references planning docs.

## Format

```markdown
---
id: {number}
status: todo|in_progress|done|blocked
created: {ISO timestamp}
priority: low|medium|high
planning_refs:
  - ./agents/planning/user-stories/{feature}.md
  - ./agents/planning/test-definitions/{feature}.md
  - ./agents/planning/design/{feature}.md (if complex)
---

# {Feature Title}

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

# Optional: Add .agents to gitignore (comment out if you want to track it)
# if ! grep -q "^\.agents/$" "$PROJECT_ROOT/.gitignore"; then
#   echo ".agents/" >> "$PROJECT_ROOT/.gitignore"
# fi

echo "✓ Project setup complete!"
echo ""
echo "Structure created:"
echo "  /AGENTS.md                                  - Agent configuration (with global link)"
echo "  /.agents/planning/user-stories/             - User stories"
echo "  /.agents/planning/test-definitions/         - Test definitions"
echo "  /.agents/planning/design/                   - Design docs"
echo "  /.agents/planning/issues/                   - Issue tracking"
echo "  /.agents/tickets/                           - Higher-level feature/epic tracking"
echo "  /.agents/hooks/                             - Symlinked from ~/.agents/coding/hooks"
echo "  /.agents/skills/                            - Symlinked from ~/.agents/coding/skills"
echo ""
echo "Next steps:"
echo "1. Review and customize /AGENTS.md (add project-specific context)"
echo "2. Create tickets in /.agents/tickets/ for major features"
echo "3. Create planning docs in /.agents/planning/"
echo "4. Set up tests/AGENTS.md if testing setup is complex"
echo ""
echo "Workflow:"
echo "  Ticket → User stories → Test definitions → TDD (RED → GREEN → REFACTOR)"
