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
 * the appropriate safeword config. Dynamic imports handle frameworks not
 * yet in the safeword plugin (Vue, Svelte, Electron).
 * @returns ESLint config file content as a string
 */
export function getEslintConfig(): string {
  return `/* eslint-disable import-x/no-unresolved, no-undef -- dynamic imports for optional framework plugins */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import safeword from "eslint-plugin-safeword";
import eslintConfigPrettier from "eslint-config-prettier";

// Read package.json relative to this config file (not CWD)
const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(nodePath.join(__dirname, "package.json"), "utf8"));
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

// Add test configs if testing frameworks detected
if (deps["vitest"]) {
  configs.push(...safeword.configs.vitest);
}
if (deps["playwright"] || deps["@playwright/test"]) {
  configs.push(...safeword.configs.playwright);
}

// Frameworks NOT in eslint-plugin-safeword (dynamic imports)
if (deps["vue"] || deps["nuxt"]) {
  const vue = await tryImport("eslint-plugin-vue", "Vue");
  configs.push(...vue.default.configs["flat/recommended"]);
}

if (deps["svelte"] || deps["@sveltejs/kit"]) {
  const svelte = await tryImport("eslint-plugin-svelte", "Svelte");
  configs.push(...svelte.default.configs.recommended);
}

if (deps["electron"]) {
  const electron = await tryImport("@electron-toolkit/eslint-config", "Electron");
  configs.push(electron.default);
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
