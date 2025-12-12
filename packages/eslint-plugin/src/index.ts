/**
 * eslint-plugin-safeword
 *
 * ESLint plugin with rules optimized for LLM coding agents.
 * Bundles multiple plugins with severity levels tuned to catch
 * common mistakes in AI-generated code.
 *
 * Usage:
 *   import safeword from 'eslint-plugin-safeword';
 *
 *   // JavaScript projects
 *   export default [...safeword.configs.recommended];
 *
 *   // TypeScript projects
 *   export default [...safeword.configs.recommendedTypeScript];
 *
 *   // React + TypeScript projects
 *   export default [...safeword.configs.recommendedTypeScriptReact];
 *
 *   // Next.js projects
 *   export default [...safeword.configs.recommendedTypeScriptNext];
 *
 *   // Test files (add to existing config)
 *   export default [...safeword.configs.recommendedTypeScript, ...safeword.configs.vitest];
 *   export default [...safeword.configs.recommendedTypeScript, ...safeword.configs.playwright];
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages */

import type { Rule } from 'eslint';

import { playwrightConfig } from './configs/playwright.js';
import { recommended } from './configs/recommended.js';
import { recommendedTypeScriptNext } from './configs/recommended-nextjs.js';
import { recommendedTypeScriptReact } from './configs/recommended-react.js';
import { recommendedTypeScript } from './configs/recommended-typescript.js';
import { vitestConfig } from './configs/vitest.js';
import { rules } from './rules/index.js';

interface SafewordPlugin {
  meta: {
    name: string;
    version: string;
  };
  configs: {
    recommended: any[];
    recommendedTypeScript: any[];
    recommendedTypeScriptReact: any[];
    recommendedTypeScriptNext: any[];
    vitest: any[];
    playwright: any[];
  };
  rules: Record<string, Rule.RuleModule>;
}

const plugin: SafewordPlugin = {
  meta: {
    name: 'eslint-plugin-safeword',
    version: '0.1.0',
  },
  configs: {
    recommended,
    recommendedTypeScript,
    recommendedTypeScriptReact,
    recommendedTypeScriptNext,
    vitest: vitestConfig,
    playwright: playwrightConfig,
  },
  rules,
};

export default plugin;

export { playwrightConfig } from './configs/playwright.js';
export { recommended } from './configs/recommended.js';
export { recommendedTypeScriptNext } from './configs/recommended-nextjs.js';
export { recommendedTypeScriptReact } from './configs/recommended-react.js';
export { recommendedTypeScript } from './configs/recommended-typescript.js';
export { vitestConfig } from './configs/vitest.js';
