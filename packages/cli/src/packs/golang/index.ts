/**
 * Go Language Pack
 *
 * Detects Go projects and sets up golangci-lint configuration.
 */

import nodePath from 'node:path';

import { exists } from '../../utils/fs.js';
import type { LanguagePack, SetupResult } from '../types.js';
import { setupGoTooling } from './setup.js';

export const golangPack: LanguagePack = {
  id: 'golang',
  name: 'Go',
  extensions: ['.go'],

  detect(cwd: string): boolean {
    return exists(nodePath.join(cwd, 'go.mod'));
  },

  setup(cwd: string): SetupResult {
    return setupGoTooling(cwd);
  },
};
