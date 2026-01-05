/**
 * Setup command - Initialize safeword in a project
 *
 * Uses reconcile() with mode='install' to create all managed files.
 */

import { readdirSync } from "node:fs";
import nodePath from "node:path";

import { addInstalledPack } from "../packs/config.js";
import { setupGoTooling } from "../packs/golang/setup.js";
import {
  detectPythonLayers,
  detectPythonPackageManager,
  getPythonInstallCommand,
  hasRuffDependency,
  installPythonDependencies,
} from "../packs/python/setup.js";
import { detectLanguages as detectLanguagePacks } from "../packs/registry.js";
import { reconcile, type ReconcileResult } from "../reconcile.js";
import { type ProjectContext, SAFEWORD_SCHEMA } from "../schema.js";
import { createProjectContext } from "../utils/context.js";
import { exists, readJson, writeJson } from "../utils/fs.js";
import { installDependencies } from "../utils/install.js";
import { error, header, info, listItem, success } from "../utils/output.js";
import { detectLanguages, type Languages } from "../utils/project-detector.js";
import { VERSION } from "../version.js";
import {
  buildArchitecture,
  hasArchitectureDetected,
  syncConfigCore,
} from "./sync-config.js";

interface SetupOptions {
  yes?: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  "lint-staged"?: Record<string, string[]>;
  workspaces?: string[] | { packages?: string[] };
}

/**
 * Add format scripts to workspace packages that don't have them.
 * Only runs if root project uses Prettier (not an existing formatter like Biome).
 */
function setupWorkspaceFormatScripts(
  cwd: string,
  ctx: ProjectContext,
): string[] {
  // Skip if root uses an existing formatter (Biome, dprint, etc.)
  if (ctx.projectType.existingFormatter) return [];

  const packageJsonPath = nodePath.join(cwd, "package.json");
  const rootPackageJson = readJson(packageJsonPath) as PackageJson | undefined;
  if (!rootPackageJson?.workspaces) return [];

  // Resolve workspace patterns to paths
  const workspacePatterns = Array.isArray(rootPackageJson.workspaces)
    ? rootPackageJson.workspaces
    : (rootPackageJson.workspaces.packages ?? []);

  const updated: string[] = [];

  for (const pattern of workspacePatterns) {
    // Handle both explicit paths and simple glob patterns like "packages/*"
    const workspacePath = pattern.endsWith("/*")
      ? pattern.slice(0, -2) // Remove /* suffix, we'll scan the directory
      : pattern;

    const fullPath = nodePath.join(cwd, workspacePath);

    if (pattern.endsWith("/*")) {
      // Scan directory for subdirectories
      if (!exists(fullPath)) continue;
      try {
        const entries = readdirSync(fullPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            const pkgPath = nodePath.join(fullPath, entry.name);
            if (addFormatScriptIfMissing(pkgPath)) {
              updated.push(
                nodePath.join(workspacePath, entry.name, "package.json"),
              );
            }
          }
        }
      } catch {
        // Directory not readable, skip
      }
    } else {
      // Explicit path
      if (addFormatScriptIfMissing(fullPath)) {
        updated.push(nodePath.join(workspacePath, "package.json"));
      }
    }
  }

  return updated;
}

/**
 * Add format script to a package if it doesn't have one.
 * Returns true if the script was added.
 */
function addFormatScriptIfMissing(packageDir: string): boolean {
  const packageJsonPath = nodePath.join(packageDir, "package.json");
  if (!exists(packageJsonPath)) return false;

  const packageJson = readJson(packageJsonPath) as PackageJson | undefined;
  if (!packageJson) return false;

  // Skip if format script already exists
  if (packageJson.scripts?.format) return false;

  // Add format script
  const scripts = packageJson.scripts ?? {};
  scripts.format = "prettier --write .";
  packageJson.scripts = scripts;
  writeJson(packageJsonPath, packageJson);

  return true;
}

/**
 * Create package.json if missing, unless non-JS-only project (Python, Go).
 * Returns true if created, false if already exists or skipped.
 */
function ensurePackageJson(cwd: string): boolean {
  const packageJsonPath = nodePath.join(cwd, "package.json");
  if (exists(packageJsonPath)) return false;

  // Skip for non-JS-only projects (no JS tooling needed)
  const languages = detectLanguages(cwd);
  const hasNonJs = languages.python || languages.golang;
  if (hasNonJs && !languages.javascript) return false;

  const dirName = nodePath.basename(cwd) || "project";
  const defaultPackageJson: PackageJson = {
    name: dirName,
    version: "0.1.0",
    scripts: {},
  };
  writeJson(packageJsonPath, defaultPackageJson);
  return true;
}

interface PythonSetupStatus {
  files: string[];
  installFailed: boolean;
  importLinter: boolean;
}

/** Base Python tools to install. Import-linter added when layers detected. */
function getPythonTools(includeImportLinter: boolean): string[] {
  const tools = ["ruff", "mypy", "deadcode"];
  if (includeImportLinter) tools.push("import-linter");
  return tools;
}

/**
 * Configure Python tooling and install dependencies.
 * Config files (ruff.toml, mypy.ini, .importlinter) are created by reconciliation.
 * This function handles dependency installation.
 */
function setupPython(cwd: string): PythonSetupStatus {
  let installFailed = false;

  // Detect layers for import-linter
  const layers = detectPythonLayers(cwd);
  const hasLayers = layers.length >= 2;

  // Install Python tools if not already in dependencies
  if (!hasRuffDependency(cwd)) {
    const tools = getPythonTools(hasLayers);
    const pm = detectPythonPackageManager(cwd);
    if (pm === "pip") {
      installFailed = true;
    } else {
      info(`\nInstalling Python tools (${tools.join(", ")})...`);
      const installed = installPythonDependencies(cwd, tools);
      if (installed) {
        success("Python tools installed");
      } else {
        installFailed = true;
      }
    }
  }

  // Note: files are now created by reconciliation, not returned here
  return { files: [], installFailed, importLinter: hasLayers };
}

interface SetupSummaryOptions {
  cwd: string;
  result: ReconcileResult;
  packageJsonCreated: boolean;
  languages: Languages;
  archFiles?: string[];
  workspaceUpdates?: string[];
  pythonFiles?: string[];
  pythonInstallFailed?: boolean;
  pythonImportLinter?: boolean;
}

function printSetupSummary(options: SetupSummaryOptions): void {
  const {
    cwd,
    result,
    packageJsonCreated,
    languages,
    archFiles = [],
    workspaceUpdates = [],
    pythonFiles = [],
    pythonInstallFailed = false,
    pythonImportLinter = false,
  } = options;
  header("Setup Complete");

  // Schema-created files (including .golangci.yml, .safeword/ruff.toml) are in result.created
  const allCreated = [
    ...result.created,
    ...archFiles,
    ...pythonFiles.filter((f) => f !== "pyproject.toml"),
  ];
  if (allCreated.length > 0 || packageJsonCreated) {
    info("\nCreated:");
    if (packageJsonCreated) listItem("package.json");
    for (const file of allCreated) listItem(file);
  }

  const allUpdated = [
    ...result.updated,
    ...workspaceUpdates,
    ...pythonFiles.filter((f) => f === "pyproject.toml"),
  ];
  if (allUpdated.length > 0) {
    info("\nModified:");
    for (const file of allUpdated) listItem(file);
  }

  info("\nNext steps:");
  listItem("Run `safeword check` to verify setup");

  // Python-specific guidance: show install command only if auto-install failed
  if (languages.python && pythonInstallFailed) {
    listItem(
      `Install Python tools: ${getPythonInstallCommand(cwd, getPythonTools(pythonImportLinter))}`,
    );
  }

  // Go-specific guidance: show if .golangci.yml was created (Go tools are installed globally)
  if (languages.golang && result.created.includes(".golangci.yml")) {
    listItem(
      "Install Go tools: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest",
    );
  }

  listItem("Commit the new files to git");

  success(`\nSafeword ${VERSION} installed successfully!`);
}

export async function setup(_options: SetupOptions): Promise<void> {
  const cwd = process.cwd();
  const safewordDirectory = nodePath.join(cwd, ".safeword");

  if (exists(safewordDirectory)) {
    error("Already configured. Run `safeword upgrade` to update.");
    process.exit(1);
  }

  const packageJsonCreated = ensurePackageJson(cwd);

  header("Safeword Setup");
  info(`Version: ${VERSION}`);
  if (packageJsonCreated) info("Created package.json (none found)");

  try {
    info("\nCreating safeword configuration...");
    const ctx = createProjectContext(cwd);
    const languages = ctx.languages ?? {
      javascript: false,
      python: false,
      golang: false,
    };
    const isNonJsOnly =
      (languages.python || languages.golang) && !languages.javascript;
    if (languages.python && !languages.javascript)
      info("Python project detected (skipping JS tooling)");
    if (languages.golang && !languages.javascript)
      info("Go project detected (skipping JS tooling)");
    const result = await reconcile(SAFEWORD_SCHEMA, "install", ctx);
    success("Created .safeword directory and configuration");

    // Detect architecture and workspaces, generate depcruise configs if found
    // (only for JS projects)
    const archFiles: string[] = [];
    let workspaceUpdates: string[] = [];

    if (!isNonJsOnly) {
      const arch = buildArchitecture(cwd);

      if (hasArchitectureDetected(arch)) {
        const syncResult = syncConfigCore(cwd, arch);
        if (syncResult.generatedConfig)
          archFiles.push(".safeword/depcruise-config.cjs");
        if (syncResult.createdMainConfig)
          archFiles.push(".dependency-cruiser.cjs");

        const detected: string[] = [];
        if (arch.elements.length > 0) {
          detected.push(
            arch.elements.map((element) => element.location).join(", "),
          );
        }
        if (arch.workspaces && arch.workspaces.length > 0) {
          detected.push(`workspaces: ${arch.workspaces.join(", ")}`);
        }
        info(`\nArchitecture detected: ${detected.join("; ")}`);
        info("Generated dependency-cruiser config for /audit command");
      }

      // Add format scripts to workspace packages (monorepo support)
      workspaceUpdates = setupWorkspaceFormatScripts(cwd, ctx);
      if (workspaceUpdates.length > 0) {
        info(
          `\nAdded format scripts to ${workspaceUpdates.length} workspace package(s)`,
        );
      }

      // Install JS dependencies (ESLint, Prettier, etc.)
      installDependencies(
        cwd,
        result.packagesToInstall,
        "linting dependencies",
      );
    }

    // Python-specific setup (install dependencies)
    // Note: Config files (ruff.toml, mypy.ini, .importlinter) are created by reconcile (managedFiles)
    const pythonStatus = languages.python
      ? setupPython(cwd)
      : { files: [], installFailed: false, importLinter: false };

    // Go-specific setup (future: layer detection for depguard)
    // Note: .golangci.yml is created by reconcile (managedFiles)
    if (languages.golang) {
      setupGoTooling(); // Currently no-op, kept for future layer detection
    }

    // Track installed packs in config.json
    const detectedPacks = detectLanguagePacks(cwd);
    for (const packId of detectedPacks) {
      addInstalledPack(cwd, packId);
    }

    printSetupSummary({
      cwd,
      result,
      packageJsonCreated,
      languages,
      archFiles,
      workspaceUpdates,
      pythonFiles: pythonStatus.files,
      pythonInstallFailed: pythonStatus.installFailed,
      pythonImportLinter: pythonStatus.importLinter,
    });
  } catch (error_) {
    error(
      `Setup failed: ${error_ instanceof Error ? error_.message : "Unknown error"}`,
    );
    process.exit(1);
  }
}
