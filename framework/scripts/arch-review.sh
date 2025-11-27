#!/bin/bash
################################################################################
# Architecture Review Script
#
# Sends changed files to Claude Haiku API for semantic architecture review.
# Returns JSON verdict: clean | minor | refactor_needed
#
# Usage:
#   arch-review.sh file1.ts file2.ts    # Review specific files
#   arch-review.sh --staged             # Review git staged files
#
# Environment variables:
#   ANTHROPIC_API_KEY - Required. Your Anthropic API key.
#   ARCH_REVIEW_MODEL - Optional. Model to use (default: claude-3-haiku-20240307)
#
# Exit codes:
#   0 - Clean or minor issues (commit allowed)
#   1 - Refactor needed (commit blocked)
#   2 - Error (missing API key, network issue, etc.)
################################################################################

set -e

VERSION="v1.0.0"

# Configuration
MODEL="${ARCH_REVIEW_MODEL:-claude-3-haiku-20240307}"
MAX_TOKENS=1024

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check for required tools
if ! command -v curl &> /dev/null; then
  echo "ERROR: curl is required but not installed." >&2
  exit 2
fi

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed." >&2
  exit 2
fi

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY environment variable is not set." >&2
  echo "Set it with: export ANTHROPIC_API_KEY='your-api-key'" >&2
  exit 2
fi

# Parse arguments
FILES=()
STAGED_MODE=false

for arg in "$@"; do
  case "$arg" in
    --staged)
      STAGED_MODE=true
      ;;
    --help|-h)
      echo "Architecture Review Script $VERSION"
      echo ""
      echo "Usage:"
      echo "  arch-review.sh file1.ts file2.ts    # Review specific files"
      echo "  arch-review.sh --staged             # Review git staged files"
      echo ""
      echo "Environment variables:"
      echo "  ANTHROPIC_API_KEY - Required. Your Anthropic API key."
      echo "  ARCH_REVIEW_MODEL - Optional. Model (default: claude-3-haiku-20240307)"
      exit 0
      ;;
    *)
      FILES+=("$arg")
      ;;
  esac
done

# Get staged files if --staged mode
if [ "$STAGED_MODE" = true ]; then
  # Get staged files (only .js, .ts, .tsx, .jsx)
  while IFS= read -r file; do
    if [[ "$file" =~ \.(js|ts|tsx|jsx)$ ]]; then
      FILES+=("$file")
    fi
  done < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
fi

# Check if we have files to review
if [ ${#FILES[@]} -eq 0 ]; then
  echo "No files to review."
  exit 0
fi

echo "Reviewing ${#FILES[@]} file(s) for architectural issues..."

# Find ARCHITECTURE.md (search upward from current directory)
ARCH_FILE=""
SEARCH_DIR="$PWD"
while [ "$SEARCH_DIR" != "/" ]; do
  if [ -f "$SEARCH_DIR/ARCHITECTURE.md" ]; then
    ARCH_FILE="$SEARCH_DIR/ARCHITECTURE.md"
    break
  fi
  SEARCH_DIR=$(dirname "$SEARCH_DIR")
done

# Build context for the prompt
CONTEXT=""

# Add ARCHITECTURE.md if found
if [ -n "$ARCH_FILE" ]; then
  ARCH_CONTENT=$(cat "$ARCH_FILE" | head -c 8000)  # Limit to ~8KB
  CONTEXT+="## ARCHITECTURE.md\n\n$ARCH_CONTENT\n\n"
fi

# Add file contents
CONTEXT+="## Changed Files\n\n"
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    FILE_CONTENT=$(cat "$file" | head -c 4000)  # Limit each file to ~4KB
    CONTEXT+="### $file\n\n\`\`\`\n$FILE_CONTENT\n\`\`\`\n\n"
  fi
done

# Read the arch-review prompt
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/../prompts/arch-review.md"

# Fall back to .safeword location if framework location doesn't exist
if [ ! -f "$PROMPT_FILE" ]; then
  # Try .safeword/prompts/ location (when installed in project)
  PROJECT_ROOT="$PWD"
  while [ "$PROJECT_ROOT" != "/" ]; do
    if [ -f "$PROJECT_ROOT/.safeword/prompts/arch-review.md" ]; then
      PROMPT_FILE="$PROJECT_ROOT/.safeword/prompts/arch-review.md"
      break
    fi
    PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
  done
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: arch-review.md prompt not found." >&2
  exit 2
fi

PROMPT=$(cat "$PROMPT_FILE")

# Combine prompt with context
FULL_PROMPT="$PROMPT\n\n---\n\n$CONTEXT"

# Escape for JSON
FULL_PROMPT_ESCAPED=$(echo -e "$FULL_PROMPT" | jq -Rs .)

# Make API request
RESPONSE=$(curl -s -X POST "https://api.anthropic.com/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d "{
    \"model\": \"$MODEL\",
    \"max_tokens\": $MAX_TOKENS,
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": $FULL_PROMPT_ESCAPED
      }
    ]
  }" 2>&1)

# Check for API errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message // "Unknown error"')
  echo "ERROR: API request failed: $ERROR_MSG" >&2
  exit 2
fi

# Extract the text response
TEXT_RESPONSE=$(echo "$RESPONSE" | jq -r '.content[0].text // empty')

if [ -z "$TEXT_RESPONSE" ]; then
  echo "ERROR: Empty response from API" >&2
  exit 2
fi

# Try to extract JSON from the response
JSON_RESULT=$(echo "$TEXT_RESPONSE" | grep -oP '\{[^{}]*"verdict"[^{}]*\}' | head -1 || true)

# If no simple JSON found, try to extract from code block
if [ -z "$JSON_RESULT" ]; then
  JSON_RESULT=$(echo "$TEXT_RESPONSE" | sed -n '/```json/,/```/p' | grep -v '```' | tr -d '\n' || true)
fi

# Parse verdict
VERDICT="clean"
if [ -n "$JSON_RESULT" ]; then
  VERDICT=$(echo "$JSON_RESULT" | jq -r '.verdict // "clean"' 2>/dev/null || echo "clean")
fi

# Output results
echo ""
echo "=== Architecture Review Results ==="
echo ""

# Show full response for debugging/context
echo "$TEXT_RESPONSE"
echo ""

# Show verdict with color
case "$VERDICT" in
  clean)
    echo -e "${GREEN}✓ Verdict: CLEAN${NC}"
    echo "No architectural issues found."
    exit 0
    ;;
  minor)
    echo -e "${YELLOW}⚠ Verdict: MINOR${NC}"
    echo "Minor issues noted. Commit allowed."
    exit 0
    ;;
  refactor_needed)
    echo -e "${RED}✗ Verdict: REFACTOR NEEDED${NC}"
    echo "Significant architectural issues found. Please address before committing."
    exit 1
    ;;
  *)
    echo -e "${YELLOW}? Verdict: UNKNOWN (${VERDICT})${NC}"
    echo "Could not parse verdict. Allowing commit."
    exit 0
    ;;
esac

