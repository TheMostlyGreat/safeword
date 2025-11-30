/**
 * Configuration templates - ESLint config generation and hook settings
 *
 * ESLint flat config (v9+) with:
 * - defineConfig helper for validation and type checking
 * - Global ignores as first config object (no other properties)
 * - SonarJS for code quality and bug detection
 * - Microsoft SDL for security rules
 * - eslint-config-prettier last to avoid conflicts
 *
 * See: https://eslint.org/docs/latest/use/configure/configuration-files
 */

export function getEslintConfig(options: {
  typescript?: boolean;
  react?: boolean;
  nextjs?: boolean;
  astro?: boolean;
  vue?: boolean;
  svelte?: boolean;
  electron?: boolean;
  vitest?: boolean;
  boundaries?: boolean;
}): string {
  const imports: string[] = [
    'import { defineConfig } from "eslint/config";',
    'import js from "@eslint/js";',
    'import { importX } from "eslint-plugin-import-x";',
    'import sonarjs from "eslint-plugin-sonarjs";',
    'import sdl from "@microsoft/eslint-plugin-sdl";',
    'import eslintConfigPrettier from "eslint-config-prettier";',
  ];
  const configs: string[] = [];
  const ignores: string[] = ['node_modules/', 'dist/', 'build/', 'coverage/'];

  // Base JS config
  configs.push('js.configs.recommended');

  // Import/export linting (module best practices)
  configs.push('importX.flatConfigs.recommended');
  if (options.typescript) {
    configs.push('importX.flatConfigs.typescript');
  }

  // SonarJS for code quality (cognitive complexity, bugs, code smells)
  configs.push('sonarjs.configs.recommended');

  // Microsoft SDL for security rules
  configs.push('...sdl.configs.recommended');

  if (options.typescript) {
    imports.push('import tseslint from "typescript-eslint";');
    configs.push('...tseslint.configs.recommended');
  }

  if (options.react || options.nextjs) {
    imports.push('import react from "eslint-plugin-react";');
    imports.push('import reactHooks from "eslint-plugin-react-hooks";');
    imports.push('import jsxA11y from "eslint-plugin-jsx-a11y";');
    configs.push('react.configs.flat.recommended');
    configs.push('react.configs.flat["jsx-runtime"]');
    configs.push(
      '{\n    name: "react-hooks",\n    plugins: { "react-hooks": reactHooks },\n    rules: reactHooks.configs.recommended.rules,\n  }',
    );
    // Accessibility rules for JSX
    configs.push('jsxA11y.flatConfigs.recommended');
  }

  if (options.nextjs) {
    imports.push('import nextPlugin from "@next/eslint-plugin-next";');
    configs.push(
      '{\n    name: "nextjs",\n    plugins: { "@next/next": nextPlugin },\n    rules: nextPlugin.configs.recommended.rules,\n  }',
    );
    ignores.push('.next/');
  }

  if (options.astro) {
    imports.push('import eslintPluginAstro from "eslint-plugin-astro";');
    configs.push('...eslintPluginAstro.configs.recommended');
    ignores.push('.astro/');
  }

  if (options.vue) {
    imports.push('import pluginVue from "eslint-plugin-vue";');
    configs.push("...pluginVue.configs['flat/recommended']");
    ignores.push('.nuxt/');
  }

  if (options.svelte) {
    imports.push('import eslintPluginSvelte from "eslint-plugin-svelte";');
    configs.push('...eslintPluginSvelte.configs.recommended');
    ignores.push('.svelte-kit/');
  }

  if (options.electron) {
    imports.push('import electronConfig from "@electron-toolkit/eslint-config";');
    configs.push('electronConfig');
  }

  // Testing plugins with file patterns (scoped to test files only)
  if (options.vitest) {
    imports.push('import vitest from "@vitest/eslint-plugin";');
    configs.push(
      '{\n    name: "vitest",\n    files: ["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}", "**/tests/**"],\n    plugins: { vitest },\n    languageOptions: {\n      globals: { ...vitest.environments.env.globals },\n    },\n    rules: { ...vitest.configs.recommended.rules },\n  }',
    );
  }

  // Always include Playwright - safeword sets up e2e testing with Playwright
  imports.push('import playwright from "eslint-plugin-playwright";');
  configs.push(
    '{\n    name: "playwright",\n    files: ["**/e2e/**", "**/*.e2e.{js,ts,jsx,tsx}", "**/playwright/**"],\n    ...playwright.configs["flat/recommended"],\n  }',
  );

  // Architecture boundaries (auto-generated config in .safeword/)
  if (options.boundaries) {
    imports.push('import boundariesConfig from "./.safeword/eslint-boundaries.config.mjs";');
    configs.push('boundariesConfig');
  }

  // eslint-config-prettier must be last to disable conflicting rules
  configs.push('eslintConfigPrettier');

  // Build the ignores string with proper formatting
  const ignoresStr = ignores.map((i) => `"${i}"`).join(', ');

  return `${imports.join('\n')}

export default defineConfig([
  // Global ignores (must have only ignores property to apply globally)
  { ignores: [${ignoresStr}] },
  ${configs.join(',\n  ')},
]);
`;
}

export const SETTINGS_HOOKS = {
  SessionStart: [
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/session-verify-agents.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/session-version.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/session-lint-check.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/session-sync-linters.sh',
        },
      ],
    },
  ],
  UserPromptSubmit: [
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/prompt-timestamp.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/prompt-questions.sh',
        },
      ],
    },
  ],
  Stop: [
    {
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/stop-quality.sh',
        },
      ],
    },
  ],
  PostToolUse: [
    {
      matcher: 'Write|Edit|MultiEdit|NotebookEdit',
      hooks: [
        {
          type: 'command',
          command: 'bash .safeword/hooks/post-tool-lint.sh',
        },
      ],
    },
  ],
};
