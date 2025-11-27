#!/bin/bash
################################################################################
# Claude Code Linting Hook Setup Script
#
# Automatically detects project type and configures ESLint + Prettier.
#
# Architecture:
#   .safeword/eslint/eslint-base.mjs  ← Auto-generated every run. Don't edit.
#   eslint.config.mjs                  ← Your config. Customize freely.
#
# Usage:
#   bash setup-linting.sh                    # Setup/update linting
#   bash setup-linting.sh --no-typescript    # Skip TypeScript detection
#   bash setup-linting.sh --no-react         # Skip React detection
#
# Auto-detection:
#   - TypeScript: tsconfig.json OR typescript in package.json
#   - React: react in package.json
#   - Astro: astro in package.json
################################################################################

set -e

VERSION="v3.1.0"

# Parse arguments
SKIP_TYPESCRIPT=false
SKIP_REACT=false
SKIP_ASTRO=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-typescript|--no-ts) SKIP_TYPESCRIPT=true; shift ;;
    --no-react) SKIP_REACT=true; shift ;;
    --no-astro) SKIP_ASTRO=true; shift ;;
    --help|-h)
      echo "Usage: bash setup-linting.sh [options]"
      echo ""
      echo "Options:"
      echo "  --no-typescript   Skip TypeScript even if detected"
      echo "  --no-react        Skip React even if detected"
      echo "  --no-astro        Skip Astro even if detected"
      echo ""
      echo "Files:"
echo "  $BASE_DIR/eslint-base.mjs  - Auto-generated (updated every run)"
      echo "  eslint.config.mjs          - Your config (created once, never overwritten)"
      exit 0
      ;;
    *) echo "Unknown option: $1 (use --help for usage)"; exit 1 ;;
  esac
done

echo "================================="
echo "Claude Code Linting Setup"
echo "Version: $VERSION"
echo "================================="
echo ""

PROJECT_ROOT="$(pwd)"
echo "Setting up in: $PROJECT_ROOT"
echo ""

# ============================================================================
# Step 1: Detect project type
# ============================================================================
echo "[1/5] Detecting project type..."

HAS_TYPESCRIPT=false
HAS_REACT=false
HAS_ASTRO=false

# Read dependencies from package.json
if [ -f package.json ] && command -v jq &> /dev/null; then
  DEPS=$(jq -r '(.dependencies // {}), (.devDependencies // {}) | keys[]' package.json 2>/dev/null || echo "")
elif [ -f package.json ]; then
  DEPS=$(grep -E '"[^"]+"\s*:' package.json | cut -d'"' -f2)
else
  DEPS=""
fi

# TypeScript detection
if [ "$SKIP_TYPESCRIPT" = false ]; then
  if [ -f tsconfig.json ] || echo "$DEPS" | grep -qx "typescript"; then
    HAS_TYPESCRIPT=true
    echo "  ✓ TypeScript detected"
  fi
fi

# React detection
if [ "$SKIP_REACT" = false ]; then
  if echo "$DEPS" | grep -qx "react"; then
    HAS_REACT=true
    echo "  ✓ React detected"
  fi
fi

# Astro detection
if [ "$SKIP_ASTRO" = false ]; then
  if echo "$DEPS" | grep -qx "astro"; then
    HAS_ASTRO=true
    echo "  ✓ Astro detected"
  fi
fi

[ "$HAS_TYPESCRIPT" = false ] && [ "$HAS_REACT" = false ] && [ "$HAS_ASTRO" = false ] && echo "  → JavaScript-only project"
echo ""

# ============================================================================
# Step 2: Create package.json if needed
# ============================================================================
echo "[2/5] Checking package.json..."

if [ ! -f package.json ]; then
  cat > package.json << 'EOF'
{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {},
  "devDependencies": {}
}
EOF
  echo "  ✓ Created package.json"
else
  echo "  ✓ package.json exists"
fi
echo ""

# ============================================================================
# Step 3: Install packages
# ============================================================================
echo "[3/5] Installing packages..."

# Base packages (always installed)
PACKAGES="eslint @eslint/js prettier eslint-config-prettier globals"
PACKAGES+=" eslint-plugin-sonarjs @microsoft/eslint-plugin-sdl eslint-plugin-boundaries"

# Conditional packages
[ "$HAS_TYPESCRIPT" = true ] && PACKAGES+=" typescript-eslint"
[ "$HAS_REACT" = true ] && PACKAGES+=" @eslint-react/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-perf"
[ "$HAS_ASTRO" = true ] && PACKAGES+=" eslint-plugin-astro"

echo "  Installing: $PACKAGES"
  npm install --save-dev $PACKAGES --silent 2>&1 | grep -v "npm WARN" || true
echo "  ✓ Packages installed"
echo ""

# ============================================================================
# Step 4: Generate ESLint configs
# ============================================================================
echo "[4/5] Generating ESLint configs..."

mkdir -p .safeword

# --- Always generate .safeword/eslint-base.mjs ---
BASE_DIR=".safeword/eslint"
mkdir -p "$BASE_DIR"
echo "  Generating $BASE_DIR/eslint-base.mjs..."

# Build the file with prominent header
cat > "$BASE_DIR/eslint-base.mjs" << 'HEADER'
////////////////////////////////////////////////////////////////////////////////
//
//  ██████╗  ██████╗     ███╗   ██╗ ██████╗ ████████╗    ███████╗██████╗ ██╗████████╗
//  ██╔══██╗██╔═══██╗    ████╗  ██║██╔═══██╗╚══██╔══╝    ██╔════╝██╔══██╗██║╚══██╔══╝
//  ██║  ██║██║   ██║    ██╔██╗ ██║██║   ██║   ██║       █████╗  ██║  ██║██║   ██║
//  ██║  ██║██║   ██║    ██║╚██╗██║██║   ██║   ██║       ██╔══╝  ██║  ██║██║   ██║
//  ██████╔╝╚██████╔╝    ██║ ╚████║╚██████╔╝   ██║       ███████╗██████╔╝██║   ██║
//  ╚═════╝  ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝    ╚═╝       ╚══════╝╚═════╝ ╚═╝   ╚═╝
//
//  AUTO-GENERATED FILE - DO NOT EDIT
//
//  This file is regenerated every time you run:
//    bash setup-linting.sh
//
//  To customize ESLint rules, edit eslint.config.mjs instead.
//  Your customizations there are preserved across regenerations.
//
////////////////////////////////////////////////////////////////////////////////

import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';
HEADER

[ "$HAS_TYPESCRIPT" = true ] && echo "import tseslint from 'typescript-eslint';" >> "$BASE_DIR/eslint-base.mjs"
[ "$HAS_REACT" = true ] && cat >> "$BASE_DIR/eslint-base.mjs" << 'REACT_IMPORTS'
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPerf from 'eslint-plugin-react-perf';
REACT_IMPORTS
[ "$HAS_ASTRO" = true ] && echo "import astroPlugin from 'eslint-plugin-astro';" >> "$BASE_DIR/eslint-base.mjs"

cat >> "$BASE_DIR/eslint-base.mjs" << 'COMMON_IMPORTS'
import sonarjs from 'eslint-plugin-sonarjs';
import sdl from '@microsoft/eslint-plugin-sdl';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml',
  ]),

  // Base JavaScript
  {
    name: 'safeword/base-js',
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 },
    },
  },
COMMON_IMPORTS

# TypeScript block
[ "$HAS_TYPESCRIPT" = true ] && cat >> "$BASE_DIR/eslint-base.mjs" << 'TS_BLOCK'

  // TypeScript
  {
    name: 'safeword/typescript',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
TS_BLOCK

# React block
[ "$HAS_REACT" = true ] && cat >> "$BASE_DIR/eslint-base.mjs" << 'REACT_BLOCK'

  // React
  {
    name: 'safeword/react',
    files: ['**/*.{jsx,tsx}'],
    ...reactPlugin.configs['recommended-typescript'],
    plugins: {
      'react-hooks': reactHooks,
      'react-perf': reactPerf,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-array-as-prop': 'warn',
      'react-perf/jsx-no-new-function-as-prop': 'warn',
    },
  },
REACT_BLOCK

# Astro block
[ "$HAS_ASTRO" = true ] && cat >> "$BASE_DIR/eslint-base.mjs" << 'ASTRO_BLOCK'

  // Astro
  ...astroPlugin.configs.recommended,
ASTRO_BLOCK

# Determine file pattern for quality/security rules
FILE_PATTERN="**/*.{js,mjs,cjs"
[ "$HAS_TYPESCRIPT" = true ] && FILE_PATTERN+=",ts,tsx"
[ "$HAS_REACT" = true ] && FILE_PATTERN+=",jsx"
FILE_PATTERN+="}"

cat >> "$BASE_DIR/eslint-base.mjs" << QUALITY_BLOCK

  // Code quality (SonarJS)
  {
    name: 'safeword/sonarjs',
    files: ['$FILE_PATTERN'],
    plugins: { sonarjs },
    rules: sonarjs.configs.recommended.rules,
  },

  // Security (Microsoft SDL)
  {
    name: 'safeword/security',
    files: ['$FILE_PATTERN'],
    plugins: { '@microsoft/sdl': sdl },
    rules: {
      '@microsoft/sdl/no-insecure-url': 'error',
      '@microsoft/sdl/no-inner-html': 'error',
      '@microsoft/sdl/no-document-write': 'error',
      '@microsoft/sdl/no-html-method': 'error',
      '@microsoft/sdl/no-insecure-random': 'error',
      '@microsoft/sdl/no-postmessage-star-origin': 'error',
    },
  },

  // Architecture boundaries (default layers - customize in eslint.config.mjs)
  {
    name: 'safeword/boundaries',
    files: ['src/**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'domain', pattern: 'src/domain/**/*' },
        { type: 'infra', pattern: 'src/infra/**/*' },
        { type: 'shared', pattern: 'src/shared/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app', allow: ['domain', 'infra', 'shared'] },
          { from: 'domain', allow: ['shared'] },
          { from: 'infra', allow: ['domain', 'shared'] },
          { from: 'shared', allow: [] },
        ],
      }],
    },
  },

  // Prettier (must be last in base)
  {
    name: 'safeword/prettier',
    ...prettier,
  },
];
QUALITY_BLOCK

echo "  ✓ Generated $BASE_DIR/eslint-base.mjs"

# --- Create eslint.config.mjs only if it doesn't exist ---
if [ -f eslint.config.mjs ]; then
  echo "  ✓ eslint.config.mjs exists (your customizations preserved)"
else
  cat > eslint.config.mjs << 'USER_CONFIG'
/**
 * ESLint Configuration
 * 
 * This file is YOURS to customize. It imports the auto-generated base config
 * and lets you add your own rules, override defaults, and customize boundaries.
 * 
 * The base config (.safeword/eslint-base.mjs) auto-detects:
 *   - TypeScript, React, Astro from package.json
 *   - Regenerated automatically when you run setup-linting.sh
 */
import base from './.safeword/eslint/eslint-base.mjs';

export default [
  // Include all base configs (TypeScript, React, boundaries, security, etc.)
  ...base,

  // =========================================================================
  // YOUR CUSTOMIZATIONS BELOW
  // =========================================================================

  // Example: Override boundary rules for your project's layer structure
  // {
  //   name: 'my-boundaries',
  //   files: ['src/**/*'],
  //   settings: {
  //     'boundaries/elements': [
  //       { type: 'features', pattern: 'src/features/**/*' },
  //       { type: 'pages', pattern: 'src/pages/**/*' },
  //       { type: 'shared', pattern: 'src/shared/**/*' },
  //     ],
  //   },
  //   rules: {
  //     'boundaries/element-types': ['error', {
  //       default: 'disallow',
  //       rules: [
  //         { from: 'pages', allow: ['features', 'shared'] },
  //         { from: 'features', allow: ['shared'] },
  //         { from: 'shared', allow: [] },
  //       ],
  //     }],
  //   },
  // },

  // Example: Add custom rules
  // {
  //   name: 'my-rules',
  //   rules: {
  //     'no-console': 'warn',
  //     '@typescript-eslint/no-explicit-any': 'off',
  //   },
  // },
];
USER_CONFIG
  echo "  ✓ Created eslint.config.mjs (customize this file)"
fi

echo ""

# ============================================================================
# Step 5: Create supporting files and hooks
# ============================================================================
echo "[5/5] Setting up hooks and configs..."

# Prettier config
if [ ! -f .prettierrc ] && [ ! -f .prettierrc.json ] && [ ! -f prettier.config.js ]; then
    cat > .prettierrc << 'EOF'
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
EOF
  echo "  ✓ Created .prettierrc"
  fi

# Prettier ignore
if [ ! -f .prettierignore ]; then
    cat > .prettierignore << 'EOF'
node_modules
dist
build
.next
coverage
*.min.js
package-lock.json
EOF
    echo "  ✓ Created .prettierignore"
fi

# Add npm scripts
if command -v jq &> /dev/null; then
  jq '.scripts.lint = "eslint ." | .scripts.format = "prettier --write ."' package.json > package.json.tmp
  mv package.json.tmp package.json
  echo "  ✓ Added npm scripts (lint, format)"
fi

# Claude Code hooks
mkdir -p .claude/hooks .claude/commands

cat > .claude/hooks/run-linters.sh << 'EOF'
#!/bin/bash
# Shared Linting Script - runs Prettier + ESLint on files
if [ -n "$CLAUDE_PROJECT_DIR" ]; then cd "$CLAUDE_PROJECT_DIR" || exit 1; fi
for target in "$@"; do
  [ -e "$target" ] || continue
  npx prettier --write "$target" 2>&1 || true
  npx eslint --fix "$target" 2>&1 || true
done
EOF
chmod +x .claude/hooks/run-linters.sh

cat > .claude/hooks/auto-lint.sh << 'EOF'
#!/bin/bash
# PostToolUse hook - auto-lint changed files
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -n "$file_path" ] && [ -f "$file_path" ] && "$CLAUDE_PROJECT_DIR/.claude/hooks/run-linters.sh" "$file_path"
exit 0
EOF
chmod +x .claude/hooks/auto-lint.sh

cat > .claude/commands/lint.md << 'EOF'
Run linting on all project files.

Execute:
```bash
bash .claude/hooks/run-linters.sh .
```
EOF

echo "  ✓ Created Claude Code hooks"

# Update settings.json
if [ ! -f .claude/settings.json ]; then
  echo '{"hooks": {}}' > .claude/settings.json
fi

# Add PostToolUse hook for auto-linting
if ! jq -e '.hooks.PostToolUse[]?.hooks[]? | select(.command == "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-lint.sh")' .claude/settings.json > /dev/null 2>&1; then
  jq '.hooks.PostToolUse = (.hooks.PostToolUse // []) + [{"matcher": "Write|Edit|MultiEdit|NotebookEdit", "hooks": [{"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-lint.sh", "timeout": 15}]}]' \
    .claude/settings.json > .claude/settings.json.tmp
  mv .claude/settings.json.tmp .claude/settings.json
  echo "  ✓ Added PostToolUse hook (auto-lint)"
fi

# Create and add SessionStart hook to detect framework changes
cat > .claude/hooks/check-linting-sync.sh << 'EOF'
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
EOF
chmod +x .claude/hooks/check-linting-sync.sh

if ! jq -e '.hooks.SessionStart[]?.hooks[]? | select(.command == "$CLAUDE_PROJECT_DIR/.claude/hooks/check-linting-sync.sh")' .claude/settings.json > /dev/null 2>&1; then
  jq '.hooks.SessionStart = (.hooks.SessionStart // []) + [{"hooks": [{"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/check-linting-sync.sh"}]}]' \
    .claude/settings.json > .claude/settings.json.tmp
  mv .claude/settings.json.tmp .claude/settings.json
  echo "  ✓ Added SessionStart hook (sync check)"
fi

# /setup-linting command
cat > .claude/commands/setup-linting.md << 'EOF'
Re-run SAFEWORD linting setup (auto-detects frameworks, regenerates base config).

Execute:
```bash
bash .safeword/scripts/setup-linting.sh
```
EOF
echo "  ✓ Created /setup-linting command"

echo ""
echo "================================="
echo "✓ Setup Complete!"
echo "================================="
echo ""
echo "Files:"
echo "  .safeword/eslint/eslint-base.mjs  - Auto-generated (DO NOT EDIT)"
echo "  eslint.config.mjs          - Your config (customize freely)"
echo ""
echo "Detected:"
[ "$HAS_TYPESCRIPT" = true ] && echo "  ✓ TypeScript"
[ "$HAS_REACT" = true ] && echo "  ✓ React"
[ "$HAS_ASTRO" = true ] && echo "  ✓ Astro"
[ "$HAS_TYPESCRIPT" = false ] && [ "$HAS_REACT" = false ] && [ "$HAS_ASTRO" = false ] && echo "  → JavaScript only"
echo ""
echo "Included:"
echo "  • eslint-plugin-boundaries (architecture)"
echo "  • eslint-plugin-sonarjs (code quality)"
echo "  • @microsoft/eslint-plugin-sdl (security)"
echo ""
echo "Commands:"
echo "  npm run lint      # Check all files"
echo "  npm run format    # Format all files"
echo ""
echo "After adding/removing frameworks, just re-run:"
echo "  bash setup-linting.sh"
echo ""
