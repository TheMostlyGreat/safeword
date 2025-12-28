/**
 * Validation Tests: Claude Code Skills and Commands
 *
 * Validates that safeword's skills and commands follow Claude Code's
 * documented format requirements (as of Dec 2025).
 *
 * Skills: https://code.claude.com/docs/en/skills.md
 * Commands: https://code.claude.com/docs/en/slash-commands.md
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../../templates');
const SKILLS_DIR = join(TEMPLATES_DIR, 'skills');
const COMMANDS_DIR = join(TEMPLATES_DIR, 'commands');

// Claude Code validation constants
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;
const SKILL_NAME_PATTERN = /^[a-z0-9-]+$/;
const RESERVED_WORDS = ['anthropic', 'claude'];
const MIN_BODY_LENGTH = 10;

// allowed-tools patterns (Claude Code format)
// Valid: '*', 'Read', 'Read, Grep, Glob', 'Bash(git:*)', 'mcp__server__tool'
const ALLOWED_TOOLS_PATTERN = /^(\*|\w+(\([^)]+\))?(,\s*\w+(\([^)]+\))?)*)$/;

// Markdown link pattern [text](path)
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

interface ParsedFrontmatter {
  name?: string;
  description?: string;
  'allowed-tools'?: string;
  model?: string;
  'argument-hint'?: string;
  'disable-model-invocation'?: boolean;
}

/**
 * Parse YAML frontmatter from markdown file content.
 * Returns null if no valid frontmatter found.
 */
function parseFrontmatter(content: string): { frontmatter: ParsedFrontmatter; body: string } | null {
  const lines = content.split('\n');

  // Must start with --- on line 1 (no blank lines before)
  if (lines[0]?.trim() !== '---') {
    return null;
  }

  // Find closing ---
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return null;
  }

  // Parse YAML-like frontmatter (simple key: value parsing)
  const frontmatter: ParsedFrontmatter = {};
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean = line.slice(colonIndex + 1).trim();

    // Handle boolean values
    if (value === 'true') value = true as unknown as string;
    if (value === 'false') value = false as unknown as string;

    // Remove quotes if present
    if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    (frontmatter as Record<string, unknown>)[key] = value;
  }

  const body = lines.slice(endIndex + 1).join('\n').trim();
  return { frontmatter, body };
}

/**
 * Get all skill directories
 */
function getSkillDirectories(): string[] {
  try {
    return readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return [];
  }
}

/**
 * Get all command files
 */
function getCommandFiles(): string[] {
  try {
    return readdirSync(COMMANDS_DIR)
      .filter(f => f.endsWith('.md'));
  } catch {
    return [];
  }
}

/**
 * Extract markdown links from content
 * Returns array of { text, path } objects
 */
function extractMarkdownLinks(content: string): { text: string; path: string }[] {
  const links: { text: string; path: string }[] = [];
  let match;
  // Reset lastIndex for global regex
  const pattern = new RegExp(MARKDOWN_LINK_PATTERN.source, 'g');
  while ((match = pattern.exec(content)) !== null) {
    const path = match[2];
    // Skip external URLs and anchor links
    if (path && !path.startsWith('http') && !path.startsWith('#')) {
      links.push({ text: match[1], path });
    }
  }
  return links;
}

/**
 * Check if a name follows gerund convention (verb+ing)
 */
function isGerundName(name: string): boolean {
  const parts = name.split('-');
  return parts.some(part => part.endsWith('ing'));
}

/**
 * Read file and parse frontmatter, returning defaults on error
 */
function readAndParseFrontmatter(filePath: string): {
  content: string;
  parsed: ReturnType<typeof parseFrontmatter>;
} {
  try {
    const content = readFileSync(filePath, 'utf8');
    return { content, parsed: parseFrontmatter(content) };
  } catch {
    return { content: '', parsed: null };
  }
}

describe('Skills Validation (Claude Code Format)', () => {
  const skillDirectories = getSkillDirectories();

  it('should have at least one skill', () => {
    expect(skillDirectories.length).toBeGreaterThan(0);
  });

  for (const skillDir of skillDirectories) {
    describe(`skill: ${skillDir}`, () => {
      const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
      const { content, parsed } = readAndParseFrontmatter(skillPath);

      it('should have SKILL.md file', () => {
        expect(content).not.toBe('');
      });

      it('should have valid frontmatter starting with ---', () => {
        expect(parsed, 'Frontmatter must start with --- on line 1').not.toBeNull();
      });

      it('should have required "name" field', () => {
        expect(parsed?.frontmatter.name, 'Missing name field').toBeDefined();
        expect(parsed?.frontmatter.name, 'name cannot be empty').not.toBe('');
      });

      it('should have valid name format (lowercase, a-z0-9-)', () => {
        const name = parsed?.frontmatter.name;
        if (name) {
          expect(name, `name "${name}" contains invalid characters`).toMatch(SKILL_NAME_PATTERN);
        }
      });

      it('should have name under 64 characters', () => {
        const name = parsed?.frontmatter.name;
        if (name) {
          expect(name.length, `name is ${name.length} chars, max is 64`).toBeLessThanOrEqual(
            SKILL_NAME_MAX_LENGTH,
          );
        }
      });

      it('should not use reserved words in name', () => {
        const name = parsed?.frontmatter.name;
        if (name) {
          for (const reserved of RESERVED_WORDS) {
            expect(name.toLowerCase(), `name cannot contain "${reserved}"`).not.toContain(reserved);
          }
        }
      });

      it('should have required "description" field', () => {
        expect(parsed?.frontmatter.description, 'Missing description field').toBeDefined();
        expect(parsed?.frontmatter.description, 'description cannot be empty').not.toBe('');
      });

      it('should have description under 1024 characters', () => {
        const desc = parsed?.frontmatter.description;
        if (desc) {
          expect(
            desc.length,
            `description is ${desc.length} chars, max is 1024`,
          ).toBeLessThanOrEqual(SKILL_DESCRIPTION_MAX_LENGTH);
        }
      });

      it('should use third person in description (not "I" or "you")', () => {
        const desc = parsed?.frontmatter.description;
        if (desc) {
          // Check for first person
          expect(desc, 'description should not start with "I "').not.toMatch(/^I\s/);
          expect(desc, 'description should not contain " I "').not.toMatch(/\sI\s/);
          // Allow "you" in trigger examples like "'help you'"
          // but flag direct second person like "You can" or "helps you"
          expect(desc, 'description should avoid "You can" style').not.toMatch(/\bYou can\b/i);
        }
      });

      it('should not contain XML tags in name or description', () => {
        const name = parsed?.frontmatter.name;
        const desc = parsed?.frontmatter.description;
        const xmlPattern = /<[^>]+>/;
        if (name) {
          expect(name, 'name contains XML tags').not.toMatch(xmlPattern);
        }
        if (desc) {
          expect(desc, 'description contains XML tags').not.toMatch(xmlPattern);
        }
      });

      it('should have markdown body content', () => {
        expect(parsed?.body, 'No markdown content after frontmatter').not.toBe('');
        expect(parsed?.body?.length, 'Body should have content').toBeGreaterThan(MIN_BODY_LENGTH);
      });

      it('should not use tabs in frontmatter (YAML requires spaces)', () => {
        const firstSectionEnd = content.indexOf('---', 3);
        if (firstSectionEnd > 0) {
          const frontmatterSection = content.slice(0, firstSectionEnd);
          expect(frontmatterSection, 'Frontmatter contains tabs').not.toContain('\t');
        }
      });

      // Advanced frontmatter field validation
      it('should have valid allowed-tools syntax if present', () => {
        const allowedTools = parsed?.frontmatter['allowed-tools'];
        if (allowedTools) {
          expect(
            allowedTools,
            `Invalid allowed-tools format: "${allowedTools}". Use '*', 'Read', 'Read, Grep', or 'Bash(git:*)'`,
          ).toMatch(ALLOWED_TOOLS_PATTERN);
        }
      });

      it('should have valid model field if present', () => {
        const model = parsed?.frontmatter.model;
        if (model !== undefined) {
          expect(typeof model, 'model should be a string').toBe('string');
          expect(model, 'model cannot be empty').not.toBe('');
        }
      });

      // File reference validation
      it('should have valid markdown file references in body', () => {
        if (parsed?.body) {
          const links = extractMarkdownLinks(parsed.body);
          const brokenLinks: string[] = [];

          for (const link of links) {
            // Only check .md file references (not images, not code blocks)
            if (link.path.endsWith('.md')) {
              const fullPath = join(SKILLS_DIR, skillDir, link.path);
              if (!existsSync(fullPath)) {
                brokenLinks.push(`[${link.text}](${link.path})`);
              }
            }
          }

          expect(
            brokenLinks,
            `Broken markdown links: ${brokenLinks.join(', ')}`,
          ).toHaveLength(0);
        }
      });

      // Safeword convention: gerund naming (not required by Claude Code, but enforced for consistency)
      it('should follow gerund naming convention (safeword convention)', () => {
        const name = parsed?.frontmatter.name;
        if (name) {
          expect(
            isGerundName(name),
            `Skill name "${name}" should use gerund form (verb+ing) like "debugging", "refactoring"`,
          ).toBe(true);
        }
      });

      // Best practice: semantic description with trigger keywords
      it('should have description with usage context (best practice)', () => {
        const desc = parsed?.frontmatter.description;
        if (desc) {
          // Description should indicate when to use the skill
          const hasUsageContext =
            /\b(use when|use for|use if|when|trigger|invoke)\b/i.test(desc) ||
            /\b(helps?|handles?|manages?|creates?|runs?|performs?)\b/i.test(desc);

          expect(
            hasUsageContext,
            `Description should indicate when/how to use the skill: "${desc.slice(0, 50)}..."`,
          ).toBe(true);
        }
      });
    });
  }
});

describe('Commands Validation (Claude Code Format)', () => {
  const commandFiles = getCommandFiles();

  it('should have at least one command', () => {
    expect(commandFiles.length).toBeGreaterThan(0);
  });

  for (const commandFile of commandFiles) {
    describe(`command: ${commandFile}`, () => {
      const commandPath = join(COMMANDS_DIR, commandFile);
      const commandName = basename(commandFile, '.md');
      const { content, parsed } = readAndParseFrontmatter(commandPath);

      it('should have content', () => {
        expect(content).not.toBe('');
      });

      it('should have lowercase filename', () => {
        expect(commandFile, 'Command filename should be lowercase').toBe(commandFile.toLowerCase());
      });

      it('should have valid frontmatter if present', () => {
        // Commands can optionally have frontmatter
        // If they do, it should be valid
        if (content.startsWith('---')) {
          expect(parsed, 'Invalid frontmatter format').not.toBeNull();
        }
      });

      it('should have description field for /help display', () => {
        // Safeword commands should have descriptions
        if (parsed) {
          expect(
            parsed.frontmatter.description,
            'Commands should have description for /help',
          ).toBeDefined();
          expect(parsed.frontmatter.description).not.toBe('');
        }
      });

      it('should have markdown body (not just frontmatter)', () => {
        if (parsed) {
          expect(parsed.body, 'Command needs content after frontmatter').not.toBe('');
          expect(parsed.body?.length, 'Body should have content').toBeGreaterThan(10);
        }
      });

      it('should not use $0 (invalid argument)', () => {
        // $0 doesn't exist in Claude Code, only $1, $2, etc. or $ARGUMENTS
        expect(content, 'Use $1, $2, etc. or $ARGUMENTS, not $0').not.toContain('$0');
      });

      it('should have valid command name format', () => {
        // Command names should be lowercase with hyphens
        expect(commandName, `Command name "${commandName}" should be lowercase`).toBe(
          commandName.toLowerCase(),
        );
        expect(
          commandName,
          `Command name "${commandName}" should only contain a-z, 0-9, -`,
        ).toMatch(/^[a-z0-9-]+$/);
      });

      // Advanced frontmatter validation for commands
      it('should have valid allowed-tools syntax if present', () => {
        const allowedTools = parsed?.frontmatter['allowed-tools'];
        if (allowedTools) {
          expect(
            allowedTools,
            `Invalid allowed-tools format: "${allowedTools}"`,
          ).toMatch(ALLOWED_TOOLS_PATTERN);
        }
      });

      it('should have valid model field if present', () => {
        const model = parsed?.frontmatter.model;
        if (model !== undefined) {
          expect(typeof model, 'model should be a string').toBe('string');
          expect(model, 'model cannot be empty').not.toBe('');
        }
      });

      it('should have valid argument-hint format if present', () => {
        const argumentHint = parsed?.frontmatter['argument-hint'];
        if (argumentHint !== undefined) {
          expect(typeof argumentHint, 'argument-hint should be a string').toBe('string');
          // argument-hint should describe expected arguments
          expect(argumentHint.length, 'argument-hint should have content').toBeGreaterThan(0);
        }
      });

      it('should have valid disable-model-invocation if present', () => {
        const disabled = parsed?.frontmatter['disable-model-invocation'];
        if (disabled !== undefined) {
          expect(
            typeof disabled,
            'disable-model-invocation should be boolean',
          ).toBe('boolean');
        }
      });

      // Validate argument pattern usage
      it('should use valid argument patterns ($1, $2, $ARGUMENTS)', () => {
        // Check if command uses any argument patterns
        const usesArguments =
          content.includes('$1') ||
          content.includes('$2') ||
          content.includes('$ARGUMENTS');

        if (usesArguments) {
          // Ensure only valid patterns are used (not $0, not $arg, etc.)
          const invalidPatterns = content.match(/\$[a-z_]\w*/gi) || [];
          const filtered = invalidPatterns.filter(
            p => p !== '$ARGUMENTS' && !p.startsWith("$CLAUDE_"),
          );

          expect(
            filtered,
            `Invalid argument patterns: ${filtered.join(', ')}. Use $1, $2, or $ARGUMENTS`,
          ).toHaveLength(0);
        }
      });

      // File reference validation for commands
      it('should have valid markdown file references in body', () => {
        if (parsed?.body) {
          const links = extractMarkdownLinks(parsed.body);
          const brokenLinks: string[] = [];

          for (const link of links) {
            if (link.path.endsWith('.md')) {
              const fullPath = join(COMMANDS_DIR, link.path);
              if (!existsSync(fullPath)) {
                brokenLinks.push(`[${link.text}](${link.path})`);
              }
            }
          }

          expect(
            brokenLinks,
            `Broken markdown links: ${brokenLinks.join(', ')}`,
          ).toHaveLength(0);
        }
      });
    });
  }
});

describe('Skills and Commands Cross-Validation', () => {
  it('should have consistent naming between skill dir and name field', () => {
    // Note: Claude Code doesn't require dir name = skill name,
    // but consistency helps maintainability
    const skillDirectories = getSkillDirectories();
    const mismatches: string[] = [];

    for (const skillDir of skillDirectories) {
      const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
      try {
        const content = readFileSync(skillPath, 'utf8');
        const parsed = parseFrontmatter(content);
        const name = parsed?.frontmatter.name;

        // For safeword, we prefix dirs with "safeword-" but skills have short names
        // This is intentional - just document it
        if (name && !skillDir.endsWith(name) && !skillDir.includes(name)) {
          mismatches.push(`Dir "${skillDir}" has name "${name}"`);
        }
      } catch {
        // Skip if file doesn't exist
      }
    }

    // This test documents the pattern, not enforces it
    // Safeword uses "safeword-debugging" dir with "debugging" name - that's fine
    expect(mismatches.length).toBe(0);
  });

  it('should not have duplicate skill names', () => {
    const skillDirectories = getSkillDirectories();
    const names: string[] = [];

    for (const skillDir of skillDirectories) {
      const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
      try {
        const content = readFileSync(skillPath, 'utf8');
        const parsed = parseFrontmatter(content);
        if (parsed?.frontmatter.name) {
          names.push(parsed.frontmatter.name);
        }
      } catch {
        // Skip
      }
    }

    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    expect(duplicates, `Duplicate skill names: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('should not have duplicate command names', () => {
    const commandFiles = getCommandFiles();
    const names = commandFiles.map(f => basename(f, '.md'));
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    expect(duplicates, `Duplicate command names: ${duplicates.join(', ')}`).toHaveLength(0);
  });
});
