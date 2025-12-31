/**
 * TOML Section Merging Utilities
 *
 * Generic line-based TOML manipulation without external dependencies.
 * Used for adding sections to pyproject.toml.
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
