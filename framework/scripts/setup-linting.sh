#!/bin/bash
################################################################################
# Claude Code Linting Hook Setup Script
#
# Automatically detects project type and configures ESLint + Prettier.
#
# Usage:
#   bash setup-linting.sh                    # Auto-detect (skip if config exists)
#   bash setup-linting.sh --force            # Regenerate config even if exists
#   bash setup-linting.sh --no-typescript    # Skip TypeScript even if detected
#   bash setup-linting.sh --no-react         # Skip React even if detected
#
# Auto-detection:
#   - TypeScript: tsconfig.json exists OR typescript in package.json
#   - React: react in package.json
#   - Astro: astro in package.json
#
# All projects get:
#   - eslint-plugin-boundaries (architecture enforcement)
#   - eslint-plugin-sonarjs (code smells)
#   - @microsoft/eslint-plugin-sdl (security)
#   - eslint-config-prettier (formatting)
#
# After adding/removing frameworks:
#   bash setup-linting.sh --force    # Re-detect and regenerate config
################################################################################

set -e

VERSION="v2.0.0"

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
      echo "  --force, -f       Regenerate eslint.config.mjs even if exists"
      echo "  --no-typescript   Skip TypeScript even if detected"
      echo "  --no-react        Skip React even if detected"
      echo "  --no-astro        Skip Astro even if detected"
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
  # Fallback without jq
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
# Step 4: Generate ESLint config
# ============================================================================
echo "[4/5] Generating eslint.config.mjs..."

# Check if config already exists
CONFIG_EXISTS=false
[ -f eslint.config.mjs ] || [ -f eslint.config.js ] || [ -f .eslintrc.json ] || [ -f .eslintrc.js ] && CONFIG_EXISTS=true

if [ "$CONFIG_EXISTS" = true ] && [ "$FORCE" = false ]; then
  echo "  ✓ ESLint config already exists (use --force to regenerate)"
elif [ "$CONFIG_EXISTS" = true ] && [ "$FORCE" = true ]; then
  echo "  → Regenerating eslint.config.mjs (--force)"
  rm -f eslint.config.mjs eslint.config.js  # Remove old configs
  
  # Fall through to generation below
fi

if [ "$CONFIG_EXISTS" = false ] || [ "$FORCE" = true ]; then
  # Build the config by appending blocks
  
  # --- IMPORTS ---
  cat > eslint.config.mjs << 'IMPORTS'
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
IMPORTS

  [ "$HAS_TYPESCRIPT" = true ] && echo "import tseslint from 'typescript-eslint';" >> eslint.config.mjs
  [ "$HAS_REACT" = true ] && cat >> eslint.config.mjs << 'REACT_IMPORTS'
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPerf from 'eslint-plugin-react-perf';
REACT_IMPORTS
  [ "$HAS_ASTRO" = true ] && echo "import astroPlugin from 'eslint-plugin-astro';" >> eslint.config.mjs

  cat >> eslint.config.mjs << 'COMMON_IMPORTS'
import sonarjs from 'eslint-plugin-sonarjs';
import sdl from '@microsoft/eslint-plugin-sdl';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml',
  ]),

  // Base JavaScript
  {
    name: 'base-js',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 },
    },
  },
COMMON_IMPORTS

  # --- TYPESCRIPT BLOCK ---
  [ "$HAS_TYPESCRIPT" = true ] && cat >> eslint.config.mjs << 'TS_BLOCK'

  // TypeScript
  {
    name: 'typescript',
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
  },
TS_BLOCK

  # --- REACT BLOCK ---
  [ "$HAS_REACT" = true ] && cat >> eslint.config.mjs << 'REACT_BLOCK'

  // React
  {
    name: 'react',
    files: ['**/*.{jsx,tsx}'],
    extends: [reactPlugin.configs['recommended-typescript']],
    plugins: { 'react-hooks': reactHooks, 'react-perf': reactPerf },
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

  # --- ASTRO BLOCK ---
  [ "$HAS_ASTRO" = true ] && cat >> eslint.config.mjs << 'ASTRO_BLOCK'

  // Astro
  ...astroPlugin.configs.recommended,
ASTRO_BLOCK

  # --- ALWAYS-INCLUDED BLOCKS ---
  # Determine file pattern based on what's installed
  FILE_PATTERN="**/*.{js,mjs,cjs"
  [ "$HAS_TYPESCRIPT" = true ] && FILE_PATTERN+=",ts,tsx"
  [ "$HAS_REACT" = true ] && FILE_PATTERN+=",jsx"
  FILE_PATTERN+="}"

  cat >> eslint.config.mjs << QUALITY_BLOCK

  // Code quality (SonarJS)
  {
    name: 'sonarjs',
    files: ['$FILE_PATTERN'],
    extends: [sonarjs.configs.recommended],
  },

  // Security (Microsoft SDL)
  {
    name: 'security',
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

  // Architecture boundaries
  // Customize layers in ARCHITECTURE.md - see .safeword/guides/architecture-guide.md
  {
    name: 'boundaries',
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

  // Prettier (must be last)
  { name: 'prettier', extends: [prettier] },
]);
QUALITY_BLOCK

  echo "  ✓ Generated eslint.config.mjs"
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
if ! jq -e '.hooks.PostToolUse[]?.hooks[]? | select(.command == "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-lint.sh")' .claude/settings.json > /dev/null 2>&1; then
  jq '.hooks.PostToolUse = (.hooks.PostToolUse // []) + [{"matcher": "Write|Edit|MultiEdit|NotebookEdit", "hooks": [{"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-lint.sh", "timeout": 15}]}]' \
    .claude/settings.json > .claude/settings.json.tmp
  mv .claude/settings.json.tmp .claude/settings.json
  echo "  ✓ Added PostToolUse hook"
fi

echo ""
echo "================================="
echo "✓ Setup Complete!"
echo "================================="
echo ""
echo "Detected:"
[ "$HAS_TYPESCRIPT" = true ] && echo "  • TypeScript"
[ "$HAS_REACT" = true ] && echo "  • React"
[ "$HAS_ASTRO" = true ] && echo "  • Astro"
[ "$HAS_TYPESCRIPT" = false ] && [ "$HAS_REACT" = false ] && [ "$HAS_ASTRO" = false ] && echo "  • JavaScript only"
echo ""
echo "Installed:"
echo "  • ESLint + Prettier (auto-formatting)"
echo "  • eslint-plugin-boundaries (architecture)"
echo "  • eslint-plugin-sonarjs (code quality)"
echo "  • @microsoft/eslint-plugin-sdl (security)"
echo ""
echo "Commands:"
echo "  npm run lint      # Check all files"
echo "  npm run format    # Format all files"
echo ""
echo "Architecture boundaries:"
echo "  Default layers: app → domain, infra → domain, shared (no deps)"
echo "  Customize in eslint.config.mjs or see .safeword/guides/architecture-guide.md"
echo ""
