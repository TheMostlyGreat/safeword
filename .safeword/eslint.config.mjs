// Safeword ESLint config - extends project config with stricter rules
// Used by hooks for LLM enforcement. Human pre-commits use project config.
// Re-run `safeword upgrade` to regenerate after project config changes.

let projectConfig = [];
try {
  projectConfig = (await import("../eslint.config.mjs")).default;
  // Ensure it's an array
  if (!Array.isArray(projectConfig)) {
    projectConfig = [projectConfig];
  }
} catch (e) {
  console.warn(
    "Safeword: Could not load project ESLint config, using defaults only",
  );
}

// Safeword strict rules - applied after project rules (win on conflict)
const safewordStrictRules = {
  rules: {
    // Prevent common LLM mistakes
    "no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "no-undef": "error",
    "no-unreachable": "error",
    "no-constant-condition": "error",
    "no-empty": "error",
    "no-extra-semi": "error",
    "no-func-assign": "error",
    "no-import-assign": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-loss-of-precision": "error",
    "no-misleading-character-class": "error",
    "no-prototype-builtins": "error",
    "no-unexpected-multiline": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
    // Strict code quality
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-var": "error",
    "prefer-const": "error",
  },
};

export default [...projectConfig, safewordStrictRules];
