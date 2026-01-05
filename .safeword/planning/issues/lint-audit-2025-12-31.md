# Lint Audit - 2025-12-31

## Summary

Full lint run on the safeword monorepo. Prettier passes with no changes. TypeScript root config is a reference-only config (expected behavior).

### Status: FIXED

The following issues have been resolved:

| Category              | Fix Applied                                            |
| --------------------- | ------------------------------------------------------ |
| Circular deps (3)     | Moved shared types to `packs/types.ts`                 |
| Orphan module (1)     | Deleted unused `utils/toml.ts`                         |
| null → undefined      | Replaced across all pack files and project-detector.ts |
| Vitest valid-expect   | Configured `maxArgs: 2` in eslint-plugin-safeword      |
| Switch exhaustiveness | Added missing `case 'pip'` in helpers.ts               |
| CommonJS env          | Added `/* eslint-env node */` to .cjs files            |
| Error handling        | Fixed incomplete catch in eslint.config.mjs            |

**Verification:**

- ✅ Build passes (`bun run build`)
- ✅ No circular dependencies (`npx depcruise` - 0 violations)
- ✅ No orphans (47 modules, 149 dependencies)

---

## ESLint Errors by Category

### 1. Parsing Errors - Hook Files Not in tsconfig (22 errors)

Files in `.safeword/hooks/` and `packages/cli/templates/hooks/` are not included in the TypeScript project.

**Affected files:**

- `.safeword/hooks/cursor/after-file-edit.ts`
- `.safeword/hooks/cursor/stop.ts`
- `.safeword/hooks/lib/lint.ts`
- `.safeword/hooks/lib/quality.ts`
- `.safeword/hooks/post-tool-lint.ts`
- `.safeword/hooks/prompt-questions.ts`
- `.safeword/hooks/prompt-timestamp.ts`
- `.safeword/hooks/session-lint-check.ts`
- `.safeword/hooks/session-verify-agents.ts`
- `.safeword/hooks/session-version.ts`
- `.safeword/hooks/stop-quality.ts`
- `packages/cli/templates/hooks/*` (same files)

**Fix options:**

1. Add to tsconfig `include` paths
2. Use `allowDefaultProject` in ESLint config
3. Exclude from ESLint entirely (they're templates/runtime hooks)

---

### 2. Complexity Violations (10 errors)

Functions exceeding max complexity (10) or cognitive complexity (15).

| File                                                                   | Function                      | Complexity | Cognitive |
| ---------------------------------------------------------------------- | ----------------------------- | ---------- | --------- |
| `packages/cli/src/commands/setup.ts:48`                                | `setupWorkspaceFormatScripts` | 16         | 31        |
| `packages/cli/src/commands/setup.ts:198`                               | `printSetupSummary`           | 16         | -         |
| `packages/cli/src/commands/setup.ts:256`                               | `setup`                       | 23         | 31        |
| `packages/cli/src/packs/typescript/files.ts:201`                       | `merge`                       | 12         | 16        |
| `packages/cli/src/reconcile.ts:439`                                    | (anonymous)                   | -          | 16        |
| `packages/cli/src/utils/project-detector.ts:309`                       | `detectProjectType`           | 19         | -         |
| `packages/cli/tests/helpers.ts:155`                                    | `runCli`                      | 11         | -         |
| `packages/cli/tests/helpers.ts:199`                                    | `runCliSync`                  | 11         | -         |
| `packages/cli/tests/integration/claude-code-simulation.test.ts:43`     | (arrow fn)                    | 12         | -         |
| `packages/cli/tests/integration/skills-commands-validation.test.ts:65` | `parseFrontmatter`            | 11         | -         |

**Fix:** Refactor into smaller functions or disable rule for specific cases.

---

### 3. `null` vs `undefined` (25 errors)

`unicorn/no-null` requires using `undefined` instead of `null`.

**Affected files:**

- `packages/cli/src/packs/golang/files.ts` (3)
- `packages/cli/src/packs/python/files.ts` (8)
- `packages/cli/src/packs/typescript/files.ts` (10)
- `packages/cli/src/schema.ts` (1)
- `packages/cli/src/utils/project-detector.ts` (4)
- Various test files (5+)

**Fix:** Find/replace `null` → `undefined` in return types and assignments.

---

### 4. Unused Variables/Parameters (10 errors)

| File                                         | Variable       | Line |
| -------------------------------------------- | -------------- | ---- |
| `.safeword/eslint.config.mjs`                | `e`            | 12   |
| `packages/cli/src/commands/setup.ts`         | `_options`     | 256  |
| `packages/cli/src/packs/golang/index.ts`     | `_cwd`, `_ctx` | 22   |
| `packages/cli/src/packs/python/index.ts`     | `_cwd`, `_ctx` | 22   |
| `packages/cli/src/packs/typescript/index.ts` | `_cwd`, `_ctx` | 23   |
| `packages/cli/src/packs/typescript/files.ts` | `_`            | 79   |

**Fix:** Remove unused variables or use proper ignore patterns.

---

### 5. Nested Callbacks in Tests (20+ errors)

`max-nested-callbacks` (max 3) exceeded in test files.

**Affected files:**

- `tests/commands/check-reconcile.test.ts`
- `tests/commands/reset-reconcile.test.ts`
- `tests/commands/reset.test.ts`
- `tests/commands/self-healing.test.ts`
- `tests/commands/setup-hooks.test.ts`
- `tests/commands/setup-linting.test.ts`
- `tests/commands/setup-reconcile.test.ts`
- `tests/commands/upgrade-reconcile.test.ts`
- `tests/commands/upgrade.test.ts`

**Fix:** Flatten test structure or extract helper functions.

---

### 6. Vitest `expect` Syntax (40+ errors) - FALSE POSITIVE?

`vitest/valid-expect` - "Expect takes most 1 argument"

**Affected file:** `tests/integration/skills-commands-validation.test.ts`

**Pattern:** `expect(value, 'custom message').toBe(...)` - second arg is for custom error messages.

**Investigation:** Vitest DOES support `expect(value, message)` syntax for custom error messages. This is valid code:

```typescript
expect(parsed, "Frontmatter must start with ---").not.toBeNull();
```

**Root cause:** `eslint-plugin-vitest@0.5.4` (April 2024) doesn't recognize this syntax. Fix was [merged Aug 2024](https://github.com/vitest-dev/eslint-plugin-vitest/issues/503) but no new release yet.

**Fix:** Add `maxArgs: 2` config to `vitest/valid-expect` rule:

```javascript
'vitest/valid-expect': ['error', { maxArgs: 2 }]
```

---

### 7. Variable Naming (8 errors)

`unicorn/prevent-abbreviations` - requires full names.

| Variable     | Suggested            |
| ------------ | -------------------- |
| `packageDir` | `packageDirectory`   |
| `tempDir`    | `temporaryDirectory` |
| `pkgDir`     | `pkgDirectory`       |
| `bunDir`     | `bunDirectory`       |
| `baseDir`    | `baseDirectory`      |
| `skillDir`   | `skillDirectory`     |

---

### 8. Other Issues

| File                                                      | Issue                           | Rule                                             |
| --------------------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| `.dependency-cruiser.cjs:2`                               | `module` not defined            | `no-undef`                                       |
| `scripts/check-bun-publish.js`                            | `process`/`console` not defined | `no-undef`                                       |
| `.safeword/eslint.config.mjs:12`                          | Incomplete error handling       | `safeword/no-incomplete-error-handling`          |
| `.safeword/eslint.config.mjs:7`                           | Await expression member access  | `unicorn/no-await-expression-member`             |
| `packages/cli/src/packs/python/setup.ts:156`              | Useless switch case             | `unicorn/no-useless-switch-case`                 |
| `packages/cli/src/utils/install.ts:10`                    | Import style                    | `unicorn/import-style`                           |
| `packages/cli/tests/helpers.ts:406`                       | Non-exhaustive switch           | `@typescript-eslint/switch-exhaustiveness-check` |
| `tests/integration/conditional-setup.test.ts:78`          | `javascript:` code eval         | `sonarjs/code-eval`                              |
| `tests/integration/skills-commands-validation.test.ts:32` | Regex complexity                | `sonarjs/regex-complexity`                       |
| Various test files                                        | Non-literal RegExp              | `security/detect-non-literal-regexp`             |

---

## Recommended Fix Priority

### P0 - Breaking/Blocking

1. Fix incomplete error handling in `.safeword/eslint.config.mjs`
2. Add env declarations to CommonJS files (`.dependency-cruiser.cjs`, `check-bun-publish.js`)

### P1 - Code Quality

1. Replace `null` with `undefined` across pack files
2. Fix unused variables (remove or rename to `_`)
3. Fix switch exhaustiveness in `helpers.ts`

### P2 - Test Quality

1. Configure `vitest/valid-expect` with `maxArgs: 2` (false positive - valid Vitest syntax)
2. Flatten nested callbacks in test files (or increase `max-nested-callbacks` for tests)

### P3 - Style/Convention

1. Rename abbreviated variables
2. Fix import styles

### P4 - Complexity (Consider Later)

1. Refactor high-complexity functions in `setup.ts`
2. Consider if complexity rules are too strict for CLI code

### P5 - Config Decisions

1. Decide how to handle hook template files (exclude from lint or add to tsconfig)

---

## Architecture Review

### Dependency Analysis (depcruise)

```bash
npx depcruise src --config ../../.dependency-cruiser.cjs --output-type err
```

**Results:** 4 violations (3 errors, 1 warning) | 48 modules, 148 dependencies

---

### Circular Dependencies (3 errors)

All three are `packs/*/files.ts` ↔ `schema.ts` cycles:

| Cycle | Path                                                                    |
| ----- | ----------------------------------------------------------------------- |
| 1     | `packs/typescript/files.ts` → `schema.ts` → `packs/typescript/files.ts` |
| 2     | `packs/python/files.ts` → `schema.ts` → `packs/python/files.ts`         |
| 3     | `packs/golang/files.ts` → `schema.ts` → `packs/golang/files.ts`         |

**Root cause:**

- `schema.ts` imports file definitions from `packs/*/files.ts` (runtime values)
- `packs/*/files.ts` imports types from `schema.ts` (`FileDefinition`, `ManagedFileDefinition`)

**Why it works:** TypeScript resolves type-only imports at compile time, so no runtime circular dependency exists. However, this is an architectural smell.

**Fix options:**

1. **Extract shared types** - Move `FileDefinition`, `ManagedFileDefinition` to `packs/types.ts` (shared layer)
2. **Invert dependency** - Have schema define the shape, packs implement it, use dynamic import or registration pattern
3. **Accept as-is** - Document that type-only circular imports are acceptable in this architecture

---

### Orphan Module (1 warning)

| File                | Issue                 |
| ------------------- | --------------------- |
| `src/utils/toml.ts` | Not imported anywhere |

**Fix:** Either delete if unused, or integrate where needed.

---

### Current Layer Structure

Based on import analysis:

```text
┌─────────────────────────────────────────────────┐
│  commands/      (CLI entry points)              │  ← Top layer
├─────────────────────────────────────────────────┤
│  reconcile.ts   (orchestration)                 │
├─────────────────────────────────────────────────┤
│  schema.ts      (file definitions, types)       │  ← CIRCULAR with packs
├─────────────────────────────────────────────────┤
│  packs/         (language-specific config)      │  ← CIRCULAR with schema
│  templates/     (static content)                │
├─────────────────────────────────────────────────┤
│  utils/         (pure utilities)                │  ← Bottom layer
└─────────────────────────────────────────────────┘
```

**Validated boundaries:**

- ✅ `commands/` → everything below (correct)
- ✅ `reconcile.ts` → `schema.ts`, `utils/` (correct)
- ✅ `utils/` does NOT import from `commands/`, `packs/`, or `reconcile` (correct)
- ⚠️ `schema.ts` ↔ `packs/*/files.ts` (circular - types only)
- ⚠️ `utils/context.ts` → `schema.ts` (type import - acceptable)

---

### Architecture Recommendations

#### P0 - Should Fix

1. **Move shared types to break circular dependency**
   - `packs/types.ts` already exists with `LanguagePack`, `SetupContext`, `SetupResult`
   - Move `FileDefinition`, `ManagedFileDefinition`, `JsonMergeDefinition` from `schema.ts` → `packs/types.ts`
   - Update imports in both `schema.ts` and `packs/*/files.ts`

2. **Integrate or remove orphan module**
   - `src/utils/toml.ts` has `hasTomlSection()`, `appendTomlSection()` for pyproject.toml manipulation
   - Not imported anywhere - likely intended for Python pack but never integrated
   - Either: use in `packs/python/setup.ts` OR delete

#### P1 - Consider

1. **Document layer architecture in ARCHITECTURE.md**
   - Current structure isn't the standard app/domain/infra/shared pattern
   - Custom layers work but should be explicit

#### Acceptable As-Is

- `utils/context.ts` importing types from `schema.ts` - types flow downward is fine
- Complexity in setup.ts - CLI entry points are inherently complex
