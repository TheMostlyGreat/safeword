/**
 * Test Suite: NPM Package Distribution
 *
 * Tests that the npm package is correctly structured and would work
 * when installed via `npm install` or `npx`.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect,it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = join(__dirname, '..');

describe('NPM Package Structure', () => {
  it('should have package.json with correct files array', () => {
    const packageJson = JSON.parse(readFileSync(join(cliRoot, 'package.json'), 'utf-8'));

    expect(packageJson.files).toBeDefined();
    expect(packageJson.files).toContain('dist');
    expect(packageJson.files).toContain('templates');
  });

  it('should have dist directory with CLI entry point', () => {
    const distPath = join(cliRoot, 'dist');
    expect(existsSync(distPath)).toBe(true);
    expect(existsSync(join(distPath, 'cli.js'))).toBe(true);
  });

  it('should have templates directory with all required subdirectories', () => {
    const templatesPath = join(cliRoot, 'templates');
    expect(existsSync(templatesPath)).toBe(true);

    const required = [
      'SAFEWORD.md',
      'guides',
      'doc-templates',
      'hooks',
      'prompts',
      'skills',
      'commands',
      'lib',
    ];
    for (const item of required) {
      expect(existsSync(join(templatesPath, item))).toBe(true);
    }
  });

  it('should have templates/hooks with all hook scripts', () => {
    const hooksPath = join(cliRoot, 'templates', 'hooks');
    const files = readdirSync(hooksPath);

    // Session hooks
    expect(files).toContain('session-verify-agents.sh');
    expect(files).toContain('session-version.sh');
    expect(files).toContain('session-lint-check.sh');

    // Prompt hooks
    expect(files).toContain('prompt-timestamp.sh');
    expect(files).toContain('prompt-questions.sh');

    // Stop hook
    expect(files).toContain('stop-quality.sh');

    // Post-tool hook
    expect(files).toContain('post-tool-lint.sh');

    // Note: git pre-commit hook is created by Husky at setup time, not from templates
  });

  it('should have templates/guides with methodology files', () => {
    const guidesPath = join(cliRoot, 'templates', 'guides');
    const files = readdirSync(guidesPath);

    // Should have multiple guide files
    const mdFiles = files.filter(f => f.endsWith('.md'));
    expect(mdFiles.length).toBeGreaterThan(5);
  });

  it('should have templates/skills with quality reviewer', () => {
    const skillPath = join(cliRoot, 'templates', 'skills', 'safeword-quality-reviewer');
    expect(existsSync(skillPath)).toBe(true);
    expect(existsSync(join(skillPath, 'SKILL.md'))).toBe(true);
  });

  it('should have templates/commands with slash commands', () => {
    const commandsPath = join(cliRoot, 'templates', 'commands');
    const files = readdirSync(commandsPath);

    expect(files).toContain('quality-review.md');
    expect(files).toContain('architecture.md');
    expect(files).toContain('lint.md');
  });

  it('should resolve templates from dist context', () => {
    // Simulate the path resolution that getTemplatesDir() does
    const distDir = join(cliRoot, 'dist');
    const templatesFromDist = join(distDir, '..', 'templates');

    expect(existsSync(templatesFromDist)).toBe(true);
    expect(existsSync(join(templatesFromDist, 'SAFEWORD.md'))).toBe(true);
  });
});
