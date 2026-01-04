// Safeword ESLint config - standalone (no project config to extend)
// Used by hooks for LLM enforcement.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import safeword from 'eslint-plugin-safeword';
import eslintConfigPrettier from 'eslint-config-prettier';

const { detect, configs } = safeword;
const __dirname = dirname(fileURLToPath(import.meta.url));
// Look in parent directory for deps (this file is in .safeword/)
const deps = detect.collectAllDeps(dirname(__dirname));
const framework = detect.detectFramework(deps);

const baseConfigs = {
  next: configs.recommendedTypeScriptNext,
  react: configs.recommendedTypeScriptReact,
  astro: [...configs.recommendedTypeScript, ...configs.astro],
  typescript: configs.recommendedTypeScript,
  javascript: configs.recommended,
};

// Safeword strict rules - applied after project rules (win on conflict)
const safewordStrictRules = {
  rules: {
    // Prevent common LLM mistakes
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-empty': 'error',
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-prototype-builtins': 'error',
    'no-unexpected-multiline': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    // Strict code quality
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-var': 'error',
    'prefer-const': 'error',
  },
};

export default [
  { ignores: detect.getIgnores(deps) },
  ...baseConfigs[framework],
  ...(detect.hasVitest(deps) ? configs.vitest : []),
  ...(detect.hasPlaywright(deps) ? configs.playwright : []),
  ...(detect.hasTailwind(deps) ? configs.tailwind : []),
  ...(detect.hasTanstackQuery(deps) ? configs.tanstackQuery : []),
  safewordStrictRules,
  eslintConfigPrettier,
];
