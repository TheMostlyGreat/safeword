/**
 * TOML Section Merging Utilities
 *
 * Line-based TOML manipulation without external dependencies.
 * Used for adding sections to pyproject.toml (Ruff, import-linter).
 *
 * @see ARCHITECTURE.md → "TOML Parsing Without Dependencies"
 */

/**
 * Check if a TOML section header exists in the content.
 * @param content - TOML file content
 * @param section - Section header (e.g., '[tool.ruff]')
 */
export function hasTomlSection(content: string, section: string): boolean {
  // Match exact section header at start of line
  // Section comes from our own templates (e.g., '[tool.ruff]'), properly escaped
  const escapedSection = section.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  // eslint-disable-next-line security/detect-non-literal-regexp -- Input is trusted and escaped
  const regex = new RegExp(String.raw`^${escapedSection}\s*$`, 'm');
  return regex.test(content);
}

/**
 * Append a TOML section to the end of a file.
 * Does NOT overwrite if section already exists.
 *
 * @param content - Existing TOML file content
 * @param section - Section to add (including header and content)
 * @returns Updated content, or original if section exists
 */
export function appendTomlSection(content: string, section: string): string {
  // Extract the section header from the section content (first line starting with [)
  const headerMatch = /^\[.+\]/m.exec(section);
  if (!headerMatch) return content;

  const header = headerMatch[0];

  // Don't add if section already exists
  if (hasTomlSection(content, header)) {
    return content;
  }

  // Ensure content ends with newline, then add blank line and new section
  const trimmedContent = content.trimEnd();
  return `${trimmedContent}\n\n${section.trim()}\n`;
}

/**
 * Generate Ruff configuration section for pyproject.toml.
 * Mirrors ESLint rule philosophy.
 *
 * @see .safeword/planning/specs/feature-python-support.md → Ruff Rule Selection
 */
export function generateRuffConfig(): string {
  return `[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "B", "S", "SIM", "UP", "I", "ASYNC", "C90", "PT"]

[tool.ruff.lint.mccabe]
max-complexity = 10`;
}

/**
 * Generate import-linter configuration for pyproject.toml.
 *
 * @param layers - Detected layers (e.g., ['domain', 'services', 'api'])
 * @param rootPackage - Root package name for the project
 */
export function generateImportLinterConfig(layers: string[], rootPackage: string): string {
  if (layers.length < 2) return '';

  const layerList = layers.map(l => `    "${rootPackage}.${l}"`).join(',\n');

  return `[tool.importlinter]
root_packages = ["${rootPackage}"]

[tool.importlinter.contracts.layers]
name = "Layer architecture"
type = "layers"
layers = [
${layerList}
]`;
}

/**
 * Generate mypy configuration section for pyproject.toml.
 * Minimal config to make mypy usable without being too strict.
 */
export function generateMypyConfig(): string {
  return `[tool.mypy]
ignore_missing_imports = true
show_error_codes = true
pretty = true`;
}
