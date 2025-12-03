#!/bin/bash
# Markdown linter wrapper with helpful hints for MD040 errors
# Usage: ./lint-md.sh [markdownlint-cli2 args]

set -uo pipefail

# Run markdownlint and add context to MD040 errors
# Note: Don't use `set -e` - we need to capture exit code after pipe
pnpm markdownlint-cli2 "$@" 2>&1 | while IFS= read -r line; do
  echo "$line"
  if [[ "$line" == *"MD040"* ]]; then
    echo "    💡 Language hints: typescript|bash|json|yaml for code, 'text' for templates/pseudocode, 'plaintext' for directory trees"
  fi
done

# Preserve exit code from markdownlint (PIPESTATUS[0] is the first command in the pipe)
exit "${PIPESTATUS[0]}"
