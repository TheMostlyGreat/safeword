/**
 * Tests for React ESLint config - Story 7: React Support
 *
 * Verifies that the React config:
 * - Loads without errors
 * - Includes react, react-hooks, and jsx-a11y plugins
 * - Has correct rule severities configured
 */

import { describe, expect, it } from "vitest";

import { recommendedTypeScriptReact } from "../recommended-react.js";
import { getRuleConfig, getSeverityNumber } from "./test-utilities.js";

const ERROR = 2;

describe("recommendedTypeScriptReact config", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(recommendedTypeScriptReact)).toBe(true);
    expect(recommendedTypeScriptReact.length).toBeGreaterThan(0);
  });

  it("includes react-hooks plugin", () => {
    const hasReactHooks = recommendedTypeScriptReact.some(
      (config) =>
        typeof config === "object" &&
        config !== null &&
        "plugins" in config &&
        config.plugins &&
        "react-hooks" in config.plugins,
    );
    expect(hasReactHooks).toBe(true);
  });
});

describe("React hook rules (config severity)", () => {
  it("react-hooks/rules-of-hooks is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "react-hooks/rules-of-hooks",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("react-hooks/exhaustive-deps is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "react-hooks/exhaustive-deps",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });
});

describe("React JSX rules (config severity)", () => {
  it("react/jsx-key is at error severity", () => {
    const config = getRuleConfig(recommendedTypeScriptReact, "react/jsx-key");
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("react/jsx-no-duplicate-props is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "react/jsx-no-duplicate-props",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("react/no-direct-mutation-state is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "react/no-direct-mutation-state",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("react/prop-types is off (TypeScript handles this)", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "react/prop-types",
    );
    expect(getSeverityNumber(config)).toBe(0);
  });

  it("react/react-in-jsx-scope is off (React 17+)", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "react/react-in-jsx-scope",
    );
    expect(getSeverityNumber(config)).toBe(0);
  });
});

describe("Accessibility rules (jsx-a11y)", () => {
  it("includes jsx-a11y plugin", () => {
    const hasJsxA11y = recommendedTypeScriptReact.some(
      (config) =>
        typeof config === "object" &&
        config !== null &&
        "plugins" in config &&
        config.plugins &&
        "jsx-a11y" in config.plugins,
    );
    expect(hasJsxA11y).toBe(true);
  });

  it("jsx-a11y/alt-text is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "jsx-a11y/alt-text",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("jsx-a11y/anchor-is-valid is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "jsx-a11y/anchor-is-valid",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("jsx-a11y/aria-role is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "jsx-a11y/aria-role",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });

  it("jsx-a11y/no-autofocus is at error severity", () => {
    const config = getRuleConfig(
      recommendedTypeScriptReact,
      "jsx-a11y/no-autofocus",
    );
    expect(getSeverityNumber(config)).toBe(ERROR);
  });
});
