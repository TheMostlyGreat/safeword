/**
 * TypeScript Language Pack
 *
 * Handles TypeScript/JavaScript projects.
 * Note: ESLint setup is handled by the main setup flow via schema.ts.
 * This pack primarily provides detection and extension mapping.
 */

import nodePath from 'node:path';

import { exists } from '../utils/fs.js';
import type { LanguagePack, SetupContext, SetupResult } from './types.js';

export const typescriptPack: LanguagePack = {
  id: 'typescript',
  name: 'TypeScript',
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],

  detect(cwd: string): boolean {
    return exists(nodePath.join(cwd, 'package.json'));
  },

  setup(_cwd: string, _ctx: SetupContext): SetupResult {
    // TypeScript setup is handled by the main schema-based setup flow.
    // This pack exists for extension mapping and detection.
    return { files: [] };
  },
};
