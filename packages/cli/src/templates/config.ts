/**
 * Configuration templates - ESLint config generation and hook settings
 *
 * ESLint flat config (v9+) using eslint-plugin-safeword for all rules.
 * Framework detection from package.json at runtime selects the appropriate config.
 *
 * See: https://eslint.org/docs/latest/use/configure/configuration-files
 */

/**
 * Generates an ESLint config using eslint-plugin-safeword.
 *
 * The generated config reads package.json to detect frameworks and selects
 * the appropriate safeword config.
 * @returns ESLint config file content as a string
 */
export function getEslintConfig(): string {
  return `import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import safeword from "eslint-plugin-safeword";
import eslintConfigPrettier from "eslint-config-prettier";

// Read package.json relative to this config file (not CWD)
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

// Build dynamic ignores based on detected frameworks
const ignores = ["**/node_modules/", "**/dist/", "**/build/", "**/coverage/"];
if (deps["next"]) ignores.push(".next/");
if (deps["astro"]) ignores.push(".astro/");

// Select appropriate safeword config based on detected framework
// Order matters: most specific first
let baseConfig;
if (deps["next"]) {
  baseConfig = safeword.configs.recommendedTypeScriptNext;
} else if (deps["react"]) {
  baseConfig = safeword.configs.recommendedTypeScriptReact;
} else if (deps["astro"]) {
  baseConfig = safeword.configs.astro;
} else if (deps["typescript"] || deps["typescript-eslint"]) {
  baseConfig = safeword.configs.recommendedTypeScript;
} else {
  baseConfig = safeword.configs.recommended;
}

// Start with ignores + safeword config
const configs = [
  { ignores },
  ...baseConfig,
];

// Add configs for detected tools/frameworks
if (deps["vitest"]) {
  configs.push(...safeword.configs.vitest);
}
if (deps["playwright"] || deps["@playwright/test"]) {
  configs.push(...safeword.configs.playwright);
}
if (deps["tailwindcss"]) {
  configs.push(...safeword.configs.tailwind);
}
if (deps["@tanstack/react-query"] || deps["@tanstack/vue-query"] || deps["@tanstack/solid-query"] || deps["@tanstack/svelte-query"] || deps["@tanstack/angular-query-experimental"]) {
  configs.push(...safeword.configs.tanstackQuery);
}

// eslint-config-prettier must be last to disable conflicting rules
configs.push(eslintConfigPrettier);

export default configs;
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
