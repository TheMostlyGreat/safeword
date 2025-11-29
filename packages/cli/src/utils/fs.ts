/**
 * File system utilities for CLI operations
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
  statSync,
  chmodSync,
  copyFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory of this module (for locating templates)
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get path to bundled templates directory.
 * Works in both development (src/) and production (dist/) contexts.
 */
export function getTemplatesDir(): string {
  // When running from dist/, __dirname is packages/cli/dist/
  // Templates are at packages/cli/templates/ (one level up)
  const fromDist = join(__dirname, '..', 'templates');

  // Fallback path for edge cases
  const fallback = join(__dirname, '..', '..', 'templates');

  if (existsSync(fromDist)) return fromDist;
  if (existsSync(fallback)) return fallback;

  throw new Error('Templates directory not found');
}

/**
 * Check if a path exists
 */
export function exists(path: string): boolean {
  return existsSync(path);
}

/**
 * Check if path is a directory
 */
export function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Create directory recursively
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Read file as string
 */
export function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

/**
 * Read file as string, return null if not exists
 */
export function readFileSafe(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

/**
 * Write file, creating parent directories if needed
 */
export function writeFile(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content);
}

/**
 * Remove file or directory recursively
 */
export function remove(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * List files in directory
 */
export function listDir(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path);
}

/**
 * Copy a single file
 */
export function copyFile(src: string, dest: string): void {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

/**
 * Copy directory recursively
 */
export function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Make file executable
 */
export function makeExecutable(path: string): void {
  chmodSync(path, 0o755);
}

/**
 * Make all shell scripts in a directory executable
 */
export function makeScriptsExecutable(dirPath: string): void {
  if (!existsSync(dirPath)) return;
  for (const file of readdirSync(dirPath)) {
    if (file.endsWith('.sh')) {
      chmodSync(join(dirPath, file), 0o755);
    }
  }
}

/**
 * Read JSON file
 */
export function readJson<T = unknown>(path: string): T | null {
  const content = readFileSafe(path);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write JSON file with formatting
 */
export function writeJson(path: string, data: unknown): void {
  writeFile(path, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Update JSON file, merging with existing content
 */
export function updateJson<T extends Record<string, unknown>>(
  path: string,
  updater: (existing: T | null) => T,
): void {
  const existing = readJson<T>(path);
  const updated = updater(existing);
  writeJson(path, updated);
}
