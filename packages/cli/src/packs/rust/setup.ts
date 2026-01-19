/**
 * Rust language pack setup
 *
 * Handles Rust-specific setup logic including:
 * - Cargo.toml [lints.clippy] merge
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import nodePath from 'node:path';

import type { SetupResult } from '../types.js';

// Default lint configuration for Cargo.toml
const SAFEWORD_CLIPPY_LINTS = `[lints.clippy]
# Enable pedantic for stricter linting (priority -1 allows individual overrides)
pedantic = { level = "warn", priority = -1 }

# Cherry-picked restriction lints for LLM enforcement
unwrap_used = "warn"
expect_used = "warn"
todo = "warn"

# Allow common pedantic noise
missing_errors_doc = "allow"
missing_panics_doc = "allow"
module_name_repetitions = "allow"

[lints.rust]
# Deny unsafe code by default (LLMs shouldn't write unsafe)
unsafe_code = "deny"
`;

const SAFEWORD_WORKSPACE_LINTS = `[workspace.lints.clippy]
# Enable pedantic for stricter linting (priority -1 allows individual overrides)
pedantic = { level = "warn", priority = -1 }

# Cherry-picked restriction lints for LLM enforcement
unwrap_used = "warn"
expect_used = "warn"
todo = "warn"

# Allow common pedantic noise
missing_errors_doc = "allow"
missing_panics_doc = "allow"
module_name_repetitions = "allow"

[workspace.lints.rust]
# Deny unsafe code by default (LLMs shouldn't write unsafe)
unsafe_code = "deny"
`;

/**
 * Detect workspace type from Cargo.toml content
 */
export function detectWorkspaceType(
  cargoContent: string,
): 'virtual' | 'root-package' | 'single-crate' {
  const hasWorkspace = cargoContent.includes('[workspace]');
  const hasPackage = cargoContent.includes('[package]');

  if (hasWorkspace && !hasPackage) return 'virtual';
  if (hasWorkspace && hasPackage) return 'root-package';
  return 'single-crate';
}

/**
 * Check if Cargo.toml already has lint configuration
 */
function hasExistingLints(cargoContent: string): boolean {
  return (
    cargoContent.includes('[lints.clippy]') ||
    cargoContent.includes('[lints.rust]') ||
    cargoContent.includes('[workspace.lints.clippy]') ||
    cargoContent.includes('[workspace.lints.rust]')
  );
}

/**
 * Merge lint configuration into Cargo.toml
 */
function mergeCargoLints(cwd: string): void {
  const cargoPath = nodePath.join(cwd, 'Cargo.toml');
  if (!existsSync(cargoPath)) return;

  const content = readFileSync(cargoPath, 'utf8');

  // Don't modify if lints already exist
  if (hasExistingLints(content)) return;

  const workspaceType = detectWorkspaceType(content);

  // Add appropriate lint section
  const lintsToAdd =
    workspaceType === 'single-crate' ? SAFEWORD_CLIPPY_LINTS : SAFEWORD_WORKSPACE_LINTS;

  const newContent = `${content.trimEnd()}\n\n${lintsToAdd}`;
  writeFileSync(cargoPath, newContent, 'utf8');
}

/**
 * Set up Rust tooling configuration.
 *
 * @param cwd - Project root directory
 * @returns Setup result
 */
export function setupRustTooling(cwd: string): SetupResult {
  // Merge lint configuration into Cargo.toml
  mergeCargoLints(cwd);

  return { files: [] };
}
