#!/bin/bash
################################################################################
# ESLint Config Sync Check (SessionStart hook)
#
# Checks if .safeword/eslint-base.mjs matches the frameworks in package.json.
# Alerts user if out of sync (e.g., React added but not in ESLint config).
#
# Usage: Called automatically at Claude Code session start
################################################################################

# Quick exit if no eslint config
[ ! -f ".safeword/eslint-base.mjs" ] && exit 0
[ ! -f "package.json" ] && exit 0

# Read dependencies
if command -v jq &> /dev/null; then
  DEPS=$(jq -r '(.dependencies // {}), (.devDependencies // {}) | keys[]' package.json 2>/dev/null || echo "")
else
  DEPS=$(grep -E '"[^"]+"\s*:' package.json | cut -d'"' -f2)
fi

# Detect what's installed
HAS_TS=false
HAS_REACT=false
HAS_ASTRO=false

{ [ -f "tsconfig.json" ] || echo "$DEPS" | grep -qx "typescript"; } && HAS_TS=true
echo "$DEPS" | grep -qx "react" && HAS_REACT=true
echo "$DEPS" | grep -qx "astro" && HAS_ASTRO=true

# Check what's in the config
CONFIG_HAS_TS=false
CONFIG_HAS_REACT=false
CONFIG_HAS_ASTRO=false

grep -q "typescript-eslint" .safeword/eslint-base.mjs 2>/dev/null && CONFIG_HAS_TS=true
grep -q "@eslint-react" .safeword/eslint-base.mjs 2>/dev/null && CONFIG_HAS_REACT=true
grep -q "eslint-plugin-astro" .safeword/eslint-base.mjs 2>/dev/null && CONFIG_HAS_ASTRO=true

# Build mismatch message
MISMATCHES=""

[ "$HAS_TS" = true ] && [ "$CONFIG_HAS_TS" = false ] && MISMATCHES+="TypeScript added. "
[ "$HAS_TS" = false ] && [ "$CONFIG_HAS_TS" = true ] && MISMATCHES+="TypeScript removed. "
[ "$HAS_REACT" = true ] && [ "$CONFIG_HAS_REACT" = false ] && MISMATCHES+="React added. "
[ "$HAS_REACT" = false ] && [ "$CONFIG_HAS_REACT" = true ] && MISMATCHES+="React removed. "
[ "$HAS_ASTRO" = true ] && [ "$CONFIG_HAS_ASTRO" = false ] && MISMATCHES+="Astro added. "
[ "$HAS_ASTRO" = false ] && [ "$CONFIG_HAS_ASTRO" = true ] && MISMATCHES+="Astro removed. "

# Alert if mismatched
if [ -n "$MISMATCHES" ]; then
  echo "⚠️  ESLint config out of sync: $MISMATCHES"
  echo "   Run: bash .safeword/scripts/setup-linting.sh --force"
  echo ""
fi

exit 0

