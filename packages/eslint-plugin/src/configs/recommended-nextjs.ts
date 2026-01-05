/**
 * Recommended ESLint configuration for Next.js + TypeScript + LLM coding agents
 *
 * Extends the React config with Next.js-specific rules:
 * - @next/eslint-plugin-next: Framework rules (Image, Link, Head, etc.)
 *
 * Philosophy: LLMs make Next.js-specific mistakes. All rules at error severity.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- ESLint config types are incompatible across plugin packages */

import nextPlugin from "@next/eslint-plugin-next";

import { recommendedTypeScriptReact } from "./recommended-react.js";

/**
 * Next.js + TypeScript recommended config
 *
 * Extends React config with Next.js-specific rules for catching
 * common LLM mistakes: using <img> instead of <Image>, <a> instead of <Link>.
 */
export const recommendedTypeScriptNext: any[] = [
  // All React + TypeScript rules
  ...recommendedTypeScriptReact,

  // Next.js plugin with core-web-vitals config (stricter)
  nextPlugin.configs["core-web-vitals"],

  // Escalate ALL remaining warn rules to error (LLMs ignore warnings)
  {
    name: "safeword/nextjs-rules",
    rules: {
      "@next/next/google-font-display": "error",
      "@next/next/google-font-preconnect": "error",
      "@next/next/next-script-for-ga": "error",
      "@next/next/no-async-client-component": "error",
      "@next/next/no-before-interactive-script-outside-document": "error",
      "@next/next/no-css-tags": "error",
      "@next/next/no-head-element": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-page-custom-font": "error",
      "@next/next/no-styled-jsx-in-document": "error",
      "@next/next/no-title-in-document-head": "error",
      "@next/next/no-typos": "error",
      "@next/next/no-unwanted-polyfillio": "error",
    },
  },
];
