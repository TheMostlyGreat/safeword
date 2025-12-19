#!/bin/bash
# Safeword: Cursor adapter for afterFileEdit
# Auto-lints changed files, only outputs unfixable errors
# Sets marker file for stop hook to trigger quality review

# Require jq for JSON parsing
command -v jq &> /dev/null || exit 0

input=$(cat)

# Get workspace root and file path from Cursor's JSON format
workspace=$(echo "$input" | jq -r '.workspace_roots[0] // empty' 2>/dev/null)
file=$(echo "$input" | jq -r '.file_path // empty' 2>/dev/null)
conv_id=$(echo "$input" | jq -r '.conversation_id // "default"' 2>/dev/null)

# Exit silently if no file
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

# Change to workspace directory
[ -n "$workspace" ] && cd "$workspace" || true

# Check for .safeword directory
if [ ! -d ".safeword" ]; then
  exit 0
fi

# Set marker file for stop hook to know edits were made
touch "/tmp/safeword-cursor-edited-${conv_id}"

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
