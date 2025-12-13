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
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR" || true

# Determine linter based on file extension
case "$file" in
  # JS/TS and framework files - ESLint first (fix code), then Prettier (format)
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.mts|*.cjs|*.cts|*.vue|*.svelte|*.astro)
    if ! errors=$(npx eslint --fix "$file" 2>&1); then
      [ -n "$errors" ] && echo "$errors"
    fi
    npx prettier --write "$file" 2>/dev/null
    ;;

  # Other supported formats - prettier only
  *.md|*.json|*.css|*.scss|*.html|*.yaml|*.yml|*.graphql)
    npx prettier --write "$file" 2>/dev/null
    ;;

  # Shell scripts - shellcheck (if available), then Prettier (if plugin installed)
  *.sh)
    if [ -f node_modules/.bin/shellcheck ] || command -v shellcheck &> /dev/null; then
      if ! errors=$(npx shellcheck "$file" 2>&1); then
        [ -n "$errors" ] && echo "$errors"
      fi
    fi
    if [ -d node_modules/prettier-plugin-sh ]; then
      npx prettier --write "$file" 2>/dev/null
    fi
    ;;
esac

exit 0
