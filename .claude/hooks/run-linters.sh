#!/bin/bash
# Shared Linting Script - runs Prettier + ESLint on files
if [ -n "$CLAUDE_PROJECT_DIR" ]; then cd "$CLAUDE_PROJECT_DIR" || exit 1; fi
for target in "$@"; do
  [ -e "$target" ] || continue
  npx prettier --write "$target" 2>&1 || true
  npx eslint --fix "$target" 2>&1 || true
done
