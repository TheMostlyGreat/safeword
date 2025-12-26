/**
 * Language Pack Types
 */

export interface SetupContext {
  isGitRepo: boolean;
}

export interface SetupResult {
  files: string[];
}

export interface LanguagePack {
  id: string;
  name: string;
  extensions: string[];
  detect: (cwd: string) => boolean;
  setup: (cwd: string, ctx: SetupContext) => SetupResult;
}
