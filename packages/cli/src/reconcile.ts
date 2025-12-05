/**
 * Reconciliation Engine
 *
 * Computes and executes plans based on SAFEWORD_SCHEMA and project state.
 * This is the single source of truth for all file/dir/config operations.
 */

import { join } from 'node:path';
import {
  exists,
  ensureDir,
  writeFile,
  readFile,
  readFileSafe,
  readJson,
  writeJson,
  remove,
  removeIfEmpty,
  makeScriptsExecutable,
  getTemplatesDir,
} from './utils/fs.js';
import type {
  SafewordSchema,
  ProjectContext,
  FileDefinition,
  JsonMergeDefinition,
  TextPatchDefinition,
} from './schema.js';
import type { ProjectType } from './utils/project-detector.js';

// ============================================================================
// Constants
// ============================================================================

const HUSKY_DIR = '.husky';

/** Check if path should be skipped in non-git repos (husky files) */
function shouldSkipForNonGit(path: string, isGitRepo: boolean): boolean {
  return path.startsWith(HUSKY_DIR) && !isGitRepo;
}

/** Plan mkdir actions for directories that don't exist */
function planMissingDirs(
  dirs: string[],
  cwd: string,
  isGitRepo: boolean,
): { actions: Action[]; created: string[] } {
  const actions: Action[] = [];
  const created: string[] = [];
  for (const dir of dirs) {
    if (shouldSkipForNonGit(dir, isGitRepo)) continue;
    if (!exists(join(cwd, dir))) {
      actions.push({ type: 'mkdir', path: dir });
      created.push(dir);
    }
  }
  return { actions, created };
}

/** Plan text-patch actions for files missing the marker */
function planTextPatches(patches: Record<string, TextPatchDefinition>, cwd: string): Action[] {
  const actions: Action[] = [];
  for (const [filePath, def] of Object.entries(patches)) {
    const content = readFileSafe(join(cwd, filePath)) ?? '';
    if (!content.includes(def.marker)) {
      actions.push({ type: 'text-patch', path: filePath, definition: def });
    }
  }
  return actions;
}

/** Plan rmdir actions for directories that exist */
function planExistingDirsRemoval(
  dirs: string[],
  cwd: string,
): { actions: Action[]; removed: string[] } {
  const actions: Action[] = [];
  const removed: string[] = [];
  for (const dir of dirs) {
    if (exists(join(cwd, dir))) {
      actions.push({ type: 'rmdir', path: dir });
      removed.push(dir);
    }
  }
  return { actions, removed };
}

/** Plan rm actions for files that exist */
function planExistingFilesRemoval(
  files: string[],
  cwd: string,
): { actions: Action[]; removed: string[] } {
  const actions: Action[] = [];
  const removed: string[] = [];
  for (const filePath of files) {
    if (exists(join(cwd, filePath))) {
      actions.push({ type: 'rm', path: filePath });
      removed.push(filePath);
    }
  }
  return { actions, removed };
}

/** Check if a .claude path needs parent dir cleanup */
function getClaudeParentDirForCleanup(filePath: string): string | null {
  if (!filePath.startsWith('.claude/')) return null;
  const parentDir = filePath.slice(0, Math.max(0, filePath.lastIndexOf('/')));
  if (
    !parentDir ||
    parentDir === '.claude' ||
    parentDir === '.claude/skills' ||
    parentDir === '.claude/commands'
  ) {
    return null;
  }
  return parentDir;
}

// ============================================================================
// Types
// ============================================================================

export type ReconcileMode = 'install' | 'upgrade' | 'uninstall' | 'uninstall-full';

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

export interface ReconcileOptions {
  dryRun?: boolean;
}

// ============================================================================
// Main reconcile function
// ============================================================================

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
  }
}

function computeInstallPlan(schema: SafewordSchema, ctx: ProjectContext): ReconcilePlan {
  const actions: Action[] = [];
  const wouldCreate: string[] = [];

  // 1. Create all directories (skip .husky if not a git repo)
  const allDirs = [...schema.ownedDirs, ...schema.sharedDirs, ...schema.preservedDirs];
  const missingDirs = planMissingDirs(allDirs, ctx.cwd, ctx.isGitRepo);
  actions.push(...missingDirs.actions);
  wouldCreate.push(...missingDirs.created);

  // 2. Write all owned files (skip .husky files if not a git repo)
  for (const [filePath, def] of Object.entries(schema.ownedFiles)) {
    if (shouldSkipForNonGit(filePath, ctx.isGitRepo)) continue;

    const content = resolveFileContent(def, ctx);
    actions.push({ type: 'write', path: filePath, content });
    wouldCreate.push(filePath);
  }

  // 3. Write managed files (only if missing)
  for (const [filePath, def] of Object.entries(schema.managedFiles)) {
    const fullPath = join(ctx.cwd, filePath);
    if (!exists(fullPath)) {
      const content = resolveFileContent(def, ctx);
      actions.push({ type: 'write', path: filePath, content });
      wouldCreate.push(filePath);
    }
  }

  // 4. chmod hook/lib directories (only .husky if git repo)
  const chmodPaths = ['.safeword/hooks', '.safeword/hooks/cursor', '.safeword/lib'];
  if (ctx.isGitRepo) chmodPaths.push(HUSKY_DIR);
  actions.push({ type: 'chmod', paths: chmodPaths });

  // 5. JSON merges
  for (const [filePath, def] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-merge', path: filePath, definition: def });
  }

  // 6. Text patches
  for (const [filePath, def] of Object.entries(schema.textPatches)) {
    actions.push({ type: 'text-patch', path: filePath, definition: def });
    if (def.createIfMissing && !exists(join(ctx.cwd, filePath))) {
      wouldCreate.push(filePath);
    }
  }

  // 7. Compute packages to install (husky/lint-staged skipped if no git repo)
  const packagesToInstall = computePackagesToInstall(
    schema,
    ctx.projectType,
    ctx.devDeps,
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

function computeUpgradePlan(schema: SafewordSchema, ctx: ProjectContext): ReconcilePlan {
  const actions: Action[] = [];
  const wouldCreate: string[] = [];
  const wouldUpdate: string[] = [];

  // 1. Ensure directories exist (skip .husky if not a git repo)
  const allDirs = [...schema.ownedDirs, ...schema.sharedDirs, ...schema.preservedDirs];
  const missingDirs = planMissingDirs(allDirs, ctx.cwd, ctx.isGitRepo);
  actions.push(...missingDirs.actions);
  wouldCreate.push(...missingDirs.created);

  // 2. Update owned files if content changed (skip .husky files if not a git repo)
  for (const [filePath, def] of Object.entries(schema.ownedFiles)) {
    if (shouldSkipForNonGit(filePath, ctx.isGitRepo)) continue;

    const fullPath = join(ctx.cwd, filePath);
    const newContent = resolveFileContent(def, ctx);

    if (!fileNeedsUpdate(fullPath, newContent)) continue;

    actions.push({ type: 'write', path: filePath, content: newContent });
    if (exists(fullPath)) {
      wouldUpdate.push(filePath);
    } else {
      wouldCreate.push(filePath);
    }
  }

  // 3. Update managed files only if content matches current template
  for (const [filePath, def] of Object.entries(schema.managedFiles)) {
    const fullPath = join(ctx.cwd, filePath);
    const newContent = resolveFileContent(def, ctx);

    if (!exists(fullPath)) {
      // Missing - create it
      actions.push({ type: 'write', path: filePath, content: newContent });
      wouldCreate.push(filePath);
    }
    // If file exists, don't update during upgrade - user may have customized it
  }

  // 4. chmod (only .husky if git repo)
  const chmodPathsUpgrade = ['.safeword/hooks', '.safeword/hooks/cursor', '.safeword/lib'];
  if (ctx.isGitRepo) chmodPathsUpgrade.push(HUSKY_DIR);
  actions.push({ type: 'chmod', paths: chmodPathsUpgrade });

  // 5. JSON merges (always apply to ensure keys are present)
  for (const [filePath, def] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-merge', path: filePath, definition: def });
  }

  // 6. Text patches (only if marker missing)
  actions.push(...planTextPatches(schema.textPatches, ctx.cwd));

  // 7. Compute packages to install (husky/lint-staged skipped if no git repo)
  const packagesToInstall = computePackagesToInstall(
    schema,
    ctx.projectType,
    ctx.devDeps,
    ctx.isGitRepo,
  );

  return {
    actions,
    wouldCreate,
    wouldUpdate,
    wouldRemove: [],
    packagesToInstall,
    packagesToRemove: [],
  };
}

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
  const dirsToCleanup = new Set<string>();
  for (const filePath of ownedFiles.removed) {
    const parentDir = getClaudeParentDirForCleanup(filePath);
    if (parentDir) dirsToCleanup.add(parentDir);
  }
  const cleanupDirs = planExistingDirsRemoval([...dirsToCleanup], ctx.cwd);
  actions.push(...cleanupDirs.actions);
  wouldRemove.push(...cleanupDirs.removed);

  // 2. JSON unmerges
  for (const [filePath, def] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-unmerge', path: filePath, definition: def });
  }

  // 3. Text unpatches
  for (const [filePath, def] of Object.entries(schema.textPatches)) {
    const fullPath = join(ctx.cwd, filePath);
    if (exists(fullPath)) {
      const content = readFileSafe(fullPath) ?? '';
      if (content.includes(def.marker)) {
        actions.push({ type: 'text-unpatch', path: filePath, definition: def });
      }
    }
  }

  // 4. Remove preserved directories first (reverse order, only if empty)
  const preserved = planExistingDirsRemoval(schema.preservedDirs.toReversed(), ctx.cwd);
  actions.push(...preserved.actions);
  wouldRemove.push(...preserved.removed);

  // 5. Remove owned directories (reverse order ensures children before parents)
  const owned = planExistingDirsRemoval(schema.ownedDirs.toReversed(), ctx.cwd);
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
    ? computePackagesToRemove(schema, ctx.projectType, ctx.devDeps)
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

function executeAction(action: Action, ctx: ProjectContext, result: ExecutionResult): void {
  switch (action.type) {
    case 'mkdir': {
      ensureDir(join(ctx.cwd, action.path));
      result.created.push(action.path);
      break;
    }

    case 'rmdir': {
      // Use removeIfEmpty to preserve directories with user content
      if (removeIfEmpty(join(ctx.cwd, action.path))) {
        result.removed.push(action.path);
      }
      break;
    }

    case 'write': {
      executeWrite(ctx.cwd, action.path, action.content, result);
      break;
    }

    case 'rm': {
      remove(join(ctx.cwd, action.path));
      result.removed.push(action.path);
      break;
    }

    case 'chmod': {
      for (const path of action.paths) {
        const fullPath = join(ctx.cwd, path);
        if (exists(fullPath)) makeScriptsExecutable(fullPath);
      }
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

function executeWrite(cwd: string, path: string, content: string, result: ExecutionResult): void {
  const fullPath = join(cwd, path);
  const existed = exists(fullPath);
  writeFile(fullPath, content);
  (existed ? result.updated : result.created).push(path);
}

// ============================================================================
// Helper functions
// ============================================================================

function resolveFileContent(def: FileDefinition, ctx: ProjectContext): string {
  if (def.template) {
    const templatesDir = getTemplatesDir();
    return readFile(join(templatesDir, def.template));
  }

  if (def.content) {
    return typeof def.content === 'function' ? def.content() : def.content;
  }

  if (def.generator) {
    return def.generator(ctx);
  }

  throw new Error('FileDefinition must have template, content, or generator');
}

function fileNeedsUpdate(installedPath: string, newContent: string): boolean {
  if (!exists(installedPath)) return true;
  const currentContent = readFileSafe(installedPath);
  return currentContent?.trim() !== newContent.trim();
}

// Packages that require git repo
const GIT_ONLY_PACKAGES = new Set(['husky', 'lint-staged']);

export function computePackagesToInstall(
  schema: SafewordSchema,
  projectType: ProjectType,
  installedDevDeps: Record<string, string>,
  isGitRepo = true,
): string[] {
  let needed = [...schema.packages.base];

  // Filter out git-only packages when not in a git repo
  if (!isGitRepo) {
    needed = needed.filter(pkg => !GIT_ONLY_PACKAGES.has(pkg));
  }

  for (const [key, deps] of Object.entries(schema.packages.conditional)) {
    if (projectType[key as keyof ProjectType]) {
      needed.push(...deps);
    }
  }

  return needed.filter(pkg => !(pkg in installedDevDeps));
}

function computePackagesToRemove(
  schema: SafewordSchema,
  projectType: ProjectType,
  installedDevDeps: Record<string, string>,
): string[] {
  const safewordPackages = [...schema.packages.base];

  for (const [key, deps] of Object.entries(schema.packages.conditional)) {
    if (projectType[key as keyof ProjectType]) {
      safewordPackages.push(...deps);
    }
  }

  // Only remove packages that are actually installed
  return safewordPackages.filter(pkg => pkg in installedDevDeps);
}

function executeJsonMerge(
  cwd: string,
  path: string,
  def: JsonMergeDefinition,
  ctx: ProjectContext,
): void {
  const fullPath = join(cwd, path);
  const existing = readJson<Record<string, unknown>>(fullPath) ?? {};
  const merged = def.merge(existing, ctx);
  writeJson(fullPath, merged);
}

function executeJsonUnmerge(cwd: string, path: string, def: JsonMergeDefinition): void {
  const fullPath = join(cwd, path);
  if (!exists(fullPath)) return;

  const existing = readJson<Record<string, unknown>>(fullPath);
  if (!existing) return;

  const unmerged = def.unmerge(existing);

  // Check if file should be removed
  if (def.removeFileIfEmpty) {
    const remainingKeys = Object.keys(unmerged).filter(
      k => unmerged[k] !== undefined && unmerged[k] !== null,
    );
    if (remainingKeys.length === 0) {
      remove(fullPath);
      return;
    }
  }

  writeJson(fullPath, unmerged);
}

function executeTextPatch(cwd: string, path: string, def: TextPatchDefinition): void {
  const fullPath = join(cwd, path);
  let content = readFileSafe(fullPath) ?? '';

  // Check if already patched
  if (content.includes(def.marker)) return;

  // Apply patch
  content = def.operation === 'prepend' ? def.content + content : content + def.content;

  writeFile(fullPath, content);
}

function executeTextUnpatch(cwd: string, path: string, def: TextPatchDefinition): void {
  const fullPath = join(cwd, path);
  const content = readFileSafe(fullPath);
  if (!content) return;

  // Remove the patched content
  // First try to remove the full content block
  let unpatched = content.replace(def.content, '');

  // If full content wasn't found but marker exists, remove lines containing the marker
  if (unpatched === content && content.includes(def.marker)) {
    // Remove lines containing the marker
    const lines = content.split('\n');
    const filtered = lines.filter(line => !line.includes(def.marker));
    unpatched = filtered.join('\n').replace(/^\n+/, ''); // Remove leading empty lines
  }

  writeFile(fullPath, unpatched);
}
