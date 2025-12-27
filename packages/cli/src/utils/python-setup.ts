/**
 * Python-specific Setup Utilities
 *
 * Handles Python tooling configuration during safeword setup:
 * - Ruff config in pyproject.toml
 * - mypy config in pyproject.toml
 * - Pre-commit hooks
 * - Import-linter layer contracts
 */

import nodePath from 'node:path';

import { exists, readFileSafe, writeFile } from './fs.js';
import {
  appendTomlSection,
  generateImportLinterConfig,
  generateMypyConfig,
  generateRuffConfig,
} from './toml.js';

/**
 * Python layer patterns for architecture detection.
 * Mirrors boundaries.ts ARCHITECTURE_LAYERS pattern.
 *
 * @see .safeword/planning/design/phase2-python-tooling.md → Layer detection heuristic
 */
const PYTHON_LAYERS: Record<string, string[]> = {
  domain: ['domain', 'models', 'entities', 'core'],
  services: ['services', 'usecases', 'application'],
  infra: ['infra', 'infrastructure', 'adapters', 'repositories'],
  api: ['api', 'routes', 'handlers', 'views', 'controllers'],
};

/**
 * Detect Python layers in a project directory.
 * Looks for common Python layer directory patterns.
 *
 * @param cwd - Project root directory
 * @returns Array of detected layer names in dependency order (domain first)
 */
export function detectPythonLayers(cwd: string): string[] {
  const detected: string[] = [];

  for (const [layer, patterns] of Object.entries(PYTHON_LAYERS)) {
    for (const pattern of patterns) {
      // Check common locations: src/{pattern}, {pattern}
      const srcPath = nodePath.join(cwd, 'src', pattern);
      const rootPath = nodePath.join(cwd, pattern);

      if (exists(srcPath) || exists(rootPath)) {
        detected.push(layer);
        break; // Only add layer once
      }
    }
  }

  // Return in correct dependency order (domain → services → infra → api)
  const layerOrder = ['domain', 'services', 'infra', 'api'];
  return layerOrder.filter(layer => detected.includes(layer));
}

/**
 * Detect the root package name from pyproject.toml or directory structure.
 *
 * @param cwd - Project root directory
 * @returns Package name or 'src' as fallback
 */
export function detectRootPackage(cwd: string): string {
  const pyprojectPath = nodePath.join(cwd, 'pyproject.toml');
  const content = readFileSafe(pyprojectPath);

  if (content) {
    // Try to extract name from [project] section
    // Using simple pattern to avoid regex backtracking
    const nameMatch = /^name\s*=\s*"([^"]+)"/m.exec(content);
    if (nameMatch) {
      // Convert kebab-case to snake_case for Python imports
      return nameMatch[1].replaceAll('-', '_');
    }
  }

  // Fallback: check for src/ directory
  if (exists(nodePath.join(cwd, 'src'))) {
    return 'src';
  }

  // Last resort: use directory name
  return nodePath.basename(cwd).replaceAll('-', '_');
}

export interface PythonSetupResult {
  /** Files created or modified */
  files: string[];
  /** Whether import-linter was configured */
  importLinter: boolean;
}

/**
 * Add a TOML config section and track file modification.
 * Returns updated content.
 */
function addTomlConfig(content: string, config: string, files: string[]): string {
  const updated = appendTomlSection(content, config);
  if (updated !== content && !files.includes('pyproject.toml')) {
    files.push('pyproject.toml');
  }
  return updated;
}

/**
 * Set up Python tooling configuration.
 *
 * @param cwd - Project root directory
 * @returns Result with created/modified files
 */
export function setupPythonTooling(cwd: string): PythonSetupResult {
  const result: PythonSetupResult = {
    files: [],
    importLinter: false,
  };

  const pyprojectPath = nodePath.join(cwd, 'pyproject.toml');

  // Read existing pyproject.toml
  let pyprojectContent = readFileSafe(pyprojectPath) ?? '';

  // 1. Add Ruff config to pyproject.toml
  pyprojectContent = addTomlConfig(pyprojectContent, generateRuffConfig(), result.files);

  // 2. Detect layers and add import-linter config
  const layers = detectPythonLayers(cwd);
  if (layers.length >= 2) {
    const importLinterConfig = generateImportLinterConfig(layers, detectRootPackage(cwd));
    if (importLinterConfig) {
      const before = pyprojectContent;
      pyprojectContent = addTomlConfig(pyprojectContent, importLinterConfig, result.files);
      if (pyprojectContent !== before) result.importLinter = true;
    }
  }

  // 3. Add mypy config to pyproject.toml
  pyprojectContent = addTomlConfig(pyprojectContent, generateMypyConfig(), result.files);

  // Write pyproject.toml if modified
  if (result.files.includes('pyproject.toml')) {
    writeFile(pyprojectPath, pyprojectContent);
  }

  return result;
}
