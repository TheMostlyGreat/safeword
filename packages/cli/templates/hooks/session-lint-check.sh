#!/bin/bash
# Safeword: Lint configuration sync check (SessionStart)
# Warns if ESLint or Prettier configs are missing or out of sync

# Change to project directory if set
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

if [ ! -d ".safeword" ]; then
  exit 0
fi

warnings=()

# Check for ESLint config
if [ ! -f "eslint.config.mjs" ] && [ ! -f "eslint.config.js" ] && [ ! -f ".eslintrc.json" ] && [ ! -f ".eslintrc.js" ]; then
  warnings+=("ESLint config not found - run 'npm run lint' may fail")
fi

# Check for Prettier config
if [ ! -f ".prettierrc" ] && [ ! -f ".prettierrc.json" ] && [ ! -f "prettier.config.js" ]; then
  warnings+=("Prettier config not found - formatting may be inconsistent")
fi

# Check for required dependencies
if [ -f "package.json" ]; then
  if ! grep -q '"eslint"' package.json 2>/dev/null; then
    warnings+=("ESLint not in package.json - run 'npm install -D eslint'")
  fi
  if ! grep -q '"prettier"' package.json 2>/dev/null; then
    warnings+=("Prettier not in package.json - run 'npm install -D prettier'")
  fi
fi

# Output warnings if any
if [ ${#warnings[@]} -gt 0 ]; then
  echo "SAFEWORD Lint Check:"
  for warning in "${warnings[@]}"; do
    echo "  ⚠️  $warning"
  done
fi

exit 0
