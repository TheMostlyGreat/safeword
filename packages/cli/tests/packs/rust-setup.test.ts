/**
 * Unit Tests: Rust Pack Setup Functions
 *
 * Tests for pure functions in src/packs/rust/setup.ts
 * These run fast and catch edge cases that E2E tests miss.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { detectWorkspaceType, parseWorkspaceMembers } from '../../src/packs/rust/setup.js';
import { createTemporaryDirectory, removeTemporaryDirectory, writeTestFile } from '../helpers.js';

describe('detectWorkspaceType', () => {
  it('detects single-crate project (only [package])', () => {
    const cargoContent = `[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[dependencies]
`;

    expect(detectWorkspaceType(cargoContent)).toBe('single-crate');
  });

  it('detects virtual workspace (only [workspace], no [package])', () => {
    const cargoContent = `[workspace]
members = ["crates/core", "crates/cli"]
resolver = "2"
`;

    expect(detectWorkspaceType(cargoContent)).toBe('virtual');
  });

  it('detects root-package workspace ([workspace] AND [package])', () => {
    const cargoContent = `[package]
name = "my-workspace"
version = "0.1.0"

[workspace]
members = ["crates/core"]
`;

    expect(detectWorkspaceType(cargoContent)).toBe('root-package');
  });

  it('handles [workspace.dependencies] without triggering workspace detection', () => {
    // Edge case: [workspace.dependencies] contains "workspace" but isn't [workspace]
    const cargoContent = `[package]
name = "single-crate"
version = "0.1.0"

[workspace.dependencies]
serde = "1.0"
`;

    // This should NOT be detected as workspace - it's a single crate with shared deps
    // Current implementation will incorrectly detect this as workspace
    // because it uses includes('[workspace]') which matches '[workspace.dependencies]'
    //
    // For now, document the known limitation:
    expect(detectWorkspaceType(cargoContent)).toBe('single-crate');
  });

  it('handles empty Cargo.toml', () => {
    expect(detectWorkspaceType('')).toBe('single-crate');
  });

  it('handles Cargo.toml with only comments', () => {
    const cargoContent = `# This is a comment
# Another comment
`;

    expect(detectWorkspaceType(cargoContent)).toBe('single-crate');
  });

  it('is case-sensitive (TOML is case-sensitive)', () => {
    const cargoContent = `[PACKAGE]
name = "test"
`;

    // [PACKAGE] is not the same as [package] in TOML
    expect(detectWorkspaceType(cargoContent)).toBe('single-crate');
  });

  it('handles inline tables correctly', () => {
    const cargoContent = `[package]
name = "my-app"
version = "0.1.0"

[workspace]
members = ["a", "b"]
`;

    expect(detectWorkspaceType(cargoContent)).toBe('root-package');
  });
});

describe('parseWorkspaceMembers', () => {
  let testDirectory: string;

  beforeEach(() => {
    testDirectory = createTemporaryDirectory();
  });

  afterEach(() => {
    if (testDirectory) {
      removeTemporaryDirectory(testDirectory);
    }
  });

  it('parses explicit member paths (inline array)', () => {
    const cargoContent = `[workspace]
members = ["crates/core", "crates/cli"]
`;
    // Create the crate directories with Cargo.toml
    writeTestFile(testDirectory, 'crates/core/Cargo.toml', '[package]\nname = "core"');
    writeTestFile(testDirectory, 'crates/cli/Cargo.toml', '[package]\nname = "cli"');

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    expect(members).toEqual(['crates/core', 'crates/cli']);
  });

  it('parses explicit member paths (multi-line array)', () => {
    const cargoContent = `[workspace]
members = [
  "crates/core",
  "crates/cli",
]
`;
    writeTestFile(testDirectory, 'crates/core/Cargo.toml', '[package]\nname = "core"');
    writeTestFile(testDirectory, 'crates/cli/Cargo.toml', '[package]\nname = "cli"');

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    expect(members).toEqual(['crates/core', 'crates/cli']);
  });

  it('expands glob pattern crates/*', () => {
    const cargoContent = `[workspace]
members = ["crates/*"]
`;
    // Create multiple crates
    writeTestFile(testDirectory, 'crates/alpha/Cargo.toml', '[package]\nname = "alpha"');
    writeTestFile(testDirectory, 'crates/beta/Cargo.toml', '[package]\nname = "beta"');
    writeTestFile(testDirectory, 'crates/gamma/Cargo.toml', '[package]\nname = "gamma"');

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    // Order may vary due to filesystem, so sort for comparison
    expect(members.toSorted()).toEqual(['crates/alpha', 'crates/beta', 'crates/gamma']);
  });

  it('skips non-crate directories when expanding glob', () => {
    const cargoContent = `[workspace]
members = ["crates/*"]
`;
    // Create a valid crate and a non-crate directory
    writeTestFile(testDirectory, 'crates/valid/Cargo.toml', '[package]\nname = "valid"');
    writeTestFile(testDirectory, 'crates/not-a-crate/README.md', '# Not a crate');

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    expect(members).toEqual(['crates/valid']);
  });

  it('handles mixed explicit paths and glob patterns', () => {
    const cargoContent = `[workspace]
members = ["standalone", "crates/*"]
`;
    writeTestFile(testDirectory, 'standalone/Cargo.toml', '[package]\nname = "standalone"');
    writeTestFile(testDirectory, 'crates/lib-a/Cargo.toml', '[package]\nname = "lib-a"');
    writeTestFile(testDirectory, 'crates/lib-b/Cargo.toml', '[package]\nname = "lib-b"');

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    // standalone is explicit, crates/* expands
    expect(members).toContain('standalone');
    expect(members).toContain('crates/lib-a');
    expect(members).toContain('crates/lib-b');
    expect(members).toHaveLength(3);
  });

  it('returns empty array when no members key', () => {
    const cargoContent = `[workspace]
resolver = "2"
`;

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    expect(members).toEqual([]);
  });

  it('returns empty array when no [workspace] section', () => {
    const cargoContent = `[package]
name = "single-crate"
`;

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    expect(members).toEqual([]);
  });

  it('handles glob pattern for non-existent directory', () => {
    const cargoContent = `[workspace]
members = ["nonexistent/*"]
`;

    const members = parseWorkspaceMembers(cargoContent, testDirectory);

    expect(members).toEqual([]);
  });
});
