#!/bin/bash
################################################################################
# Claude Code Hooks Setup
#
# Usage:
#   bash setup-claude.sh [options]
#
# Options:
#   --skip-linting         Skip linting setup
#   --skip-quality         Skip quality review setup
#
# Examples:
#   bash setup-claude.sh                # Full setup (auto-detects project type)
#   bash setup-claude.sh --skip-linting # Quality review only
#
# Linting auto-detects from package.json:
#   - TypeScript (tsconfig.json or typescript in deps)
#   - React (react in deps)
#   - Astro (astro in deps)
################################################################################

set -e  # Exit on error

VERSION="v1.0.0"

echo "================================="
echo "Claude Code Hooks Setup"
echo "Version: $VERSION"
echo "================================="
echo ""

# Find the script's directory (where setup scripts are located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
SKIP_LINTING=false
SKIP_QUALITY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-linting)
      SKIP_LINTING=true
      shift
      ;;
    --skip-quality)
      SKIP_QUALITY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: bash setup-claude.sh [--skip-linting] [--skip-quality]"
      exit 1
      ;;
  esac
done

# Check for jq (recommended for robust JSON parsing)
if ! command -v jq &> /dev/null; then
  echo "⚠️  Warning: 'jq' not found. Using grep fallback for JSON parsing (less robust)."
  echo "   Install jq for better reliability: brew install jq (macOS) or apt-get install jq (Linux)"
  echo ""
fi

# Get project directory (current directory)
PROJECT_DIR="$(pwd)"
echo "Setting up project in: $PROJECT_DIR"
echo ""

# Check if we're in a directory where we can write
if [ ! -w "." ]; then
  echo "ERROR: Cannot write to current directory. Please cd to your project root."
  exit 1
fi

# Run linting setup
if [ "$SKIP_LINTING" = false ]; then
  echo "[1/2] Running linting setup (auto-detect)..."
  echo ""
  bash "$SCRIPT_DIR/setup-linting.sh"
  echo ""
else
  echo "[1/2] Skipping linting setup"
  echo ""
fi

# Run quality review setup
if [ "$SKIP_QUALITY" = false ]; then
  if [ "$SKIP_LINTING" = false ]; then
    echo "[2/2] Running quality review setup..."
  else
    echo "[1/1] Running quality review setup..."
  fi
  echo ""
  bash "$SCRIPT_DIR/setup-quality.sh"
  echo ""
else
  echo "[2/2] Skipping quality review setup"
  echo ""
fi

echo "================================="
echo "✓ Claude Code Hooks Setup Complete!"
echo "================================="
echo ""
echo "What was configured:"
if [ "$SKIP_LINTING" = false ]; then
  echo "  • Auto-linting (auto-detected project type)"
fi
if [ "$SKIP_QUALITY" = false ]; then
  echo "  • Quality review hooks"
  echo "  • Global patterns (.safeword/SAFEWORD.md)"
  echo "  • Reference documentation (.safeword/guides/)"
fi
echo ""

# Create Claude skills directory and seed from framework if available
mkdir -p ".claude/skills"
if [ -d "$SCRIPT_DIR/../skills" ]; then
  cp -R "$SCRIPT_DIR/../skills/." ".claude/skills/" 2>/dev/null || true
  echo "  • Seeded .claude/skills/ from framework/skills/"
else
  echo "  • .claude/skills/ created (no framework skills found to copy)"
fi

# Create Claude MCP directory and seed from framework if available
mkdir -p ".claude/mcp"
if [ -d "$SCRIPT_DIR/../mcp" ]; then
  cp -R "$SCRIPT_DIR/../mcp/." ".claude/mcp/" 2>/dev/null || true
  echo "  • Seeded .claude/mcp/ from framework/mcp/"
else
  echo "  • .claude/mcp/ created (no framework MCPs found to copy)"
fi

# Add Arcade MCP Gateway config (HTTP) if not present
if [ ! -f ".claude/mcp/arcade.json" ]; then
  cat > ".claude/mcp/arcade.json" << EOF
{
  "name": "arcade",
  "transport": "http",
  "url": "${ARCADE_MCP_GATEWAY_URL:-}",
  "headers": {
    "Authorization": "Bearer ${ARCADE_API_KEY:-}"
  }
}
EOF
  echo "  • Created .claude/mcp/arcade.json (HTTP gateway config)"
else
  echo "  • .claude/mcp/arcade.json exists (skipped)"
fi

# Soft checks for required env vars
if [ -z "${ARCADE_API_KEY:-}" ]; then
  echo "  ! ARCADE_API_KEY not set. Set it to authenticate Arcade MCP Gateway."
fi
if [ -z "${ARCADE_MCP_GATEWAY_URL:-}" ]; then
  echo "  ! ARCADE_MCP_GATEWAY_URL not set. Set it to your Arcade MCP Gateway HTTP URL."
fi

# Drop sample env file for Arcade MCP Gateway
if [ ! -f ".env.arcade.example" ]; then
  cat > ".env.arcade.example" << 'EOF'
# Arcade MCP Gateway (HTTP)
# Copy these into your shell profile or a local env file (do NOT commit secrets).
ARCADE_MCP_GATEWAY_URL=https://your-gateway.example.com
ARCADE_API_KEY=your-arcade-api-key
EOF
  echo "  • Wrote .env.arcade.example (sample env for Arcade MCP Gateway)"
fi

# Ensure CLAUDE.md references SAFEWORD.md (prepend trigger or create file)
if [ -f "CLAUDE.md" ]; then
  if grep -q "@./.safeword/SAFEWORD.md" "CLAUDE.md"; then
    echo "  • CLAUDE.md already includes SAFEWORD trigger"
  else
    tmp_file=$(mktemp)
    cat > "$tmp_file" << 'EOF'
**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

EOF
    cat "CLAUDE.md" >> "$tmp_file"
    mv "$tmp_file" "CLAUDE.md"
    echo "  • Added SAFEWORD trigger to existing CLAUDE.md"
  fi
else
  cat > "CLAUDE.md" << 'EOF'
# Project Claude Context

**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---

## Project-Specific Guidance
- Add Claude-specific context, commands, or workflow notes here
EOF
  echo "  • Created CLAUDE.md with SAFEWORD trigger"
fi

echo "Next steps:"
echo "  1. Review generated files:"
echo "     • .safeword/        (global patterns and guides)"
echo "     • .claude/          (hooks and commands)"
echo "     • SAFEWORD.md (project context) or CLAUDE.md"
echo ""
echo "  2. Commit to git:"
echo "     git add .safeword/ .claude/ SAFEWORD.md"
echo "     git commit -m 'Add Claude Code hooks and patterns'"
echo "     git push"
echo ""
echo "  3. Start using Claude Code - hooks are active!"
echo ""





