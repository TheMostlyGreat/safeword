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
    cargoContent.includes('[lints]') ||
    cargoContent.includes('[workspace.lints.clippy]') ||
    cargoContent.includes('[workspace.lints.rust]')
  );
}

/**
 * Parse workspace members from Cargo.toml
 * Supports both inline array and multi-line formats:
 * - members = ["crates/a", "crates/b"]
 * - members = [\n  "crates/a",\n  "crates/b"\n]
 */
function parseWorkspaceMembers(cargoContent: string): string[] {
  // Match members = [...] with potential multi-line content
  const membersMatch = /\[workspace\][^[]*members\s*=\s*\[([\s\S]*?)\]/.exec(cargoContent);
  if (!membersMatch) return [];

  const membersBlock = membersMatch[1];
  // Extract quoted strings
  const members: string[] = [];
  const stringRegex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = stringRegex.exec(membersBlock)) !== null) {
    members.push(match[1]);
  }
  return members;
}

/**
 * Add [lints] workspace = true to a member crate's Cargo.toml
 */
function addWorkspaceLints(memberCargoPath: string): void {
  if (!existsSync(memberCargoPath)) return;

  const content = readFileSync(memberCargoPath, 'utf8');

  // Skip if already has any lints configuration
  if (hasExistingLints(content)) return;

  const lintsSection = `[lints]
workspace = true
`;

  const newContent = `${content.trimEnd()}\n\n${lintsSection}`;
  writeFileSync(memberCargoPath, newContent, 'utf8');
}

/**
 * Add lint configuration to root Cargo.toml if not present
 */
function addRootLints(cargoPath: string, content: string, isWorkspace: boolean): void {
  if (hasExistingLints(content)) return;

  const lintsToAdd = isWorkspace ? SAFEWORD_WORKSPACE_LINTS : SAFEWORD_CLIPPY_LINTS;
  const newContent = `${content.trimEnd()}\n\n${lintsToAdd}`;
  writeFileSync(cargoPath, newContent, 'utf8');
}

/**
 * Add lints.workspace = true to all workspace member crates
 */
function addMemberLints(cwd: string, content: string): void {
  const members = parseWorkspaceMembers(content);
  for (const member of members) {
    const memberCargoPath = nodePath.join(cwd, member, 'Cargo.toml');
    addWorkspaceLints(memberCargoPath);
  }
}

/**
 * Set up Rust tooling configuration.
 *
 * @param cwd - Project root directory
 * @returns Setup result
 */
export function setupRustTooling(cwd: string): SetupResult {
  const cargoPath = nodePath.join(cwd, 'Cargo.toml');
  if (!existsSync(cargoPath)) return { files: [] };

  // Read Cargo.toml once
  const content = readFileSync(cargoPath, 'utf8');
  const workspaceType = detectWorkspaceType(content);
  const isWorkspace = workspaceType !== 'single-crate';

  // Add lint configuration to root
  addRootLints(cargoPath, content, isWorkspace);

  // For workspaces, add lints.workspace = true to member crates
  if (isWorkspace) {
    addMemberLints(cwd, content);
  }

  return { files: [] };
}
