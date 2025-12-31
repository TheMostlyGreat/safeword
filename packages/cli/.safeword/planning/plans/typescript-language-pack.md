# Plan: Extract JavaScript/TypeScript into a Language Pack

**Status:** Approved
**Created:** 2025-12-29
**Approach:** File Extraction (Option B)

## Problem Statement

JavaScript/TypeScript tooling is scattered throughout `schema.ts` with `ctx.languages?.javascript` guards. Python and Go packs have their own setup files. JS/TS should follow the same pattern.

**Goal:** Move JS-specific schema definitions to the TypeScript pack folder without changing interfaces or architecture.

---

## Approach: File Extraction

Each pack exports its schema fragments. Schema.ts imports and spreads them.

```typescript
// packs/typescript/files.ts
export const typescriptOwnedFiles = { ... };
export const typescriptManagedFiles = { ... };
export const typescriptJsonMerges = { ... };
export const typescriptPackages = { ... };

// packs/golang/files.ts
export const golangManagedFiles = { ... };

// schema.ts - thin composition layer
import { typescriptOwnedFiles, ... } from './packs/typescript/files.js';
import { golangManagedFiles } from './packs/golang/files.js';

export const SAFEWORD_SCHEMA = {
  ownedFiles: { ...baseOwnedFiles, ...typescriptOwnedFiles },
  managedFiles: { ...baseManagedFiles, ...typescriptManagedFiles, ...golangManagedFiles },
  // ...
};
```

**Why this approach:**

- Pure refactoring - no behavior change
- No interface changes needed
- Follows composition over inheritance
- Each pack is self-contained

---

## What Moves Where

### To `packs/typescript/files.ts`

**From ownedFiles:**

- `.safeword/eslint.config.mjs` (generator)
- `.safeword/.prettierrc` (generator)

**From managedFiles:**

- `eslint.config.mjs` (generator)
- `tsconfig.json` (generator)
- `knip.json` (generator)
- `.prettierrc` (generator)

**From jsonMerges:**

- `package.json` (scripts merge)
- `.prettierrc` (plugins cleanup)
- `biome.json` / `biome.jsonc` (excludes)

**From packages:**

- All of `packages.base` (eslint, eslint-plugin-safeword, dependency-cruiser, knip)
- All of `packages.conditional` (standard, astro, tailwind, shell, etc.)

**Also moves:**

- `PRETTIER_DEFAULTS` constant
- `BIOME_JSON_MERGE` definition

### To `packs/golang/files.ts`

**From managedFiles:**

- `.golangci.yml` (generator)

### Stays in `schema.ts`

**ownedFiles:** guides, hooks, skills, prompts, templates, scripts, version
**jsonMerges:** `.claude/settings.json`, `.mcp.json`, `.cursor/*`
**textPatches:** `AGENTS.md`, `CLAUDE.md`
**packages:** Empty base, empty conditional (all moved to packs)

---

## Implementation Steps

### Step 1: Create `packs/typescript/files.ts`

Move all JS-specific definitions from schema.ts:

- Import required types and utilities
- Export `typescriptOwnedFiles`
- Export `typescriptManagedFiles`
- Export `typescriptJsonMerges`
- Export `typescriptPackages`
- Export `PRETTIER_DEFAULTS` (needed by generators)

### Step 2: Create `packs/golang/files.ts`

Move Go-specific definition:

- Export `golangManagedFiles` (just `.golangci.yml`)

### Step 3: Update `schema.ts`

- Import pack file exports
- Spread into SAFEWORD_SCHEMA
- Remove moved code
- Keep language-agnostic items

### Step 4: Run Tests

- All 60+ existing tests should pass
- No behavior change expected

---

## Files Changed

### New Files

- `src/packs/typescript/files.ts`
- `src/packs/golang/files.ts`

### Modified Files

- `src/schema.ts` (remove JS/Go specific, add imports)

### Unchanged

- `src/packs/types.ts` (no interface changes)
- `src/packs/*/index.ts` (packs unchanged)
- `src/reconcile.ts` (uses same schema structure)
- All test files (behavior unchanged)

---

## Success Criteria

1. All existing tests pass
2. JS-specific code lives in `packs/typescript/files.ts`
3. Go-specific code lives in `packs/golang/files.ts`
4. `schema.ts` only contains language-agnostic items
5. No interface changes
6. No architecture changes
