# Claude Code Linting Hook Setup

Automatically run ESLint and Prettier when Claude Code modifies your files.

**Updated for 2025:** Uses ESLint 9.22.0+ with `defineConfig()` and `globalIgnores()` helpers, Prettier 3.x modern defaults, and Claude Code PostToolUse hooks.

## Requirements

- Node.js and npm installed
- ESLint 9.22.0 or later (for `defineConfig` support)
- Prettier 3.x or later
- Claude Code with hooks support

## Quick Start

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/setup-linting.sh

# TypeScript mode (default - recommended)
bash setup-linting.sh

# Or choose a framework-specific mode:
bash setup-linting.sh --react      # React + TypeScript + Hooks
bash setup-linting.sh --electron   # Electron + TypeScript
bash setup-linting.sh --astro      # Astro + TypeScript
bash setup-linting.sh --minimal    # JavaScript only (no TypeScript)
```

## Setup Modes

The script supports different modes for different project types:

### Minimal Mode (~10MB)
```bash
bash setup-linting.sh --minimal
```
**Includes:** ESLint + Prettier only
**Best for:** Pure JavaScript projects, learning ESLint, constrained environments
**Catches:** Syntax errors, basic code issues

### TypeScript Mode (~25MB, default)
```bash
bash setup-linting.sh
# or explicitly: bash setup-linting.sh --typescript
```
**Includes:** ESLint + Prettier + TypeScript
**Best for:** TypeScript projects, general use, most modern JavaScript projects
**Catches:** Type errors, syntax errors, undefined variables

### React Mode (~35MB)
```bash
bash setup-linting.sh --react
```
**Includes:** TypeScript mode + React plugins
**Best for:** React applications, Next.js, React Native

**Additional features:**
- **React Hooks linting** - Catches missing dependencies in useEffect, useCallback, etc.
- **React-specific patterns** - Enforces best practices for components

### Electron Mode (~25MB)
```bash
bash setup-linting.sh --electron
```
**Includes:** Same as TypeScript mode
**Best for:** Electron desktop applications

**Note:** This is currently identical to TypeScript mode. Use it for semantic clarity in Electron projects.

### Astro Mode (~30MB)
```bash
bash setup-linting.sh --astro
```
**Includes:** TypeScript mode + Astro plugin
**Best for:** Astro projects

**Additional features:**
- **Astro component linting** - Lints `.astro` files properly
- **TypeScript in Astro** - Full TypeScript support in components

---

## What It Does

The setup script configures your project to automatically lint and format code whenever Claude Code uses the `Write` or `Edit` tools.

**Base packages (all modes):**
- `eslint` - JavaScript/TypeScript linter (v9.22.0+)
- `@eslint/js` - ESLint recommended configs
- `prettier` - Code formatter (v3.x)
- `eslint-config-prettier` - Disables ESLint rules that conflict with Prettier
- `globals` - Global variable definitions for different environments

**TypeScript+ modes also include:**
- `typescript-eslint` - TypeScript linting

**Framework modes add:**
- React: `@eslint-react/eslint-plugin`, `eslint-plugin-react-hooks`
- Astro: `eslint-plugin-astro`

**Created files:**
- `.claude/settings.json` - Hook configuration
- `.claude/hooks/prettier.sh` - Prettier formatting script
- `.claude/hooks/eslint.sh` - ESLint linting script
- `eslint.config.js` - ESLint flat config with 2025 best practices (if not present)
- `.prettierrc` - Prettier formatting options with modern defaults (if not present)
- `.prettierignore` - Files to exclude from formatting

**Added npm scripts:**
- `npm run lint` - Manually run ESLint
- `npm run format` - Manually run Prettier

## How It Works

The script configures `PostToolUse` hooks that trigger after Claude writes or edits files:

1. **Prettier runs first** - Formats the file (spacing, quotes, etc.)
2. **ESLint runs second** - Lints the formatted code (catches errors, enforces rules)

Both tools run with `--fix`/`--write` flags to automatically fix issues.

### Hook Configuration

The setup script creates two hook scripts and registers them in `.claude/settings.json`:

**`.claude/settings.json`:**
```json
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
```

**`.claude/hooks/prettier.sh`:**
```bash
#!/bin/bash
# Auto-format with Prettier after Write/Edit
file_path=$(jq -r '.tool_input.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  npx prettier --write "$file_path" 2>&1 || true
fi
```

**`.claude/hooks/eslint.sh`:**
```bash
#!/bin/bash
# Auto-lint with ESLint after Write/Edit
file_path=$(jq -r '.tool_input.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  npx eslint --fix "$file_path" 2>&1 || true
fi
```

**Key features:**
- `Write|Edit` - Single matcher for both Write and Edit tools (efficient)
- `jq -r '.tool_input.file_path'` - Extracts file path from JSON input (stdin)
- `[ -n "$file_path" ] && [ -f "$file_path" ]` - Validates file path exists
- `|| true` - Non-blocking: shows warnings but don't stop Claude
- `timeout: 10` and `timeout: 15` - Reasonable timeouts for fast tools

**How it works:**
PostToolUse hooks receive JSON via stdin containing `tool_input.file_path`. The hook scripts use `jq` to extract the file path, validate it exists, then run the formatter/linter on that specific file.

**Why scripts instead of inline commands?**
- Easier to read and maintain
- Simpler to customize (just edit the `.sh` files)
- No complex JSON escaping
- Better error handling
- Follows official Claude Code best practices

## Configuration Decisions

### Auto-Fix vs. Report-Only

**Default: Auto-fix enabled** (`--fix`, `--write`)

**Pros:**
- Claude sees corrected code immediately
- Saves manual formatting work
- Consistent style across the codebase

**To change to report-only:**
Edit `.claude/hooks/eslint.sh` and `.claude/hooks/prettier.sh` to remove the `--fix` and `--write` flags:

```bash
# In .claude/hooks/eslint.sh - remove --fix
npx eslint "$file_path" 2>&1 || true

# In .claude/hooks/prettier.sh - remove --write (use --check instead)
npx prettier --check "$file_path" 2>&1 || true
```

### Blocking vs. Non-Blocking

**Default: Non-blocking** (`|| true` at end of command)

**Pros:**
- Linting errors don't interrupt Claude's workflow
- You can fix issues later
- Useful for experimental/incomplete code

**To make blocking (stop on errors):**
Edit the hook scripts to remove `|| true` and use `exit 2` on errors:

```bash
# In .claude/hooks/eslint.sh - exit 2 on lint errors
file_path=$(jq -r '.tool_input.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  if ! npx eslint --fix "$file_path" 2>&1; then
    echo "ESLint errors found" >&2
    exit 2  # Block Claude from continuing
  fi
fi
```

### File Scope

**Default: Only changed file** (via `tool_input.file_path`)

**Pros:**
- Fast - doesn't re-lint entire project
- Focused feedback on current changes

**To lint entire project:**
```json
{
  "command": "cd \"$CLAUDE_PROJECT_DIR\" && npx eslint --fix . 2>&1 || true"
}
```
This ignores the file path from stdin and lints everything.

⚠️ **Warning:** Linting the entire project can be slow for large codebases and may time out.

## Customizing Linting Rules

### ESLint (eslint.config.js)

**Note:** The setup script creates an ESLint 9.22.0+ flat config using the latest 2025 best practices with `defineConfig()` and `globalIgnores()` helpers.

**What gets checked:**
- **Syntax errors** - Invalid JavaScript/TypeScript
- **Type errors** - TypeScript type mismatches (TS modes)
- **Undefined variables** - Using variables before declaration
- **React Hooks** - Missing dependencies, incorrect hook usage (React mode)
- **Framework-specific** - Astro component syntax, React patterns

**Tier 1 focus: Immediate feedback only**
This setup focuses on fast, objective checks that help Claude Code iterate quickly. It does NOT include:
- ❌ Code quality metrics (complexity, duplicates)
- ❌ Accessibility rules (can be noisy during development)
- ❌ Security scanning (better for commit-time/CI)

**Default config (eslint.config.js):**
```javascript
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  // Global ignores - applies to all files
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/build/',
    '**/.next/',
    '**/coverage/',
    '**/*.min.js',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml'
  ]),

  // Base configuration for all JavaScript files
  {
    name: 'base-config',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025
      }
    },
    rules: {
      // Add your custom rules here
    }
  },

  // Prettier must be last to disable conflicting rules
  {
    name: 'prettier-config',
    extends: [prettier]
  }
]);
```

**New 2025 Features:**
- `defineConfig()` - Provides type safety and auto-flattening (ESLint 9.22.0+, March 2025)
- `globalIgnores()` - Makes global ignore patterns explicit and clear
- Named configs - Each config object has a `name` for better debugging
- `globals` package - Centralized global variable definitions
- Proper `extends` within config objects - More flexible than array spreading

**Framework-Specific Examples:**

The setup script handles framework configurations automatically. See the [Setup Modes](#setup-modes) section above for:
- **TypeScript**: Use default mode (includes TypeScript linting)
- **React**: Use `--react` mode (includes React + Hooks)
- **Electron**: Use `--electron` mode (same as TypeScript)
- **Astro**: Use `--astro` mode (includes Astro component linting)

**Manual customization:**
If you need to further customize the generated config, edit `eslint.config.js`. For example:

```javascript
// Adding custom rules
{
  name: 'custom-rules',
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  }
}

// Project-specific ignores
globalIgnores([
  '**/node_modules/',
  '**/generated/**',  // Add your patterns
  '**/vendor/**',
  '**/*.config.js'
])
```

**Adding more plugins (optional):**
Want code quality or accessibility checks? Add them manually:

```bash
# Code quality
npm install --save-dev eslint-plugin-sonarjs

# Accessibility
npm install --save-dev eslint-plugin-jsx-a11y

# Security
npm install --save-dev eslint-plugin-security
```

Then update your config to include them. These are better for commit-time checking vs immediate feedback.

### Prettier (.prettierrc)

**Modern 2025 defaults:**
```json
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
```

**What changed from older defaults:**
- `printWidth: 100` (was 80) - More common for modern displays
- `trailingComma: "all"` (was "es5") - Better for git diffs, works in all modern JS
- `arrowParens: "avoid"` (was "always") - Cleaner arrow functions: `x => x + 1` vs `(x) => x + 1`
- `endOfLine: "lf"` - Explicit Unix line endings (avoids Windows/Mac inconsistencies)

Common customizations:
- `"semi": false` - No semicolons
- `"singleQuote": false` - Use double quotes
- `"printWidth": 120` - Even longer lines
- `"tabWidth": 4` - Wider indentation
- `"arrowParens": "always"` - Always use parentheses in arrow functions

## Testing

After setup, test the hooks:

1. Start a new Claude Code session in your project
2. Ask Claude to create a file with intentional style issues:
   ```
   Create a file test.js with this code:
   const x=1;console.log( x )
   ```
3. Check if the file was auto-formatted:
   ```bash
   cat test.js
   # Should show: const x = 1;
   #              console.log(x);
   ```

## Troubleshooting

### Hooks not running

Check hook registration:
```bash
claude /hooks
```

Enable debug output:
```bash
claude --debug
```

### Linting timeouts

Increase timeout in `.claude/settings.json`:
```json
{
  "timeout": 60
}
```

### ESLint/Prettier not found

Ensure dependencies are installed:
```bash
npm install
```

Check if `npx eslint --version` works.

### Conflicting rules

Ensure the Prettier config object is last in your config array:
```javascript
export default defineConfig([
  js.configs.recommended,
  // ... other configs
  {
    name: 'prettier-config',
    extends: [prettier]  // Must be last
  }
]);
```

## Advanced: Per-Project Configuration

For monorepos or projects with different linting needs, use project-level settings:

```bash
# Project-specific (committed to repo)
.claude/settings.json

# Local overrides (not committed)
.claude/settings.local.json
```

Example `.claude/settings.local.json` (disable Prettier, keep only ESLint):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
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
```

Or create a custom local hook script in `.claude/hooks/` and reference it.

## Alternative: Pre-commit Hooks

If you prefer running linters only before commits (not during development), use a tool like [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged) instead:

```bash
npm install --save-dev husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

Configure `package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

**Difference:**
- Claude Code hooks: Lint during development (immediate feedback)
- Pre-commit hooks: Lint before git commits (prevents bad commits)

You can use both together!

## What's New in 2025

This setup script uses the latest best practices as of November 2025:

### ESLint 9.22.0+ (March 2025)
- **`defineConfig()` function** - Type-safe configuration with auto-flattening ([announced March 2025](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/))
- **`globalIgnores()` helper** - Explicit global ignore patterns
- **`extends` in config objects** - More flexible than array spreading
- **Named configurations** - Better debugging with the `name` property
- **`globals` package** - Centralized environment globals
- **Tier 1 focus** - Fast, immediate feedback only (no code quality metrics)

### Prettier 3.x (Latest: 3.6.2)
- **Modern defaults** - `printWidth: 100`, `trailingComma: "all"`, `arrowParens: "avoid"`
- **Better git diffs** - Trailing commas on all multi-line structures
- **TypeScript config support** - New in Prettier 3.5 (February 2025)

### Claude Code Hooks
- **PostToolUse hooks** - Run linters after Write/Edit operations
- **Non-blocking pattern** - Show warnings without stopping Claude's workflow
- **File-scoped linting** - Only lint changed files for speed

## Choosing the Right Mode

**Decision flowchart:**

1. **Are you using a specific framework?**
   - React/Next.js/React Native → `--react`
   - Electron desktop app → `--electron`
   - Astro website → `--astro`

2. **Are you using TypeScript?**
   - Yes → Default mode (no flag needed)
   - No, pure JavaScript → `--minimal`

3. **Unsure or mixed project?**
   - Use default TypeScript mode - works for most projects
   - Adds minimal overhead (~25MB)
   - Catches type errors and basic bugs

**Mode comparison:**

| Mode | Size | TypeScript | React Hooks | Framework | Best For |
|------|------|------------|-------------|-----------|----------|
| `--minimal` | ~10MB | ❌ | ❌ | None | Learning, pure JS |
| Default | ~25MB | ✅ | ❌ | None | General use |
| `--react` | ~35MB | ✅ | ✅ | React | React apps |
| `--electron` | ~25MB | ✅ | ❌ | None | Desktop apps |
| `--astro` | ~30MB | ✅ | ❌ | Astro | Astro sites |

**Recommendation:** Start with **default mode** (TypeScript). It works for both JS and TS projects and isn't framework-specific. Add framework modes as needed.

## Resources

### Official Documentation
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [ESLint Flat Config Guide](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Prettier 3.5 Release Notes](https://prettier.io/blog/2025/02/09/3.5.0.html)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide.md)

### Framework Plugins (Included)
- [@eslint-react/eslint-plugin](https://www.npmjs.com/package/@eslint-react/eslint-plugin) - Modern React linting (React mode)
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) - React Hooks rules (React mode)
- [eslint-plugin-astro](https://www.npmjs.com/package/eslint-plugin-astro) - Astro component linting (Astro mode)
- [typescript-eslint](https://www.npmjs.com/package/typescript-eslint) - TypeScript support (all TS+ modes)

### Optional Plugins (Not Included - Add Manually)
These are better suited for commit-time or CI checking:
- [eslint-plugin-jsx-a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) - JSX accessibility checking
- [eslint-plugin-sonarjs](https://www.npmjs.com/package/eslint-plugin-sonarjs) - Code quality and bug detection
- [eslint-plugin-security](https://www.npmjs.com/package/eslint-plugin-security) - Security vulnerability detection
- [eslint-plugin-n](https://www.npmjs.com/package/eslint-plugin-n) - Node.js best practices

### 2025 Updates
- [Evolving Flat Config with Extends (March 2025)](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/)
- [ESLint 9 Flat Config Tutorial](https://dev.to/aolyang/eslint-9-flat-config-tutorial-2bm5)
- [Modern Linting in 2025](https://advancedfrontends.com/eslint-flat-config-typescript-javascript/)
- [ESLint Config Helpers](https://www.npmjs.com/package/@eslint/config-helpers)
- [Globals Package](https://www.npmjs.com/package/globals)
