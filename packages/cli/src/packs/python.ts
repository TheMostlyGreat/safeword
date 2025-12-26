/**
 * Python Language Pack
 *
 * Wraps existing python-setup.ts functionality in the LanguagePack interface.
 */

import nodePath from 'node:path';

import { exists } from '../utils/fs.js';
import { setupPythonTooling } from '../utils/python-setup.js';
import type { LanguagePack, SetupContext, SetupResult } from './types.js';

export const pythonPack: LanguagePack = {
  id: 'python',
  name: 'Python',
  extensions: ['.py', '.pyi'],

  detect(cwd: string): boolean {
    return exists(nodePath.join(cwd, 'pyproject.toml'));
  },

  setup(cwd: string, ctx: SetupContext): SetupResult {
    const result = setupPythonTooling(cwd, ctx.isGitRepo);
    return { files: result.files };
  },
};
