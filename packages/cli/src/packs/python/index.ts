/**
 * Python Language Pack
 *
 * Wraps existing setup.ts functionality in the LanguagePack interface.
 */

import nodePath from 'node:path';

import { exists } from '../../utils/fs.js';
import type { LanguagePack, SetupResult } from '../types.js';
import { setupPythonTooling } from './setup.js';

export const pythonPack: LanguagePack = {
  id: 'python',
  name: 'Python',
  extensions: ['.py', '.pyi'],

  detect(cwd: string): boolean {
    return exists(nodePath.join(cwd, 'pyproject.toml'));
  },

  setup(cwd: string, _ctx): SetupResult {
    const result = setupPythonTooling(cwd);
    return { files: result.files };
  },
};
