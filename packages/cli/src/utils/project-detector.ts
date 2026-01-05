/**
 * Project type detection from package.json
 *
 * Detects frameworks and tools used in the project to configure
 * appropriate linting rules.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import nodePath from "node:path";

import { detect } from "eslint-plugin-safeword";

// Re-export detection constants from eslint-plugin-safeword (single source of truth)
export const {
  TAILWIND_PACKAGES,
  TANSTACK_QUERY_PACKAGES,

  hasExistingLinter,
  hasExistingFormatter,
} = detect;

// Python project file markers
const PYPROJECT_TOML = "pyproject.toml";
const REQUIREMENTS_TXT = "requirements.txt";
const UV_LOCK = "uv.lock";

// Go project file markers
const GO_MOD = "go.mod";

// ESLint config file markers (flat config and legacy)
const ESLINT_CONFIG_FILES = [
  "eslint.config.mjs",
  "eslint.config.js",
  "eslint.config.cjs",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yml",
  ".eslintrc.yaml",
] as const;

// golangci-lint config file markers
const GOLANGCI_CONFIG_FILES = [
  ".golangci.yml",
  ".golangci.yaml",
  ".golangci.toml",
  ".golangci.json",
];

// Python frameworks to detect (order matters - first match wins)
const PYTHON_FRAMEWORKS = ["django", "flask", "fastapi"] as const;

export interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  main?: string;
  module?: string;
  exports?: unknown;
  types?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ProjectType {
  typescript: boolean;
  react: boolean;
  nextjs: boolean;
  astro: boolean;
  vitest: boolean;
  playwright: boolean;
  tailwind: boolean;
  tanstackQuery: boolean;
  publishableLibrary: boolean;
  shell: boolean;
  /** True if project has existing lint script or linter config */
  existingLinter: boolean;
  /** True if project has existing format script or formatter config */
  existingFormatter: boolean;
  /** Path to existing ESLint config if present (e.g., 'eslint.config.mjs' or '.eslintrc.json') */
  existingEslintConfig: string | undefined;
  /** True if existing ESLint config is legacy format (.eslintrc.*) requiring FlatCompat */
  legacyEslint: boolean;
  /** True if project has [tool.ruff] in pyproject.toml or ruff.toml */
  existingRuffConfig: boolean;
  /** True if project has [tool.mypy] in pyproject.toml or mypy.ini */
  existingMypyConfig: boolean;
  /** True if project has [tool.importlinter] in pyproject.toml or .importlinter */
  existingImportLinterConfig: boolean;
  /** Path to existing golangci-lint config if present (e.g., '.golangci.yml') */
  existingGolangciConfig: string | undefined;
}

/**
 * Language detection result
 * @see ARCHITECTURE.md → Language Detection
 */
export interface Languages {
  javascript: boolean; // package.json exists
  python: boolean; // pyproject.toml OR requirements.txt exists
  golang: boolean; // go.mod exists
}

/**
 * Python-specific detection (returned only if languages.python)
 * @see ARCHITECTURE.md → Language Detection
 */
export interface PythonProjectType {
  framework: "django" | "flask" | "fastapi" | undefined;
  packageManager: "poetry" | "uv" | "pip";
}

/**
 * Detects which languages are used in the project
 * @param cwd - Working directory to scan
 * @returns Languages object indicating which languages are present
 * @see ARCHITECTURE.md → Language Detection
 */
export function detectLanguages(cwd: string): Languages {
  const hasPackageJson = existsSync(nodePath.join(cwd, "package.json"));
  const hasPyproject = existsSync(nodePath.join(cwd, PYPROJECT_TOML));
  const hasRequirements = existsSync(nodePath.join(cwd, REQUIREMENTS_TXT));
  const hasGoModule = existsSync(nodePath.join(cwd, GO_MOD));

  return {
    javascript: hasPackageJson,
    python: hasPyproject || hasRequirements,
    golang: hasGoModule,
  };
}

/**
 * Detects Python project type (framework and package manager)
 * @param cwd - Working directory to scan
 * @returns PythonProjectType or undefined if not a Python project
 * @see ARCHITECTURE.md → Language Detection
 */
export function detectPythonType(cwd: string): PythonProjectType | undefined {
  const pyprojectPath = nodePath.join(cwd, PYPROJECT_TOML);
  const requirementsPath = nodePath.join(cwd, REQUIREMENTS_TXT);
  const uvLockPath = nodePath.join(cwd, UV_LOCK);

  const hasPyproject = existsSync(pyprojectPath);
  const hasRequirements = existsSync(requirementsPath);

  if (!hasPyproject && !hasRequirements) {
    return undefined;
  }

  // Read project file for dependency/tool detection
  const content = hasPyproject
    ? readFileSync(pyprojectPath, "utf8")
    : readFileSync(requirementsPath, "utf8");

  // Detect package manager (priority: poetry > uv > pip)
  let packageManager: PythonProjectType["packageManager"] = "pip";
  if (hasPyproject && content.includes("[tool.poetry]")) {
    packageManager = "poetry";
  } else if (existsSync(uvLockPath)) {
    packageManager = "uv";
  }

  // Detect framework (first match wins)
  const contentLower = content.toLowerCase();
  const framework = PYTHON_FRAMEWORKS.find((fw) => contentLower.includes(fw));

  return { framework, packageManager };
}

/**
 * Checks if a directory contains any .sh files up to specified depth.
 * Excludes node_modules and .git directories.
 * @param cwd
 * @param maxDepth
 */
function hasShellScripts(cwd: string, maxDepth = 4): boolean {
  const excludeDirectories = new Set(["node_modules", ".git", ".safeword"]);

  /**
   *
   * @param dir
   * @param depth
   */
  function scan(dir: string, depth: number): boolean {
    if (depth > maxDepth) return false;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".sh")) {
          return true;
        }
        if (
          entry.isDirectory() &&
          !excludeDirectories.has(entry.name) &&
          scan(nodePath.join(dir, entry.name), depth + 1)
        ) {
          return true;
        }
      }
    } catch {
      // Ignore permission errors
    }
    return false;
  }

  return scan(cwd, 0);
}

interface PackageJsonWithScripts extends PackageJson {
  scripts?: Record<string, string>;
}

/**
 * Check if project has existing ESLint config.
 * @param cwd - Working directory to scan
 * @returns The config file path if found, undefined otherwise.
 */
function findExistingEslintConfig(cwd: string): string | undefined {
  for (const config of ESLINT_CONFIG_FILES) {
    if (existsSync(nodePath.join(cwd, config))) {
      return config;
    }
  }
  return undefined;
}

/**
 * Check if project has existing Ruff config.
 * @param cwd - Working directory to scan
 * @returns True if ruff.toml exists OR [tool.ruff] in pyproject.toml
 */
function hasExistingRuffConfig(cwd: string): boolean {
  // Check for standalone ruff.toml
  if (existsSync(nodePath.join(cwd, "ruff.toml"))) return true;

  // Check for [tool.ruff] in pyproject.toml
  const pyprojectPath = nodePath.join(cwd, PYPROJECT_TOML);
  if (!existsSync(pyprojectPath)) return false;
  try {
    const content = readFileSync(pyprojectPath, "utf8");
    return content.includes("[tool.ruff]");
  } catch {
    return false;
  }
}

/**
 * Check if project has existing mypy config.
 * @param cwd - Working directory to scan
 * @returns True if mypy.ini/.mypy.ini exists OR [tool.mypy] in pyproject.toml
 */
function hasExistingMypyConfig(cwd: string): boolean {
  // Check for standalone mypy config files
  if (existsSync(nodePath.join(cwd, "mypy.ini"))) return true;
  if (existsSync(nodePath.join(cwd, ".mypy.ini"))) return true;

  // Check for [tool.mypy] in pyproject.toml
  const pyprojectPath = nodePath.join(cwd, PYPROJECT_TOML);
  if (!existsSync(pyprojectPath)) return false;
  try {
    const content = readFileSync(pyprojectPath, "utf8");
    return content.includes("[tool.mypy]");
  } catch {
    return false;
  }
}

/**
 * Check if project has existing import-linter config.
 * @param cwd - Working directory to scan
 * @returns True if .importlinter exists OR [tool.importlinter] in pyproject.toml
 */
function hasExistingImportLinterConfig(cwd: string): boolean {
  // Check for standalone .importlinter file
  if (existsSync(nodePath.join(cwd, ".importlinter"))) return true;

  // Check for [tool.importlinter] in pyproject.toml
  const pyprojectPath = nodePath.join(cwd, PYPROJECT_TOML);
  if (!existsSync(pyprojectPath)) return false;
  try {
    const content = readFileSync(pyprojectPath, "utf8");
    return content.includes("[tool.importlinter]");
  } catch {
    return false;
  }
}

/**
 * Check if project has existing golangci-lint config.
 * @param cwd - Working directory to scan
 * @returns The config file path if found, undefined otherwise.
 */
function findExistingGolangciConfig(cwd: string): string | undefined {
  for (const config of GOLANGCI_CONFIG_FILES) {
    if (existsSync(nodePath.join(cwd, config))) {
      return config;
    }
  }
  return undefined;
}

/**
 * Detects project type from package.json contents and optional file scanning
 * @param packageJson - Package.json contents including scripts
 * @param cwd - Working directory for file-based detection
 */
export function detectProjectType(
  packageJson: PackageJsonWithScripts,
  cwd?: string,
): ProjectType {
  const deps = packageJson.dependencies || {};
  const developmentDeps = packageJson.devDependencies || {};
  const allDeps = { ...deps, ...developmentDeps };
  const scripts = packageJson.scripts || {};

  const hasTypescript = "typescript" in allDeps;
  const hasReact = "react" in deps || "react" in developmentDeps;
  const hasNextJs = "next" in deps;
  const hasAstro = "astro" in deps || "astro" in developmentDeps;
  const hasVitest = "vitest" in developmentDeps;
  const hasPlaywright = "@playwright/test" in developmentDeps;
  // Tailwind v4 can be installed via tailwindcss, @tailwindcss/vite, or @tailwindcss/postcss
  const hasTailwind = TAILWIND_PACKAGES.some((pkg) => pkg in allDeps);

  // TanStack Query detection
  const hasTanstackQuery = TANSTACK_QUERY_PACKAGES.some(
    (pkg) => pkg in allDeps,
  );

  // Publishable library: has entry points and is not marked private
  const hasEntryPoints = !!(
    packageJson.main ||
    packageJson.module ||
    packageJson.exports
  );
  const isPublishable = hasEntryPoints && packageJson.private !== true;

  // Shell scripts: detected by scanning for .sh files
  const hasShell = cwd ? hasShellScripts(cwd) : false;

  // Generic tooling detection: detect intent, not specific tools
  const hasLinter = hasExistingLinter(scripts);
  const hasFormatter = cwd
    ? hasExistingFormatter(cwd, scripts)
    : "format" in scripts;

  // Detect existing ESLint config and whether it's legacy format
  const eslintConfig = cwd ? findExistingEslintConfig(cwd) : undefined;
  const isLegacyEslint = eslintConfig?.startsWith(".eslintrc") ?? false;

  return {
    typescript: hasTypescript,
    react: hasReact || hasNextJs, // Next.js implies React
    nextjs: hasNextJs,
    astro: hasAstro,
    vitest: hasVitest,
    playwright: hasPlaywright,
    tailwind: hasTailwind,
    tanstackQuery: hasTanstackQuery,
    publishableLibrary: isPublishable,
    shell: hasShell,
    existingLinter: hasLinter,
    existingFormatter: hasFormatter,
    existingEslintConfig: eslintConfig,
    legacyEslint: isLegacyEslint,
    existingRuffConfig: cwd ? hasExistingRuffConfig(cwd) : false,
    existingMypyConfig: cwd ? hasExistingMypyConfig(cwd) : false,
    existingImportLinterConfig: cwd
      ? hasExistingImportLinterConfig(cwd)
      : false,
    existingGolangciConfig: cwd ? findExistingGolangciConfig(cwd) : undefined,
  };
}
