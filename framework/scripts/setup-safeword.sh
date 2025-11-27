#!/bin/bash
# setup-agent-project.sh
# Sets up standardized agent project structure
# Also handles first-time user setup (~/.claude/skills/) automatically

set -e

PROJECT_ROOT=$(pwd)
SAFEWORD_DIR="$PROJECT_ROOT/.safeword"
# Locate framework files relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --use-claude-code) USE_CLAUDE_CODE=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

echo "Setting up agent project structure..."

# First-time user setup: Configure ~/.claude/skills/ (idempotent)
CLAUDE_USER_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_USER_DIR/skills"

# Check if skills need to be symlinked
if [ -d "$GLOBAL_AGENTS_DIR/skills" ]; then
  echo "Checking user-level skills setup..."
  for skill in "$GLOBAL_AGENTS_DIR/skills"/*; do
    if [ -d "$skill" ]; then
      skill_name=$(basename "$skill")
      target="$CLAUDE_USER_DIR/skills/$skill_name"

      # Only create symlink if it doesn't exist or is broken
      if [ ! -L "$target" ] || [ ! -e "$target" ]; then
        echo "  Linking $skill_name to ~/.claude/skills/"
        rm -f "$target" 2>/dev/null || true
        ln -s "$skill" "$target"
      fi
    fi
  done
fi

# Create directory structure with archive folders
mkdir -p "$AGENTS_DIR"/planning/{user-stories/{,archive},test-definitions/{,archive},design/{,archive},issues/{,archive}}
mkdir -p "$AGENTS_DIR"/tickets/{,completed,archived}

# Create Claude Code directory structure
mkdir -p "$PROJECT_ROOT/.claude"

# Copy framework SAFEWORD.md into project .safeword/ (global patterns)
mkdir -p "$SAFEWORD_DIR"
if [ -f "$SCRIPT_DIR/../SAFEWORD.md" ]; then
  cp "$SCRIPT_DIR/../SAFEWORD.md" "$SAFEWORD_DIR/SAFEWORD.md"
  echo "  ✓ Copied framework SAFEWORD.md to .safeword/SAFEWORD.md"
else
  echo "  ⚠ Warning: framework SAFEWORD.md not found at $SCRIPT_DIR/../SAFEWORD.md (skipping)"
fi

# Copy guides and templates into .safeword/ for standalone operation
if [ -d "$SCRIPT_DIR/../guides" ]; then
  cp -R "$SCRIPT_DIR/../guides" "$SAFEWORD_DIR/" 2>/dev/null || true
  echo "  ✓ Copied guides to .safeword/guides/"
else
  echo "  ⚠ Warning: framework guides not found at $SCRIPT_DIR/../guides (skipping)"
fi
if [ -d "$SCRIPT_DIR/../templates" ]; then
  cp -R "$SCRIPT_DIR/../templates" "$SAFEWORD_DIR/" 2>/dev/null || true
  echo "  ✓ Copied templates to .safeword/templates/"
else
  echo "  ⚠ Warning: framework templates not found at $SCRIPT_DIR/../templates (skipping)"
fi

# Copy prompts into .safeword/prompts/ for LLM review hooks
if [ -d "$SCRIPT_DIR/../prompts" ]; then
  cp -R "$SCRIPT_DIR/../prompts" "$SAFEWORD_DIR/" 2>/dev/null || true
  echo "  ✓ Copied prompts to .safeword/prompts/"
else
  echo "  ⚠ Warning: framework prompts not found at $SCRIPT_DIR/../prompts (skipping)"
fi

# Copy scripts to .safeword/scripts/
mkdir -p "$SAFEWORD_DIR/scripts"

if [ -f "$SCRIPT_DIR/arch-review.sh" ]; then
  cp "$SCRIPT_DIR/arch-review.sh" "$SAFEWORD_DIR/scripts/" 2>/dev/null || true
  chmod +x "$SAFEWORD_DIR/scripts/arch-review.sh"
  echo "  ✓ Copied arch-review.sh to .safeword/scripts/"
else
  echo "  ⚠ Warning: arch-review.sh not found (skipping)"
fi

if [ -f "$SCRIPT_DIR/check-linting-sync.sh" ]; then
  cp "$SCRIPT_DIR/check-linting-sync.sh" "$SAFEWORD_DIR/scripts/" 2>/dev/null || true
  chmod +x "$SAFEWORD_DIR/scripts/check-linting-sync.sh"
  echo "  ✓ Copied check-linting-sync.sh to .safeword/scripts/"
else
  echo "  ⚠ Warning: check-linting-sync.sh not found (skipping)"
fi

if [ -f "$SCRIPT_DIR/setup-linting.sh" ]; then
  cp "$SCRIPT_DIR/setup-linting.sh" "$SAFEWORD_DIR/scripts/" 2>/dev/null || true
  chmod +x "$SAFEWORD_DIR/scripts/setup-linting.sh"
  echo "  ✓ Copied setup-linting.sh to .safeword/scripts/"
else
  echo "  ⚠ Warning: setup-linting.sh not found (skipping)"
fi

# Create SAFEWORD.md at project root if missing
if [ ! -f "$PROJECT_ROOT/SAFEWORD.md" ]; then
  echo "Creating SAFEWORD.md with project template..."
  cat > "$PROJECT_ROOT/SAFEWORD.md" << 'EOF'
# [Project Name] - SAFEWORD Configuration

Use the guides under `@./.safeword/guides/` for core patterns, workflows, and conventions.

---

## Project Overview

[Brief description. Current status.]

## Tech Stack

- [List your technologies here]

## Architecture Decisions

### [Tech Choice]
**Decision:** [What we chose]
**Why:** [Specific reasoning]
**Trade-off:** [What we gave up]
**Gotcha:** [Common mistake to avoid]

## Common Gotchas

1. **[Thing]:** [Why it breaks and how to fix]

## File Organization

**Dir** (`path/`) - Purpose
EOF
fi

# Create .claude/settings.json with global hook reference
if [ ! -f "$PROJECT_ROOT/.claude/settings.json" ]; then
  echo "Creating .claude/settings.json with local hook reference..."
  cat > "$PROJECT_ROOT/.claude/settings.json" << 'EOF'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-quality-review.sh"
          }
        ]
      }
    ]
  }
}
EOF
else
  echo "Note: .claude/settings.json already exists, skipping..."
fi

# Create git pre-commit hook for architecture enforcement
if [ -d "$PROJECT_ROOT/.git" ]; then
  mkdir -p "$PROJECT_ROOT/.git/hooks"
  
  # Check if pre-commit hook already exists
  if [ -f "$PROJECT_ROOT/.git/hooks/pre-commit" ]; then
    # Check if our section is already there (has our marker)
    if grep -q "SAFEWORD_ARCH_CHECK_START" "$PROJECT_ROOT/.git/hooks/pre-commit" 2>/dev/null; then
      echo "  ✓ Architecture checks already in pre-commit hook (skipped)"
    else
      # Append our checks to existing hook
      echo "  Appending architecture checks to existing pre-commit hook..."
      cat >> "$PROJECT_ROOT/.git/hooks/pre-commit" << 'EOF'

# === SAFEWORD_ARCH_CHECK_START ===
# Architecture Enforcement (appended by setup-safeword.sh)
# Get staged JS/TS files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|tsx|jsx)$' || true)

if [ -n "$STAGED_FILES" ]; then
  echo "Running architecture checks..."
  
  # ESLint (if configured)
  if command -v npx &> /dev/null && [ -f "eslint.config.mjs" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    echo "$STAGED_FILES" | xargs npx eslint --max-warnings 0 || exit 1
  fi
  
  # Architecture review (if configured and API key set)
  if [ -f ".safeword/scripts/arch-review.sh" ] && [ -n "$ANTHROPIC_API_KEY" ]; then
    bash .safeword/scripts/arch-review.sh --staged || {
      if [ $? -eq 1 ]; then exit 1; fi  # Only fail on refactor_needed
    }
  fi
fi
# === SAFEWORD_ARCH_CHECK_END ===
EOF
      echo "  ✓ Appended architecture checks to existing pre-commit hook"
    fi
  else
    # Create new pre-commit hook
    cat > "$PROJECT_ROOT/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# === SAFEWORD_ARCH_CHECK_START ===
################################################################################
# Pre-commit Hook: Architecture Enforcement
#
# Runs:
# 1. ESLint on staged files (fast, free, deterministic)
# 2. arch-review.sh on staged files (semantic LLM review, requires ANTHROPIC_API_KEY)
#
# Exit codes:
#   0 - All checks pass, commit allowed
#   1 - Issues found, commit blocked
################################################################################

# Get staged JS/TS files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|tsx|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
  # No JS/TS files staged, skip checks
  exit 0
fi

echo "Running architecture checks on staged files..."
echo ""

# Step 1: ESLint (fast, deterministic)
echo "=== ESLint Check ==="
if command -v npx &> /dev/null && [ -f "eslint.config.mjs" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
  # Run ESLint on staged files
  echo "$STAGED_FILES" | xargs npx eslint --max-warnings 0
  ESLINT_EXIT=$?
  
  if [ $ESLINT_EXIT -ne 0 ]; then
    echo ""
    echo "✗ ESLint found errors. Please fix them before committing."
    exit 1
  fi
  echo "✓ ESLint passed"
else
  echo "⚠ ESLint not configured, skipping"
fi
echo ""

# Step 2: Architecture Review (semantic, requires API key)
echo "=== Architecture Review ==="
ARCH_REVIEW_SCRIPT=""

# Find arch-review.sh (check multiple locations)
if [ -f ".safeword/scripts/arch-review.sh" ]; then
  ARCH_REVIEW_SCRIPT=".safeword/scripts/arch-review.sh"
elif [ -f ".claude/hooks/arch-review.sh" ]; then
  ARCH_REVIEW_SCRIPT=".claude/hooks/arch-review.sh"
fi

if [ -n "$ARCH_REVIEW_SCRIPT" ] && [ -n "$ANTHROPIC_API_KEY" ]; then
  bash "$ARCH_REVIEW_SCRIPT" --staged
  ARCH_EXIT=$?
  
  if [ $ARCH_EXIT -eq 1 ]; then
    echo ""
    echo "✗ Architecture review found issues that need refactoring."
    echo "  Fix them before committing, or use 'git commit --no-verify' to bypass."
    exit 1
  elif [ $ARCH_EXIT -eq 2 ]; then
    echo "⚠ Architecture review encountered an error (continuing anyway)"
  else
    echo "✓ Architecture review passed"
  fi
elif [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠ ANTHROPIC_API_KEY not set, skipping LLM architecture review"
  echo "  Set it to enable: export ANTHROPIC_API_KEY='your-key'"
else
  echo "⚠ arch-review.sh not found, skipping LLM architecture review"
fi

echo ""
echo "✓ All pre-commit checks passed"
exit 0
# === SAFEWORD_ARCH_CHECK_END ===
EOF

    chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
    echo "  ✓ Created git pre-commit hook for architecture enforcement"
  fi
else
  echo "  ⚠ Not a git repository, skipping pre-commit hook"
fi

# Ensure learnings directory exists
mkdir -p "$SAFEWORD_DIR/learnings" "$SAFEWORD_DIR/learnings/archive"
echo "  ✓ Ensured .safeword/learnings/ and archive/ exist"

# If AGENTS.md exists, ensure it includes the SAFEWORD trigger at the top
if [ -f "$PROJECT_ROOT/AGENTS.md" ]; then
  if grep -q "@./.safeword/SAFEWORD.md" "$PROJECT_ROOT/AGENTS.md"; then
    echo "  ✓ AGENTS.md already has SAFEWORD.md reference (skipped)"
  else
    temp_file=$(mktemp)
    cat > "$temp_file" << 'EOF'
**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

EOF
    cat "$PROJECT_ROOT/AGENTS.md" >> "$temp_file"
    mv "$temp_file" "$PROJECT_ROOT/AGENTS.md"
    echo "  ✓ Added SAFEWORD.md reference to existing AGENTS.md"
  fi
else
  # Create AGENTS.md with SAFEWORD trigger
  cat > "$PROJECT_ROOT/AGENTS.md" << 'EOF'
# Project Name - Developer Context

**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

## Project-Specific Context

### Tech Stack
- Add your technologies here

### Architecture
- Add architecture notes here

### Gotchas
- Add project-specific gotchas here

### Conventions
- Add coding conventions here
EOF
  echo "  ✓ Created AGENTS.md with SAFEWORD.md reference"
fi

# Create README for planning
cat > "$SAFEWORD_DIR/planning/README.md" << 'EOF'
# Planning

## Structure

- `user-stories/` - User stories for features (As a X / Given-When-Then)
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

See `@./.safeword/SAFEWORD.md` for full workflow.
EOF

# Create README for tickets
cat > "$SAFEWORD_DIR/tickets/README.md" << 'EOF'
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
  - ./.safeword/planning/user-stories/001-user-authentication.md
  - ./.safeword/planning/test-definitions/001-user-authentication.md
  - ./.safeword/planning/design/001-user-authentication.md (if complex)
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

See `@./.safeword/SAFEWORD.md` → Ticket System for details.
EOF

# Create .gitignore if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.gitignore" ]; then
  echo "Creating .gitignore..."
  cat > "$PROJECT_ROOT/.gitignore" << 'EOF'
# Claude Code - Personal settings
.claude/settings.local.json
.claude/todos/
.claude/shell-snapshots/

# SAFEWORD planning (local state)
.safeword/planning/
.safeword/tickets/

# Node
node_modules/
dist/
*.log
.env
.env.local

# OS
.DS_Store
EOF
else
  # Add .safeword planning folders to existing gitignore if not present
  if ! grep -q "^\.safeword/planning/$" "$PROJECT_ROOT/.gitignore"; then
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# SAFEWORD planning (local state)" >> "$PROJECT_ROOT/.gitignore"
    echo ".safeword/planning/" >> "$PROJECT_ROOT/.gitignore"
    echo ".safeword/tickets/" >> "$PROJECT_ROOT/.gitignore"
    echo "Added .safeword planning folders to .gitignore"
  fi

  # Add Claude Code ignores if not present
  if ! grep -q "^\.claude/settings\.local\.json$" "$PROJECT_ROOT/.gitignore"; then
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# Claude Code - Personal settings" >> "$PROJECT_ROOT/.gitignore"
    echo ".claude/settings.local.json" >> "$PROJECT_ROOT/.gitignore"
    echo ".claude/todos/" >> "$PROJECT_ROOT/.gitignore"
    echo ".claude/shell-snapshots/" >> "$PROJECT_ROOT/.gitignore"
    echo "Added Claude Code ignores to .gitignore"
  fi
fi

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Structure created:"
echo "  /SAFEWORD.md                                - Project configuration (references guides)"
echo "  /.safeword/planning/user-stories/           - Active user stories"
echo "  /.safeword/planning/user-stories/archive/   - Completed user stories"
echo "  /.safeword/planning/test-definitions/       - Active test definitions"
echo "  /.safeword/planning/test-definitions/archive/ - Completed test definitions"
echo "  /.safeword/planning/design/                 - Active design docs"
echo "  /.safeword/planning/design/archive/         - Completed design docs"
echo "  /.safeword/planning/issues/                 - Active issues"
echo "  /.safeword/planning/issues/archive/         - Completed issues"
echo "  /.safeword/tickets/                         - Active tickets"
echo "  /.safeword/tickets/completed/               - Verified completed tickets"
echo "  /.safeword/tickets/archived/                - Blocked/cancelled tickets"
echo "  .gitignore                                  - Updated to exclude planning folders"
echo ""
echo "Next steps:"
echo "1. Review and customize /SAFEWORD.md (add project-specific context)"
echo "2. Create tickets in /.safeword/tickets/ for major features"
echo "3. Create planning docs in /.safeword/planning/"
echo "4. (Optional) Run framework/scripts/setup-claude.sh to add Claude Code hooks"






