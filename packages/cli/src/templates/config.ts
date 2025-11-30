/**
 * Configuration templates - ESLint config generation and hook settings
 */

export function getEslintConfig(options: {
  typescript?: boolean;
  react?: boolean;
  nextjs?: boolean;
  astro?: boolean;
}): string {
  const imports: string[] = ['import js from "@eslint/js";'];
  const configs: string[] = ['js.configs.recommended'];

  if (options.typescript) {
    imports.push('import tseslint from "typescript-eslint";');
    configs.push('...tseslint.configs.recommended');
  }

  if (options.react || options.nextjs) {
    imports.push('import react from "eslint-plugin-react";');
    imports.push('import reactHooks from "eslint-plugin-react-hooks";');
    configs.push('react.configs.flat.recommended');
    configs.push('react.configs.flat["jsx-runtime"]');
    configs.push(
      '{ plugins: { "react-hooks": reactHooks }, rules: reactHooks.configs.recommended.rules }',
    );
  }

  if (options.astro) {
    imports.push('import eslintPluginAstro from "eslint-plugin-astro";');
    configs.push('...eslintPluginAstro.configs.recommended');
  }

  return `${imports.join('\n')}

export default [
  ${configs.join(',\n  ')},
  {
    ignores: ["node_modules/", "dist/", ".next/", ".astro/", "build/"],
  },
];
`;
}

export const SETTINGS_HOOKS = {
  SessionStart: [
    {
      command: 'bash .safeword/hooks/agents-md-check.sh',
      description: 'Safeword: Verify AGENTS.md link',
    },
  ],
  UserPromptSubmit: [
    {
      command: 'bash .safeword/hooks/inject-timestamp.sh',
      description: 'Safeword: Inject current timestamp',
    },
  ],
  PostToolUse: [
    {
      command: 'bash .safeword/hooks/post-tool.sh 2>/dev/null || true',
      description: 'Safeword: Post-tool validation',
    },
  ],
};
