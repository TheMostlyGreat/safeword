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
 */

import type { Linter, Rule } from 'eslint';

import { recommended } from './configs/recommended.js';
import { recommendedTypeScript } from './configs/recommended-typescript.js';

interface SafewordPlugin {
  meta: {
    name: string;
    version: string;
  };
  configs: {
    recommended: Linter.Config[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESLint config types are incompatible across plugin packages
    recommendedTypeScript: any[];
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
  },
  rules: {},
};

export default plugin;

export { recommended } from './configs/recommended.js';
export { recommendedTypeScript } from './configs/recommended-typescript.js';
