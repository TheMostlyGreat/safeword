#!/bin/bash
# Safeword pre-commit hook
# Runs architecture checks before commit

# Run linting if available
if [ -f "package.json" ] && grep -q '"lint"' package.json; then
  npm run lint --silent || exit 1
fi

exit 0
