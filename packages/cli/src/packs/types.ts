/**
 * Language Pack Types
 *
 * Shared types used by both schema.ts and pack files.
 * This file breaks the circular dependency between them.
 */

import type { Languages, ProjectType } from '../utils/project-detector.js';

// ============================================================================
// Pack Interface Types
// ============================================================================

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

// ============================================================================
// Schema Types (shared with schema.ts)
// ============================================================================

export interface ProjectContext {
  cwd: string;
  projectType: ProjectType;
  developmentDeps: Record<string, string>;
  productionDeps: Record<string, string>;
  isGitRepo: boolean;
  /** Languages detected in project (for conditional file generation) */
  languages?: Languages;
}

export interface FileDefinition {
  template?: string; // Path in templates/ dir
  content?: string | (() => string); // Static content or factory
  generator?: (ctx: ProjectContext) => string | undefined; // Dynamic generator, undefined = skip file
}

// managedFiles: created if missing, updated only if content === current template output
export type ManagedFileDefinition = FileDefinition;

export interface JsonMergeDefinition {
  keys: string[]; // Dot-notation keys we manage
  conditionalKeys?: Record<string, string[]>; // Keys added based on project type
  merge: (existing: Record<string, unknown>, ctx: ProjectContext) => Record<string, unknown>;
  unmerge: (existing: Record<string, unknown>, ctx: ProjectContext) => Record<string, unknown>;
  removeFileIfEmpty?: boolean; // Delete file if our keys were the only content
  skipIfMissing?: boolean; // Don't create file if it doesn't exist (for optional integrations)
}
