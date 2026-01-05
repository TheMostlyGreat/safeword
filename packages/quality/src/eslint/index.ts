/**
 * ESLint configs for @safeword/quality
 *
 * Re-exports all ESLint configurations from eslint-plugin-safeword.
 * This provides a unified entry point for quality tooling.
 */

// Re-export the default plugin (includes configs, detect, rules)
export { default } from "eslint-plugin-safeword";

// Re-export named configs for convenience
export {
  astroConfig,
  detect,
  playwrightConfig,
  recommended,
  recommendedTypeScript,
  recommendedTypeScriptNext,
  recommendedTypeScriptReact,
  tailwindConfig,
  tanstackQueryConfig,
  vitestConfig,
} from "eslint-plugin-safeword";
