# Safeword CLI Implementation Plan

**Goal:** Ship TypeScript CLI that replaces bash scripts with elite developer experience.

**Strategy:** Project-local (committable, version-pinnable) with optional plugin wrapper in Phase 2.

**Non-goal:** Don't try to be Superpowers. Stay focused on quality enforcement, not skill libraries.

---

## Phase 1: Core CLI (Ship This First)

**Target:** v1.0.0 - Functional replacement for bash scripts with better UX

### 1.1 Project Setup

**Create CLI package structure:**

`````bash
mkdir -p packages/cli/src/{commands,lib,templates}
cd packages/cli
npm init -y
```text

**Install dependencies:**

```bash
# Core CLI
npm install commander @clack/prompts

# File operations
npm install fs-extra globby

# Utilities
npm install picocolors execa

# Dev dependencies
npm install -D typescript @types/node @types/fs-extra tsx vitest
```text

**Why these choices:**

- `commander` - Industry standard CLI framework
- `@clack/prompts` - Modern, beautiful prompts (used by Astro/Vite)
- `fs-extra` - Promise-based fs with extras (copy, ensureDir)
- `execa` - Better child_process (run npm, git commands)
- `tsx` - Fast TypeScript execution for dev/testing

---

### 1.2 Core Commands

**Priority order (ship incrementally):**

**1.2.1 `safeword init` (CRITICAL PATH)**

**Purpose:** Replace `setup-safeword.sh` with interactive setup

**Features:**

```bash
safeword init                    # Interactive with prompts
safeword init --yes              # Accept all defaults
safeword init --ci               # Non-interactive (CI mode)
safeword init --linting-only     # Skip quality review
safeword init --quality-only     # Skip linting
```text

**Flow:**

1. Detect project type (Next.js, React, Electron, TypeScript, etc.)
2. Prompt for install mode (or use defaults in --yes/--ci)
3. Copy templates from npm package to `.safeword/` and `.claude/`
4. Install linting dependencies (biome or eslint+prettier)
5. Update `package.json` (add scripts, optionally add CLI to devDeps)
6. Register hooks in `.claude/settings.json`
7. Create/update `SAFEWORD.md` with .safeword/SAFEWORD.md reference
8. Run automatic verification (see 1.2.2)
9. Print success summary with next steps

**Auto-detection logic:**

```typescript
export async function detectProjectType(): Promise<ProjectType> {
  const hasFile = (path: string) => fs.existsSync(path);
  const pkgJson = await readPackageJson();

  // Check dependencies
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

  if (deps['@biomejs/biome']) return 'biome';
  if (deps['next']) return 'nextjs';
  if (deps['electron']) return 'electron';
  if (deps['astro']) return 'astro';
  if (deps['react']) return 'react';
  if (deps['typescript'] || hasFile('tsconfig.json')) return 'typescript';

  return 'minimal';
}
```text

**Output (interactive mode):**

```text
$ safeword init

○  Detecting project type...
   ✓ Next.js with TypeScript

○  Install options:
   ○ Recommended (auto-linting + quality review)
   ○ Auto-linting only
   ○ Quality review only

   ◆ Choice
   │ ● Recommended (auto-linting + quality review)
   └

○  Installing...

   ▲ Linting (biome, 15.2 MB)
   ▲ Quality review
   ▲ Guides (12 files)

   ✓ Configured in 4.2s

○  Verification

   Files:
   ✓ .safeword/SAFEWORD.md
   ✓ .safeword/guides/ (12 guides)
   ✓ .claude/hooks/ (3 hooks)
   ✓ .claude/settings.json
   ✓ SAFEWORD.md

   Hooks:
   ✓ PostToolUse → auto-lint.sh
   ✓ Stop → auto-quality-review.sh

   Linting:
   ✓ biome.jsonc configured
   ✓ npm run lint works

   ✓ All checks passed!

○  Next steps

   git add .safeword .claude SAFEWORD.md package.json
   git commit -m "Add safeword config"

   Try it: Ask Claude to create a file
```text

---

**1.2.2 `safeword verify` (CRITICAL PATH)**

**Purpose:** Health check + auto-repair

**Features:**

```bash
safeword verify                  # Show status, exit 0/1
safeword verify --auto-init      # Init if not configured (teammate onboarding)
safeword verify --repair         # Fix broken hooks
safeword verify --ci             # CI mode (minimal output)
```text

**Checks:**

1. `.safeword/SAFEWORD.md` exists
2. `.safeword/guides/` exists (count files)
3. `.claude/hooks/` exists (verify scripts executable)
4. `.claude/settings.json` exists and valid JSON
5. Hooks registered (PostToolUse, Stop)
6. `SAFEWORD.md` or `CLAUDE.md` references `.safeword/SAFEWORD.md`
7. Linting configured (biome.jsonc or eslint.config.mjs exists)
8. npm scripts exist (`lint`, `format`)

**Repair logic:**

```typescript
async function repair() {
  // Re-register hooks if missing
  if (!hooksRegistered()) {
    await registerHooks();
  }

  // Fix executable permissions
  await fs.chmod('.claude/hooks/auto-lint.sh', 0o755);
  await fs.chmod('.claude/hooks/auto-quality-review.sh', 0o755);

  // Re-add SAFEWORD.md reference if missing
  if (!agentsHasReference()) {
    await addSafewordReference();
  }
}
```text

**Use case (teammate onboarding):**

```json
// package.json
{
  "scripts": {
    "prepare": "safeword verify --silent || echo 'ℹ Run: npx safeword init'"
  }
}
```text

Teammate runs `npm install` → `prepare` hook runs → Prints message if not configured.

**Note:** Don't use `postinstall` (security red flag). Use `prepare` (runs in dev only).

---

**1.2.3 `safeword --version` (CRITICAL PATH)**

**Purpose:** Show CLI version

```bash
safeword --version
# 1.0.0
```text

**Implementation:**

```typescript
// Read from package.json
import { readFileSync } from 'fs';
import { join } from 'path';

const pkgPath = join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

program.version(pkg.version);
```text

---

**1.2.4 `safeword status` (NICE TO HAVE)**

**Purpose:** Show detailed project state

```bash
safeword status
```text

**Output:**

```text
Safeword Status

Project: /Users/alex/projects/my-app
Version: 1.0.0 (latest: 1.2.0 - run `safeword upgrade` to update)

Components:
  ✓ Auto-linting (biome)
  ✓ Quality review hooks
  ✓ 12 guides in .safeword/

Hooks:
  ✓ PostToolUse → auto-lint.sh (active)
  ✓ Stop → auto-quality-review.sh (active)

Config:
  • enabled: true
  • ask_questions: true
  • linting_mode: biome

To update: safeword upgrade
```text

**Data sources:**

- `.safeword/version` file (created by init)
- `.claude/settings.json` (hook registration)
- `.auto-quality-review.config` (user preferences)
- Check npm registry for latest version

---

### 1.3 Template Embedding

**Strategy:** Embed all templates in npm package (no external downloads, no cache complexity)

**Structure:**

```text
packages/cli/src/templates/
├── SAFEWORD.md                 # Core patterns (copied from framework/SAFEWORD.md)
├── guides/                     # All guides
│   ├── testing-methodology.md
│   ├── code-philosophy.md
│   ├── user-story-guide.md
│   └── ... (all existing guides)
├── hooks/                      # Hook scripts
│   ├── auto-lint.sh
│   ├── auto-quality-review.sh
│   ├── run-linters.sh
│   └── run-quality-review.sh
└── config/                     # Config file templates
    ├── eslint.config.mjs
    ├── biome.jsonc
    └── prettierrc
```text

**Copy operation:**

```typescript
import { copy } from 'fs-extra';
import { join } from 'path';

export async function copyTemplates(projectDir: string) {
  const templatesDir = join(__dirname, '../templates');
  const targetDir = join(projectDir, '.safeword');

  // Copy everything
  await copy(templatesDir, targetDir);

  // Write version file
  const version = require('../package.json').version;
  await fs.writeFile(join(targetDir, 'version'), version);
}
```text

**Why embed vs download:**

- Templates are ~2MB total (tiny for npm)
- Offline support (no network needed after npx download)
- Simpler code (no cache management)
- npm already caches packages in `~/.npm/_npx/`

---

### 1.4 Non-Interactive Mode (CI/CD)

**Auto-detect non-interactive environments:**

```typescript
const isCI =
  !process.stdin.isTTY || process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

if (isCI && !options.yes && !options.ci) {
  console.error('Error: Interactive prompts require TTY');
  console.error('Use --yes or --ci flag for non-interactive mode');
  process.exit(1);
}
```text

**CI mode behavior:**

```bash
safeword init --ci

# No colors (plain text)
# No progress bars
# No prompts (use defaults)
# Minimal output (errors + summary only)
# Exit code 0 = success, 1 = failure
```text

**GitHub Actions example:**

```yaml
name: Verify Safeword
on: [push]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx @safeword/cli verify --ci
```text

---

### 1.5 Package Manager Detection

**Problem:** Mutating `package.json` breaks yarn/pnpm lockfiles

**Solution:** Detect package manager and use appropriate command

```typescript
export async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
  if (await fs.pathExists('pnpm-lock.yaml')) return 'pnpm';
  if (await fs.pathExists('yarn.lock')) return 'yarn';
  return 'npm';
}

export async function runPackageManagerCommand(
  command: string,
  pkgManager: 'npm' | 'yarn' | 'pnpm',
) {
  const cmds = {
    npm: `npm ${command}`,
    yarn: `yarn ${command}`,
    pnpm: `pnpm ${command}`,
  };

  await execa(cmds[pkgManager], { shell: true });
}
```text

**Ask before mutating package.json:**

```typescript
if (!options.yes && !options.ci) {
  const { addToDeps } = await prompts({
    type: 'confirm',
    name: 'addToDeps',
    message: `Add @safeword/cli to devDependencies? (${pkgManager})`,
    initial: true,
  });

  if (addToDeps) {
    await addToPackageJson(pkgManager);
  }
}
```text

---

### 1.6 XDG Compliance (Global Learnings)

**Follow XDG Base Directory spec:**

```typescript
import { homedir } from 'os';
import { join } from 'path';

export function getGlobalLearningsDir(): string {
  const xdgDataHome = process.env.XDG_DATA_HOME || join(homedir(), '.local/share');
  return join(xdgDataHome, 'safeword/learnings');
}

export function getConfigDir(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(xdgConfigHome, 'safeword');
}
```text

**Structure:**

```text
~/.local/share/safeword/
└── .safeword/learnings/ # Project learnings

~/.config/safeword/
└── config.json          # CLI preferences (future)
```text

**Phase 1:** Only implement if adding `safeword learning add` command. Otherwise defer to Phase 2.

---

### 1.7 Testing Strategy

**Unit tests (vitest):**

```typescript
// tests/detect.test.ts
import { describe, it, expect } from 'vitest';
import { detectProjectType } from '../src/lib/detect';

describe('detectProjectType', () => {
  it('detects Next.js projects', async () => {
    // Mock fs to return package.json with next dep
    const type = await detectProjectType();
    expect(type).toBe('nextjs');
  });
});
```text

**Integration tests (mock fs):**

```typescript
import { vol } from 'memfs';
import { init } from '../src/commands/init';

describe('safeword init', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
    });
  });

  it('creates .safeword directory', async () => {
    await init({ yes: true });
    expect(vol.existsSync('/project/.safeword')).toBe(true);
  });
});
```text

**Manual smoke test:**

```bash
# In packages/cli
npm link

# In test project
cd ~/test-project
safeword init --yes
safeword verify
safeword status
```text

---

## Phase 1 Checklist

**Must have (blocking v1.0.0 release):**

- [ ] `safeword init` with interactive prompts
- [ ] `safeword init --yes` (non-interactive)
- [ ] `safeword init --ci` (CI mode)
- [ ] `safeword verify` (health check)
- [ ] `safeword --version`
- [ ] Auto-detect project type (Next.js, React, etc.)
- [ ] Copy templates to `.safeword/` and `.claude/`
- [ ] Install linting dependencies
- [ ] Register hooks in `.claude/settings.json`
- [ ] Create/update SAFEWORD.md reference
- [ ] Automatic verification after init
- [ ] Package manager detection (npm/yarn/pnpm)
- [ ] Non-TTY detection (auto-enable --ci mode)

**Nice to have (can ship after v1.0.0):**

- [ ] `safeword status` (detailed health report)
- [ ] `safeword verify --repair` (auto-fix broken hooks)
- [ ] Unit tests (70%+ coverage)
- [ ] Integration tests (smoke tests)

**Defer to Phase 2:**

- [ ] `safeword upgrade` (update templates)
- [ ] `safeword learning add/list` (manage learnings)
- [ ] Global learnings directory
- [ ] Version migration tooling
- [ ] Claude Code plugin wrapper

---

## Publishing (npm)

**Package name:** `@safeword/cli`

**package.json:**

```json
{
  "name": "@safeword/cli",
  "version": "1.0.0",
  "description": "TDD workflows and quality patterns for Claude Code",
  "bin": {
    "safeword": "./dist/cli.js"
  },
  "files": ["dist/", "templates/"],
  "keywords": ["claude-code", "tdd", "quality", "linting", "hooks"],
  "repository": "github:TheMostlyGreat/safeword",
  "license": "MIT"
}
```text

**Build:**

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "test": "vitest"
  }
}
```text

**Publish:**

```bash
npm run build
npm publish --access public
```text

**Usage after publish:**

```bash
npx @safeword/cli init        # Download + run (cached)
npm install -g @safeword/cli  # Global install
safeword init                 # Run globally
```text

---

## Migration from Bash Scripts

**Current state:**

- `setup-safeword.sh` (270 lines)
- `setup-linting.sh` (738 lines)
- `setup-quality.sh` (531 lines)

**Total:** ~1500 lines of bash

**Target:** ~800 lines of TypeScript (more maintainable, testable, cross-platform)

**Migration path:**

1. Ship CLI alongside bash scripts (backwards compatible)
2. Update README to recommend CLI
3. Mark bash scripts as deprecated (add warning banner)
4. Remove bash scripts in v2.0.0

**Deprecation notice in bash scripts:**

```bash
echo "⚠️  WARNING: Bash setup scripts are deprecated"
echo "   Use the new CLI instead: npx @safeword/cli init"
echo "   Bash scripts will be removed in v2.0.0"
echo ""
```text

---

## Documentation Updates

**Update README.md:**

````markdown
## Quick Start

**1. Install:**

```bash
npx @safeword/cli init
```text
`````

**2. Verify:**

````bash
npx @safeword/cli verify
```text

**3. Commit:**

```bash
git add .safeword .claude SAFEWORD.md package.json
git commit -m "Add safeword config"
```text

````

**Add CLI reference docs:**

```markdown
## CLI Reference

### safeword init

Initialize safeword in current project

Options:
--yes Accept all defaults
--ci Non-interactive mode (CI/CD)
--linting-only Skip quality review setup
--quality-only Skip linting setup

### safeword verify

Verify safeword configuration

Options:
--auto-init Auto-initialize if not configured
--repair Fix broken hooks
--ci CI mode (exit 0/1)

### safeword status

Show detailed project status

### safeword --version

Show CLI version
```

---

## Timeline Estimate

**Week 1: Setup + Core Commands**

- Day 1-2: Project setup, dependencies, TypeScript config
- Day 3-4: `safeword init` command (basic functionality)
- Day 5: `safeword verify` command

**Week 2: Templates + Auto-Detection**

- Day 1-2: Embed templates in package
- Day 3-4: Project type detection logic
- Day 5: Template copying + hook registration

**Week 3: Polish + Testing**

- Day 1-2: Interactive prompts (clack/prompts)
- Day 3: CI mode, package manager detection
- Day 4-5: Testing (unit + integration)

**Week 4: Publish + Migrate**

- Day 1: Build system, publish to npm
- Day 2-3: Update README, add CLI docs
- Day 4-5: Test in real projects, fix bugs

**Total: 4 weeks to v1.0.0**

---

## Success Criteria

**v1.0.0 is ready when:**

1. ✅ CLI fully replaces bash scripts (feature parity)
2. ✅ One-command setup works: `npx @safeword/cli init`
3. ✅ Verification catches broken configs: `safeword verify`
4. ✅ CI mode works in GitHub Actions
5. ✅ Published to npm as `@safeword/cli`
6. ✅ README updated with new install instructions
7. ✅ Tested in 3+ real projects (Next.js, React, TypeScript)
8. ✅ No critical bugs (linting works, hooks trigger)

**Ship when these are green. Don't wait for perfect.**

---

## Phase 2: Advanced Features (Future)

**Defer these until v1.0.0 shipped and validated:**

- `safeword upgrade` - Update project templates
- `safeword learning add/list` - Manage learnings
- Version migration tooling (`safeword migrate`)
- Claude Code plugin wrapper (`/safeword:init`)
- Health monitoring (daily status reports)
- Team analytics (hook usage stats)

**Get feedback first. Don't over-engineer.**

---

## Anti-Patterns to Avoid

**❌ Don't:**

- Build version migration before v2.0.0 exists
- Add cache management (npm already caches)
- Convert guides to "skills" (terminology confusion)
- Make it a Claude Code plugin (lose project-local benefits)
- Use `postinstall` scripts (security red flag)
- Support every edge case (ship fast, iterate)

**✅ Do:**

- Start with MVP (init + verify)
- Ship incrementally (don't wait for perfect)
- Test in real projects early
- Get feedback before Phase 2
- Keep it simple (no premature abstraction)
- Follow XDG standards (if adding global state)

---

## Decision Log

**Decisions made:**

1. ✅ TypeScript CLI (not bash) - Maintainability > speed
2. ✅ npx distribution (not curl) - Target audience has Node.js
3. ✅ Project-local (not plugin) - Team consistency + versioning
4. ✅ `@clack/prompts` (not inquirer) - Modern, actively maintained
5. ✅ Embed templates (not download) - Offline support
6. ✅ `prepare` script (not postinstall) - Security
7. ✅ XDG compliance (for global learnings) - Standards matter

**Decisions deferred:**

1. ⏸ Claude Code plugin wrapper - Wait for v1.0.0 feedback
2. ⏸ Version migration tooling - Wait for v2.0.0
3. ⏸ Learning management - Wait for user demand
4. ⏸ Status command - Nice to have, not blocking

**Questions to answer during implementation:**

1. Should `safeword verify --auto-init` run automatically on `npm install`?
2. Should we ask before mutating `package.json` in `--yes` mode?
3. Should `safeword status` check npm registry for updates (network call)?
4. How much output is too much in CI mode?

---

## Next Steps

**Start here:**

1. **Create CLI package:**

   ```bash
   mkdir -p packages/cli/src/{commands,lib,templates}
   cd packages/cli
   npm init -y
   npm install commander @clack/prompts fs-extra picocolors execa
   npm install -D typescript @types/node tsx vitest
   ```

2. **Copy templates:**

   ```bash
   cp ../SAFEWORD.md src/templates/SAFEWORD.md
   cp -r ../guides src/templates/guides
   cp -r ../.claude/hooks src/templates/hooks
   ```

3. **Build `safeword init` skeleton:**

   ```typescript
   // src/cli.ts
   #!/usr/bin/env node
   import { Command } from 'commander';
   import { init } from './commands/init';

   const program = new Command();

   program
     .name('safeword')
     .version('1.0.0');

   program
     .command('init')
     .option('--yes', 'Accept all defaults')
     .option('--ci', 'Non-interactive mode')
     .action(init);

   program.parse();
   ```

4. **Test locally:**

   ```bash
   chmod +x src/cli.ts
   npm link
   cd ~/test-project
   safeword init --yes
   ```

5. **Iterate until it works, then ship.**

**Don't overthink. Start coding.**
