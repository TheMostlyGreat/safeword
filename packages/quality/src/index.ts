/**
 * @safeword/quality
 *
 * Multi-language code quality configs and runners.
 * Consolidates ESLint, depcruise, knip, jscpd, ruff configs.
 */

// Detection - re-export from eslint-plugin-safeword (single source of truth)
export { detect } from "eslint-plugin-safeword";

// Tools
export * from "./tools/depcruise.js";
