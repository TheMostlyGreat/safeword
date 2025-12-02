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
    case 'install':
      return computeInstallPlan(schema, ctx);
    case 'upgrade':
      return computeUpgradePlan(schema, ctx);
    case 'uninstall':
      return computeUninstallPlan(schema, ctx, false);
    case 'uninstall-full':
      return computeUninstallPlan(schema, ctx, true);
  }
}

function computeInstallPlan(schema: SafewordSchema, ctx: ProjectContext): ReconcilePlan {
  const actions: Action[] = [];
  const wouldCreate: string[] = [];

  // 1. Create all directories
  const allDirs = [...schema.ownedDirs, ...schema.sharedDirs, ...schema.preservedDirs];
  for (const dir of allDirs) {
    const fullPath = join(ctx.cwd, dir);
    if (!exists(fullPath)) {
      actions.push({ type: 'mkdir', path: dir });
      wouldCreate.push(dir);
    }
  }

  // 2. Write all owned files
  for (const [filePath, def] of Object.entries(schema.ownedFiles)) {
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

  // 4. chmod hook/lib directories
  const chmodPaths = ['.safeword/hooks', '.safeword/lib', '.husky'];
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

  // 7. Compute packages to install
  const packagesToInstall = computePackagesToInstall(schema, ctx.projectType, ctx.devDeps);

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

  // 1. Ensure directories exist
  const allDirs = [...schema.ownedDirs, ...schema.sharedDirs, ...schema.preservedDirs];
  for (const dir of allDirs) {
    const fullPath = join(ctx.cwd, dir);
    if (!exists(fullPath)) {
      actions.push({ type: 'mkdir', path: dir });
      wouldCreate.push(dir);
    }
  }

  // 2. Update owned files if content changed
  for (const [filePath, def] of Object.entries(schema.ownedFiles)) {
    const fullPath = join(ctx.cwd, filePath);
    const newContent = resolveFileContent(def, ctx);

    if (fileNeedsUpdate(fullPath, newContent)) {
      actions.push({ type: 'write', path: filePath, content: newContent });
      if (exists(fullPath)) {
        wouldUpdate.push(filePath);
      } else {
        wouldCreate.push(filePath);
      }
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
    } else {
      // Exists - only update if user hasn't modified it
      // For upgrade, we need to compare against what safeword would generate
      // If the current content matches our template, user hasn't customized it
      const currentContent = readFileSafe(fullPath);
      if (currentContent?.trim() === newContent.trim()) {
        // Content matches - no update needed (already current)
      } else {
        // Content differs - check if it was originally from safeword
        // For now, we don't update managed files in upgrade mode
        // unless they match our previous template exactly
        // This is conservative - user may have customized
      }
    }
  }

  // 4. chmod
  const chmodPaths = ['.safeword/hooks', '.safeword/lib', '.husky'];
  actions.push({ type: 'chmod', paths: chmodPaths });

  // 5. JSON merges (always apply to ensure keys are present)
  for (const [filePath, def] of Object.entries(schema.jsonMerges)) {
    actions.push({ type: 'json-merge', path: filePath, definition: def });
  }

  // 6. Text patches (only if marker missing)
  for (const [filePath, def] of Object.entries(schema.textPatches)) {
    const fullPath = join(ctx.cwd, filePath);
    const content = readFileSafe(fullPath) ?? '';
    if (!content.includes(def.marker)) {
      actions.push({ type: 'text-patch', path: filePath, definition: def });
    }
  }

  // 7. Compute packages to install
  const packagesToInstall = computePackagesToInstall(schema, ctx.projectType, ctx.devDeps);

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

  // 1. Remove all owned files
  const dirsToCleanup = new Set<string>();
  for (const filePath of Object.keys(schema.ownedFiles)) {
    const fullPath = join(ctx.cwd, filePath);
    if (exists(fullPath)) {
      actions.push({ type: 'rm', path: filePath });
      wouldRemove.push(filePath);
      // Track parent dir for cleanup (for .claude/* skill dirs)
      if (filePath.startsWith('.claude/')) {
        const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
        if (
          parentDir &&
          parentDir !== '.claude' &&
          parentDir !== '.claude/skills' &&
          parentDir !== '.claude/commands'
        ) {
          dirsToCleanup.add(parentDir);
        }
      }
    }
  }
  // Clean up empty parent directories (like .claude/skills/safeword-*)
  for (const dir of dirsToCleanup) {
    const fullPath = join(ctx.cwd, dir);
    if (exists(fullPath)) {
      actions.push({ type: 'rmdir', path: dir });
      wouldRemove.push(dir);
    }
  }

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

  // 4. Remove preserved directories first (reverse order)
  // These will only be removed if empty (no user content)
  const preservedDirsToRemove = [...schema.preservedDirs].reverse();
  for (const dir of preservedDirsToRemove) {
    const fullPath = join(ctx.cwd, dir);
    if (exists(fullPath)) {
      actions.push({ type: 'rmdir', path: dir });
      wouldRemove.push(dir);
    }
  }

  // 5. Remove owned directories (reverse order)
  // Reverse order ensures children are removed before parents
  const dirsToRemove = [...schema.ownedDirs].reverse();
  for (const dir of dirsToRemove) {
    const fullPath = join(ctx.cwd, dir);
    if (exists(fullPath)) {
      actions.push({ type: 'rmdir', path: dir });
      wouldRemove.push(dir);
    }
  }

  // 6. Full uninstall: remove managed files
  if (full) {
    for (const filePath of Object.keys(schema.managedFiles)) {
      const fullPath = join(ctx.cwd, filePath);
      if (exists(fullPath)) {
        actions.push({ type: 'rm', path: filePath });
        wouldRemove.push(filePath);
      }
    }
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

  for (const action of plan.actions) {
    switch (action.type) {
      case 'mkdir': {
        const fullPath = join(ctx.cwd, action.path);
        ensureDir(fullPath);
        created.push(action.path);
        break;
      }

      case 'rmdir': {
        const fullPath = join(ctx.cwd, action.path);
        // Use removeIfEmpty to preserve directories with user content
        // This will only succeed if the directory is empty
        if (removeIfEmpty(fullPath)) {
          removed.push(action.path);
        }
        break;
      }

      case 'write': {
        const fullPath = join(ctx.cwd, action.path);
        const existed = exists(fullPath);
        writeFile(fullPath, action.content);
        if (existed) {
          updated.push(action.path);
        } else {
          created.push(action.path);
        }
        break;
      }

      case 'rm': {
        const fullPath = join(ctx.cwd, action.path);
        remove(fullPath);
        removed.push(action.path);
        break;
      }

      case 'chmod': {
        for (const path of action.paths) {
          const fullPath = join(ctx.cwd, path);
          if (exists(fullPath)) {
            makeScriptsExecutable(fullPath);
          }
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

  return { created, updated, removed };
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

export function computePackagesToInstall(
  schema: SafewordSchema,
  projectType: ProjectType,
  installedDevDeps: Record<string, string>,
): string[] {
  const needed = [...schema.packages.base];

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
  if (def.operation === 'prepend') {
    content = def.content + content;
  } else {
    content = content + def.content;
  }

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
