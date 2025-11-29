# Design: Safeword CLI

**Guide**: `@./.safeword/guides/design-doc-guide.md` - Principles, structure guidelines, and avoiding bloat
**Template**: `@./.safeword/templates/design-doc-template.md`

**Related**: User Stories: `.safeword/planning/user-stories/005-cli-implementation.md` | Test Definitions: `.safeword/planning/test-definitions/005-cli-implementation.md`

**TDD Note**: This design implements tests from Test Definitions. Reference specific test scenarios (e.g., "Test 3.1: Registers hooks in settings.json").

## Architecture

The CLI is a TypeScript Node.js application structured around command handlers. Each command (setup, check, upgrade, diff, reset) is an independent module that shares utilities for file operations, prompting, and output formatting.

The core principle is **idempotent operations with explicit state**: the CLI reads project state from `.safeword/version` and `.claude/settings.json`, performs operations, and writes state back. No global state or caching between runs.

**Diagram**:
```
┌─────────────────────────────────────────────────────────┐
│                      CLI Entry                          │
│  (parse args, route to command)                         │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐      ┌─────────┐
   │  setup  │      │  check   │      │  reset  │
   │ upgrade │      │   diff   │      │         │
   └────┬────┘      └────┬─────┘      └────┬────┘
        │                │                 │
        └────────────────┼─────────────────┘
                         ▼
              ┌─────────────────────┐
              │      Utilities      │
              │ ─────────────────── │
              │ • FileManager       │
              │ • HookManager       │
              │ • Prompter          │
              │ • ProjectDetector   │
              │ • OutputFormatter   │
              └─────────────────────┘
```

## Components

### Component 1: CLI Entry (`src/cli.ts`)

**What**: Parses arguments, routes to command handlers, handles global flags
**Where**: `packages/cli/src/cli.ts`
**Interface**:
```typescript
// Entry point
async function main(args: string[]): Promise<void>;

// Parsed options available to all commands
interface GlobalOptions {
  version: boolean;
  help: boolean;
  yes: boolean;      // --yes flag
  verbose: boolean;  // --verbose flag
  offline: boolean;  // --offline flag
}
```

**Dependencies**: Commander.js (arg parsing), all command modules
**Tests**: Test 1.1-1.3 (version, help, bare command)

### Component 2: Setup Command (`src/commands/setup.ts`)

**What**: Orchestrates full project setup - files, hooks, skills, linting, AGENTS.md
**Where**: `packages/cli/src/commands/setup.ts`
**Interface**:
```typescript
interface SetupOptions {
  yes: boolean;  // Skip prompts
}

async function setup(options: SetupOptions): Promise<void>;

// Throws SetupError on failure (exit 1)
// Returns normally on success (exit 0)
```

**Dependencies**: FileManager, HookManager, Prompter, ProjectDetector, LintingSetup
**Tests**: Test 2.1-2.5, 3.1-3.5, 4.4-4.8, 5.1-5.2, 6.1-6.3, 7.1-7.5

### Component 2b: Other Commands (check, upgrade, diff, reset)

| Command | File | What | Dependencies | Tests |
|---------|------|------|--------------|-------|
| check | `commands/check.ts` | Show versions, verify structure, check for updates | FileManager, npm registry fetch | 8.1-8.7 |
| upgrade | `commands/upgrade.ts` | Overwrite .safeword/, update hooks/skills | FileManager, HookManager | 9.1-9.7 |
| diff | `commands/diff.ts` | Compare project vs bundled templates | FileManager | 10.1-10.5 |
| reset | `commands/reset.ts` | Remove .safeword/, hooks, skills, AGENTS.md link | FileManager, HookManager, Prompter | 11.1-11.10 |

All commands share the same pattern: parse options → check project state → perform operation → output result.

### Component 3: FileManager (`src/utils/file-manager.ts`)

**What**: Handles all file system operations - copy, write, read, delete with atomic operations
**Where**: `packages/cli/src/utils/file-manager.ts`
**Interface**:
```typescript
interface FileManager {
  // Template operations
  copyTemplates(dest: string): Promise<string[]>;

  // Version file
  readVersion(projectRoot: string): Promise<string | null>;
  writeVersion(projectRoot: string, version: string): Promise<void>;

  // AGENTS.md operations
  prependAgentsLink(projectRoot: string): Promise<void>;
  removeAgentsLink(projectRoot: string): Promise<void>;
  hasAgentsLink(projectRoot: string): Promise<boolean>;

  // Diff operations
  diffTemplates(projectRoot: string): Promise<DiffResult>;
}

interface DiffResult {
  added: string[];
  modified: string[];
  unchanged: string[];
  removed: string[];
}
```

**Dependencies**: Node fs/promises, path
**Tests**: Test 2.1-2.4, 9.1, 10.1-10.4, 11.4, 11.8

### Component 4: HookManager (`src/utils/hook-manager.ts`)

**What**: Manages Claude Code hooks in settings.json and git hooks in .git/hooks/
**Where**: `packages/cli/src/utils/hook-manager.ts`
**Interface**:
```typescript
interface HookManager {
  // Claude hooks
  registerClaudeHooks(projectRoot: string): Promise<void>;
  removeClaudeHooks(projectRoot: string): Promise<void>;
  getClaudeHooks(projectRoot: string): Promise<ClaudeSettings>;

  // Git hooks
  installGitHooks(projectRoot: string): Promise<void>;
  removeGitHooks(projectRoot: string): Promise<void>;

  // Skills
  copySkills(projectRoot: string): Promise<void>;
  removeSkills(projectRoot: string): Promise<void>;
}

// Marker constants for git hooks
const GIT_HOOK_START = '# SAFEWORD_ARCH_CHECK_START';
const GIT_HOOK_END = '# SAFEWORD_ARCH_CHECK_END';
```

**Dependencies**: FileManager (for file ops)
**Tests**: Test 3.1-3.5, 7.4-7.5, 11.5-11.7

### Component 5: Prompter (`src/utils/prompter.ts`)

**What**: Handles interactive prompts with TTY detection and --yes override
**Where**: `packages/cli/src/utils/prompter.ts`
**Interface**:
```typescript
interface Prompter {
  // Check if running interactively
  isInteractive(): boolean;

  // Prompt with automatic default in non-interactive mode
  confirm(message: string, defaultValue: boolean): Promise<boolean>;
}

// Factory to inject --yes flag
function createPrompter(options: { yes: boolean }): Prompter;
```

**Dependencies**: Node readline, process.stdin.isTTY
**Tests**: Test 6.1-6.3, 7.1-7.3, 11.1-11.3

### Component 6: ProjectDetector (`src/utils/project-detector.ts`)

**What**: Detects project type from package.json for linting configuration
**Where**: `packages/cli/src/utils/project-detector.ts`
**Interface**:
```typescript
interface ProjectType {
  typescript: boolean;
  react: boolean;
  nextjs: boolean;
  astro: boolean;
  node: boolean;
}

function detectProjectType(packageJson: PackageJson): ProjectType;
```

**Dependencies**: None (pure function)
**Tests**: Test 4.1-4.3

### Component 7: LintingSetup (`src/utils/linting-setup.ts`)

**What**: Installs and configures ESLint + Prettier based on detected project type
**Where**: `packages/cli/src/utils/linting-setup.ts`
**Interface**:
```typescript
interface LintingSetup {
  // Full setup - install deps, create configs, add scripts
  configure(projectRoot: string, projectType: ProjectType): Promise<void>;

  // Individual operations
  installDependencies(projectRoot: string, projectType: ProjectType): Promise<void>;
  createEslintConfig(projectRoot: string, projectType: ProjectType): Promise<void>;
  createPrettierConfig(projectRoot: string): Promise<void>;
  addPackageScripts(projectRoot: string): Promise<void>;
}

// Throws LintingError on failure (exit 1 - core failure)
```

**Dependencies**: ProjectDetector, child_process (for npm/pnpm install), FileManager
**Tests**: Test 4.4-4.8

## Data Model

```typescript
// Project state (read from .safeword/version)
interface ProjectState {
  configured: boolean;
  version: string | null;  // null if unconfigured
}

// Claude settings structure
interface ClaudeSettings {
  hooks?: {
    SessionStart?: HookConfig[];
    PostToolUse?: HookConfig[];
    Stop?: HookConfig[];
    // ... other hook types
  };
}

interface HookConfig {
  matcher?: string;
  hooks: Array<{
    type: 'command';
    command: string;
    timeout?: number;
  }>;
}
```

## Component Interaction

**Setup Flow:**
```
CLI Entry → Setup Command
  → FileManager.copyTemplates()
  → HookManager.registerClaudeHooks()
  → HookManager.copySkills()
  → LintingSetup.configure()
  → Prompter.confirm() [if no git]
  → HookManager.installGitHooks() [if git]
  → FileManager.prependAgentsLink()
  → FileManager.writeVersion()
```

**Reset Flow:**
```
CLI Entry → Reset Command
  → Prompter.confirm()
  → FileManager.remove('.safeword/')
  → HookManager.removeClaudeHooks()
  → HookManager.removeSkills()
  → HookManager.removeGitHooks()
  → FileManager.removeAgentsLink()
```

## User Flow

1. User runs `npx safeword setup` in project directory
2. CLI checks for existing `.safeword/` → errors if found
3. CLI detects project type from package.json
4. CLI copies templates to `.safeword/`
5. CLI registers hooks in `.claude/settings.json`
6. CLI installs ESLint + Prettier, creates configs
7. CLI checks for `.git/` → prompts if missing (skips with --yes)
8. CLI prepends link to `AGENTS.md`
9. CLI prints success summary with file counts

## Key Decisions

### Decision 1: Commander.js for argument parsing

**What**: Use Commander.js instead of manual argv parsing or alternatives (yargs, meow)
**Why**: Most popular (40k+ GitHub stars), excellent TypeScript support, subcommand pattern matches our design, minimal bundle size impact
**Trade-off**: External dependency vs zero-dep (but arg parsing is complex enough to warrant it)

### Decision 2: Marker-based git hooks

**What**: Use comment markers (`SAFEWORD_ARCH_CHECK_START/END`) for git hook content
**Why**: Allows coexistence with other tools (husky, lint-staged) that also modify pre-commit hooks
**Trade-off**: Slightly more complex removal logic, but essential for ecosystem compatibility

### Decision 3: Bundled templates

**What**: Ship templates as part of npm package, copy on setup (not fetch from GitHub)
**Why**: Works offline, faster setup, version-locked to CLI, no network dependency
**Trade-off**: Larger package size (~500KB), but acceptable for CLI tool

### Decision 4: No config file

**What**: No `.safewordrc` or similar - all behavior via flags
**Why**: Simpler mental model, npx-first means config rarely persists anyway, flags are explicit
**Trade-off**: Can't persist preferences, but `--yes` covers the main use case (CI)

## Implementation Notes

**Constraints**:
- Node 18+ required (use engines field in package.json)
- Must work with npm, pnpm, yarn, bun for linting deps install
- Max 500ms startup time (lazy-load heavy modules)

**Error Handling**:
- Core failures (can't write files, linting fails) → exit 1 with clear message
- Warnings (no git, offline) → exit 0 with warning in output
- Use custom error classes: `SetupError`, `ConfigError`, `NetworkError`

**Gotchas**:
- Always check for existing `.safeword/` before any writes in setup
- AGENTS.md link must be exact string match for removal
- Git hooks must preserve existing content outside markers
- settings.json might not exist yet - create if missing

**Open Questions**:
- [ ] Which npm registry endpoint for version check? (registry.npmjs.org/safeword/latest)
- [ ] Should we support Bun's package manager for linting install?

## References

- [CLI UX Vision](../../.agents/planning/011-cli-ux-vision.md)
- [Ticket #005](../../.agents/tickets/005-cli-implementation.md)
- [Commander.js docs](https://github.com/tj/commander.js)
