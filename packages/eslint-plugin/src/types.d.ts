// Type declarations for ESLint plugins without their own types

declare module 'eslint-plugin-promise' {
  import type { ESLint, Linter } from 'eslint';
  const plugin: ESLint.Plugin & {
    configs: {
      'flat/recommended': Linter.Config;
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-security' {
  import type { ESLint, Linter } from 'eslint';
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-better-tailwindcss' {
  import type { ESLint } from 'eslint';
  const plugin: ESLint.Plugin & {
    configs: Record<string, { rules: Record<string, unknown> }>;
  };
  export default plugin;
}
