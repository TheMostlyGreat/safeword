/**
 * Test Suite: Setup - Template Bundling (Story 1)
 *
 * Tests for the "self-contained templates" feature.
 * The CLI should bundle full methodology files (not stubs) so
 * `npx safeword setup` works without external dependencies.
 *
 * First 3 tests FAIL until Story 1 is implemented.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTempDir,
  removeTempDir,
  createTypeScriptPackageJson,
  runCli,
  readTestFile,
  writeTestFile,
  fileExists,
  initGitRepo,
} from '../helpers';

describe('Setup - Template Bundling (Story 1)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  it('should install full SAFEWORD.md (not a stub)', async () => {
    createTypeScriptPackageJson(tempDir);
    initGitRepo(tempDir);

    await runCli(['setup', '--yes'], { cwd: tempDir });

    expect(fileExists(tempDir, '.safeword/SAFEWORD.md')).toBe(true);

    const content = readTestFile(tempDir, '.safeword/SAFEWORD.md');
    // Full file is ~31KB, stub is <1KB
    expect(content.length).toBeGreaterThan(1000);
    // Verify it's the full methodology file, not a stub
    expect(content).toContain('# SAFEWORD Agent Instructions');
  });

  it('should install methodology guides to .safeword/guides/', async () => {
    createTypeScriptPackageJson(tempDir);
    initGitRepo(tempDir);

    await runCli(['setup', '--yes'], { cwd: tempDir });

    expect(fileExists(tempDir, '.safeword/guides')).toBe(true);

    const guidesDir = join(tempDir, '.safeword/guides');
    const mdFiles = readdirSync(guidesDir).filter(f => f.endsWith('.md'));

    expect(mdFiles.length).toBeGreaterThan(0);
  });

  it('should install document templates', async () => {
    createTypeScriptPackageJson(tempDir);
    initGitRepo(tempDir);

    await runCli(['setup', '--yes'], { cwd: tempDir });

    expect(fileExists(tempDir, '.safeword/templates')).toBe(true);

    const templatesDir = join(tempDir, '.safeword/templates');
    const mdFiles = readdirSync(templatesDir).filter(f => f.endsWith('.md'));

    expect(mdFiles.length).toBeGreaterThan(0);
  });

  it('should install review prompts to .safeword/prompts/', async () => {
    createTypeScriptPackageJson(tempDir);
    initGitRepo(tempDir);

    await runCli(['setup', '--yes'], { cwd: tempDir });

    expect(fileExists(tempDir, '.safeword/prompts')).toBe(true);

    const promptsDir = join(tempDir, '.safeword/prompts');
    const mdFiles = readdirSync(promptsDir).filter(f => f.endsWith('.md'));

    // Should have 2 review prompts
    expect(mdFiles.length).toBeGreaterThan(0);
  });

  it('should block re-run and preserve user content', async () => {
    createTypeScriptPackageJson(tempDir);
    initGitRepo(tempDir);

    await runCli(['setup', '--yes'], { cwd: tempDir });

    // Create user content
    writeTestFile(
      tempDir,
      '.safeword/learnings/my-learning.md',
      '# My Learning\n\nImportant info.',
    );

    // Re-run setup should exit with error (already configured)
    const result = await runCli(['setup', '--yes'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Already configured');

    // User content should be untouched
    expect(fileExists(tempDir, '.safeword/learnings/my-learning.md')).toBe(true);
    const content = readTestFile(tempDir, '.safeword/learnings/my-learning.md');
    expect(content).toContain('My Learning');
  });

  it('should have no broken internal links in installed templates', async () => {
    createTypeScriptPackageJson(tempDir);
    initGitRepo(tempDir);

    await runCli(['setup', '--yes'], { cwd: tempDir });

    // Collect all markdown files in .safeword/
    const safewordDir = join(tempDir, '.safeword');
    const allMdFiles: string[] = [];

    function collectMdFiles(dir: string) {
      if (!fileExists(tempDir, dir.replace(tempDir + '/', ''))) return;
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          collectMdFiles(fullPath);
        } else if (entry.name.endsWith('.md')) {
          allMdFiles.push(fullPath);
        }
      }
    }

    collectMdFiles(safewordDir);

    // Must have at least SAFEWORD.md with links to verify
    expect(allMdFiles.length).toBeGreaterThan(0);

    // Extract all .safeword/ links and verify targets exist
    // Pattern: .safeword/path.md - stop at whitespace, backticks, quotes, parens, or markdown formatting
    const linkPattern = /\.safeword\/[a-zA-Z0-9_\-/]+\.md/g;
    const brokenLinks: { file: string; link: string }[] = [];
    let totalLinks = 0;

    // Patterns for example/placeholder links that shouldn't be validated
    const examplePatterns = [
      /XXX/, // Template placeholders like XXX-feature-name.md
      /file\.md$/, // Generic "file.md" examples in docs
      /learnings\//, // Example learning file paths in documentation
    ];

    for (const mdFile of allMdFiles) {
      const content = readFileSync(mdFile, 'utf-8');
      const links = content.match(linkPattern) || [];
      totalLinks += links.length;

      for (const link of links) {
        // Skip example/placeholder links
        if (examplePatterns.some(p => p.test(link))) {
          continue;
        }

        // The link is already a relative path like .safeword/path.md
        const relativePath = link;

        if (!fileExists(tempDir, relativePath)) {
          brokenLinks.push({
            file: mdFile.replace(tempDir + '/', ''),
            link,
          });
        }
      }
    }

    // Report all broken links
    if (brokenLinks.length > 0) {
      const report = brokenLinks.map(b => `  ${b.file}: ${b.link}`).join('\n');
      expect.fail(`Found ${brokenLinks.length} broken links:\n${report}`);
    }

    // Should have found at least some links to validate
    expect(totalLinks).toBeGreaterThan(0);
  });
});
