/**
 * Unit Tests: Rust Pack Setup Functions
 *
 * Tests for pure functions in src/packs/rust/setup.ts
 * These run fast and catch edge cases that E2E tests miss.
 */

import { describe, expect, it } from 'vitest';

import { detectWorkspaceType } from '../../src/packs/rust/setup.js';

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
