/**
 * Configuration templates - ESLint config generation and hook settings
 *
 * ESLint flat config (v9+) using eslint-plugin-safeword for all rules.
 * Framework detection uses safeword.detect utilities at runtime.
 *
 * See: https://eslint.org/docs/latest/use/configure/configuration-files
 */

/**
 * Generates an ESLint config using eslint-plugin-safeword.
 *
 * The generated config uses safeword.detect utilities to detect frameworks
 * and select the appropriate config at lint time.
 * @param hasExistingFormatter - If true, generates a minimal config without Prettier
 * @returns ESLint config file content as a string
 */
export function getEslintConfig(hasExistingFormatter = false): string {
  if (hasExistingFormatter) {
    return getFormatterAgnosticEslintConfig();
  }
  return getStandardEslintConfig();
}

/**
 * Standard ESLint config - full linting with Prettier
 */
function getStandardEslintConfig(): string {
  return `import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import safeword from "eslint-plugin-safeword";
import eslintConfigPrettier from "eslint-config-prettier";

const { detect, configs } = safeword;
const __dirname = dirname(fileURLToPath(import.meta.url));
const deps = detect.collectAllDeps(__dirname);
const framework = detect.detectFramework(deps);

// Map framework to base config
// Note: Astro config only lints .astro files, so we combine it with TypeScript config
// to also lint .ts files in Astro projects
const baseConfigs = {
  next: configs.recommendedTypeScriptNext,
  react: configs.recommendedTypeScriptReact,
  astro: [...configs.recommendedTypeScript, ...configs.astro],
  typescript: configs.recommendedTypeScript,
  javascript: configs.recommended,
};

export default [
  { ignores: detect.getIgnores(deps) },
  ...baseConfigs[framework],
  ...(detect.hasVitest(deps) ? configs.vitest : []),
  ...(detect.hasPlaywright(deps) ? configs.playwright : []),
  ...(detect.hasTailwind(deps) ? configs.tailwind : []),
  ...(detect.hasTanstackQuery(deps) ? configs.tanstackQuery : []),
  eslintConfigPrettier,
];
`;
}

/**
 * Formatter-agnostic ESLint config - minimal config for projects with existing formatter.
 * Used alongside external formatters (Biome, dprint, etc.) that handle formatting.
 * Does not include eslint-config-prettier since another tool handles formatting.
 */
function getFormatterAgnosticEslintConfig(): string {
  return `import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import safeword from "eslint-plugin-safeword";

const { detect, configs } = safeword;
const __dirname = dirname(fileURLToPath(import.meta.url));
const deps = detect.collectAllDeps(__dirname);
const framework = detect.detectFramework(deps);

// Map framework to base config
// Note: Astro config only lints .astro files, so we combine it with TypeScript config
// to also lint .ts files in Astro projects
const baseConfigs = {
  next: configs.recommendedTypeScriptNext,
  react: configs.recommendedTypeScriptReact,
  astro: [...configs.recommendedTypeScript, ...configs.astro],
  typescript: configs.recommendedTypeScript,
  javascript: configs.recommended,
};

export default [
  { ignores: detect.getIgnores(deps) },
  ...baseConfigs[framework],
  ...(detect.hasVitest(deps) ? configs.vitest : []),
  ...(detect.hasPlaywright(deps) ? configs.playwright : []),
  ...(detect.hasTailwind(deps) ? configs.tailwind : []),
  ...(detect.hasTanstackQuery(deps) ? configs.tanstackQuery : []),
];
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
