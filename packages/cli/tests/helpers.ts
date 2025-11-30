import { execSync, exec } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Path to the CLI entry point (built)
 */
export const CLI_PATH = join(__dirname, '../dist/cli.js');

/**
 * Path to the CLI source (for ts-node execution during development)
 */
export const CLI_SRC_PATH = join(__dirname, '../src/cli.ts');

/**
 * Creates a temporary directory for test isolation
 */
export function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'safeword-test-'));
}

/**
 * Removes a temporary directory and all contents
 */
export function removeTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/**
 * Creates a minimal package.json in the given directory
 */
export function createPackageJson(dir: string, overrides: Record<string, unknown> = {}): void {
  const pkg = {
    name: 'test-project',
    version: '1.0.0',
    ...overrides,
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
}

/**
 * Creates a TypeScript package.json (with typescript in devDependencies)
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
  // Increased timeout for setup command which now runs npm install
  const { cwd = process.cwd(), input, env = {}, timeout = 120000 } = options;

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
 */
export function runCliSync(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {},
): CliResult {
  const { cwd = process.cwd(), env = {}, timeout = 30000 } = options;

  const command = `node ${CLI_PATH} ${args.join(' ')}`;

  try {
    const stdout = execSync(command, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
      encoding: 'utf-8',
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
 */
export function readTestFile(dir: string, relativePath: string): string {
  return readFileSync(join(dir, relativePath), 'utf-8');
}

/**
 * Writes a file to the test directory
 */
export function writeTestFile(dir: string, relativePath: string, content: string): void {
  const fullPath = join(dir, relativePath);
  const parentDir = join(fullPath, '..');
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }
  writeFileSync(fullPath, content);
}

/**
 * Checks if a file exists in the test directory
 */
export function fileExists(dir: string, relativePath: string): boolean {
  return existsSync(join(dir, relativePath));
}

/**
 * Initializes a git repository in the given directory
 */
export function initGitRepo(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
}

/**
 * Creates a configured project (runs setup) for tests that need pre-configured state
 */
export async function createConfiguredProject(dir: string): Promise<void> {
  createTypeScriptPackageJson(dir);
  initGitRepo(dir);
  await runCli(['setup', '--yes'], { cwd: dir });
}

/**
 * Measures execution time of a function in milliseconds
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = performance.now();
  const result = await fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}

/**
 * Measures execution time of a sync function in milliseconds
 */
export function measureTimeSync<T>(fn: () => T): { result: T; timeMs: number } {
  const start = performance.now();
  const result = fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}
