#!/bin/bash
# Safeword: Auto-lint changed files (PostToolUse)
# Auto-fixes what it can, blocks on unfixable errors so Claude can fix them.
#
# Strategy (Option B - see .safeword/learnings/post-tool-linting-strategies.md):
# - Formatters: always exit 0 (they did their job)
# - ESLint: exit 2 if unfixable ERRORS remain (--quiet ignores warnings)
# - Markdown: always exit 0 (low-risk, MD040 can't always be auto-fixed)
#
# SYNC: Keep file patterns in sync with LINT_STAGED_CONFIG in:
#   packages/cli/src/templates/content.ts

# Require jq for JSON parsing
command -v jq &> /dev/null || exit 0

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null)

# Exit silently if no file or file doesn't exist
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

# Change to project directory
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR" || true

# Determine linter based on file extension
case "$file" in
  # JS/TS and framework files - ESLint first (fix code), then Prettier (format)
  # Exit 2 if unfixable errors remain so Claude can address them
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.mts|*.cjs|*.cts|*.vue|*.svelte|*.astro)
    # Run --fix --quiet: auto-fix what we can, only report errors (not warnings)
    errors=$(npx eslint --fix --quiet "$file" 2>&1)
    eslint_exit=$?

    # Always format
    npx prettier --write "$file" 2>/dev/null

    # If ESLint failed, output errors and block
    if [ $eslint_exit -ne 0 ]; then
      echo "$errors" >&2
      exit 2
    fi
    ;;

  # Markdown - markdownlint first, then Prettier
  # Always exit 0 - MD040 (language hints) often can't be auto-fixed
  *.md)
    npx markdownlint-cli2 --fix "$file" 2>/dev/null
    npx prettier --write "$file" 2>/dev/null
    ;;

  # Other supported formats - prettier only
  *.json|*.css|*.scss|*.html|*.yaml|*.yml|*.graphql)
    npx prettier --write "$file" 2>/dev/null
    ;;
esac

exit 0
