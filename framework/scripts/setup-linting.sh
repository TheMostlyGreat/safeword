#!/bin/bash
################################################################################
# Claude Code Linting Hook Setup Script
#
# Automatically detects project type and configures ESLint + Prettier.
#
# Architecture:
#   .safeword/eslint-base.mjs  ← Auto-generated. We update this.
#   eslint.config.mjs          ← User-owned. Created once, never overwritten.
#
# Usage:
#   bash setup-linting.sh                    # First-time setup
#   bash setup-linting.sh --force            # Re-detect and update base config
#   bash setup-linting.sh --no-typescript    # Skip TypeScript even if detected
#
# Auto-detection:
#   - TypeScript: tsconfig.json OR typescript in package.json
#   - React: react in package.json
#   - Astro: astro in package.json
#
# After adding/removing frameworks:
#   bash setup-linting.sh --force
#   (Only updates .safeword/eslint-base.mjs, preserves your customizations)
################################################################################

set -e

VERSION="v3.0.0"

# Parse arguments
SKIP_TYPESCRIPT=false
SKIP_REACT=false
SKIP_ASTRO=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force|-f) FORCE=true; shift ;;
    --no-typescript|--no-ts) SKIP_TYPESCRIPT=true; shift ;;
    --no-react) SKIP_REACT=true; shift ;;
    --no-astro) SKIP_ASTRO=true; shift ;;
    --help|-h)
      echo "Usage: bash setup-linting.sh [options]"
      echo ""
      echo "Options:"
      echo "  --force, -f       Re-detect frameworks and update base config"
      echo "  --no-typescript   Skip TypeScript even if detected"
      echo "  --no-react        Skip React even if detected"
      echo "  --no-astro        Skip Astro even if detected"
      echo ""
      echo "Files:"
      echo "  .safeword/eslint-base.mjs  - Auto-generated (updated with --force)"
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

# --- Always generate/update .safeword/eslint-base.mjs ---
echo "  Generating .safeword/eslint-base.mjs..."

# Build imports
cat > .safeword/eslint-base.mjs << 'HEADER'
/**
 * SAFEWORD ESLint Base Config (auto-generated)
 * 
 * DO NOT EDIT - This file is regenerated when you run:
 *   bash setup-linting.sh --force
 * 
 * Add your customizations to eslint.config.mjs instead.
 */
import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';
HEADER

[ "$HAS_TYPESCRIPT" = true ] && echo "import tseslint from 'typescript-eslint';" >> .safeword/eslint-base.mjs
[ "$HAS_REACT" = true ] && cat >> .safeword/eslint-base.mjs << 'REACT_IMPORTS'
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPerf from 'eslint-plugin-react-perf';
REACT_IMPORTS
[ "$HAS_ASTRO" = true ] && echo "import astroPlugin from 'eslint-plugin-astro';" >> .safeword/eslint-base.mjs

cat >> .safeword/eslint-base.mjs << 'COMMON_IMPORTS'
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
[ "$HAS_TYPESCRIPT" = true ] && cat >> .safeword/eslint-base.mjs << 'TS_BLOCK'

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
[ "$HAS_REACT" = true ] && cat >> .safeword/eslint-base.mjs << 'REACT_BLOCK'

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
[ "$HAS_ASTRO" = true ] && cat >> .safeword/eslint-base.mjs << 'ASTRO_BLOCK'

  // Astro
  ...astroPlugin.configs.recommended,
ASTRO_BLOCK

# Determine file pattern for quality/security rules
FILE_PATTERN="**/*.{js,mjs,cjs"
[ "$HAS_TYPESCRIPT" = true ] && FILE_PATTERN+=",ts,tsx"
[ "$HAS_REACT" = true ] && FILE_PATTERN+=",jsx"
FILE_PATTERN+="}"

cat >> .safeword/eslint-base.mjs << QUALITY_BLOCK

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

echo "  ✓ Generated .safeword/eslint-base.mjs"

# --- Create eslint.config.mjs only if it doesn't exist ---
if [ -f eslint.config.mjs ]; then
  echo "  ✓ eslint.config.mjs exists (not overwriting - your customizations preserved)"
else
  cat > eslint.config.mjs << 'USER_CONFIG'
/**
 * ESLint Configuration
 * 
 * This file is YOURS to customize. It imports the auto-generated base config
 * and lets you add your own rules, override defaults, and customize boundaries.
 * 
 * Base config auto-detects: TypeScript, React, Astro
 * To update base after adding/removing frameworks:
 *   bash setup-linting.sh --force
 */
import base from './.safeword/eslint-base.mjs';

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

# Create check-linting-sync hook
cat > .claude/hooks/check-linting-sync.sh << 'EOF'
#!/bin/bash
# SessionStart hook - checks if ESLint config matches package.json frameworks
[ ! -f ".safeword/eslint-base.mjs" ] && exit 0
[ ! -f "package.json" ] && exit 0

DEPS=$(jq -r '(.dependencies // {}), (.devDependencies // {}) | keys[]' package.json 2>/dev/null || grep -E '"[^"]+"\s*:' package.json | cut -d'"' -f2)

HAS_TS=false; HAS_REACT=false; HAS_ASTRO=false
{ [ -f "tsconfig.json" ] || echo "$DEPS" | grep -qx "typescript"; } && HAS_TS=true
echo "$DEPS" | grep -qx "react" && HAS_REACT=true
echo "$DEPS" | grep -qx "astro" && HAS_ASTRO=true

CFG_TS=false; CFG_REACT=false; CFG_ASTRO=false
grep -q "typescript-eslint" .safeword/eslint-base.mjs 2>/dev/null && CFG_TS=true
grep -q "@eslint-react" .safeword/eslint-base.mjs 2>/dev/null && CFG_REACT=true
grep -q "eslint-plugin-astro" .safeword/eslint-base.mjs 2>/dev/null && CFG_ASTRO=true

MSG=""
[ "$HAS_TS" = true ] && [ "$CFG_TS" = false ] && MSG+="TypeScript added. "
[ "$HAS_TS" = false ] && [ "$CFG_TS" = true ] && MSG+="TypeScript removed. "
[ "$HAS_REACT" = true ] && [ "$CFG_REACT" = false ] && MSG+="React added. "
[ "$HAS_REACT" = false ] && [ "$CFG_REACT" = true ] && MSG+="React removed. "
[ "$HAS_ASTRO" = true ] && [ "$CFG_ASTRO" = false ] && MSG+="Astro added. "
[ "$HAS_ASTRO" = false ] && [ "$CFG_ASTRO" = true ] && MSG+="Astro removed. "

[ -n "$MSG" ] && echo "⚠️  ESLint out of sync: ${MSG}Run: bash .safeword/scripts/setup-linting.sh --force"
exit 0
EOF
chmod +x .claude/hooks/check-linting-sync.sh
echo "  ✓ Created check-linting-sync hook"

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

# Add SessionStart hook for sync check
if ! jq -e '.hooks.SessionStart[]?.hooks[]? | select(.command == "$CLAUDE_PROJECT_DIR/.claude/hooks/check-linting-sync.sh")' .claude/settings.json > /dev/null 2>&1; then
  jq '.hooks.SessionStart = (.hooks.SessionStart // []) + [{"hooks": [{"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/check-linting-sync.sh"}]}]' \
    .claude/settings.json > .claude/settings.json.tmp
  mv .claude/settings.json.tmp .claude/settings.json
  echo "  ✓ Added SessionStart hook (sync check)"
fi

echo ""
echo "================================="
echo "✓ Setup Complete!"
echo "================================="
echo ""
echo "Files created:"
echo "  .safeword/eslint-base.mjs  - Auto-generated base config (re-run with --force to update)"
echo "  eslint.config.mjs          - Your config (customize this, we won't overwrite)"
echo ""
echo "Detected frameworks:"
[ "$HAS_TYPESCRIPT" = true ] && echo "  ✓ TypeScript"
[ "$HAS_REACT" = true ] && echo "  ✓ React"
[ "$HAS_ASTRO" = true ] && echo "  ✓ Astro"
[ "$HAS_TYPESCRIPT" = false ] && [ "$HAS_REACT" = false ] && [ "$HAS_ASTRO" = false ] && echo "  → JavaScript only"
echo ""
echo "Included in base config:"
echo "  • eslint-plugin-boundaries (architecture)"
echo "  • eslint-plugin-sonarjs (code quality)"
echo "  • @microsoft/eslint-plugin-sdl (security)"
echo "  • eslint-config-prettier (formatting)"
echo ""
echo "Commands:"
echo "  npm run lint                        # Check all files"
echo "  npm run format                      # Format all files"
echo "  bash setup-linting.sh --force       # Re-detect frameworks, update base config"
echo ""
echo "Customize:"
echo "  Edit eslint.config.mjs to add rules, override boundaries, etc."
echo "  Your customizations are preserved when you run --force."
echo ""
