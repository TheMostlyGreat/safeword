# Design: Language Packs

**Guide**: `.safeword/guides/design-doc-guide.md`

**Related**:
- Feature Spec: `.safeword/planning/specs/feature-language-packs.md`
- Test Definitions: `.safeword/planning/test-definitions/feature-language-packs.md`
- Architecture: `ARCHITECTURE.md` → Language Packs section

---

## Architecture

Language packs modularize language-specific tooling into a consistent interface. Each pack handles detection and config generation for one language. A central registry maps file extensions to packs, and config.json tracks which packs are installed.

```text
┌─────────────────────────────────────────────────────────────┐
│                      Pack Registry                          │
│   findPackForExtension('.py') → pythonPack                  │
│   detectLanguages(cwd) → ['python', 'typescript']           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────┐                     ┌───────────────────┐
│   Python Pack     │                     │  TypeScript Pack  │
│   detect()        │                     │   detect()        │
│   setup()         │                     │   setup()         │
└───────────────────┘                     └───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               .safeword/config.json                         │
│   { "version": "0.15.0", "installedPacks": ["python"] }     │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### Component 1: LanguagePack Interface

**What**: Type definition for language packs
**Where**: `packages/cli/src/packs/types.ts`

```typescript
export interface LanguagePack {
  id: string;
  name: string;
  extensions: string[];
  detect: (cwd: string) => boolean;
  setup: (cwd: string, ctx: SetupContext) => SetupResult;
}

export interface SetupContext {
  isGitRepo: boolean;
}

export interface SetupResult {
  files: string[];  // Files created/modified
}
```

**Tests**: Test 1.1-1.3 (extension mapping)

### Component 2: Pack Registry

**What**: Central registry of all packs with lookup helpers
**Where**: `packages/cli/src/packs/registry.ts`

```typescript
import { pythonPack } from './python.js';
import { typescriptPack } from './typescript.js';

export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  python: pythonPack,
  typescript: typescriptPack,
};

export function findPackForExtension(ext: string): LanguagePack | null;
export function detectLanguages(cwd: string): string[];
```

**Dependencies**: All pack implementations
**Tests**: Test 1.1-1.5

### Component 3: Python Pack

**What**: Python language pack (refactored from existing code)
**Where**: `packages/cli/src/packs/python.ts`

```typescript
export const pythonPack: LanguagePack = {
  id: 'python',
  name: 'Python',
  extensions: ['.py', '.pyi'],
  detect: (cwd) => exists(join(cwd, 'pyproject.toml')),
  setup: (cwd, ctx) => setupPythonTooling(cwd, ctx.isGitRepo),
};
```

**Dependencies**: `../utils/python-setup.ts` (existing)
**Tests**: Existing Python tests (18 tests in setup-python-phase2.test.ts)

### Component 4: TypeScript Pack

**What**: TypeScript/JavaScript language pack
**Where**: `packages/cli/src/packs/typescript.ts`

```typescript
export const typescriptPack: LanguagePack = {
  id: 'typescript',
  name: 'TypeScript',
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  detect: (cwd) => exists(join(cwd, 'package.json')),
  setup: (cwd, ctx) => setupTypescriptTooling(cwd, ctx),
};
```

**Dependencies**: Existing ESLint setup logic
**Tests**: Existing setup.test.ts ESLint tests

### Component 5: Config Tracking

**What**: Helpers to read/write installedPacks in config.json
**Where**: `packages/cli/src/packs/config.ts`

```typescript
export function getInstalledPacks(cwd: string): string[];
export function isPackInstalled(cwd: string, packId: string): boolean;
export function addInstalledPack(cwd: string, packId: string): void;
```

**Tests**: Test 1.3, 2.1

### Component 6: installPack Function

**What**: Install a pack and update config
**Where**: `packages/cli/src/packs/install.ts`

```typescript
export function installPack(packId: string, cwd: string): void {
  if (isPackInstalled(cwd, packId)) return;  // Idempotent

  const pack = LANGUAGE_PACKS[packId];
  if (!pack) throw new Error(`Unknown pack: ${packId}`);

  const ctx = { isGitRepo: isGitRepository(cwd) };
  pack.setup(cwd, ctx);
  addInstalledPack(cwd, packId);
}
```

**Tests**: Test 1.4, 1.5

---

## Component Interaction

### Setup Flow

```text
safeword setup
    │
    ├─► detectLanguages(cwd)        # Returns ['python', 'typescript']
    │
    ├─► For each detected language:
    │       └─► installPack(packId, cwd)
    │               ├─► pack.setup()
    │               └─► addInstalledPack()
    │
    └─► Write config.json with installedPacks
```

### Check Flow

```text
safeword check
    │
    ├─► detectLanguages(cwd)        # What languages exist now?
    ├─► getInstalledPacks(cwd)      # What's in config?
    │
    ├─► Compare: detected vs installed
    │       └─► Missing? Warn + suggest upgrade
    │
    └─► Exit 0 (all good) or non-zero (warnings)
```

### Upgrade Flow

```text
safeword upgrade
    │
    ├─► detectLanguages(cwd)
    ├─► getInstalledPacks(cwd)
    │
    ├─► For each detected but not installed:
    │       └─► installPack(packId, cwd)
    │
    └─► Report: "Installed Python pack"
```

---

## Key Decisions

### Decision 1: Refactor, Don't Rewrite

**What**: Wrap existing python-setup.ts and ESLint setup in pack interface
**Why**: Existing code works (18 tests passing). Refactor preserves behavior.
**Trade-off**: Some indirection; existing tests verify behavior unchanged

### Decision 2: Config Helpers Over Direct File Access

**What**: All config.json access through helper functions
**Why**: Single source of truth for schema, easier to extend
**Trade-off**: Slight overhead vs direct JSON.parse

### Decision 3: Synchronous Detection

**What**: `detect()` is synchronous (uses `existsSync`)
**Why**: Detection runs once at startup, async complexity not needed
**Trade-off**: Blocks event loop briefly (negligible for file existence checks)

---

## Implementation Order

### Phase 1: Interface & Registry (Story 1)

1. Create `src/packs/types.ts` with `LanguagePack` interface
2. Create `src/packs/registry.ts` with `findPackForExtension`, `detectLanguages`
3. Write unit tests (Test 1.1-1.5)

### Phase 2: Refactor Existing (Stories 2-3)

1. Create `src/packs/python.ts` wrapping python-setup.ts
2. Create `src/packs/typescript.ts` wrapping ESLint setup
3. Verify existing tests still pass

### Phase 3: Config Tracking (Story 4)

1. Create `src/packs/config.ts` with helpers
2. Create `src/packs/install.ts` with `installPack`
3. Update setup command to write installedPacks
4. Write tests (Test 2.1-2.3)

### Phase 4: Commands (Stories 5-7)

1. Update check command with pack detection
2. Update upgrade command with pack installation
3. Write integration tests (Test 3.1-4.2)

---

## References

- Existing Python setup: `packages/cli/src/utils/python-setup.ts`
- Existing TOML utils: `packages/cli/src/utils/toml.ts`
- Config schema: `ARCHITECTURE.md` → Language Packs section
