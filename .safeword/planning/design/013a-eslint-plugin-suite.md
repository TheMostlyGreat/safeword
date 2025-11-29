# ESLint Plugin Suite

**Parent:** [013-cli-self-contained-templates.md](./013-cli-self-contained-templates.md)
**Date:** 2025-11-29

---

Safeword sets up a comprehensive linting configuration. The plugin list varies by detected project type.

## Core Plugins (Always Installed)

| Plugin | Purpose | npm Package |
|--------|---------|-------------|
| SonarJS | Code smells, complexity, bugs | `eslint-plugin-sonarjs` |
| Microsoft SDL | Security Development Lifecycle (includes eslint-plugin-security rules) | `@microsoft/eslint-plugin-sdl` |

**Note:** We use `@microsoft/eslint-plugin-sdl` instead of `eslint-plugin-security` because [SDL is a superset](https://github.com/microsoft/eslint-plugin-sdl) that includes security rules plus additional framework-specific rules (React, Angular, TypeScript). Using both would be redundant.

## Architecture Enforcement (Auto-Detected)

| Plugin | npm Package | Mode |
|--------|-------------|------|
| Boundaries | `eslint-plugin-boundaries` | Auto-detect dirs, generate config, warn severity |

Safeword auto-generates boundaries config when it detects 3+ architecture directories:

**Detection logic:**
```typescript
const architectureDirs = ['app', 'components', 'lib', 'utils', 'hooks', 'services', 'types', 'features', 'modules'];

// Check both root and src/ prefix
const found = architectureDirs.filter(d =>
  existsSync(join(projectDir, d)) || existsSync(join(projectDir, 'src', d))
);

if (found.length >= 3) {
  generateBoundariesConfig(projectDir, found);
}
```

**Generated hierarchy** (from most to least restrictive):
```
types      → can be imported by: everything
utils      → can import: types
lib        → can import: utils, types
hooks      → can import: lib, utils, types
services   → can import: lib, utils, types
components → can import: hooks, services, lib, utils, types
features   → can import: components, hooks, services, lib, utils, types
modules    → can import: components, hooks, services, lib, utils, types
app        → can import: everything
```

**Key design decisions:**
- Uses `warn` severity (not `error`) - informative, not blocking
- Config placed in `.safeword/eslint-boundaries.config.js` (safeword owns)
- User can override in their `eslint.config.js` (takes precedence)
- Setup prints: "Detected architecture boundaries - review `.safeword/eslint-boundaries.config.js`"

**Generated config example:**
```javascript
// .safeword/eslint-boundaries.config.js (AUTO-GENERATED)
import boundaries from 'eslint-plugin-boundaries';

// Detected directories: components, lib, utils, types (in src/)
export default {
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'components', pattern: 'src/components/**' },
      { type: 'lib', pattern: 'src/lib/**' },
      { type: 'utils', pattern: 'src/utils/**' },
      { type: 'types', pattern: 'src/types/**' },
    ],
  },
  rules: {
    'boundaries/element-types': ['warn', {
      default: 'disallow',
      rules: [
        { from: 'components', allow: ['lib', 'utils', 'types'] },
        { from: 'lib', allow: ['utils', 'types'] },
        { from: 'utils', allow: ['types'] },
        // types can be imported by anything (no restriction)
      ],
    }],
  },
};
```

**User override** (in their `eslint.config.js`):
```javascript
export default defineConfig([
  { extends: [safeword] },

  // Override boundaries with custom architecture
  {
    settings: {
      'boundaries/elements': [
        // Your custom architecture
      ],
    },
    rules: {
      'boundaries/element-types': ['error', { /* stricter rules */ }],
    },
  },
]);
```

## Framework-Specific Plugins (Auto-Detected)

| Framework | Plugin | npm Package | Detection |
|-----------|--------|-------------|-----------|
| React | React rules | `eslint-plugin-react` | `react` in dependencies |
| React | Hooks rules | `eslint-plugin-react-hooks` | `react` in dependencies |
| Next.js | Next.js rules | `@next/eslint-plugin-next` | `next` in dependencies |
| Astro | Astro rules | `eslint-plugin-astro` | `astro` in dependencies |
| Electron | Electron config | `@electron-toolkit/eslint-config` | `electron` in dependencies |

## Testing Plugins (Auto-Detected)

| Framework | Plugin | npm Package | Detection |
|-----------|--------|-------------|-----------|
| Vitest | Vitest rules | `@vitest/eslint-plugin` | `vitest` in devDependencies |
| Playwright | Playwright rules | `eslint-plugin-playwright` | `@playwright/test` in devDependencies |

**Note:** Testing plugins use `files` patterns to scope rules to test files only:
- Vitest: `['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**']`
- Playwright: `['**/e2e/**', '**/*.e2e.{ts,tsx}', '**/playwright/**']`

Patterns are detected from `playwright.config.ts` if present, otherwise defaults are used.

## Database Plugins (Auto-Detected)

| ORM/Database | Plugin | npm Package | Detection |
|--------------|--------|-------------|-----------|
| Drizzle ORM | Drizzle rules | `eslint-plugin-drizzle` | `drizzle-orm` in dependencies |

**Available but not auto-installed** (too niche for most projects):
- `eslint-plugin-sql` - SQL linting in template literals (for raw SQL usage)
- `eslint-plugin-sql-template` - Enforces `sql` tag to prevent injection

## Container Linting (Separate Tool)

Dockerfile linting is handled by [Hadolint](https://github.com/hadolint/hadolint), not ESLint:

```bash
# Installation
brew install hadolint      # macOS
scoop install hadolint     # Windows
docker pull hadolint/hadolint  # Docker

# Usage
hadolint Dockerfile
```

**Safeword integration:** The `safeword setup` command adds Hadolint to pre-commit hooks if Dockerfile is detected in project root. Requires Hadolint to be installed on the system.

## Plugin Detection Logic

```typescript
function detectPlugins(projectDir: string): string[] {
  const pkg = readPackageJson(projectDir);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const devDeps = pkg.devDependencies || {};
  const plugins: string[] = [];

  // Core (always)
  plugins.push('eslint-plugin-sonarjs');
  plugins.push('@microsoft/eslint-plugin-sdl'); // Superset of eslint-plugin-security

  // Framework detection
  if (deps['react']) {
    plugins.push('eslint-plugin-react');
    plugins.push('eslint-plugin-react-hooks');
  }
  if (deps['next']) {
    plugins.push('@next/eslint-plugin-next');
  }
  if (deps['astro']) {
    plugins.push('eslint-plugin-astro');
  }
  if (deps['electron']) {
    plugins.push('@electron-toolkit/eslint-config');
  }

  // Testing detection
  if (devDeps['vitest']) {
    plugins.push('@vitest/eslint-plugin');
  }
  if (devDeps['@playwright/test']) {
    plugins.push('eslint-plugin-playwright');
  }

  // Database detection (only Drizzle - raw SQL plugins are niche)
  if (deps['drizzle-orm']) {
    plugins.push('eslint-plugin-drizzle');
  }

  // Architecture boundaries (auto-detected if 3+ dirs found)
  if (detectArchitectureFolders(projectDir)) {
    plugins.push('eslint-plugin-boundaries');
  }

  return plugins;
}

function detectArchitectureFolders(projectDir: string): boolean {
  const architectureDirs = ['app', 'components', 'lib', 'utils', 'hooks', 'services', 'types', 'features', 'modules'];

  const found = architectureDirs.filter(d =>
    existsSync(join(projectDir, d)) || existsSync(join(projectDir, 'src', d))
  );
  return found.length >= 3;
}
```

## ESLint Config Generation

The generated `.safeword/eslint.config.js` dynamically includes plugins based on detection:

```javascript
// .safeword/eslint.config.js (SAFEWORD OWNS)
// ⚠️ AUTO-GENERATED BY SAFEWORD - DO NOT EDIT
// Customize in your root eslint.config.js instead

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import sdl from '@microsoft/eslint-plugin-sdl';
// Framework imports added based on detection (react, next, vitest, etc.)
// Boundaries import added if 3+ architecture dirs detected

export default [
  // Base (always included)
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  ...sdl.configs.recommended,

  // Framework configs (conditionally included based on package.json)
  // ...react configs if react detected
  // ...next configs if next detected
  // ...vitest configs if vitest detected
  // ...playwright configs if @playwright/test detected

  // Boundaries (conditionally included if 3+ architecture dirs found)
  // boundariesConfig,

  // Global ignores
  { ignores: ['node_modules/', 'dist/', '.next/', 'build/'] },
];
```

**Implementation note:** The CLI generates this file dynamically based on detected dependencies and directory structure. Only detected plugins are imported and included.

**Note:** Vite doesn't need ESLint rules - use `vite-plugin-eslint2` for dev server integration.
