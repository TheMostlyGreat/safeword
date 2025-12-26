/**
 * Pack Registry
 *
 * Central registry of language packs with lookup helpers.
 */

import { pythonPack } from './python.js';
import type { LanguagePack } from './types.js';
import { typescriptPack } from './typescript.js';

/**
 * All registered language packs.
 */
export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  python: pythonPack,
  typescript: typescriptPack,
};

/**
 * Find the language pack for a file extension.
 *
 * @param ext - File extension including dot (e.g., '.py')
 * @returns The matching pack or null
 */
export function findPackForExtension(extension: string): LanguagePack | null {
  for (const pack of Object.values(LANGUAGE_PACKS)) {
    if (pack.extensions.includes(extension)) {
      return pack;
    }
  }
  return null;
}

/**
 * Detect which languages are present in a project.
 *
 * @param cwd - Project root directory
 * @returns Array of pack IDs for detected languages
 */
export function detectLanguages(cwd: string): string[] {
  const detected: string[] = [];

  for (const pack of Object.values(LANGUAGE_PACKS)) {
    if (pack.detect(cwd)) {
      detected.push(pack.id);
    }
  }

  return detected;
}
