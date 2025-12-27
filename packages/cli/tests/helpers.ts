import { exec, execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Timeout constants for test operations.
 * Centralized to ensure consistency and easy adjustment.
 */
/** Quick operations that don't spawn processes (10s) */
export const TIMEOUT_QUICK = 10_000;
/** Sync CLI operations without npm install (30s) */
export const TIMEOUT_SYNC = 30_000;
/** Setup commands that may run npm install with warm cache (60s) */
export const TIMEOUT_SETUP = 60_000;
/** npm install operations under load or cold cache (120s) */
export const TIMEOUT_NPM_INSTALL = 120_000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename);

/**
 * Path to the CLI entry point (built)
 */
export const CLI_PATH = nodePath.join(__dirname, '../dist/cli.js');

/**
 * Path to the local eslint-plugin-safeword package (for file: references in tests)
 */
export const ESLINT_PLUGIN_PATH = nodePath.join(__dirname, '../../eslint-plugin');

/**
 * eslint-plugin-safeword reference for test package.json files.
 * Uses file: protocol to install the local built package instead of from npm.
 * This ensures tests run against the current source code.
 */
export const ESLINT_PLUGIN_VERSION = `file:${ESLINT_PLUGIN_PATH}`;

/**
 * Path to the CLI source (for ts-node execution during development)
 */
export const CLI_SRC_PATH = nodePath.join(__dirname, '../src/cli.ts');

/**
 * Creates a temporary directory for test isolation
 */
export function createTemporaryDirectory(): string {
  return mkdtempSync(nodePath.join(tmpdir(), 'safeword-test-'));
}

/**
 * Removes a temporary directory and all contents.
 * Uses rmSync's built-in retry for ENOTEMPTY/EBUSY errors from
 * npm/git processes that haven't released file handles.
 * Wrapped in try-catch to prevent cleanup failures from cascading to test failures.
 * @param dir
 */
export function removeTemporaryDirectory(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch {
    // Ignore cleanup failures - OS will clean temp directory eventually
    // This prevents ENOTEMPTY race conditions from failing tests
  }
}

/**
 * Creates a minimal package.json in the given directory
 * @param dir
 * @param overrides
 */
export function createPackageJson(dir: string, overrides: Record<string, unknown> = {}): void {
  const pkg = {
    name: 'test-project',
    version: '1.0.0',
    ...overrides,
  };
  writeFileSync(nodePath.join(dir, 'package.json'), JSON.stringify(pkg, undefined, 2));
}

/**
 * Creates a TypeScript package.json (with typescript in devDependencies)
 * @param dir
 * @param overrides
 */
export function createTypeScriptPackageJson(
  dir: string,
  overrides: Record<string, unknown> = {},
): void {
  createPackageJson(dir, {
    devDependencies: {
      typescript: '^5.0.0',
    },
    ...overrides,
  });
}

/**
 * Creates a React package.json
 * @param dir
 * @param overrides
 */
export function createReactPackageJson(dir: string, overrides: Record<string, unknown> = {}): void {
  createPackageJson(dir, {
    dependencies: {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    },
    ...overrides,
  });
}

/**
 * Creates a Next.js package.json
 * @param dir
 * @param overrides
 */
export function createNextJsPackageJson(
  dir: string,
  overrides: Record<string, unknown> = {},
): void {
  createPackageJson(dir, {
    dependencies: {
      next: '^14.0.0',
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    },
    ...overrides,
  });
}

/**
 * Result from running the CLI
 */
export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Runs the CLI with the given arguments in the specified directory
 * Uses built CLI (dist/cli.js)
 * @param args
 * @param options
 * @param options.cwd
 * @param options.input
 * @param options.env
 * @param options.timeout
 */
export async function runCli(
  args: string[],
  options: {
    cwd?: string;
    input?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {},
): Promise<CliResult> {
  const { cwd = process.cwd(), input, env = {}, timeout = TIMEOUT_NPM_INSTALL } = options;

  const command = `node ${CLI_PATH} ${args.join(' ')}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
      ...(input ? { input } : {}),
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
      status?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      exitCode: execError.code ?? execError.status ?? 1,
    };
  }
}

/**
 * Runs the CLI synchronously (for simple tests)
 * @param args
 * @param options
 * @param options.cwd
 * @param options.env
 * @param options.timeout
 */
export function runCliSync(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {},
): CliResult {
  const { cwd = process.cwd(), env = {}, timeout = TIMEOUT_SYNC } = options;

  const command = `node ${CLI_PATH} ${args.join(' ')}`;

  try {
    const stdout = execSync(command, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      status?: number;
    };
    return {
      stdout: execError.stdout?.toString() ?? '',
      stderr: execError.stderr?.toString() ?? '',
      exitCode: execError.status ?? 1,
    };
  }
}

/**
 * Reads a file from the test directory
 * @param dir
 * @param relativePath
 */
export function readTestFile(dir: string, relativePath: string): string {
  return readFileSync(nodePath.join(dir, relativePath), 'utf8');
}

/**
 * Writes a file to the test directory
 * @param dir
 * @param relativePath
 * @param content
 */
export function writeTestFile(dir: string, relativePath: string, content: string): void {
  const fullPath = nodePath.join(dir, relativePath);
  const parentDirectory = nodePath.dirname(fullPath);
  if (!existsSync(parentDirectory)) {
    mkdirSync(parentDirectory, { recursive: true });
  }
  writeFileSync(fullPath, content);
}

/**
 * Checks if a file exists in the test directory
 * @param dir
 * @param relativePath
 */
export function fileExists(dir: string, relativePath: string): boolean {
  return existsSync(nodePath.join(dir, relativePath));
}

/**
 * Initializes a git repository in the given directory
 * @param dir
 */
export function initGitRepo(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
}

/**
 * Creates a configured project (runs setup) for tests that need pre-configured state.
 * Includes base packages in devDependencies to prevent sync attempts during tests
 * (eslint-plugin-safeword isn't published yet).
 * @param dir
 */
export async function createConfiguredProject(dir: string): Promise<void> {
  createTypeScriptPackageJson(dir, {
    devDependencies: {
      typescript: '^5.0.0',
      // Include safeword base packages to prevent sync attempts during upgrade tests
      eslint: '^9.0.0',
      prettier: '^3.0.0',
      'eslint-config-prettier': '^9.0.0',
      'eslint-plugin-safeword': ESLINT_PLUGIN_VERSION,
      knip: '^5.0.0',
    },
  });
  initGitRepo(dir);
  await runCli(['setup', '--yes'], { cwd: dir });
}

/**
 * Measures execution time of a function in milliseconds
 * @param fn
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = performance.now();
  const result = await fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}

/**
 * Measures execution time of a sync function in milliseconds
 * @param fn
 */
export function measureTimeSync<T>(fn: () => T): { result: T; timeMs: number } {
  const start = performance.now();
  const result = fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}

/**
 * Writes .safeword/config.json for Language Packs tests
 * @param dir
 * @param config
 * @param config.installedPacks - Array of installed pack IDs
 * @param config.version - Config version (defaults to '0.15.0')
 */
export function writeSafewordConfig(
  dir: string,
  config: { installedPacks?: string[]; version?: string } = {},
): void {
  const { installedPacks = [], version = '0.15.0' } = config;
  writeTestFile(dir, '.safeword/config.json', JSON.stringify({ version, installedPacks }));
}

/**
 * Reads and parses .safeword/config.json
 * @param dir
 */
export function readSafewordConfig(dir: string): { version: string; installedPacks: string[] } {
  return JSON.parse(readTestFile(dir, '.safeword/config.json'));
}

/**
 * Check if Ruff is installed on the system.
 * Used by Python-related tests to skip tests when Ruff isn't available.
 */
export function isRuffInstalled(): boolean {
  try {
    const result = execSync('ruff --version', { encoding: 'utf8', stdio: 'pipe' });
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Creates a Python-only project with pyproject.toml
 * @param dir
 * @param options
 * @param options.framework - Optional framework dependency (django, flask, fastapi)
 * @param options.manager - Package manager indicator (poetry, uv, pip)
 */
export function createPythonProject(
  dir: string,
  options: { framework?: string; manager?: 'poetry' | 'uv' | 'pip' } = {},
): void {
  const { framework, manager = 'pip' } = options;

  let content = `[project]
name = "test-python-project"
version = "0.1.0"
`;

  if (framework) {
    content += `dependencies = ["${framework}"]\n`;
  }

  if (manager === 'poetry') {
    content += `\n[tool.poetry]\nname = "test-python-project"\n`;
  } else if (manager === 'uv') {
    content += `\n[tool.uv]\n`;
  }

  writeTestFile(dir, 'pyproject.toml', content);
}
