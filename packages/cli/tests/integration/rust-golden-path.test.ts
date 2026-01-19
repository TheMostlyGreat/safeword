/**
 * E2E Test: Rust Golden Path
 *
 * Verifies that a Rust project with safeword works correctly:
 * - clippy.toml config is created (project root + .safeword/)
 * - rustfmt.toml config is created (project root + .safeword/)
 * - Cargo.toml gets [lints.clippy] section merged
 * - cargo clippy runs and catches issues (when installed)
 * - rustfmt formats Rust files (when installed)
 *
 * Note: Tests requiring clippy/rustfmt are skipped if not installed.
 * Uses a single project setup (expensive) shared across all tests.
 */

import { spawnSync } from 'node:child_process';
import nodePath from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createRustProject,
  createTemporaryDirectory,
  fileExists,
  initGitRepo,
  isClippyInstalled,
  readTestFile,
  removeTemporaryDirectory,
  runCli,
  runLintHook,
  writeTestFile,
} from '../helpers';

const CLIPPY_AVAILABLE = isClippyInstalled();

describe('E2E: Rust Golden Path', () => {
  let projectDirectory: string;

  beforeAll(async () => {
    projectDirectory = createTemporaryDirectory();
    createRustProject(projectDirectory);
    initGitRepo(projectDirectory);
    await runCli(['setup', '--yes'], { cwd: projectDirectory });
  }, 180_000); // 3 min timeout for setup

  afterAll(() => {
    if (projectDirectory) {
      removeTemporaryDirectory(projectDirectory);
    }
  });

  // Scenario 1: Single-crate Rust project setup
  it('creates clippy.toml at project root', () => {
    expect(fileExists(projectDirectory, 'clippy.toml')).toBe(true);

    const config = readTestFile(projectDirectory, 'clippy.toml');
    expect(config).toContain('cognitive-complexity-threshold');
    expect(config).toContain('too-many-arguments-threshold');
  });

  it('creates .safeword/clippy.toml', () => {
    expect(fileExists(projectDirectory, '.safeword/clippy.toml')).toBe(true);

    const config = readTestFile(projectDirectory, '.safeword/clippy.toml');
    expect(config).toContain('cognitive-complexity-threshold = 10');
    expect(config).toContain('too-many-arguments-threshold = 5');
  });

  it('creates rustfmt.toml at project root', () => {
    expect(fileExists(projectDirectory, 'rustfmt.toml')).toBe(true);

    const config = readTestFile(projectDirectory, 'rustfmt.toml');
    expect(config).toContain('edition');
    expect(config).toContain('max_width');
  });

  it('creates .safeword/rustfmt.toml', () => {
    expect(fileExists(projectDirectory, '.safeword/rustfmt.toml')).toBe(true);

    const config = readTestFile(projectDirectory, '.safeword/rustfmt.toml');
    expect(config).toContain('edition = "2021"');
    expect(config).toContain('max_width = 100');
    expect(config).toContain('newline_style = "Unix"');
  });

  it('merges [lints.clippy] into Cargo.toml', () => {
    const cargoToml = readTestFile(projectDirectory, 'Cargo.toml');

    // Check for [lints.clippy] section with pedantic enabled
    expect(cargoToml).toContain('[lints.clippy]');
    expect(cargoToml).toContain('pedantic');

    // Check for [lints.rust] section with unsafe_code denied
    expect(cargoToml).toContain('[lints.rust]');
    expect(cargoToml).toContain('unsafe_code');
  });

  it.skipIf(!CLIPPY_AVAILABLE)('clippy config is valid', () => {
    // cargo clippy should run without config errors
    const result = spawnSync('cargo', ['clippy', '--', '--version'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    // Just checking it doesn't error on config parsing
    expect(result.status).toBe(0);
  });

  it.skipIf(!CLIPPY_AVAILABLE)('clippy runs on valid code', () => {
    // main.rs from createRustProject should be valid
    const result = spawnSync('cargo', ['clippy'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
  });

  it.skipIf(!CLIPPY_AVAILABLE)('clippy detects unwrap_used violation', () => {
    writeTestFile(
      projectDirectory,
      'src/bad.rs',
      `fn bad() {
    let x: Option<i32> = Some(5);
    let _y = x.unwrap(); // clippy::unwrap_used should trigger
}
`,
    );

    // Run clippy with deny on unwrap_used (our config has it as warn)
    const result = spawnSync('cargo', ['clippy', '--', '-D', 'clippy::unwrap_used'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toMatch(/unwrap_used|unwrap/i);
  });

  it.skipIf(!CLIPPY_AVAILABLE)('rustfmt formats files', () => {
    writeTestFile(projectDirectory, 'src/ugly.rs', `fn main(){println!("no spaces")}`);

    spawnSync('rustfmt', ['src/ugly.rs'], { cwd: projectDirectory });

    const formatted = readTestFile(projectDirectory, 'src/ugly.rs');
    expect(formatted).toContain('fn main() {');
  });

  it.skipIf(!CLIPPY_AVAILABLE)('lint hook processes .rs files', () => {
    const filePath = nodePath.join(projectDirectory, 'src/hook-test.rs');
    writeTestFile(projectDirectory, 'src/hook-test.rs', `fn hook_test(){println!("test")}`);

    runLintHook(projectDirectory, filePath);

    const result = readTestFile(projectDirectory, 'src/hook-test.rs');
    expect(result).toContain('fn hook_test() {');
  });
});
