/**
 * Configuration templates - ESLint config generation and hook settings
 *
 * ESLint flat config (v9+) with:
 * - Dynamic framework detection from package.json at runtime
 * - Static imports for base plugins (always installed by safeword)
 * - Dynamic imports for framework plugins (loaded only if framework detected)
 * - defineConfig helper for validation and type checking
 * - eslint-config-prettier last to avoid conflicts
 *
 * See: https://eslint.org/docs/latest/use/configure/configuration-files
 */

/**
 * Generates a dynamic ESLint config that adapts to project frameworks at runtime.
 *
 * The generated config reads package.json to detect frameworks and dynamically
 * imports the corresponding ESLint plugins. This allows the config to be generated
 * once at setup and automatically adapt when frameworks are added or removed.
 *
 * @param options.boundaries - Whether to include architecture boundaries config
 * @returns ESLint config file content as a string
 */
export function getEslintConfig(options: { boundaries?: boolean }): string {
  return `/* eslint-disable import-x/no-unresolved, no-undef -- dynamic imports for optional framework plugins, console used in tryImport */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import { importX } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import sonarjs from "eslint-plugin-sonarjs";
import sdl from "@microsoft/eslint-plugin-sdl";
import playwright from "eslint-plugin-playwright";
import unicorn from "eslint-plugin-unicorn";
import eslintConfigPrettier from "eslint-config-prettier";
${options.boundaries ? 'import boundariesConfig from "./.safeword/eslint-boundaries.config.mjs";' : ''}

// Read package.json relative to this config file (not CWD)
// This ensures correct detection in monorepos where lint-staged may run from subdirectories
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

// Helper for dynamic imports with actionable error messages
async function tryImport(pkgName, frameworkName) {
  try {
    return await import(pkgName);
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND") {
      console.error(\`\\n✗ Missing ESLint plugin for \${frameworkName}\\n\`);
      console.error(\`Your package.json has \${frameworkName} but the ESLint plugin is not installed.\`);
      console.error(\`Run: npm install -D \${pkgName}\\n\`);
      console.error(\`Or run: npx safeword sync\\n\`);
    }
    throw err;
  }
}

// Build dynamic ignores based on detected frameworks
const ignores = ["**/node_modules/", "**/dist/", "**/build/", "**/coverage/"];
if (deps["next"]) ignores.push(".next/");
if (deps["astro"]) ignores.push(".astro/");
if (deps["vue"] || deps["nuxt"]) ignores.push(".nuxt/");
if (deps["svelte"] || deps["@sveltejs/kit"]) ignores.push(".svelte-kit/");

// Start with base configs (always loaded)
const configs = [
  { ignores },
  js.configs.recommended,
  importX.flatConfigs.recommended,
  {
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
  },
  sonarjs.configs.recommended,
  ...sdl.configs.recommended,
  unicorn.configs["flat/recommended"],
  {
    // Unicorn overrides for LLM-generated code
    // Keep modern JS enforcement, disable overly pedantic rules
    rules: {
      "unicorn/prevent-abbreviations": "off", // ctx, dir, pkg, err are standard
      "unicorn/no-null": "off", // null is valid JS
      "unicorn/no-process-exit": "off", // CLI apps use process.exit
      "unicorn/import-style": "off", // Named imports are fine
      "unicorn/numeric-separators-style": "off", // Style preference
      "unicorn/text-encoding-identifier-case": "off", // utf-8 vs utf8
      "unicorn/switch-case-braces": "warn", // Good practice, not critical
      "unicorn/catch-error-name": "warn", // Reasonable, auto-fixable
      "unicorn/no-negated-condition": "off", // Sometimes clearer
      "unicorn/no-array-reduce": "off", // Reduce is fine when readable
      "unicorn/no-array-for-each": "off", // forEach is fine
      "unicorn/prefer-module": "off", // CJS still valid
    },
  },
];

// TypeScript support (detected from package.json)
if (deps["typescript"] || deps["typescript-eslint"]) {
  const tseslint = await tryImport("typescript-eslint", "TypeScript");
  configs.push(importX.flatConfigs.typescript);
  configs.push(...tseslint.default.configs.recommended);
}

// React/Next.js support
if (deps["react"] || deps["next"]) {
  const react = await tryImport("eslint-plugin-react", "React");
  const reactHooks = await tryImport("eslint-plugin-react-hooks", "React");
  const jsxA11y = await tryImport("eslint-plugin-jsx-a11y", "React");
  configs.push(react.default.configs.flat.recommended);
  configs.push(react.default.configs.flat["jsx-runtime"]);
  configs.push({
    name: "react-hooks",
    plugins: { "react-hooks": reactHooks.default },
    rules: reactHooks.default.configs.recommended.rules,
  });
  configs.push(jsxA11y.default.flatConfigs.recommended);
}

// Next.js plugin
if (deps["next"]) {
  const nextPlugin = await tryImport("@next/eslint-plugin-next", "Next.js");
  configs.push({
    name: "nextjs",
    plugins: { "@next/next": nextPlugin.default },
    rules: nextPlugin.default.configs.recommended.rules,
  });
}

// Astro support
if (deps["astro"]) {
  const astro = await tryImport("eslint-plugin-astro", "Astro");
  configs.push(...astro.default.configs.recommended);
}

// Vue support
if (deps["vue"] || deps["nuxt"]) {
  const vue = await tryImport("eslint-plugin-vue", "Vue");
  configs.push(...vue.default.configs["flat/recommended"]);
}

// Svelte support
if (deps["svelte"] || deps["@sveltejs/kit"]) {
  const svelte = await tryImport("eslint-plugin-svelte", "Svelte");
  configs.push(...svelte.default.configs.recommended);
}

// Electron support
if (deps["electron"]) {
  const electron = await tryImport("@electron-toolkit/eslint-config", "Electron");
  configs.push(electron.default);
}

// Vitest support (scoped to test files)
if (deps["vitest"]) {
  const vitest = await tryImport("@vitest/eslint-plugin", "Vitest");
  configs.push({
    name: "vitest",
    files: ["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}", "**/tests/**"],
    plugins: { vitest: vitest.default },
    languageOptions: {
      globals: { ...vitest.default.environments.env.globals },
    },
    rules: { ...vitest.default.configs.recommended.rules },
  });
}

// Playwright for e2e tests (always included - safeword sets up Playwright)
configs.push({
  name: "playwright",
  files: ["**/e2e/**", "**/*.e2e.{js,ts,jsx,tsx}", "**/playwright/**"],
  ...playwright.configs["flat/recommended"],
});

// Architecture boundaries${options.boundaries ? '\nconfigs.push(boundariesConfig);' : ''}

// eslint-config-prettier must be last to disable conflicting rules
configs.push(eslintConfigPrettier);

export default defineConfig(configs);
`;
}

// Cursor hooks configuration (.cursor/hooks.json format)
// See: https://cursor.com/docs/agent/hooks
export const CURSOR_HOOKS = {
  afterFileEdit: [{ command: './.safeword/hooks/cursor/after-file-edit.sh' }],
  stop: [{ command: './.safeword/hooks/cursor/stop.sh' }],
};

// Claude Code hooks configuration (.claude/settings.json format)
export const SETTINGS_HOOKS = {
  SessionStart: [
    {
      hooks: [
        {
          type: 'command',
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/session-verify-agents.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/session-version.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/session-lint-check.sh',
        },
      ],
    },
  ],
  UserPromptSubmit: [
    {
      hooks: [
        {
          type: 'command',
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/prompt-timestamp.sh',
        },
      ],
    },
    {
      hooks: [
        {
          type: 'command',
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/prompt-questions.sh',
        },
      ],
    },
  ],
  Stop: [
    {
      hooks: [
        {
          type: 'command',
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/stop-quality.sh',
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
          command: '"$CLAUDE_PROJECT_DIR"/.safeword/hooks/post-tool-lint.sh',
        },
      ],
    },
  ],
};
