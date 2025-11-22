#!/bin/bash
################################################################################
# Claude Code Linting Hook Setup Script
#
# This script configures ESLint and Prettier to run automatically when Claude
# Code makes changes to your project files.
#
# Usage:
#   bash setup-linting.sh              # TypeScript mode (default)
#   bash setup-linting.sh --minimal    # Minimal (JS only)
#   bash setup-linting.sh --react      # React + TypeScript
#   bash setup-linting.sh --electron   # Electron + TypeScript
#   bash setup-linting.sh --astro      # Astro + TypeScript
#
# Modes:
#   --minimal   : ESLint + Prettier (~10MB)
#   (default)   : + TypeScript (~25MB)
#   --react     : + React + Hooks (~35MB)
#   --electron  : Same as TypeScript (~25MB)
#   --astro     : + Astro plugin (~30MB)
#
# Configuration:
# - Auto-fix: Enabled by default (--fix, --write)
# - Blocking: Non-blocking by default (shows warnings, doesn't stop Claude)
# - Scope: Only lints changed files (faster, more targeted)
################################################################################

set -e  # Exit on error

# Parse mode argument
MODE="${1:-typescript}"
case "$MODE" in
  --minimal)
    MODE="minimal"
    ;;
  --typescript|--ts)
    MODE="typescript"
    ;;
  --react)
    MODE="react"
    ;;
  --electron)
    MODE="electron"
    ;;
  --astro)
    MODE="astro"
    ;;
  *)
    MODE="typescript"  # Default
    ;;
esac

echo "================================="
echo "Claude Code Linting Setup"
echo "Mode: $MODE"
echo "================================="
echo ""

# Check if we're in a directory where we can write
if [ ! -w "." ]; then
  echo "ERROR: Cannot write to current directory. Please cd to your project root."
  exit 1
fi

PROJECT_ROOT="$(pwd)"
echo "Setting up linting in: $PROJECT_ROOT"
echo ""

# ============================================================================
# Step 1: Initialize package.json if needed
# ============================================================================
echo "[1/5] Checking for package.json..."

if [ ! -f "package.json" ]; then
  echo "  No package.json found. Creating one..."
  cat > package.json << 'EOF'
{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module",
  "description": "",
  "scripts": {},
  "devDependencies": {}
}
EOF
  echo "  ✓ Created package.json"
else
  echo "  ✓ package.json exists"

  # Add "type": "module" if not present (needed for ESLint 9.x flat config)
  if command -v jq &> /dev/null; then
    if [ "$(jq -r '.type // empty' package.json)" != "module" ]; then
      echo "  Adding \"type\": \"module\" to package.json for ESLint 9.x..."
      jq '. + {"type": "module"}' package.json > package.json.tmp
      mv package.json.tmp package.json
    fi
  fi
fi
echo ""

# ============================================================================
# Step 2: Install ESLint and Prettier
# ============================================================================
echo "[2/5] Installing ESLint and Prettier..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is not installed. Please install Node.js and npm first."
  exit 1
fi

# Determine packages based on mode
# Tier 1 only: Fast, objective, immediate feedback (no SonarJS, no a11y, no security)
BASE_PACKAGES="eslint @eslint/js prettier eslint-config-prettier globals"

case "$MODE" in
  minimal)
    PACKAGES="$BASE_PACKAGES"
    ;;
  typescript)
    PACKAGES="$BASE_PACKAGES typescript-eslint"
    ;;
  react)
    PACKAGES="$BASE_PACKAGES typescript-eslint @eslint-react/eslint-plugin eslint-plugin-react-hooks"
    ;;
  electron)
    PACKAGES="$BASE_PACKAGES typescript-eslint"
    ;;
  astro)
    PACKAGES="$BASE_PACKAGES typescript-eslint eslint-plugin-astro"
    ;;
esac

# Install linters as dev dependencies
echo "  Installing packages (this may take a moment)..."
echo "  Packages: $PACKAGES"
npm install --save-dev $PACKAGES --silent 2>&1 | grep -v "npm WARN" || true

echo "  ✓ Installed packages for $MODE mode"
echo ""

# ============================================================================
# Step 3: Add npm scripts for manual linting
# ============================================================================
echo "[3/5] Adding npm scripts..."

# Use a simple approach: read, modify with jq, write back
if command -v jq &> /dev/null; then
  # Add scripts using jq
  jq '.scripts.lint = "eslint ." | .scripts.format = "prettier --write ."' package.json > package.json.tmp
  mv package.json.tmp package.json
  echo "  ✓ Added 'npm run lint' and 'npm run format' scripts"
else
  echo "  ⚠ jq not found - please manually add these scripts to package.json:"
  echo '    "lint": "eslint ."'
  echo '    "format": "prettier --write ."'
fi
echo ""

# ============================================================================
# Step 4: Create .claude directory and settings.json
# ============================================================================
echo "[4/5] Configuring Claude Code hooks..."

mkdir -p .claude/hooks

# Create prettier hook script
cat > .claude/hooks/prettier.sh << 'EOF'
#!/bin/bash
# Auto-format with Prettier after Write/Edit
file_path=$(jq -r '.tool_input.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  npx prettier --write "$file_path" 2>&1 || true
fi
EOF

chmod +x .claude/hooks/prettier.sh

# Create eslint hook script
cat > .claude/hooks/eslint.sh << 'EOF'
#!/bin/bash
# Auto-lint with ESLint after Write/Edit
file_path=$(jq -r '.tool_input.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  npx eslint --fix "$file_path" 2>&1 || true
fi
EOF

chmod +x .claude/hooks/eslint.sh

# Create settings.json with linting hooks
cat > .claude/settings.json << 'EOF'
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/prettier.sh",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/eslint.sh",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
EOF

echo "  ✓ Created .claude/hooks/prettier.sh"
echo "  ✓ Created .claude/hooks/eslint.sh"
echo "  ✓ Created .claude/settings.json with linting hooks"
echo ""

# ============================================================================
# Step 5: Create basic config files if they don't exist
# ============================================================================
echo "[5/5] Checking for linter config files..."

# Create mode-specific eslint.config.js
if [ ! -f ".eslintrc.json" ] && [ ! -f ".eslintrc.js" ] && [ ! -f "eslint.config.js" ]; then

  case "$MODE" in
    minimal)
      cat > eslint.config.js << 'EOF'
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'
  ]),
  {
    name: 'base-config',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 }
    }
  },
  { name: 'prettier-config', extends: [prettier] }
]);
EOF
      ;;

    typescript)
      cat > eslint.config.js << 'EOF'
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'
  ]),
  {
    name: 'base-config',
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 }
    }
  },
  {
    name: 'typescript-config',
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended]
  },
  { name: 'prettier-config', extends: [prettier] }
]);
EOF
      ;;

    react)
      cat > eslint.config.js << 'EOF'
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'
  ]),
  {
    name: 'base-config',
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 },
      parserOptions: { ecmaFeatures: { jsx: true } }
    }
  },
  {
    name: 'typescript-config',
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended]
  },
  {
    name: 'react-config',
    files: ['**/*.{jsx,tsx}'],
    extends: [reactPlugin.configs['recommended-typescript']],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules
    }
  },
  { name: 'prettier-config', extends: [prettier] }
]);
EOF
      ;;

    electron)
      cat > eslint.config.js << 'EOF'
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'
  ]),
  {
    name: 'base-config',
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 }
    }
  },
  {
    name: 'typescript-config',
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended]
  },
  { name: 'prettier-config', extends: [prettier] }
]);
EOF
      ;;

    astro)
      cat > eslint.config.js << 'EOF'
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'
  ]),
  {
    name: 'base-config',
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 }
    }
  },
  {
    name: 'typescript-config',
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended]
  },
  ...astroPlugin.configs.recommended,
  { name: 'prettier-config', extends: [prettier] }
]);
EOF
      ;;
  esac

  echo "  ✓ Created eslint.config.js ($MODE mode)"
else
  echo "  ✓ ESLint config already exists"
fi

# Create modern .prettierrc (Prettier 3.x best practices, 2025)
if [ ! -f ".prettierrc" ] && [ ! -f ".prettierrc.json" ] && [ ! -f "prettier.config.js" ]; then
  cat > .prettierrc << 'EOF'
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "trailingComma": "all",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
EOF
  echo "  ✓ Created .prettierrc (Prettier 3.x modern defaults)"
else
  echo "  ✓ Prettier config already exists"
fi

# Create .prettierignore if it doesn't exist
if [ ! -f ".prettierignore" ]; then
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
else
  echo "  ✓ .prettierignore already exists"
fi

echo ""
echo "================================="
echo "✓ Setup Complete! ($MODE mode)"
echo "================================="
echo ""

# Mode-specific info
case "$MODE" in
  minimal)
    echo "Configured for: JavaScript (minimal)"
    echo "  • ESLint core rules + Prettier"
    ;;
  typescript)
    echo "Configured for: JavaScript + TypeScript"
    echo "  • Type checking enabled"
    ;;
  react)
    echo "Configured for: React + TypeScript"
    echo "  • React Hooks rules enabled (catches dependency bugs)"
    echo "  • React-specific patterns enforced"
    ;;
  electron)
    echo "Configured for: Electron + TypeScript"
    echo "  • Same as TypeScript mode (ES + TS + Prettier)"
    ;;
  astro)
    echo "Configured for: Astro + TypeScript"
    echo "  • Astro component (.astro files) linting enabled"
    ;;
esac

echo ""
echo "What was configured:"
echo "  • ESLint and Prettier installed as dev dependencies"
echo "  • npm scripts added: 'npm run lint' and 'npm run format'"
echo "  • Claude Code hooks configured to auto-lint on Write/Edit"
echo ""
echo "Hook behavior:"
echo "  • Auto-fix enabled: Code is automatically formatted and fixed"
echo "  • Non-blocking: Linting errors won't stop Claude (warns only)"
echo "  • File-scoped: Only changed files are linted (fast)"
echo ""
echo "To customize:"
echo "  • Edit eslint.config.js for ESLint rules"
echo "  • Edit .prettierrc for Prettier formatting"
echo "  • Edit .claude/settings.json for hook behavior"
echo ""
echo "Test it:"
echo "  • Start a new Claude Code session"
echo "  • Ask Claude to create or edit a file"
echo "  • Watch for linting output after the change"
echo ""
