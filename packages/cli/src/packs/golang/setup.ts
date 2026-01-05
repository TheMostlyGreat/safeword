/**
 * Go-specific Setup Utilities
 *
 * Setup logic for Go projects.
 * Config generators are in files.ts (same pattern as TypeScript and Python).
 *
 * Future: Layer detection for depguard import rules.
 */

import type { SetupResult } from "../types.js";

/**
 * Set up Go tooling configuration.
 *
 * Note: .golangci.yml is now created by the schema system (managedFiles).
 * This function exists for future Go-specific setup (layer detection).
 *
 * @returns Empty result (schema handles file creation)
 */
export function setupGoTooling(): SetupResult {
  // .golangci.yml is created by schema.ts managedFiles
  // Future: Add layer detection for depguard rules here
  return { files: [] };
}
