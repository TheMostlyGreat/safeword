# eslint-plugin-safeword - Agent Instructions

ESLint plugin optimized for LLM coding agents. Bundles 15+ plugins with severity levels tuned to catch common AI-generated code mistakes.

## Key Concept

**LLMs ignore warnings.** This plugin escalates rules that catch real bugs to `error` severity, forcing agents to fix them before proceeding.

## Package Structure

```
src/
├── index.ts              # Main entry - exports plugin with all configs
├── detect.ts             # Framework detection utilities (shared with CLI)
├── types.d.ts            # Type declarations for untyped plugins
├── rules/
│   ├── index.ts          # Rule registry
│   └── no-incomplete-error-handling.ts  # Custom LLM-specific rule
└── configs/
    ├── base.ts           # Shared plugins (security, promise, unicorn, etc.)
    ├── recommended.ts    # JavaScript baseline
    ├── recommended-typescript.ts    # TypeScript strict
    ├── recommended-react.ts         # React + TypeScript
    ├── recommended-nextjs.ts        # Next.js (extends React)
    ├── astro.ts          # Astro standalone
    ├── tailwind.ts       # Tailwind CSS (additive)
    ├── tanstack-query.ts # TanStack Query (additive)
    ├── vitest.ts         # Unit test linting (additive)
    └── playwright.ts     # E2E test linting (additive)
```

## Bundled Plugins

**Base (all configs except Astro):** `@eslint/js`, `eslint-plugin-import-x`, `eslint-plugin-promise`, `eslint-plugin-regexp`, `eslint-plugin-security`, `eslint-plugin-sonarjs`, `eslint-plugin-unicorn`, `eslint-plugin-simple-import-sort`, `eslint-config-prettier`

**JavaScript only:** `eslint-plugin-jsdoc` (TypeScript uses types instead of docs)

**TypeScript:** `typescript-eslint` (type-checked with strictTypeChecked + stylisticTypeChecked)

**React:** `eslint-plugin-react`, `eslint-plugin-react-hooks` (v7+ with Compiler rules)

**Framework-specific:** `@next/eslint-plugin-next`, `eslint-plugin-astro` (standalone - doesn't include base)

**Additive:** `eslint-plugin-tailwindcss`, `@tanstack/eslint-plugin-query`, `eslint-plugin-vitest`, `eslint-plugin-playwright`

## File Scoping

Configs are scoped to relevant file types to prevent conflicts in multi-framework projects:

| Config | File Patterns |
|--------|---------------|
| Base plugins | `**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}` |
| TypeScript rules | `**/*.{ts,tsx,mts,cts}` |
| Astro | `**/*.astro` |
| Tailwind | `**/*.{jsx,tsx,astro,html}` |
| Vitest | `**/*.{test,spec}.*` |
| Playwright | `**/*.e2e.*`, `**/e2e/**/*.{test,spec}.*` |

This prevents base JS/TS rules from trying to parse `.astro` files (which use a different parser).

## Custom Rule

**`safeword/no-incomplete-error-handling`** - Detects catch blocks that log errors but don't rethrow or return (error swallowing).

```javascript
// BAD - error swallowed
catch (error) { console.error(error); }

// GOOD
catch (error) { console.error(error); throw error; }
catch (error) { console.error(error); return null; }
```

## Exported API

```typescript
import safeword from 'eslint-plugin-safeword';

// Configs (arrays - spread to use)
safeword.configs.recommended                // JavaScript + JSDoc
safeword.configs.recommendedTypeScript      // TypeScript (type-checked)
safeword.configs.recommendedTypeScriptReact // React + TS
safeword.configs.recommendedTypeScriptNext  // Next.js
safeword.configs.astro                      // Astro .astro files ONLY (use with recommendedTypeScript)
safeword.configs.tailwind                   // Tailwind CSS (additive)
safeword.configs.tanstackQuery              // TanStack Query (additive)
safeword.configs.vitest                     // Vitest tests (additive, *.test.* and *.spec.* files)
safeword.configs.playwright                 // Playwright tests (additive, *.e2e.* and e2e/**/*.{test,spec}.* files)

// Detection utilities (for CLI config generation)
safeword.detect.collectAllDeps(rootDir)     // Collects all deps from workspaces
safeword.detect.detectFramework(deps)       // → 'next' | 'react' | 'astro' | 'typescript' | 'javascript'
safeword.detect.hasTailwind(deps)           // Feature detection
safeword.detect.hasVitest(deps)
safeword.detect.hasPlaywright(deps)
safeword.detect.hasTanstackQuery(deps)
safeword.detect.hasExistingLinter(scripts)  // True if 'lint' script exists
safeword.detect.hasExistingFormatter(cwd)   // True if formatter config exists

// Constants
safeword.detect.TAILWIND_PACKAGES           // Package names to check
safeword.detect.TANSTACK_QUERY_PACKAGES
safeword.detect.PLAYWRIGHT_PACKAGES
safeword.detect.FORMATTER_CONFIG_FILES

// Rules
safeword.rules                              // { 'no-incomplete-error-handling': RuleModule }
```

## Development

```bash
bun run build        # Build with tsup
bun run dev          # Watch mode
bun run test         # Run Vitest
bun run typecheck    # Type check
```

## Testing Strategy

Tests verify:
1. **Config loading** - Configs load without errors
2. **Auto-fix** - Import sorting and style fixes work
3. **Error severity** - Bug-catching rules fire at `error` level
4. **Framework rules** - React, Next.js, Astro rules at correct severity

Run tests before any changes to configs or rules.

## Adding New Rules

1. Create rule in `src/rules/`
2. Export from `src/rules/index.ts`
3. Add to appropriate config(s)
4. Write tests in `src/rules/__tests__/`

## Adding New Configs

1. Create config in `src/configs/`
2. Export from `src/index.ts`
3. Add to `SafewordPlugin.configs` interface
4. Write tests in `src/configs/__tests__/`

## Critical Rules (Error Severity)

These rules catch bugs LLMs commonly make:

| Rule | Why |
|------|-----|
| `safeword/no-incomplete-error-handling` | LLMs swallow errors |
| `@typescript-eslint/no-floating-promises` | Forgotten await |
| `@typescript-eslint/no-explicit-any` | Type safety bypass |
| `react-hooks/exhaustive-deps` | Stale closures |
| `react/jsx-key` | Missing list keys |
| `promise/no-multiple-resolved` | Missing return after resolve |
| `security/detect-eval-with-expression` | Code injection |
| `complexity` (max 10) | LLMs write dense code |
| `max-depth` (max 4) | Forces early returns |
| `max-params` (max 5) | Forces object params |
