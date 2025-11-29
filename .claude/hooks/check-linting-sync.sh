#!/bin/bash
# SessionStart hook - reminds user to re-run setup if frameworks changed
[ ! -f ".safeword/eslint/eslint-base.mjs" ] || [ ! -f "package.json" ] && exit 0
DEPS=$(jq -r '(.dependencies//{}),(.devDependencies//{}) | keys[]' package.json 2>/dev/null || grep -oE '"[^"]+":' package.json | tr -d '":')
HAS_TS=false; HAS_REACT=false; HAS_ASTRO=false
{ [ -f "tsconfig.json" ] || echo "$DEPS" | grep -qx "typescript"; } && HAS_TS=true
echo "$DEPS" | grep -qx "react" && HAS_REACT=true
echo "$DEPS" | grep -qx "astro" && HAS_ASTRO=true
CFG_TS=$(grep -q "typescript-eslint" .safeword/eslint/eslint-base.mjs && echo true || echo false)
CFG_REACT=$(grep -q "@eslint-react" .safeword/eslint/eslint-base.mjs && echo true || echo false)
CFG_ASTRO=$(grep -q "eslint-plugin-astro" .safeword/eslint/eslint-base.mjs && echo true || echo false)
MSG=""
[ "$HAS_TS" != "$CFG_TS" ] && MSG+="TypeScript "
[ "$HAS_REACT" != "$CFG_REACT" ] && MSG+="React "
[ "$HAS_ASTRO" != "$CFG_ASTRO" ] && MSG+="Astro "
[ -n "$MSG" ] && echo "⚠️ ESLint config out of sync (${MSG% }changed). Run: bash .safeword/scripts/setup-linting.sh"
exit 0
