#!/bin/bash
# Safeword post-tool hook - auto-lint changed files
# Silently auto-fixes, only outputs unfixable errors

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null)

# Exit silently if no file or file doesn't exist
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

# Change to project directory
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

# Determine linters based on file extension
case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.astro)
    # Prettier (silent, ignore errors)
    npx prettier --write "$file" 2>/dev/null

    # ESLint --fix (capture unfixable errors)
    errors=$(npx eslint --fix "$file" 2>&1)
    exit_code=$?
    if [ $exit_code -ne 0 ] && [ -n "$errors" ]; then
      echo "$errors"
    fi
    ;;

  *.md)
    # Markdownlint (capture unfixable errors)
    errors=$(npx markdownlint-cli2 --fix "$file" 2>&1)
    exit_code=$?
    if [ $exit_code -ne 0 ] && [ -n "$errors" ]; then
      echo "$errors"
    fi
    ;;

  *.json|*.css|*.scss|*.html|*.yaml|*.yml|*.graphql)
    # Prettier only (silent, ignore errors)
    npx prettier --write "$file" 2>/dev/null
    ;;
esac

exit 0
