#!/bin/bash
# Safeword: Auto-lint changed files (PostToolUse)
# Silently auto-fixes, only outputs unfixable errors
#
# SYNC: Keep file patterns in sync with LINT_STAGED_CONFIG in:
#   packages/cli/src/templates/content.ts
#
# This hook is intentionally simple - ESLint's config handles
# framework-specific rules (React, Vue, Svelte, Astro, etc.)

# Require jq for JSON parsing
command -v jq &> /dev/null || exit 0

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null)

# Exit silently if no file or file doesn't exist
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

# Change to project directory
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

# Determine linter based on file extension
case "$file" in
  # JS/TS and framework files - ESLint first (fix code), then Prettier (format)
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.mts|*.cjs|*.cts|*.vue|*.svelte|*.astro)
    errors=$(npx eslint --fix "$file" 2>&1)
    [ $? -ne 0 ] && [ -n "$errors" ] && echo "$errors"
    npx prettier --write "$file" 2>/dev/null
    ;;

  # Markdown - markdownlint first, then Prettier
  *.md)
    errors=$(npx markdownlint-cli2 --fix "$file" 2>&1)
    [ $? -ne 0 ] && [ -n "$errors" ] && echo "$errors"
    npx prettier --write "$file" 2>/dev/null
    ;;

  # Other supported formats - prettier only
  *.json|*.css|*.scss|*.html|*.yaml|*.yml|*.graphql)
    npx prettier --write "$file" 2>/dev/null
    ;;
esac

exit 0
