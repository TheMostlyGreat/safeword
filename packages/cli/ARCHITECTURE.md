# Safeword CLI Architecture

**Version:** 1.0
**Last Updated:** 2025-11-27
**Status:** Design

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Decisions](#key-decisions)
- [Best Practices](#best-practices)
- [Migration Strategy](#migration-strategy)

---

## Overview

The Safeword CLI is a TypeScript Node.js application that replaces bash scripts for project setup, verification, and maintenance. It provides commands for setting up development environments with linting, Claude Code hooks, and configuration management.

**Design Philosophy:**

- **npx-first**: Always run via npx for latest version
- **Stateless**: No global config, all state in project files
- **Idempotent**: Safe to re-run commands (with appropriate guards)
- **Non-interactive capable**: Full functionality via flags for CI/automation

---

## Tech Stack

| Category    | Choice                 | Rationale                                          |
| ----------- | ---------------------- | -------------------------------------------------- |
| Language    | TypeScript 5.x         | Type safety, IDE support, matches target projects  |
| Runtime     | Node.js 18+            | LTS, native fetch, stable fs/promises              |
| Arg parsing | Commander.js           | Industry standard, TypeScript support, subcommands |
| Build       | tsup                   | Fast, zero-config, ESM + CJS output                |
| Testing     | Vitest                 | Fast, TypeScript-native, compatible with Node      |
| Linting     | ESLint 9 (flat config) | What we install for users, dogfood ourselves       |

---

## Project Structure

```
packages/cli/
├── src/
│   ├── cli.ts              # Entry point, arg parsing
│   ├── commands/
│   │   ├── setup.ts        # Setup command
│   │   ├── check.ts        # Health check command
│   │   ├── upgrade.ts      # Upgrade command
│   │   ├── diff.ts         # Diff preview command
│   │   └── reset.ts        # Reset/uninstall command
│   ├── utils/
│   │   ├── file-manager.ts # File operations
│   │   ├── hook-manager.ts # Claude + git hooks
│   │   ├── prompter.ts     # Interactive prompts
│   │   ├── project-detector.ts # Project type detection
│   │   ├── linting-setup.ts    # ESLint/Prettier config
│   │   └── output.ts       # Colored output, spinners
│   └── templates/          # Bundled templates (copied to .safeword/)
├── tests/
│   ├── commands/           # Integration tests per command
│   └── utils/              # Unit tests for utilities
├── ARCHITECTURE.md         # This file
├── package.json
└── tsconfig.json
```

---

## Key Decisions

### Decision 1: TypeScript over JavaScript

**Status:** Active
**Date:** 2025-11-27

| Field          | Value                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| What           | Write CLI in TypeScript, compile to JavaScript for distribution                                                        |
| Why            | Type safety catches bugs early, better IDE support, self-documents interfaces. Target users are TypeScript developers. |
| Trade-off      | Build step required, but tsup makes this trivial                                                                       |
| Alternatives   | Pure JS (rejected: lose type safety), Bun (rejected: not ubiquitous enough)                                            |
| Implementation | `packages/cli/src/**/*.ts`                                                                                             |

### Decision 2: ESM-only

**Status:** Active
**Date:** 2025-11-27

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| What           | Package uses `"type": "module"`, tsup outputs ESM only                     |
| Why            | Node 18+ has full ESM support, CJS adds bloat for shrinking use case       |
| Trade-off      | Won't work with very old tooling that requires CJS                         |
| Alternatives   | CJS-only (rejected: legacy), dual ESM+CJS (rejected: unnecessary bloat)    |
| Implementation | `tsup.config.ts`: `format: ['esm']`                                        |

### Decision 3: Bundle templates in package

**Status:** Active
**Date:** 2025-11-27

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| What           | Ship `.safeword/` templates as part of npm package, copy on setup       |
| Why            | Works offline, version-locked to CLI, no network dependency for setup   |
| Trade-off      | Larger package (~500KB), templates update requires CLI update           |
| Alternatives   | Fetch from GitHub (rejected: network dependency, version mismatch risk) |
| Implementation | `src/templates/` copied to dist, read at runtime                        |

### Decision 4: Commander.js for CLI framework

**Status:** Active
**Date:** 2025-11-27

| Field          | Value                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| What           | Use Commander.js for argument parsing, help generation, subcommands                                       |
| Why            | Most popular (40k+ stars), excellent TypeScript support, minimal bundle impact                            |
| Trade-off      | External dependency, but arg parsing complexity justifies it                                              |
| Alternatives   | yargs (rejected: heavier), meow (rejected: less TypeScript support), manual (rejected: reinventing wheel) |
| Implementation | `src/cli.ts`                                                                                              |

### Decision 5: Vitest for testing

**Status:** Active
**Date:** 2025-11-27

| Field          | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| What           | Use Vitest for unit and integration tests                                       |
| Why            | Fast, TypeScript-native, watch mode, compatible with Node fs operations         |
| Trade-off      | Another test runner to know (but API is Jest-compatible)                        |
| Alternatives   | Jest (rejected: slower, config heavy), Node test runner (rejected: less mature) |
| Implementation | `tests/**/*.test.ts`                                                            |

### Decision 6: No runtime dependencies beyond Commander

**Status:** Active
**Date:** 2025-11-27

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| What           | Minimize runtime deps - only Commander.js, use Node built-ins for everything else |
| Why            | Faster install, fewer security audit concerns, smaller attack surface             |
| Trade-off      | May need to implement utilities that libraries provide                            |
| Alternatives   | Use chalk, ora, inquirer, etc. (rejected: bloat for simple CLI)                   |
| Implementation | Use Node readline for prompts, ANSI codes directly for colors                     |

---

## Best Practices

### Error Handling Pattern

**What:** Use custom error classes with exit codes
**Why:** Consistent error handling, testable exit behavior
**Example:** See `src/utils/errors.ts`

```typescript
// Define error types
class SafewordError extends Error {
  constructor(
    message: string,
    public exitCode: number = 1,
  ) {
    super(message);
  }
}

class SetupError extends SafewordError {}
class ConfigError extends SafewordError {}

// Use in commands
try {
  await setup(options);
} catch (e) {
  if (e instanceof SafewordError) {
    console.error(e.message);
    process.exit(e.exitCode);
  }
  throw e; // Re-throw unexpected errors
}
```

### File Operations Pattern

**What:** Always use async fs operations, handle errors explicitly
**Why:** Non-blocking, better error messages
**Example:** See `src/utils/file-manager.ts`

```typescript
import { readFile, writeFile, mkdir } from 'fs/promises';

async function safeWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
}
```

### Output Pattern

**What:** Use symbols for status, no emoji by default
**Why:** Works in all terminals, professional appearance
**Example:** See `src/utils/output.ts`

```typescript
const symbols = {
  success: '✓',
  warning: '⚠',
  error: '✗',
  info: '→',
};

function success(msg: string) {
  console.log(`${symbols.success} ${msg}`);
}
```

---

## Migration Strategy

### From Bash Scripts to CLI

**Trigger:** User has existing bash-based safeword setup
**Steps:**

1. User runs `npx safeword upgrade`
2. CLI detects `.safeword/` exists
3. CLI overwrites all files with bundled templates
4. CLI updates hooks in `.claude/settings.json`
5. CLI preserves user's AGENTS.md content (only updates link)

**Rollback:** Run `npx safeword reset`, then re-run old bash scripts

### Future: v1 to v2

**Trigger:** Breaking changes to template structure or hook format
**Steps:**

1. v2 CLI detects v1 version in `.safeword/version`
2. Runs migration logic before normal upgrade
3. Updates version file to v2

**Rollback:** Document breaking changes, provide migration guide

---

## Appendix

### References

- [Design Doc](../../.safeword/planning/design/005-cli-implementation.md)
- [User Stories](../../.safeword/planning/user-stories/005-cli-implementation.md)
- [Test Definitions](../../.safeword/planning/test-definitions/005-cli-implementation.md)
- [CLI UX Vision](../../.agents/planning/011-cli-ux-vision.md)

### Package.json (key fields)

```json
{
  "name": "safeword",
  "type": "module",
  "bin": {
    "safeword": "./dist/cli.js"
  },
  "engines": {
    "node": ">=18"
  },
  "files": ["dist", "templates"]
}
```
