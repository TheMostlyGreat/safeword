/**
 * @safeword/quality
 *
 * Multi-language code quality configs and runners.
 * Consolidates ESLint, depcruise, knip, jscpd, ruff configs.
 */

// Re-export ESLint configs
export * from "./eslint/index.js";

// Detection
export { detect } from "./detection/index.js";

// Tools (to be added)
// export * from "./tools/index.js";
