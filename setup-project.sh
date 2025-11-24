#!/bin/bash
################################################################################
# Claude Code Project Setup - One Command Installer
#
# Usage:
#   bash setup-project.sh [options]
#
# Options:
#   --linting-mode MODE    Linting mode: minimal, typescript, react, electron, astro, biome
#                          (default: auto-detect from project files)
#   --skip-linting         Skip linting setup
#   --skip-quality-review  Skip quality review setup
#
# Examples:
#   bash setup-project.sh                          # Auto-detect + quality review
#   bash setup-project.sh --linting-mode biome     # Force Biome mode + quality review
#   bash setup-project.sh --skip-linting           # Quality review only
#
# Auto-detection logic:
#   - Biome: If @biomejs/biome already in package.json (ONLY Biome, no ESLint)
#   - Next.js: If next in package.json (uses React mode with ESLint)
#   - Electron: If electron in package.json
#   - Astro: If astro in package.json
#   - React: If react in package.json
#   - TypeScript: If typescript in package.json or tsconfig.json exists
#   - Minimal: Otherwise (or no package.json)
################################################################################

set -e  # Exit on error

VERSION="v1.0.0"

echo "================================="
echo "Claude Code Project Setup"
echo "Version: $VERSION"
echo "================================="
echo ""

# Find the script's directory (where setup scripts are located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
LINTING_MODE=""
AUTO_DETECT=true
SKIP_LINTING=false
SKIP_QUALITY_REVIEW=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --linting-mode)
      LINTING_MODE="$2"
      AUTO_DETECT=false
      shift 2
      ;;
    --skip-linting)
      SKIP_LINTING=true
      shift
      ;;
    --skip-quality-review)
      SKIP_QUALITY_REVIEW=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: bash setup-project.sh [--linting-mode MODE] [--skip-linting] [--skip-quality-review]"
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

# Auto-detect linting mode if not specified
if [ "$SKIP_LINTING" = false ] && [ "$AUTO_DETECT" = true ]; then
  echo "Auto-detecting project type..."

  # Check if package.json exists
  if [ -f package.json ]; then
    # Extract dependencies and devDependencies using jq (more robust than grep)
    if command -v jq &> /dev/null; then
      DEPS=$(jq -r '.dependencies // {}, .devDependencies // {} | keys[]' package.json 2>/dev/null || echo "")
    else
      # Fallback to grep if jq not available (less robust but works for most cases)
      DEPS=$(cat package.json | grep -E '"(dependencies|devDependencies)"' -A 100 | grep -E '^\s*"[^"]+"\s*:' | cut -d'"' -f2)
    fi

    # Check for specific frameworks/tools (priority order)
    if echo "$DEPS" | grep -q "^@biomejs/biome$"; then
      LINTING_MODE="biome"
      echo "  ✓ Detected: Biome (already installed)"
    elif echo "$DEPS" | grep -q "^next$"; then
      LINTING_MODE="react"
      echo "  ✓ Detected: Next.js project (using React mode)"
    elif echo "$DEPS" | grep -q "^electron$"; then
      LINTING_MODE="electron"
      echo "  ✓ Detected: Electron project"
    elif echo "$DEPS" | grep -q "^astro$"; then
      LINTING_MODE="astro"
      echo "  ✓ Detected: Astro project"
    elif echo "$DEPS" | grep -q "^react$"; then
      LINTING_MODE="react"
      echo "  ✓ Detected: React project"
    elif echo "$DEPS" | grep -q "^typescript$"; then
      LINTING_MODE="typescript"
      echo "  ✓ Detected: TypeScript project (typescript in package.json)"
    elif [ -f tsconfig.json ]; then
      LINTING_MODE="typescript"
      echo "  ✓ Detected: TypeScript project (tsconfig.json found)"
    else
      LINTING_MODE="minimal"
      echo "  ✓ Detected: Minimal/JavaScript project"
    fi
  elif [ -f tsconfig.json ]; then
    # No package.json but has tsconfig.json
    LINTING_MODE="typescript"
    echo "  ✓ Detected: TypeScript project (tsconfig.json found)"
  else
    # No package.json and no tsconfig.json - use minimal
    LINTING_MODE="minimal"
    echo "  ✓ Detected: Minimal project (no package.json)"
  fi

  echo ""
fi

# Default to typescript if still not set
if [ -z "$LINTING_MODE" ]; then
  LINTING_MODE="typescript"
fi

# Validate linting mode
if [ "$SKIP_LINTING" = false ]; then
  case "$LINTING_MODE" in
    minimal|typescript|react|electron|astro|biome)
      ;;
    *)
      echo "ERROR: Invalid linting mode: $LINTING_MODE"
      echo "Valid modes: minimal, typescript, react, electron, astro, biome"
      exit 1
      ;;
  esac
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
  echo "[1/2] Running linting setup (mode: $LINTING_MODE)..."
  echo ""
  bash "$SCRIPT_DIR/setup-linting.sh" "--$LINTING_MODE"
  echo ""
else
  echo "[1/2] Skipping linting setup"
  echo ""
fi

# Run quality review setup
if [ "$SKIP_QUALITY_REVIEW" = false ]; then
  if [ "$SKIP_LINTING" = false ]; then
    echo "[2/2] Running quality review setup..."
  else
    echo "[1/1] Running quality review setup..."
  fi
  echo ""
  bash "$SCRIPT_DIR/setup-quality-review.sh"
  echo ""
else
  echo "[2/2] Skipping quality review setup"
  echo ""
fi

echo "================================="
echo "✓ Project Setup Complete!"
echo "================================="
echo ""
echo "What was configured:"
if [ "$SKIP_LINTING" = false ]; then
  if [ "$AUTO_DETECT" = true ]; then
    echo "  • Auto-linting (auto-detected: $LINTING_MODE)"
  else
    echo "  • Auto-linting (manual mode: $LINTING_MODE)"
  fi
fi
if [ "$SKIP_QUALITY_REVIEW" = false ]; then
  echo "  • Quality review hooks"
  echo "  • Global patterns (.safeword/SAFEWORD.md)"
  echo "  • Reference documentation (.safeword/guides/)"
fi
echo ""
echo "Next steps:"
echo "  1. Review generated files:"
echo "     • .safeword/        (global patterns and guides)"
echo "     • .claude/          (hooks and commands)"
echo "     • AGENTS.md or CLAUDE.md (project context)"
echo ""
echo "  2. Commit to git:"
echo "     git add .safeword/ .claude/ AGENTS.md CLAUDE.md"
echo "     git commit -m 'Add Claude Code hooks and patterns'"
echo "     git push"
echo ""
echo "  3. Start using Claude Code - hooks are active!"
echo ""
