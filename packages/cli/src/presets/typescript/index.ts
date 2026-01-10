/**
 * TypeScript Preset
 *
 * ESLint configs, rules, and detection for TypeScript/JavaScript projects.
 * This is the main entry point for the TypeScript language preset.
 *
 * Usage in user's eslint.config.mjs:
 *   import safeword from 'safeword/eslint';
 *   export default [...safeword.configs.recommendedTypeScript];
 *
 * Or with multiple configs:
 *   import safeword from 'safeword/eslint';
 *   export default [
 *     ...safeword.configs.recommendedTypeScript,
 *     ...safeword.configs.vitest,
 *   ];
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import type { Rule } from 'eslint';

import { VERSION } from '../../version.js';
import { detect } from './detect.js';
import { astroConfig } from './eslint-configs/astro.js';
import { prettierConfig } from './eslint-configs/base.js';
import { playwrightConfig } from './eslint-configs/playwright.js';
import { recommended } from './eslint-configs/recommended.js';
import { recommendedTypeScriptNext } from './eslint-configs/recommended-nextjs.js';
import { recommendedTypeScriptReact } from './eslint-configs/recommended-react.js';
import { recommendedTypeScript } from './eslint-configs/recommended-typescript.js';
import { tailwindConfig } from './eslint-configs/tailwind.js';
import { tanstackQueryConfig } from './eslint-configs/tanstack-query.js';
import { vitestConfig } from './eslint-configs/vitest.js';
import { rules } from './eslint-rules/index.js';

interface SafewordEslint {
  meta: {
    name: string;
    version: string;
  };
  configs: {
    recommended: any[];
    recommendedTypeScript: any[];
    recommendedTypeScriptReact: any[];
    recommendedTypeScriptNext: any[];
    astro: any[];
    tailwind: any[];
    tanstackQuery: any[];
    vitest: any[];
    playwright: any[];
  };
  detect: typeof detect;
  rules: Record<string, Rule.RuleModule>;
  /** eslint-config-prettier, bundled for convenience */
  prettierConfig: any;
}

/**
 * ESLint plugin structure for TypeScript preset.
 * Can be used directly as an ESLint plugin or via safeword.eslint.
 */
export const eslintPlugin: SafewordEslint = {
  meta: {
    name: 'safeword',
    version: VERSION,
  },
  configs: {
    recommended,
    recommendedTypeScript,
    recommendedTypeScriptReact,
    recommendedTypeScriptNext,
    astro: astroConfig,
    tailwind: tailwindConfig,
    tanstackQuery: tanstackQueryConfig,
    vitest: vitestConfig,
    playwright: playwrightConfig,
  },
  detect,
  rules,
  prettierConfig,
};

// Re-export configs for direct access
export { detect } from './detect.js';
export { astroConfig } from './eslint-configs/astro.js';
export { prettierConfig } from './eslint-configs/base.js';
export { playwrightConfig } from './eslint-configs/playwright.js';
export { recommended } from './eslint-configs/recommended.js';
export { recommendedTypeScriptNext } from './eslint-configs/recommended-nextjs.js';
export { recommendedTypeScriptReact } from './eslint-configs/recommended-react.js';
export { recommendedTypeScript } from './eslint-configs/recommended-typescript.js';
export { tailwindConfig } from './eslint-configs/tailwind.js';
export { tanstackQueryConfig } from './eslint-configs/tanstack-query.js';
export { vitestConfig } from './eslint-configs/vitest.js';
export { rules } from './eslint-rules/index.js';

// Default export for `import safeword from "safeword/eslint"`
export default eslintPlugin;
