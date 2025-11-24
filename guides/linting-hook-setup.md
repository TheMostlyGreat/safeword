# Claude Code Linting Hook Setup

Automatically run linting and formatting when Claude Code modifies your files.

**Updated for 2025:** Choose between ESLint + Prettier (flexible, many plugins) or Biome (10-25x faster, all-in-one). Uses ESLint 9.22.0+ with `defineConfig()` and `globalIgnores()`, Prettier 3.x modern defaults, Biome v2.0+, and Claude Code PostToolUse hooks.

## Requirements

- **Node.js and npm** - Required for running ESLint and Prettier
- **jq** - JSON processor required for PostToolUse hooks
  - macOS: `brew install jq`
  - Ubuntu/Debian: `sudo apt-get install jq`
  - Other: https://jqlang.github.io/jq/download/
- **ESLint 9.22.0 or later** - For `defineConfig` support
- **Prettier 3.x or later** - Modern formatting defaults
- **Claude Code with hooks support** - PostToolUse hooks

## Quick Start

The setup script is fully self-contained - all hooks and configs are generated inline, no global dependencies.

```bash
# Clone the agents repo (one-time setup)
git clone <YOUR_PRIVATE_REPO> /tmp/agents

# Run setup from your project directory
cd /path/to/your/project

# TypeScript mode (default - recommended)
bash /tmp/agents/coding/setup-linting.sh

# Or choose a different mode:
bash /tmp/agents/coding/setup-linting.sh --biome      # Biome (10-25x faster, single tool)
bash /tmp/agents/coding/setup-linting.sh --react      # React + TypeScript + Hooks
bash /tmp/agents/coding/setup-linting.sh --electron   # Electron + TypeScript
bash /tmp/agents/coding/setup-linting.sh --astro      # Astro + TypeScript
bash /tmp/agents/coding/setup-linting.sh --minimal    # JavaScript only (no TypeScript)

# Cleanup (optional - scripts are standalone)
rm -rf /tmp/agents
```

**What gets created:**
- `.claude/hooks/` - Local hook scripts (with version comments)
- `.claude/commands/lint.md` - `/lint` slash command
- `.claude/settings.json` - Hook configuration (appends to existing, preserves other hooks)
- Config files (if not present): `eslint.config.mjs`, `.prettierrc`, `biome.jsonc`

**Idempotent:** Safe to run multiple times - won't duplicate hooks if already installed.

**Note:** For full standalone operation (AGENTS.md + guides), also run `setup-quality-review.sh`.

## Setup Modes

The script supports different modes for different project types:

### Biome Mode (~15MB) **⚡ FASTEST**
```bash
bash setup-linting.sh --biome
```
**Includes:** Biome only (linter + formatter combined)
**Best for:** TypeScript/JavaScript/React projects where speed matters, simple projects, new projects
**Speed:** 10-25x faster than ESLint + Prettier
**Catches:** Type errors (85% coverage), syntax errors, basic code issues, formatting

**Pros:**
- ⚡ **Extremely fast** - Written in Rust, much faster than Node-based tools
- 🎯 **All-in-one** - Single tool for linting and formatting
- ⚙️ **Simple config** - One `biome.jsonc` file instead of two
- 🔋 **Zero dependencies** - No plugin conflicts

**Cons:**
- ❌ **Limited plugin ecosystem** - No third-party plugins (yet)
- ❌ **No framework-specific rules** - No Vue, Svelte, Astro support (planned)
- ❌ **Missing specialized plugins** - No security, accessibility, testing plugins
- ⚠️ **85% TypeScript coverage** - Catches less than typescript-eslint

**When to choose Biome:**
- Speed is critical (large codebases, frequent linting)
- Simple TypeScript/React project
- Don't need specialized ESLint plugins
- Want minimal configuration

**When to choose ESLint instead:**
- Need security/accessibility/testing plugins
- Working with Vue, Svelte, or Astro
- Need 100% TypeScript coverage
- Require custom linting rules

---

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

**For Biome mode:**
- `@biomejs/biome` - All-in-one linter + formatter (v2.0+)

**For ESLint modes - Base packages:**
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

**Created files (all modes):**
- `.claude/settings.json` - Hook configuration (appends to existing, preserves other hooks)
- `.claude/hooks/run-linters.sh` - **Shared linting script** with version comments (used by both hooks and `/lint` command)
- `.claude/hooks/auto-lint.sh` - PostToolUse hook wrapper with version comments
- `.claude/commands/lint.md` - `/lint` slash command for manual linting

**Version tracking:**
All generated files include version comments:
```bash
# Generated by .safeword/setup-linting.sh v1.0.0
# To upgrade: Re-run this script from your .agents repo
```

**Idempotency:**
- Running the script multiple times is safe
- Won't duplicate hooks if already installed
- Preserves other existing hooks (custom PostToolUse hooks won't be lost)

**For Biome mode:**
- `biome.jsonc` - Biome configuration (if not present)

**For ESLint modes:**
- `eslint.config.mjs` - ESLint flat config with 2025 best practices (if not present)
- `.prettierrc` - Prettier formatting options with modern defaults (if not present)
- `.prettierignore` - Files to exclude from formatting

**Added npm scripts:**
- `npm run lint` - Manually run linter (Biome or ESLint)
- `npm run format` - Manually run formatter (Biome or Prettier)

## How It Works

### Biome Mode
The script configures `PostToolUse` hooks that trigger after Claude writes or edits files:

1. **Biome runs** - Lints and formats in one pass (faster)

### ESLint Modes
The script configures `PostToolUse` hooks that trigger after Claude writes or edits files:

1. **Prettier runs first** - Formats the file (spacing, quotes, etc.)
2. **ESLint runs second** - Lints the formatted code (catches errors, enforces rules)

All tools run with auto-fix flags (`--write`, `--fix`) to automatically fix issues.

### Hook Configuration

The setup script creates a **shared linting architecture** for consistency between hooks and manual commands:

**`.claude/settings.json`:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-lint.sh",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

**`.claude/hooks/auto-lint.sh`** (PostToolUse hook wrapper):
```bash
#!/bin/bash
# PostToolUse hook wrapper - extracts file path from stdin
input=$(cat)

# Try file_path first (Write/Edit), fall back to notebook_path (NotebookEdit)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  # Delegate to shared linting script
  "$CLAUDE_PROJECT_DIR/.claude/hooks/run-linters.sh" "$file_path"
fi

exit 0  # Non-blocking
```

**`.claude/hooks/run-linters.sh`** (shared core logic):
```bash
#!/bin/bash
# Shared linting script - used by both hooks and /lint command
# Usage: run-linters.sh file.js  (single file)
#        run-linters.sh .        (all files)

if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 1
fi

# Check if npx is available (once, before the loop)
if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx not found. Please install Node.js and npm." >&2
  exit 1
fi

for target in "$@"; do
  if [ ! -e "$target" ]; then
    echo "Warning: $target does not exist, skipping" >&2
    continue
  fi

  # Run Prettier (formatting)
  echo "Formatting: $target"
  npx prettier --write "$target" 2>&1 || true

  # Run ESLint (linting)
  echo "Linting: $target"
  npx eslint --fix "$target" 2>&1 || true
done
```

**Key features:**
- ✅ **File-write tools only** - Matcher `Write|Edit|MultiEdit|NotebookEdit` triggers ONLY on file modifications
- ✅ **Handles all file tools** - Supports both `file_path` (Write/Edit/MultiEdit) and `notebook_path` (NotebookEdit)
- ✅ **Shared code** - Same linting logic for hooks and manual `/lint` command
- ✅ **DRY principle** - Single source of truth for linting behavior
- ✅ **Explicit stdin pattern** - `input=$(cat)` follows official Claude Code docs
- ✅ **Dependency checks** - Validates npx availability before running
- ✅ **Separation of concerns** - Hook wrapper handles stdin, core script handles linting
- ✅ **Easy to extend** - Add new linters by editing one file
- ✅ **Non-blocking** - `|| true` and `exit 0` ensure Claude continues on errors

**How it works:**
1. PostToolUse hook receives JSON via stdin with `tool_input.file_path`
2. `auto-lint.sh` extracts the file path using `jq`
3. Calls shared `run-linters.sh` with the file path
4. `run-linters.sh` runs Prettier and ESLint on the file

**Which tools trigger the hook:**
- ✅ **Write** - Creating or overwriting files
- ✅ **Edit** - Making targeted edits to existing files
- ✅ **MultiEdit** - Making multiple edits to a single file (shows as "Update" in UI)
- ✅ **NotebookEdit** - Modifying Jupyter notebook cells
- ❌ **Read** - Only reads, doesn't modify (no linting needed)
- ❌ **Bash** - Shell commands (could modify files but not a "file tool")
- ❌ **Grep/Glob** - Search operations (no file modifications)
- ❌ **TodoWrite** - Todo list updates (not code files)

The matcher `Write|Edit|MultiEdit|NotebookEdit` ensures the hook **ONLY** triggers on actual file write/edit operations.

**Why shared scripts?**
- **Consistency** - Hooks and `/lint` command behave identically
- **Maintainability** - Change linting logic in one place
- **Reusability** - Same script works for single files or entire project
- **Testability** - Can test linting logic independently

## Configuration Decisions

### Auto-Fix vs. Report-Only

**Default: Auto-fix enabled** (`--fix`, `--write`)

**Pros:**
- Claude sees corrected code immediately
- Saves manual formatting work
- Consistent style across the codebase

**To change to report-only:**
Edit `.claude/hooks/run-linters.sh` to remove the `--fix` and `--write` flags:

```bash
# In .claude/hooks/run-linters.sh
# Change --write to --check and remove --fix
for target in "$@"; do
  if [ ! -e "$target" ]; then
    echo "Warning: $target does not exist, skipping" >&2
    continue
  fi

  # Check formatting (don't fix)
  npx prettier --check "$target" 2>&1 || true

  # Lint only (don't fix)
  npx eslint "$target" 2>&1 || true
done
```

### Blocking vs. Non-Blocking

**Default: Non-blocking** (`|| true` at end of command)

**Pros:**
- Linting errors don't interrupt Claude's workflow
- You can fix issues later
- Useful for experimental/incomplete code

**To make blocking (stop on errors):**
Edit `.claude/hooks/auto-lint.sh` to exit with code 2 on errors:

```bash
#!/bin/bash
# PostToolUse hook wrapper - BLOCKING version
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  # Call shared linting script WITHOUT || true
  if ! "$CLAUDE_PROJECT_DIR/.claude/hooks/run-linters.sh" "$file_path"; then
    echo "Linting errors found" >&2
    exit 2  # Block Claude from continuing
  fi
fi

exit 0
```

And update `.claude/hooks/run-linters.sh` to fail on errors:

```bash
# Remove || true from linting commands
npx prettier --write "$target" 2>&1
npx eslint --fix "$target" 2>&1
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

### ESLint (eslint.config.mjs)

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

**Default config (eslint.config.mjs):**
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
If you need to further customize the generated config, edit `eslint.config.mjs`. For example:

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

## Quality Review Setup

In addition to linting, you can set up automatic quality review hooks that trigger when Claude proposes or makes changes:

```bash
# Run from your project directory
bash /tmp/agents/coding/setup-quality-review.sh
```

**What it does:**
- Creates `.claude/hooks/auto-quality-review.sh` - Stop hook that detects changes
- Creates `.claude/hooks/run-quality-review.sh` - Quality review prompt
- Creates `.claude/commands/quality-review.md` - `/quality-review` slash command
- Adds Stop hook to `.claude/settings.json` (appends to existing, preserves other hooks)

**Hook behavior:**
- Only runs in projects with `AGENTS.md` or `CLAUDE.md` (searches upward for monorepos)
- Triggers when Claude proposes or makes changes
- Skips if Claude asks a question (waits for your answer)
- Can be disabled per-project: create `.auto-quality-review.config`

**Quality review prompt:**
When triggered, Claude is prompted to:
- Verify correctness
- Check elegance
- Validate against latest docs and best practices
- Consider asking clarifying questions
- Think deeply and avoid bloat

**Combining linting and quality review:**
Both setup scripts use jq to merge hooks, so you can run both:
```bash
bash /tmp/agents/coding/setup-linting.sh --typescript
bash /tmp/agents/coding/setup-quality-review.sh
```

This creates a comprehensive review system:
- **Linting** (PostToolUse) - Immediate feedback on code style/errors
- **Quality review** (Stop) - Deeper review of correctness and design

## Advanced: Per-Project Configuration

For monorepos or projects with different linting needs, use project-level settings:

```bash
# Project-specific (committed to repo)
.claude/settings.json

# Local overrides (not committed)
.claude/settings.local.json
```

Example `.claude/settings.local.json` (disable hooks locally):
```json
{
  "hooks": {
    "PostToolUse": []
  }
}
```

Or create a custom version of `run-linters.sh` with different behavior and reference it from `auto-lint.sh`.

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
