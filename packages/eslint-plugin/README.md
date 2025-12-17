# eslint-plugin-safeword

ESLint plugin with rules optimized for LLM coding agents. Bundles 15+ ESLint plugins with severity levels tuned to catch common AI-generated code mistakes.

## Why This Plugin?

**LLMs ignore warnings.** They process output and move on. This plugin:

- Escalates bug-catching rules to `error` severity
- Forces agents to fix real issues before proceeding
- Includes a custom rule for common LLM error patterns
- Bundles everything needed for modern JS/TS projects

## Installation

```bash
npm install eslint-plugin-safeword eslint --save-dev
```

For TypeScript projects:

```bash
npm install eslint-plugin-safeword eslint typescript --save-dev
```

## Usage

Create `eslint.config.js` (or `.mjs`):

```javascript
import safeword from 'eslint-plugin-safeword';

// JavaScript projects
export default [...safeword.configs.recommended];

// TypeScript projects
export default [...safeword.configs.recommendedTypeScript];

// React + TypeScript projects
export default [...safeword.configs.recommendedTypeScriptReact];

// Next.js projects
export default [...safeword.configs.recommendedTypeScriptNext];

// Astro projects (TypeScript + Astro components)
export default [
  ...safeword.configs.recommendedTypeScript,
  ...safeword.configs.astro,
];
```

### Adding Feature Configs

Feature configs are additive - spread them after your base config:

```javascript
import safeword from 'eslint-plugin-safeword';

export default [
  ...safeword.configs.recommendedTypeScriptReact,
  ...safeword.configs.tailwind,      // If using Tailwind CSS
  ...safeword.configs.tanstackQuery, // If using TanStack Query
  ...safeword.configs.vitest,        // For test files
  ...safeword.configs.playwright,    // For E2E test files
];
```

## Available Configs

| Config | Use For | Includes |
|--------|---------|----------|
| `recommended` | JavaScript projects | Base plugins + JSDoc |
| `recommendedTypeScript` | TypeScript projects | Base plugins + typescript-eslint (type-checked) |
| `recommendedTypeScriptReact` | React + TypeScript | TypeScript + React + Hooks |
| `recommendedTypeScriptNext` | Next.js projects | React + Next.js plugin |
| `astro` | Astro `.astro` files | Astro plugin only (standalone) |
| `tailwind` | Tailwind CSS | Additive - combine with base config |
| `tanstackQuery` | TanStack Query | Additive - combine with base config |
| `vitest` | Vitest unit tests | Additive - for `*.test.*` and `*.spec.*` files |
| `playwright` | Playwright E2E tests | Additive - for `*.e2e.*` and `e2e/**/*.{test,spec}.*` files |

## Bundled Plugins

This plugin bundles and configures:

**Base (all configs except Astro):**
- `@eslint/js` - ESLint recommended
- `eslint-plugin-import-x` - Import validation
- `eslint-plugin-promise` - Promise handling
- `eslint-plugin-regexp` - Regex safety (ReDoS prevention)
- `eslint-plugin-security` - Security vulnerabilities
- `eslint-plugin-sonarjs` - Code quality
- `eslint-plugin-unicorn` - Modern JavaScript
- `eslint-plugin-simple-import-sort` - Auto-fixable import sorting
- `eslint-config-prettier` - Disables conflicting rules

**JavaScript only:**
- `eslint-plugin-jsdoc` - Documentation rules (TypeScript uses types instead)

**TypeScript:**
- `typescript-eslint` - Full type-checked rules

**React:**
- `eslint-plugin-react` - JSX best practices
- `eslint-plugin-react-hooks` - Hooks rules (v7+ with Compiler support)

**Framework-specific:**
- `@next/eslint-plugin-next` - Next.js rules
- `eslint-plugin-astro` - Astro component rules (standalone config)

**Additive (combine with base configs):**
- `eslint-plugin-tailwindcss` - Tailwind class validation
- `@tanstack/eslint-plugin-query` - Query best practices
- `eslint-plugin-vitest` - Unit test rules
- `eslint-plugin-playwright` - E2E test rules

## Custom Rules

### `safeword/no-incomplete-error-handling`

Detects catch blocks that log errors but don't rethrow or return, silently swallowing errors. This is a common LLM mistake.

```javascript
// Bad - error is swallowed
try {
  await fetchData();
} catch (error) {
  console.error(error);
}

// Good - error is propagated
try {
  await fetchData();
} catch (error) {
  console.error(error);
  throw error;
}

// Good - explicit return
try {
  return await fetchData();
} catch (error) {
  console.error(error);
  return null;
}
```

## Key Rules at Error Severity

These rules catch bugs LLMs commonly make:

| Category | Rules |
|----------|-------|
| **Error Handling** | `no-incomplete-error-handling`, `no-floating-promises` |
| **Type Safety** | `no-explicit-any`, `no-unsafe-*` rules |
| **React** | `jsx-key`, `exhaustive-deps`, `rules-of-hooks` |
| **Security** | `detect-eval-with-expression`, `detect-non-literal-fs-filename` |
| **Complexity** | `complexity` (max 10), `max-depth` (4), `max-params` (5) |
| **Promise** | `no-multiple-resolved`, `no-nesting` |

## Framework Detection Utilities

The plugin exports detection utilities for dynamic config generation:

```javascript
import { detect } from 'eslint-plugin-safeword';

const deps = detect.collectAllDeps(process.cwd());
const framework = detect.detectFramework(deps);

if (detect.hasTailwind(deps)) {
  // Add Tailwind config
}

if (detect.hasVitest(deps)) {
  // Add Vitest config
}
```

## Requirements

- ESLint 9.x (flat config format)
- Node.js 18+
- TypeScript 5.0+ (optional, for TypeScript configs)
- `tsconfig.json` in project root (required for TypeScript type-checked rules)

## License

MIT
