/**
 * File system utilities for CLI operations
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import nodePath from "node:path";

// Get the directory of this module (for locating templates)
const __dirname = import.meta.dirname;

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
export function getTemplatesDirectory(): string {
  const knownTemplateFile = "SAFEWORD.md";

  // Try different relative paths - the bundled code ends up in dist/ directly (flat)
  // while source is in src/utils/
  const candidates = [
    nodePath.join(__dirname, "..", "templates"), // From dist/ (flat bundled)
    nodePath.join(__dirname, "..", "..", "templates"), // From src/utils/ or dist/utils/
    nodePath.join(__dirname, "templates"), // Direct sibling (unlikely but safe)
  ];

  for (const candidate of candidates) {
    if (existsSync(nodePath.join(candidate, knownTemplateFile))) {
      return candidate;
    }
  }

  throw new Error("Templates directory not found");
}

/**
 * Check if a path exists
 * @param path
 */
export function exists(path: string): boolean {
  return existsSync(path);
}

/**
 * Create directory recursively
 * @param path
 */
export function ensureDirectory(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Read file as string
 * @param path
 */
export function readFile(path: string): string {
  return readFileSync(path, "utf8");
}

/**
 * Read file as string, return null if not exists
 * @param path
 */
export function readFileSafe(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return readFileSync(path, "utf8");
}

/**
 * Write file, creating parent directories if needed
 * @param path
 * @param content
 */
export function writeFile(path: string, content: string): void {
  ensureDirectory(nodePath.dirname(path));
  writeFileSync(path, content);
}

/**
 * Remove file or directory recursively
 * @param path
 */
export function remove(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * Remove directory only if empty, returns true if removed
 * @param path
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
 * @param dirPath
 */
export function makeScriptsExecutable(dirPath: string): void {
  if (!existsSync(dirPath)) return;
  for (const file of readdirSync(dirPath)) {
    if (file.endsWith(".sh")) {
      chmodSync(nodePath.join(dirPath, file), 0o755);
    }
  }
}

/**
 * Read JSON file
 * @param path
 */
export function readJson(path: string): unknown {
  const content = readFileSafe(path);
  if (!content) return undefined;
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Write JSON file with formatting
 * @param path
 * @param data
 */
export function writeJson(path: string, data: unknown): void {
  writeFile(path, `${JSON.stringify(data, undefined, 2)}\n`);
}
