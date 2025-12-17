# ESLint Config Restructure Plan

## Problem Statement

The current eslint-plugin-safeword configs have issues with multi-framework projects:

1. **Base plugins apply to ALL files** - Including `.astro` files which use a different parser
2. **Mutual exclusivity** - Can't easily combine configs for monorepos with multiple frameworks
3. **Astro incomplete** - The `astro` config only lints `.astro` files, missing `.ts` files (quick-fixed in CLI)

## Proposed Solution

Scope all configs to their relevant file types using ESLint's `files` property.

### File Scoping Matrix

| Config | Files |
|--------|-------|
| base | `**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}` |
| typescript | `**/*.{ts,tsx,mts,cts}` |
| react | `**/*.{jsx,tsx}` |
| next | (inherits from react) |
| astro | `**/*.astro`, `**/*.astro/*.{js,ts}` (embedded scripts) |
| tailwind | `**/*.{jsx,tsx,astro,html}` |
| vitest | `**/*.{test,spec}.*` (already scoped) |
| playwright | `**/*.e2e.*`, `**/e2e/**/*` (already scoped) |

### Benefits

1. **Monorepos work** - Spread multiple configs, file patterns prevent conflicts
2. **No false positives** - Rules only run on files they understand
3. **Performance** - Rules skip irrelevant files
4. **Backwards compatible** - Layered configs still work as before

### Implementation Steps

#### Phase 1: Scope Base Plugins

1. Edit `src/configs/base.ts`:
   - Wrap `basePlugins` array items in a config object with `files` restriction
   - Target: `**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`

2. Update tests to verify file scoping

#### Phase 2: Make Astro Self-Contained

1. Edit `src/configs/astro.ts`:
   - Include base rules scoped to `.astro` and embedded scripts
   - Include TypeScript rules scoped to `**/*.astro/*.ts`
   - Keep existing Astro-specific rules

2. Update tests for Astro completeness

#### Phase 3: Scope Tailwind

1. Edit `src/configs/tailwind.ts`:
   - Add `files: ['**/*.{jsx,tsx,astro,html}']`

2. Update tests

#### Phase 4: Update Documentation

1. Update README.md with new scoping behavior
2. Update AGENTS.md
3. Add migration notes if any breaking changes

### Testing Strategy

1. **Unit tests** - Verify file patterns are set correctly
2. **Integration tests** - Verify rules only fire on correct file types
3. **Monorepo test** - Create test with Next + Astro, verify both work

### Risks

1. **Breaking change** - If base rules were (incorrectly) relied upon for non-JS files
2. **Edge cases** - Unusual file extensions might be missed
3. **Embedded scripts** - Need to verify TypeScript rules work on `**/*.astro/*.ts` pattern

### Open Questions

1. Should we add `.vue` and `.svelte` patterns for future compatibility?
   - **Decision**: No - Vue/Svelte are out of scope for this project

2. Should prettier be extracted to a separate config?
   - **Decision**: Keep as-is for now, duplication when combining configs is acceptable

3. Should we export building blocks (base, typescript, react separately)?
   - **Decision**: No - Keep layered presets, just add file scoping

### Acceptance Criteria

- [x] Base rules only run on JS/TS files
- [x] Astro config is complete (combines with recommendedTypeScript for full coverage)
- [x] Tailwind only runs on UI files
- [x] Spreading `[...recommendedTypeScriptNext, ...astro]` works without conflicts
- [x] All existing tests pass
- [x] New tests verify file scoping
