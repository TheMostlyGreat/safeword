#!/bin/bash
# Safeword: Sync linting plugins with project dependencies (SessionStart)
#
# Detects frameworks in package.json and installs missing ESLint plugins.
# Ensures linting stays in sync when frameworks are added between commits.
#
# Example: Adding Astro between commits will auto-install eslint-plugin-astro
# before the next linting run.

# Run sync command quietly, capture list of changed files
changed_files=$(npx safeword sync --quiet 2>/dev/null)

# If files were changed, stage them for the next commit
if [ -n "$changed_files" ]; then
  echo "$changed_files" | while read -r file; do
    [ -f "$file" ] && git add "$file" 2>/dev/null
  done

  echo "Synced linting plugins with project dependencies"
  echo "Staged: $changed_files"
fi

exit 0
