#!/bin/bash
# Shared Quality Review Script
#
# Prompts for a quality review with configurable questions.
# Used by both Stop hooks and manual /quality-review command.
#
# Usage:
#   run-quality-review.sh               # With questions enabled
#   run-quality-review.sh --no-questions  # Without "ask me" prompt
#
# Environment variables:
#   CLAUDE_PROJECT_DIR - Project root (for finding config)

# Default: ask questions enabled
ask_questions=true

# Parse command line arguments
for arg in "$@"; do
  case "$arg" in
    --no-questions)
      ask_questions=false
      ;;
  esac
done

# Try to read project config if CLAUDE_PROJECT_DIR is set
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  config_file="$CLAUDE_PROJECT_DIR/.auto-quality-review.config"

  if [ -f "$config_file" ]; then
    while IFS='=' read -r key value; do
      # Skip empty lines and comments
      [[ -z "$key" || "$key" =~ ^# ]] && continue
      # Trim whitespace
      key=$(echo "$key" | xargs)
      value=$(echo "$value" | xargs)

      case "$key" in
        ask_questions)
          ask_questions="$value"
          ;;
      esac
    done < "$config_file"
  fi
fi

# Output quality review prompt to stderr (so Claude sees it)
echo "Double check and critique your work just in case." >&2
echo "" >&2
echo "- Is it correct?" >&2
echo "- Is it elegant?" >&2
echo "- Does it adhere to the latest documentation and best practices for the relevant stack items, UX principles, domain requirements, and testing practices?" >&2

if [ "$ask_questions" = "true" ]; then
  echo "- Ask me any non-obvious questions you can't research yourself in the codebase or online." >&2
fi

echo "- Think hard." >&2
echo "- Avoid bloat." >&2

# Exit with code 2 to block (Stop hook behavior)
exit 2



