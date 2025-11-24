# Safeword Elite DX Implementation Plan

Implementation roadmap for upgrading Safeword to elite developer experience standards.

---

## 1. One-Command Installation: Debate & Decision

### Option A: curl Installer
```bash
curl -fsSL https://raw.githubusercontent.com/TheMostlyGreat/safeword/main/install.sh | bash
```

**Pros:**
- Universal (works on any Unix system without Node.js)
- Fast (no npm registry delays)
- Direct from source (GitHub)
- Works in Docker, CI, minimal environments
- Standard pattern (Rust, Homebrew, Docker use this)

**Cons:**
- Scary for security-conscious devs ("piping to bash")
- No built-in version management (must handle manually)
- Harder to distribute updates (users must re-curl)
- Platform-specific (need separate Windows installer)

**Best for:** System-level tools, language installers, cross-platform CLIs

---

### Option B: npx/npm
```bash
npx @safeword/cli init
# or
npm install -g @safeword/cli
safeword init
```

**Pros:**
- Instant run (npx downloads + executes, no install)
- Automatic updates (npm handles versions)
- Works cross-platform (Windows, macOS, Linux)
- Familiar to all JS/TS devs
- Can bundle as dev dependency (teammates auto-get it)
- npm registry handles distribution

**Cons:**
- Requires Node.js (not universal)
- npm registry can be slow
- Global installs can conflict between projects
- npx adds ~2-3s startup time on first run

**Best for:** JavaScript/TypeScript project tooling, dev-focused CLIs

---

### Option C: brew tap (macOS only)
```bash
brew install safeword/tap/safeword
safeword init
```

**Pros:**
- Native package manager (trusted by macOS devs)
- Automatic updates (brew upgrade)
- Clean uninstall (brew uninstall)
- Version pinning (brew pin)

**Cons:**
- macOS only (70%+ of devs, but not universal)
- Requires maintaining Homebrew formula
- Slower adoption (must discover tap)
- Extra maintenance overhead

**Best for:** macOS-first tools with broad appeal

---

### **RECOMMENDATION: Option B (npx/npm)**

**Reasoning:**

1. **Target audience = JS/TS devs** - Safeword targets Claude Code users working on web projects. 99% have Node.js installed.

2. **Zero-friction distribution** - npm registry handles:
   - Versioning (`@safeword/cli@1.2.3`)
   - Updates (`npm update @safeword/cli`)
   - Platform detection (Windows, macOS, Linux)
   - Dependencies (no manual installs)

3. **Team onboarding magic** - Can add to `package.json`:
   ```json
   {
     "devDependencies": {
       "@safeword/cli": "^1.0.0"
     },
     "scripts": {
       "postinstall": "safeword verify --auto-init"
     }
   }
   ```
   Teammates run `npm install` → Safeword auto-configures. **Zero manual steps.**

4. **npx is instant** - No global install needed:
   ```bash
   npx @safeword/cli init    # Downloads, runs, caches
   npx @safeword/cli status  # Uses cached version
   ```

5. **Escape hatch for non-Node projects** - If someone wants Safeword for Python/Go/Rust, they can:
   ```bash
   npm install -g @safeword/cli  # Install once
   safeword init                 # Use anywhere
   ```

**Phase 2:** Add curl installer for non-Node users (Python/Go/Rust projects). But ship npx first.

---

## 2. Version Management

### Implementation

**In CLI:**
```bash
safeword --version              # 1.2.3
safeword update                 # Update to latest (npm update -g @safeword/cli)
safeword update --version 1.2.0 # Install specific version (npm install -g @safeword/cli@1.2.0)
safeword changelog              # Print CHANGELOG.md or open in browser
```

**Version in project:**
- Store in `.safeword/version` file: `1.2.3`
- CLI checks on `safeword status`:
  ```
  Project safeword version: 1.2.3
  Latest available: 1.3.0
  
  Update? safeword upgrade-project
  ```

**Breaking changes:**
- Semantic versioning (semver): `MAJOR.MINOR.PATCH`
- Major bumps = breaking changes (require migration)
- CLI detects version mismatch and offers migration:
  ```bash
  safeword status
  
  ⚠ Project safeword version (1.x) is outdated (latest: 2.0.0)
  
  Run migration: safeword migrate --from 1.x --to 2.x
  ```

---

## 3. Interactive Mode with Defaults

### Current Flow (Silent)
```bash
bash setup-project.sh
# ... tons of output ...
# Done
```

### Elite Flow (Interactive)
```bash
safeword init

# Detecting project...
# ✓ Found: Next.js with TypeScript
# 
# Install options:
#   [1] Recommended (auto-linting + quality review)
#   [2] Auto-linting only
#   [3] Quality review only
#   [4] Custom (choose components)
# 
# Choice [1]: 
# 
# Linting mode:
#   [1] Auto-detect (recommended: biome)
#   [2] ESLint + Prettier
#   [3] Biome
#   [4] Skip linting
# 
# Choice [1]:
# 
# Installing... ███████████████████████░ 90%
# 
# ✓ Configured in 4.2s
# 
# Installed:
#   • Auto-linting (biome, 15MB)
#   • Quality review hooks
#   • AGENTS.md with .safeword/SAFEWORD.md reference
# 
# Next steps:
#   1. git add .safeword .claude AGENTS.md
#   2. git commit -m "Add safeword config"
#   3. Ask Claude to create a file (test hooks)
# 
# Verification:
#   safeword status
```

### Non-interactive (CI mode)
```bash
safeword init --yes          # Accept all defaults
safeword init --ci           # Non-interactive, uses defaults, no colors
safeword init --linting-only # Skip quality review
```

---

## 4. Automatic Verification

### What to Verify

**After `safeword init`:**

1. **Files created:**
   - ✓ `.safeword/SAFEWORD.md` exists
   - ✓ `.safeword/guides/` exists (12 files)
   - ✓ `.claude/hooks/` exists (auto-lint.sh, auto-quality-review.sh, run-*.sh)
   - ✓ `.claude/settings.json` exists
   - ✓ `AGENTS.md` or `CLAUDE.md` exists

2. **Hooks registered:**
   - ✓ PostToolUse hook → auto-lint.sh
   - ✓ Stop hook → auto-quality-review.sh
   - ✓ SessionStart hook → version-check.sh

3. **AGENTS.md reference:**
   - ✓ Contains `@./.safeword/SAFEWORD.md`

4. **Linting configured:**
   - ✓ `eslint.config.mjs` or `biome.jsonc` exists
   - ✓ `npm run lint` works
   - ✓ `npm run format` works

5. **Smoke test:**
   - Create temp file: `test-safeword.js`
   - Run linter on it: `npx biome check test-safeword.js` (should succeed)
   - Delete temp file
   - ✓ Linter works

### Output

```bash
safeword init

# ... setup runs ...

Running verification...

Files:
  ✓ .safeword/SAFEWORD.md
  ✓ .safeword/guides/ (12 guides)
  ✓ .claude/hooks/ (5 hooks)
  ✓ .claude/settings.json
  ✓ AGENTS.md

Hooks:
  ✓ PostToolUse → auto-lint.sh
  ✓ Stop → auto-quality-review.sh
  ✓ SessionStart → version-check.sh

Linting:
  ✓ biome.jsonc configured
  ✓ npm run lint works
  ✓ npm run format works

✓ All checks passed!

Next: git add .safeword .claude AGENTS.md
```

**If verification fails:**
```bash
Running verification...

Files:
  ✓ .safeword/SAFEWORD.md
  ✗ .claude/settings.json missing

Fix: Re-run setup with --force
  safeword init --force
```

---

## 6. Global Config: No ~/.agents Folder

### Current Problem

README says:
```bash
git clone https://github.com/TheMostlyGreat/safeword ~/.agents
```

This creates **global state** that devs must manage:
- `cd ~/.agents && git pull` to update
- Manual git operations
- Confusing mental model (is safeword global or per-project?)

### Elite Solution: Project-Self-Contained

**Core principle:** Everything lives in the project. Zero global folders.

```
my-project/
├── .safeword/
│   ├── SAFEWORD.md          # Core patterns
│   ├── guides/              # All guides (copied from npm package)
│   ├── templates/           # Templates
│   └── version              # 1.2.3
├── .claude/
│   ├── hooks/
│   └── settings.json
└── AGENTS.md                # References @./.safeword/SAFEWORD.md
```

**No ~/.agents folder. No global state. Fully portable.**

### How Updates Work

**Option A: npm package contains everything**

When you run `npx @safeword/cli init`:

1. CLI downloads from npm (contains all guides/templates/patterns)
2. Copies files to `.safeword/` in your project
3. Project is now **standalone** (no external dependencies)

To update project:
```bash
safeword upgrade-project

# Fetching latest from npm...
# Upgrading .safeword/ from 1.2.3 → 1.3.0
# 
# Changed files:
#   • guides/testing-methodology.md (updated)
#   • guides/llm-prompting.md (new)
# 
# ✓ Upgraded to 1.3.0
```

**Internal:** CLI compares `.safeword/` files to npm package, only updates changed files.

---

**Option B: Hidden cache for faster installs**

CLI caches guides in `~/.cache/safeword/` (not ~/.agents):

```
~/.cache/safeword/
└── 1.3.0/                   # Version-specific cache
    ├── SAFEWORD.md
    ├── guides/
    └── templates/
```

**When you run `safeword init`:**

1. Check cache for latest version
2. If missing, download from npm → cache
3. Copy from cache to `.safeword/` in project
4. Project is standalone (cache only speeds up future installs)

**Benefits:**
- Faster installs (no repeated npm downloads)
- Offline support (cached versions work without network)
- Multiple projects share cache (save disk space)

**Clear cache:**
```bash
safeword cache clear         # Remove all cached versions
safeword cache clear --older-than 1.2.0  # Remove old versions
```

**Important:** Cache is **optional optimization**. Projects don't depend on it. If cache deleted, CLI re-downloads from npm.

---

### Learnings: Global or Project-Scoped?

**Problem:** Where do custom learnings go?

**Current:** `~/.agents/learnings/[concept].md` (global, shared across projects)

**Elite approach:** Both!

```
# Project-specific learnings (this codebase only)
my-project/.safeword/learnings/custom-auth-flow.md

# Global learnings (reusable across projects)
~/.config/safeword/learnings/react-hooks-gotchas.md
```

**CLI behavior:**
```bash
# In project directory
safeword learning add react-hooks-gotchas --global
# Creates: ~/.config/safeword/learnings/react-hooks-gotchas.md

safeword learning add custom-auth-flow
# Creates: .safeword/learnings/custom-auth-flow.md (project-local)

safeword learning list
# Shows both global + project learnings
```

**Agent behavior:** When agent needs learnings, check both:
1. `.safeword/learnings/*` (project-specific)
2. `~/.config/safeword/learnings/*` (global, cross-project)

**Why:** Some learnings are universal (React hooks), others are project-specific (your auth flow).

---

## 7. Zero Setup for Teammates

### The Problem

**Current flow:**
1. Dev sets up safeword: `bash setup-project.sh`
2. Commits `.safeword/` and `.claude/` to git
3. Teammate clones project
4. Teammate has safeword files but **hooks don't work** (no CLI installed)
5. Teammate must read docs, install CLI, run setup

**Pain:** 5 manual steps. High friction.

---

### Elite Solution: Automatic Onboarding

**Step 1: Dev sets up project**
```bash
cd my-project
npx @safeword/cli init

# Installs safeword, adds to package.json
```

**package.json after setup:**
```json
{
  "devDependencies": {
    "@safeword/cli": "^1.0.0"
  },
  "scripts": {
    "postinstall": "safeword verify --auto-init"
  }
}
```

**Step 2: Dev commits**
```bash
git add .safeword/ .claude/ AGENTS.md package.json
git commit -m "Add safeword config"
git push
```

**Step 3: Teammate clones and installs**
```bash
git clone my-project
cd my-project
npm install    # or pnpm install, yarn install
```

**What happens automatically:**

1. `npm install` runs
2. Installs `@safeword/cli` (from package.json)
3. Runs `postinstall` script → `safeword verify --auto-init`
4. CLI checks:
   - ✓ `.safeword/` exists (from git)
   - ✓ `.claude/` exists (from git)
   - ✓ AGENTS.md exists (from git)
   - ✓ Hooks registered in `.claude/settings.json`
5. Output:
   ```
   Safeword detected in project
   ✓ Configuration valid
   ✓ Hooks active
   
   Ready to use Claude Code!
   ```

**Teammate is done.** Zero manual steps. Hooks work immediately.

---

### What `safeword verify --auto-init` Does

```bash
safeword verify --auto-init

# Check if project has safeword files
if [ -d .safeword ] && [ -d .claude ]; then
  # Project already configured
  echo "✓ Safeword configured"
  
  # Verify hooks are valid
  if [ hooks_valid ]; then
    echo "✓ Hooks active"
    exit 0
  else
    echo "⚠ Hooks invalid, repairing..."
    repair_hooks()
    exit 0
  fi
else
  # Project not configured (first dev)
  if [ --auto-init flag ]; then
    echo "Initializing safeword..."
    safeword init --yes
  else
    echo "Safeword not configured. Run: safeword init"
    exit 1
  fi
fi
```

---

### Alternative: Pre-commit Hook (No postinstall)

Some teams don't want `postinstall` scripts (security concerns).

**Alternative:** Add to `.git/hooks/post-checkout`:
```bash
#!/bin/bash
# Auto-verify safeword on branch checkout

if command -v safeword &> /dev/null; then
  safeword verify --silent
fi
```

Teammate checks out branch → Hooks auto-verify.

---

### Why This is Elite

**Zero documentation needed.** Teammate workflow:
1. `git clone`
2. `npm install`
3. Done

Compare to current:
1. `git clone`
2. Read README
3. Install safeword manually
4. Run setup script
5. Hope it worked

**5 steps → 2 steps.** That's elite.

---

## 11. CI/CD Mode: What It Means

### The Problem

**CI/CD pipelines are non-interactive:**
- No human to answer prompts
- No TTY (no colors, no progress bars)
- Failure = block deployment

**Current safeword setup:**
- Prompts for input (breaks CI)
- Verbose output (clutters logs)
- No way to verify success programmatically

---

### Elite Solution: CI-Friendly Mode

```bash
safeword init --ci

# Non-interactive (uses defaults)
# No colors (plain text only)
# Minimal output (only errors + summary)
# Exit code 0 = success, 1 = failure
```

**Example CI usage (GitHub Actions):**

```yaml
name: Verify Safeword
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx @safeword/cli verify --ci
        # ✓ Passes if safeword configured correctly
        # ✗ Fails if hooks missing or invalid
```

---

### CI Mode Flags

```bash
safeword init --ci
# = --yes (auto-accept) + --no-color + --minimal-output

safeword init --yes
# Accept all defaults (but still colorful)

safeword init --no-color
# Plain text (no ANSI colors)

safeword verify --ci
# Verify hooks + exit 0/1 (for CI pass/fail)
```

---

### Why CI Mode Matters

**Use cases:**

1. **Enforce safeword in PRs:**
   ```yaml
   - run: npx @safeword/cli verify --ci
   ```
   PR fails if safeword not configured → Forces devs to set it up.

2. **Auto-setup in Docker:**
   ```dockerfile
   RUN npx @safeword/cli init --ci
   ```
   No prompts, works in non-interactive Docker build.

3. **Monorepo setup script:**
   ```bash
   for project in packages/*; do
     cd $project
     npx @safeword/cli init --yes
   done
   ```
   Batch setup without manual prompts.

---

## 12. CLI Language: TypeScript vs Bash

### Debate

| Criteria | TypeScript | Bash |
|----------|-----------|------|
| **npm distribution** | ✓ Native (npm packages) | ⚠ Requires bundling |
| **Cross-platform** | ✓ Node.js everywhere | ⚠ Windows needs WSL/Git Bash |
| **Version management** | ✓ package.json | ✗ Manual versioning |
| **Testing** | ✓ Jest/Vitest | ⚠ bats or manual |
| **Maintainability** | ✓ Type safety, refactorable | ⚠ Brittle, hard to refactor |
| **Speed** | ⚠ 100-200ms Node.js startup | ✓ Instant (native) |
| **Dependencies** | ✓ npm ecosystem | ⚠ Limited (jq, curl, grep) |
| **File operations** | ✓ fs module | ✓ Native |
| **JSON parsing** | ✓ Native | ⚠ Requires jq |
| **Error handling** | ✓ Try/catch | ⚠ set -e (brittle) |

---

### **RECOMMENDATION: TypeScript**

**Reasoning:**

1. **Target audience = JS/TS devs** - They're comfortable with TypeScript, not shell scripting.

2. **npm ecosystem = perfect fit:**
   - Publish to npm registry (`@safeword/cli`)
   - Users run with `npx` (no install needed)
   - Automatic version management

3. **Maintainability >> startup speed:**
   - Current bash scripts are 700+ lines each
   - Adding features (interactive mode, verification) will balloon to 2000+ lines
   - TypeScript is refactorable, testable, readable
   - Bash at that scale becomes unmaintainable

4. **Cross-platform by default:**
   - No Windows compatibility headaches
   - Node.js handles file paths, line endings, etc.

5. **Rich CLI libraries:**
   - Interactive prompts: `inquirer`, `prompts`
   - Progress bars: `ora`, `cli-progress`
   - Colors: `chalk`, `picocolors`
   - File operations: `fs-extra`, `globby`
   - JSON parsing: Native (no jq dependency)

6. **Testing:**
   - Unit tests: Vitest
   - Integration tests: Mock file system
   - CI-friendly (no manual testing)

---

### TypeScript CLI Architecture

```
@safeword/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts          # safeword init
│   │   ├── status.ts        # safeword status
│   │   ├── verify.ts        # safeword verify
│   │   ├── upgrade.ts       # safeword upgrade-project
│   │   └── learning.ts      # safeword learning add/list
│   ├── lib/
│   │   ├── files.ts         # File operations (copy guides, etc)
│   │   ├── hooks.ts         # Hook registration/verification
│   │   ├── detect.ts        # Project type detection
│   │   ├── verify.ts        # Verification checks
│   │   └── version.ts       # Version management
│   ├── templates/           # Embedded templates (SAFEWORD.md, guides)
│   └── cli.ts               # Entry point
├── package.json
└── tsconfig.json
```

**Entry point (`cli.ts`):**
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { status } from './commands/status';
import { verify } from './commands/verify';

const program = new Command();

program
  .name('safeword')
  .description('Elite DX for Claude Code patterns')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize safeword in current project')
  .option('--yes', 'Accept all defaults')
  .option('--ci', 'Non-interactive mode for CI/CD')
  .option('--linting-only', 'Skip quality review setup')
  .action(init);

program
  .command('status')
  .description('Show project status and health')
  .action(status);

program
  .command('verify')
  .description('Verify safeword configuration')
  .option('--auto-init', 'Auto-initialize if not configured')
  .option('--ci', 'CI mode (exit 0/1)')
  .action(verify);

program.parse();
```

---

### Embedding Templates

**Templates live in npm package:**
```
@safeword/cli/src/templates/
├── SAFEWORD.md
├── guides/
│   ├── testing-methodology.md
│   ├── code-philosophy.md
│   └── ...
├── hooks/
│   ├── auto-lint.sh
│   ├── auto-quality-review.sh
│   └── ...
└── config/
    ├── eslint.config.mjs.template
    ├── biome.jsonc.template
    └── .prettierrc.template
```

**On `safeword init`:**
```typescript
import fs from 'fs-extra';
import path from 'path';

export async function copyTemplates(projectDir: string) {
  const templatesDir = path.join(__dirname, '../templates');
  const targetDir = path.join(projectDir, '.safeword');
  
  // Copy all templates to project
  await fs.copy(templatesDir, targetDir);
  
  console.log('✓ Copied guides and patterns to .safeword/');
}
```

**Result:** Project is standalone. No external dependencies.

---

## 10. Progress Bar + Summary Output

### Current (Verbose)
```
================================
Claude Code Project Setup
Version: v1.0.0
================================

Setting up project in: /Users/alex/projects/my-app

[1/2] Running linting setup (mode: biome)...

================================
Claude Code Linting Setup
Mode: biome
================================

[1/6] Checking for package.json...
  ✓ package.json exists

[2/6] Checking dependencies...
  ✓ Dependencies checked

[3/6] Checking for Biome...
  Installing packages (this may take a moment)...
  Packages: @biomejs/biome
  ✓ Installed packages for biome mode

... (50 more lines) ...
```

---

### Elite (Concise)
```bash
safeword init

Detecting project... ✓ Next.js with TypeScript

Install options:
  [1] Recommended (auto-linting + quality review)
  [2] Auto-linting only
  [3] Quality review only

Choice [1]: 

Installing...

  Linting (biome)    ████████████████████ 15.2 MB
  Quality review     ████████████████████ 2.1 MB
  Guides             ████████████████████ 1.8 MB

✓ Configured in 4.2s

Installed:
  • Auto-linting (biome)
  • Quality review hooks
  • 12 guides in .safeword/

Next: git add .safeword .claude AGENTS.md
```

---

### Implementation (TypeScript)

```typescript
import ora from 'ora';
import chalk from 'chalk';

export async function install(options: InstallOptions) {
  const spinner = ora('Detecting project...').start();
  
  const projectType = await detectProjectType();
  spinner.succeed(`Detected: ${projectType}`);
  
  // Interactive prompts
  const answers = await prompt([
    {
      type: 'select',
      name: 'mode',
      message: 'Install options:',
      choices: [
        { title: 'Recommended (auto-linting + quality review)', value: 'full' },
        { title: 'Auto-linting only', value: 'linting' },
        { title: 'Quality review only', value: 'quality' },
      ],
      initial: 0,
    },
  ]);
  
  // Install with progress
  spinner.start('Installing...');
  
  await installLinting({ onProgress: (pct) => spinner.text = `Linting ${pct}%` });
  await installQualityReview({ onProgress: (pct) => spinner.text = `Quality review ${pct}%` });
  await copyGuides({ onProgress: (pct) => spinner.text = `Guides ${pct}%` });
  
  spinner.succeed('Configured in 4.2s');
  
  // Summary
  console.log('\nInstalled:');
  console.log('  • Auto-linting (biome)');
  console.log('  • Quality review hooks');
  console.log('  • 12 guides in .safeword/');
  console.log('\nNext: git add .safeword .claude AGENTS.md');
}
```

---

## Implementation Phases

### Phase 1: Core CLI (v1.0.0)
- ✓ TypeScript CLI with commander
- ✓ `safeword init` (interactive + --ci mode)
- ✓ Automatic verification after init
- ✓ `safeword --version`
- ✓ Progress bar + summary output
- ✓ Embed templates in npm package
- ✓ Publish to npm as `@safeword/cli`

### Phase 2: Advanced Features (v1.1.0)
- ✓ `safeword status` (health check)
- ✓ `safeword upgrade-project` (update guides)
- ✓ `safeword learning add/list` (manage learnings)
- ✓ `safeword verify --auto-init` (teammate onboarding)

### Phase 3: Ecosystem (v1.2.0)
- ✓ `safeword cache clear` (manage cache)
- ✓ `safeword migrate --from 1.x --to 2.x` (version migrations)
- ✓ curl installer (for non-Node projects)
- ✓ VS Code extension (status bar + quick actions)

---

## Next Steps

1. **Create TypeScript CLI scaffold:**
   ```bash
   mkdir packages/cli
   cd packages/cli
   npm init -y
   npm install commander inquirer ora chalk fs-extra
   npm install -D typescript @types/node
   ```

2. **Port bash scripts to TypeScript:**
   - `setup-project.sh` → `src/commands/init.ts`
   - `setup-linting.sh` → `src/lib/linting.ts`
   - `setup-quality-review.sh` → `src/lib/quality-review.ts`

3. **Embed templates:**
   - Copy `AGENTS.md`, `guides/`, `hooks/` to `src/templates/`

4. **Test locally:**
   ```bash
   npm link
   cd ~/test-project
   safeword init
   ```

5. **Publish to npm:**
   ```bash
   npm publish --access public
   ```

6. **Update README:**
   - Replace bash install with `npx @safeword/cli init`
