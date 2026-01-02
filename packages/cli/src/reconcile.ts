/**
 * Reconciliation Engine
 *
 * Computes and executes plans based on SAFEWORD_SCHEMA and project state.
 * This is the single source of truth for all file/dir/config operations.
 */

import nodePath from 'node:path';

import type {
  FileDefinition,
  JsonMergeDefinition,
  ProjectContext,
  SafewordSchema,
  TextPatchDefinition,
} from './schema.js';
import {
  ensureDirectory,
  exists,
  getTemplatesDirectory,
  makeScriptsExecutable,
  readFile,
  readFileSafe,
  readJson,
  remove,
  removeIfEmpty,
  writeFile,
  writeJson,
} from './utils/fs.js';
import type { ProjectType } from './utils/project-detector.js';

// ============================================================================
// Constants
// ============================================================================

const HUSKY_DIR = '.husky';

/**
 * Directories containing executable scripts that need chmod +x.
 * Used by both install and upgrade plans.
 */
const CHMOD_PATHS = [
  '.safeword/hooks',
  '.safeword/hooks/cursor',
  '.safeword/lib',
  '.safeword/scripts',
];

/**
 * Prettier-related packages that should be skipped for projects with existing formatter.
 */
const PRETTIER_PACKAGES = new Set([
  'prettier',
  'prettier-plugin-astro',
  'prettier-plugin-tailwindcss',
  'prettier-plugin-sh',
]);

/**
 * Get conditional packages based on project type.
 * Handles the "standard" key and prettier filtering for existing formatters.
 */
function getConditionalPackages(
  conditionalPackages: Record<string, string[]>,
  projectType: ProjectType,
): string[] {
  const packages: string[] = [];

  for (const [key, deps] of Object.entries(conditionalPackages)) {
    // "standard" means !existingFormatter - only for projects without existing formatter
    if (key === 'standard') {
      if (!projectType.existingFormatter) {
        packages.push(...deps);
      }
      continue;
    }

    // Check if this condition is met
    if (projectType[key as keyof ProjectType]) {
      // For projects with existing formatter, skip prettier-related packages
      if (projectType.existingFormatter) {
        packages.push(...deps.filter(pkg => !PRETTIER_PACKAGES.has(pkg)));
      } else {
        packages.push(...deps);
      }
    }
  }

  return packages;
}

/**
 * Check if path should be skipped in non-git repos (husky files)
 * @param path
 * @param isGitRepo
 */
function shouldSkipForNonGit(path: string, isGitRepo: boolean): boolean {
  return path.startsWith(HUSKY_DIR) && !isGitRepo;
}

/**
 * Plan mkdir actions for directories that don't exist
 * @param dirs
 * @param cwd
 * @param isGitRepo
 */
function planMissingDirectories(
  directories: string[],
  cwd: string,
  isGitRepo: boolean,
): { actions: Action[]; created: string[] } {
  const actions: Action[] = [];
  const created: string[] = [];
  for (const dir of directories) {
    if (shouldSkipForNonGit(dir, isGitRepo)) continue;
    if (!exists(nodePath.join(cwd, dir))) {
      actions.push({ type: 'mkdir', path: dir });
      created.push(dir);
    }
  }
  return { actions, created };
}

/**
 * Plan text-patch actions for files missing the marker
 * @param patches
 * @param cwd
 * @param isGitRepo
 */
function planTextPatches(
  patches: Record<string, TextPatchDefinition>,
  cwd: string,
  isGitRepo: boolean,
): Action[] {
  const actions: Action[] = [];
  for (const [filePath, definition] of Object.entries(patches)) {
    if (shouldSkipForNonGit(filePath, isGitRepo)) continue;
    const content = readFileSafe(nodePath.join(cwd, filePath)) ?? '';
    if (!content.includes(definition.marker)) {
      actions.push({ type: 'text-patch', path: filePath, definition });
    }
  }
  return actions;
}

function planOwnedFileWrites(
  files: Record<string, FileDefinition>,
  ctx: ProjectContext,
): { actions: Action[]; created: string[] } {
  const actions: Action[] = [];
  const created: string[] = [];
  for (const [filePath, definition] of Object.entries(files)) {
    if (shouldSkipForNonGit(filePath, ctx.isGitRepo)) continue;
    const content = resolveFileContent(definition, ctx);
    // Skip files where generator returned undefined (e.g., non-JS projects)
    if (content === undefined) continue;
    actions.push({ type: 'write', path: filePath, content });
    created.push(filePath);
  }
  return { actions, created };
}

function planManagedFileWrites(
  files: Record<string, FileDefinition>,
  ctx: ProjectContext,
): { actions: Action[]; created: string[] } {
  const actions: Action[] = [];
  const created: string[] = [];
  for (const [filePath, definition] of Object.entries(files)) {
    if (exists(nodePath.join(ctx.cwd, filePath))) continue;
    const content = resolveFileContent(definition, ctx);
    // Skip files where generator returned undefined (e.g., non-JS projects)
    if (content === undefined) continue;
    actions.push({ type: 'write', path: filePath, content });
    created.push(filePath);
  }
  return { actions, created };
}

function planTextPatchesWithCreation(
  patches: Record<string, TextPatchDefinition>,
  ctx: ProjectContext,
): { actions: Action[]; created: string[] } {
  const actions: Action[] = [];
  const created: string[] = [];
  for (const [filePath, definition] of Object.entries(patches)) {
    if (shouldSkipForNonGit(filePath, ctx.isGitRepo)) continue;
    actions.push({ type: 'text-patch', path: filePath, definition });
    if (definition.createIfMissing && !exists(nodePath.join(ctx.cwd, filePath))) {
      created.push(filePath);
    }
  }
  return { actions, created };
}

/**
 * Plan rmdir actions for directories that exist
 * @param dirs
 * @param cwd
 */
function planExistingDirectoriesRemoval(
  directories: string[],
  cwd: string,
): { actions: Action[]; removed: string[] } {
  const actions: Action[] = [];
  const removed: string[] = [];
  for (const dir of directories) {
    if (exists(nodePath.join(cwd, dir))) {
      actions.push({ type: 'rmdir', path: dir });
      removed.push(dir);
    }
  }
  return { actions, removed };
}

/**
 * Plan rm actions for files that exist
 * @param files
 * @param cwd
 */
function planExistingFilesRemoval(
  files: string[],
  cwd: string,
): { actions: Action[]; removed: string[] } {
  const actions: Action[] = [];
  const removed: string[] = [];
  for (const filePath of files) {
    if (exists(nodePath.join(cwd, filePath))) {
      actions.push({ type: 'rm', path: filePath });
      removed.push(filePath);
    }
  }
  return { actions, removed };
}

/**
 * Check if a .claude path needs parent dir cleanup
 * @param filePath
 */
function getClaudeParentDirectoryForCleanup(filePath: string): string | undefined {
  if (!filePath.startsWith('.claude/')) return undefined;
  const parentDirectory = filePath.slice(0, Math.max(0, filePath.lastIndexOf('/')));
  if (
    !parentDirectory ||
    parentDirectory === '.claude' ||
    parentDirectory === '.claude/skills' ||
    parentDirectory === '.claude/commands'
  ) {
    return undefined;
  }
  return parentDirectory;
}

// ============================================================================
// Types
// ============================================================================

type ReconcileMode = 'install' | 'upgrade' | 'uninstall' | 'uninstall-full';

export type Action =
  | { type: 'mkdir'; path: string }
  | { type: 'rmdir'; path: string }
  | { type: 'write'; path: string; content: string }
  | { type: 'rm'; path: string }
  | { type: 'chmod'; paths: string[] }
  | { type: 'json-merge'; path: string; definition: JsonMergeDefinition }
  | { type: 'json-unmerge'; path: string; definition: JsonMergeDefinition }
  | { type: 'text-patch'; path: string; definition: TextPatchDefinition }
  | { type: 'text-unpatch'; path: string; definition: TextPatchDefinition };

export interface ReconcileResult {
  actions: Action[];
  applied: boolean;
  created: string[];
  updated: string[];
  removed: string[];
  packagesToInstall: string[];
  packagesToRemove: string[];
}

interface ReconcileOptions {
  dryRun?: boolean;
}

// ============================================================================
// Main reconcile function
// ============================================================================

/**
 *
 * @param schema
 * @param mode
 * @param ctx
 * @param options
 */
export async function reconcile(
  schema: SafewordSchema,
  mode: ReconcileMode,
  ctx: ProjectContext,
  options?: ReconcileOptions,
): Promise<ReconcileResult> {
  const dryRun = options?.dryRun ?? false;

  const plan = computePlan(schema, mode, ctx);

  if (dryRun) {
    return {
      actions: plan.actions,
      applied: false,
      created: plan.wouldCreate,
      updated: plan.wouldUpdate,
      removed: plan.wouldRemove,
      packagesToInstall: plan.packagesToInstall,
      packagesToRemove: plan.packagesToRemove,
    };
  }

  const result = executePlan(plan, ctx);

  return {
    actions: plan.actions,
    applied: true,
    created: result.created,
    updated: result.updated,
    removed: result.removed,
    packagesToInstall: plan.packagesToInstall,
    packagesToRemove: plan.packagesToRemove,
  };
}

// ============================================================================
// Plan computation
// ============================================================================

interface ReconcilePlan {
  actions: Action[];
  wouldCreate: string[];
  wouldUpdate: string[];
  wouldRemove: string[];
  packagesToInstall: string[];
  packagesToRemove: string[];
}

/**
 *
 * @param schema
 * @param mode
 * @param ctx
 */
function computePlan(
  schema: SafewordSchema,
  mode: ReconcileMode,
  ctx: ProjectContext,
): ReconcilePlan {
  switch (mode) {
    case 'install': {
      return computeInstallPlan(schema, ctx);
    }
    case 'upgrade': {
      return computeUpgradePlan(schema, ctx);
    }
    case 'uninstall': {
      return computeUninstallPlan(schema, ctx, false);
    }
    case 'uninstall-full': {
      return computeUninstallPlan(schema, ctx, true);
    }
    default: {
      // Exhaustive check - TypeScript ensures all cases are handled
      const _exhaustiveCheck: never = mode;
      return _exhaustiveCheck;
    }
  }
}

/**
 *
 * @param schema
 * @param ctx
 */
function computeInstallPlan(schema: SafewordSchema, ctx: ProjectContext): ReconcilePlan {
  const actions: Action[] = [];
  const wouldCreate: string[] = [];

  // 1. Create all directories
  const allDirectories = [...schema.ownedDirs, ...schema.sharedDirs, ...schema.preservedDirs];
  const directories = planMissingDirectories(allDirectories, ctx.cwd, ctx.isGitRepo);
  actions.push(...directories.actions);
  wouldCreate.push(...directories.created);

  // 2. Write owned files
  const owned = planOwnedFileWrites(schema.ownedFiles, ctx);
  actions.push(...owned.actions);
  wouldCreate.push(...owned.created);

  // 3. Write managed files (only if missing)
  const managed = planManagedFileWrites(schema.managedFiles, ctx);
  actions.push(...managed.actions);
  wouldCreate.push(...managed.created);

  // 4. chmod hook/lib/scripts directories
  const chmodPaths = [...CHMOD_PATHS];
  if (ctx.isGitRepo) chmodPaths.push(HUSKY_DIR);
  actions.push({ type: 'chmod', paths: chmodPaths });

  // 5. JSON merges
  for (const [filePath, definition] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-merge', path: filePath, definition });
  }

  // 6. Text patches
  const patches = planTextPatchesWithCreation(schema.textPatches, ctx);
  actions.push(...patches.actions);
  wouldCreate.push(...patches.created);

  // 7. Compute packages to install
  const packagesToInstall = computePackagesToInstall(
    schema,
    ctx.projectType,
    ctx.developmentDeps,
    ctx.isGitRepo,
  );

  return {
    actions,
    wouldCreate,
    wouldUpdate: [],
    wouldRemove: [],
    packagesToInstall,
    packagesToRemove: [],
  };
}

/**
 *
 * @param schema
 * @param ctx
 */
function computeUpgradePlan(schema: SafewordSchema, ctx: ProjectContext): ReconcilePlan {
  const actions: Action[] = [];
  const wouldCreate: string[] = [];
  const wouldUpdate: string[] = [];

  // 1. Ensure directories exist (skip .husky if not a git repo)
  const allDirectories = [...schema.ownedDirs, ...schema.sharedDirs, ...schema.preservedDirs];
  const missingDirectories = planMissingDirectories(allDirectories, ctx.cwd, ctx.isGitRepo);
  actions.push(...missingDirectories.actions);
  wouldCreate.push(...missingDirectories.created);

  // 2. Update owned files if content changed (skip .husky files if not a git repo)
  for (const [filePath, definition] of Object.entries(schema.ownedFiles)) {
    if (shouldSkipForNonGit(filePath, ctx.isGitRepo)) continue;

    const fullPath = nodePath.join(ctx.cwd, filePath);
    const newContent = resolveFileContent(definition, ctx);

    // Skip files where generator returned undefined (e.g., non-JS projects)
    if (newContent === undefined) continue;

    if (!fileNeedsUpdate(fullPath, newContent)) continue;

    actions.push({ type: 'write', path: filePath, content: newContent });
    if (exists(fullPath)) {
      wouldUpdate.push(filePath);
    } else {
      wouldCreate.push(filePath);
    }
  }

  // 3. Update managed files only if content matches current template
  for (const [filePath, definition] of Object.entries(schema.managedFiles)) {
    const fullPath = nodePath.join(ctx.cwd, filePath);
    const newContent = resolveFileContent(definition, ctx);

    // Skip files where generator returned undefined (e.g., non-JS projects)
    if (newContent === undefined) continue;

    if (!exists(fullPath)) {
      // Missing - create it
      actions.push({ type: 'write', path: filePath, content: newContent });
      wouldCreate.push(filePath);
    }
    // If file exists, don't update during upgrade - user may have customized it
  }

  // 4. Remove deprecated files (renamed or removed in newer versions)
  const deprecatedFiles = planExistingFilesRemoval(schema.deprecatedFiles, ctx.cwd);
  actions.push(...deprecatedFiles.actions);
  const wouldRemove = deprecatedFiles.removed;

  // 4b. Remove deprecated directories (no longer managed by safeword)
  const deprecatedDirectories = planExistingDirectoriesRemoval(schema.deprecatedDirs, ctx.cwd);
  actions.push(...deprecatedDirectories.actions);
  wouldRemove.push(...deprecatedDirectories.removed);

  // 5. chmod
  actions.push({ type: 'chmod', paths: CHMOD_PATHS });

  // 6. JSON merges (always apply to ensure keys are present)
  for (const [filePath, definition] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-merge', path: filePath, definition });
  }

  // 7. Text patches (only if marker missing, skip .husky in non-git repos)
  actions.push(...planTextPatches(schema.textPatches, ctx.cwd, ctx.isGitRepo));

  // 8. Compute packages to install (husky/lint-staged skipped if no git repo)
  const packagesToInstall = computePackagesToInstall(
    schema,
    ctx.projectType,
    ctx.developmentDeps,
    ctx.isGitRepo,
  );

  // 9. Compute deprecated packages to remove (only those actually installed)
  const packagesToRemove = schema.deprecatedPackages.filter(pkg => pkg in ctx.developmentDeps);

  return {
    actions,
    wouldCreate,
    wouldUpdate,
    wouldRemove,
    packagesToInstall,
    packagesToRemove,
  };
}

/**
 *
 * @param schema
 * @param ctx
 * @param full
 */
function computeUninstallPlan(
  schema: SafewordSchema,
  ctx: ProjectContext,
  full: boolean,
): ReconcilePlan {
  const actions: Action[] = [];
  const wouldRemove: string[] = [];

  // 1. Remove all owned files and track parent dirs for cleanup
  const ownedFiles = planExistingFilesRemoval(Object.keys(schema.ownedFiles), ctx.cwd);
  actions.push(...ownedFiles.actions);
  wouldRemove.push(...ownedFiles.removed);

  // Collect parent dirs that need cleanup (for .claude/* skill dirs)
  const directoriesToCleanup = new Set<string>();
  for (const filePath of ownedFiles.removed) {
    const parentDirectory = getClaudeParentDirectoryForCleanup(filePath);
    if (parentDirectory) directoriesToCleanup.add(parentDirectory);
  }
  const cleanupDirectories = planExistingDirectoriesRemoval([...directoriesToCleanup], ctx.cwd);
  actions.push(...cleanupDirectories.actions);
  wouldRemove.push(...cleanupDirectories.removed);

  // 2. JSON unmerges
  for (const [filePath, definition] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-unmerge', path: filePath, definition });
  }

  // 3. Text unpatches
  for (const [filePath, definition] of Object.entries(schema.textPatches)) {
    const fullPath = nodePath.join(ctx.cwd, filePath);
    if (exists(fullPath)) {
      const content = readFileSafe(fullPath) ?? '';
      if (content.includes(definition.marker)) {
        actions.push({ type: 'text-unpatch', path: filePath, definition });
      }
    }
  }

  // 4. Remove preserved directories first (reverse order, only if empty)
  const preserved = planExistingDirectoriesRemoval(schema.preservedDirs.toReversed(), ctx.cwd);
  actions.push(...preserved.actions);
  wouldRemove.push(...preserved.removed);

  // 5. Remove owned directories (reverse order ensures children before parents)
  const owned = planExistingDirectoriesRemoval(schema.ownedDirs.toReversed(), ctx.cwd);
  actions.push(...owned.actions);
  wouldRemove.push(...owned.removed);

  // 6. Full uninstall: remove managed files
  if (full) {
    const managed = planExistingFilesRemoval(Object.keys(schema.managedFiles), ctx.cwd);
    actions.push(...managed.actions);
    wouldRemove.push(...managed.removed);
  }

  // 7. Compute packages to remove (full only)
  const packagesToRemove = full
    ? computePackagesToRemove(schema, ctx.projectType, ctx.developmentDeps)
    : [];

  return {
    actions,
    wouldCreate: [],
    wouldUpdate: [],
    wouldRemove,
    packagesToInstall: [],
    packagesToRemove,
  };
}

// ============================================================================
// Plan execution
// ============================================================================

interface ExecutionResult {
  created: string[];
  updated: string[];
  removed: string[];
}

/**
 *
 * @param plan
 * @param ctx
 */
function executePlan(plan: ReconcilePlan, ctx: ProjectContext): ExecutionResult {
  const created: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  const result = { created, updated, removed };

  for (const action of plan.actions) {
    executeAction(action, ctx, result);
  }

  return result;
}

/**
 *
 * @param action
 * @param ctx
 * @param result
 */
function executeChmod(cwd: string, paths: string[]): void {
  for (const path of paths) {
    const fullPath = nodePath.join(cwd, path);
    if (exists(fullPath)) makeScriptsExecutable(fullPath);
  }
}

function executeRmdir(cwd: string, path: string, result: ExecutionResult): void {
  if (removeIfEmpty(nodePath.join(cwd, path))) result.removed.push(path);
}

function executeAction(action: Action, ctx: ProjectContext, result: ExecutionResult): void {
  switch (action.type) {
    case 'mkdir': {
      ensureDirectory(nodePath.join(ctx.cwd, action.path));
      result.created.push(action.path);
      break;
    }
    case 'rmdir': {
      executeRmdir(ctx.cwd, action.path, result);
      break;
    }
    case 'write': {
      executeWrite(ctx.cwd, action.path, action.content, result);
      break;
    }
    case 'rm': {
      remove(nodePath.join(ctx.cwd, action.path));
      result.removed.push(action.path);
      break;
    }
    case 'chmod': {
      executeChmod(ctx.cwd, action.paths);
      break;
    }
    case 'json-merge': {
      executeJsonMerge(ctx.cwd, action.path, action.definition, ctx);
      break;
    }
    case 'json-unmerge': {
      executeJsonUnmerge(ctx.cwd, action.path, action.definition);
      break;
    }
    case 'text-patch': {
      executeTextPatch(ctx.cwd, action.path, action.definition);
      break;
    }
    case 'text-unpatch': {
      executeTextUnpatch(ctx.cwd, action.path, action.definition);
      break;
    }
  }
}

/**
 *
 * @param cwd
 * @param path
 * @param content
 * @param result
 */
function executeWrite(cwd: string, path: string, content: string, result: ExecutionResult): void {
  const fullPath = nodePath.join(cwd, path);
  const existed = exists(fullPath);
  writeFile(fullPath, content);
  (existed ? result.updated : result.created).push(path);
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 *
 * @param definition
 * @param ctx
 */
function resolveFileContent(definition: FileDefinition, ctx: ProjectContext): string | undefined {
  if (definition.template) {
    const templatesDirectory = getTemplatesDirectory();
    return readFile(nodePath.join(templatesDirectory, definition.template));
  }

  if (definition.content) {
    return typeof definition.content === 'function' ? definition.content() : definition.content;
  }

  if (definition.generator) {
    // Generator can return null to skip file creation
    return definition.generator(ctx);
  }

  throw new Error('FileDefinition must have template, content, or generator');
}

/**
 *
 * @param installedPath
 * @param newContent
 */
function fileNeedsUpdate(installedPath: string, newContent: string): boolean {
  if (!exists(installedPath)) return true;
  const currentContent = readFileSafe(installedPath);
  return currentContent?.trim() !== newContent.trim();
}

// Packages that require git repo
const GIT_ONLY_PACKAGES = new Set(['husky', 'lint-staged']);

/**
 *
 * @param schema
 * @param projectType
 * @param installedDevDeps
 * @param isGitRepo
 */
export function computePackagesToInstall(
  schema: SafewordSchema,
  projectType: ProjectType,
  installedDevelopmentDeps: Record<string, string>,
  isGitRepo = true,
): string[] {
  let needed = [...schema.packages.base];

  // Filter out git-only packages when not in a git repo
  if (!isGitRepo) {
    needed = needed.filter(pkg => !GIT_ONLY_PACKAGES.has(pkg));
  }

  // Add conditional packages based on project type
  needed.push(...getConditionalPackages(schema.packages.conditional, projectType));

  return needed.filter(pkg => !(pkg in installedDevelopmentDeps));
}

/**
 *
 * @param schema
 * @param projectType
 * @param installedDevDeps
 */
function computePackagesToRemove(
  schema: SafewordSchema,
  projectType: ProjectType,
  installedDevelopmentDeps: Record<string, string>,
): string[] {
  const safewordPackages = [
    ...schema.packages.base,
    ...getConditionalPackages(schema.packages.conditional, projectType),
  ];

  // Only remove packages that are actually installed
  return safewordPackages.filter(pkg => pkg in installedDevelopmentDeps);
}

/**
 *
 * @param cwd
 * @param path
 * @param definition
 * @param ctx
 */
function executeJsonMerge(
  cwd: string,
  path: string,
  definition: JsonMergeDefinition,
  ctx: ProjectContext,
): void {
  const fullPath = nodePath.join(cwd, path);
  const rawExisting = readJson(fullPath) as Record<string, unknown> | undefined;

  // Skip if file doesn't exist and skipIfMissing is set
  if (!rawExisting && definition.skipIfMissing) return;

  const existing = rawExisting ?? {};
  const merged = definition.merge(existing, ctx);

  // Skip write if content is unchanged (avoids formatting churn)
  if (JSON.stringify(existing) === JSON.stringify(merged)) return;

  writeJson(fullPath, merged);
}

/**
 *
 * @param cwd
 * @param path
 * @param definition
 */
function executeJsonUnmerge(cwd: string, path: string, definition: JsonMergeDefinition): void {
  const fullPath = nodePath.join(cwd, path);
  if (!exists(fullPath)) return;

  const existing = readJson(fullPath) as Record<string, unknown> | undefined;
  if (!existing) return;

  const unmerged = definition.unmerge(existing);

  // Check if file should be removed
  if (definition.removeFileIfEmpty) {
    const remainingKeys = Object.keys(unmerged).filter(k => unmerged[k] !== undefined);
    if (remainingKeys.length === 0) {
      remove(fullPath);
      return;
    }
  }

  writeJson(fullPath, unmerged);
}

/**
 *
 * @param cwd
 * @param path
 * @param definition
 */
function executeTextPatch(cwd: string, path: string, definition: TextPatchDefinition): void {
  const fullPath = nodePath.join(cwd, path);
  let content = readFileSafe(fullPath) ?? '';

  // Check if already patched
  if (content.includes(definition.marker)) return;

  // Apply patch
  content =
    definition.operation === 'prepend'
      ? definition.content + content
      : content + definition.content;

  writeFile(fullPath, content);
}

/**
 *
 * @param cwd
 * @param path
 * @param definition
 */
function executeTextUnpatch(cwd: string, path: string, definition: TextPatchDefinition): void {
  const fullPath = nodePath.join(cwd, path);
  const content = readFileSafe(fullPath);
  if (!content) return;

  // Remove the patched content
  // First try to remove the full content block
  let unpatched = content.replace(definition.content, '');

  // If full content wasn't found but marker exists, remove lines containing the marker
  if (unpatched === content && content.includes(definition.marker)) {
    // Remove lines containing the marker
    const lines = content.split('\n');
    const filtered = lines.filter(line => !line.includes(definition.marker));
    unpatched = filtered.join('\n').replace(/^\n+/, ''); // Remove leading empty lines
  }

  writeFile(fullPath, unpatched);
}
