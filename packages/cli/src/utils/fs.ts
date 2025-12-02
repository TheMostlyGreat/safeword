/**
 * File system utilities for CLI operations
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  rmdirSync,
  readdirSync,
  chmodSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory of this module (for locating templates)
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get path to bundled templates directory.
 * Works in both development (src/) and production (dist/) contexts.
 *
 * Note: We check for SAFEWORD.md to distinguish from src/templates/ which
 * contains TypeScript source files (config.ts, content.ts).
 *
 * Path resolution (bundled with tsup):
 * - From dist/chunk-*.js: __dirname = packages/cli/dist/ → ../templates
 */
export function getTemplatesDir(): string {
  const knownTemplateFile = 'SAFEWORD.md';

  // Try different relative paths - the bundled code ends up in dist/ directly (flat)
  // while source is in src/utils/
  const candidates = [
    join(__dirname, '..', 'templates'), // From dist/ (flat bundled)
    join(__dirname, '..', '..', 'templates'), // From src/utils/ or dist/utils/
    join(__dirname, 'templates'), // Direct sibling (unlikely but safe)
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, knownTemplateFile))) {
      return candidate;
    }
  }

  throw new Error('Templates directory not found');
}

/**
 * Check if a path exists
 */
export function exists(path: string): boolean {
  return existsSync(path);
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
 * Remove directory only if empty, returns true if removed
 */
export function removeIfEmpty(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    rmdirSync(path); // Non-recursive, throws if not empty
    return true;
  } catch {
    return false;
  }
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
