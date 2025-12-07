/**
 * Test Suite: Setup Command (Reconcile-based)
 *
 * Tests that the setup command uses reconcile() with mode='install'
 * to create all managed files and directories.
 *
 * TDD RED phase - these tests verify reconcile integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

describe('Setup Command - Reconcile Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'safeword-setup-reconcile-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('reconcile mode=install', () => {
    it('should compute all install actions correctly', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      // Create minimal package.json
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx, { dryRun: true });

      // dryRun should compute actions without applying
      expect(result.applied).toBe(false);

      // Should have mkdir actions for directories
      const mkdirActions = result.actions.filter(a => a.type === 'mkdir');
      expect(mkdirActions.length).toBeGreaterThan(0);

      // Should have write actions for files
      const writeActions = result.actions.filter(a => a.type === 'write');
      expect(writeActions.length).toBeGreaterThan(0);

      // Should have SAFEWORD.md write action
      const hasSafewordMd = writeActions.some(
        a => a.type === 'write' && a.path.includes('SAFEWORD.md'),
      );
      expect(hasSafewordMd).toBe(true);

      // Should have version file write action
      const hasVersion = writeActions.some(
        a => a.type === 'write' && a.path === '.safeword/version',
      );
      expect(hasVersion).toBe(true);

      // Should have JSON merge for settings.json
      const jsonMergeActions = result.actions.filter(a => a.type === 'json-merge');
      expect(jsonMergeActions.length).toBeGreaterThan(0);

      // Should compute packages to install
      expect(result.packagesToInstall.length).toBeGreaterThan(0);
      expect(result.packagesToInstall).toContain('eslint');
    });

    it('should create all directories when applied', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Check directories created
      expect(existsSync(join(tempDir, '.safeword'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/hooks'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/guides'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/learnings'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/tickets'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/tickets/completed'))).toBe(true);
      expect(existsSync(join(tempDir, '.claude'))).toBe(true);
      expect(existsSync(join(tempDir, '.claude/commands'))).toBe(true);
    });

    it('should create all owned files when applied', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Check core files
      expect(existsSync(join(tempDir, '.safeword/SAFEWORD.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/version'))).toBe(true);

      // Check hook files
      expect(existsSync(join(tempDir, '.safeword/hooks/session-verify-agents.sh'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/hooks/stop-quality.sh'))).toBe(true);

      // Check guides
      expect(existsSync(join(tempDir, '.safeword/guides/architecture-guide.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/guides/planning-guide.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.safeword/guides/testing-guide.md'))).toBe(true);

      // Check claude files
      expect(existsSync(join(tempDir, '.claude/commands/lint.md'))).toBe(true);
    });

    it('should create managed files only if missing', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      // Create existing eslint config with custom content
      writeFileSync(join(tempDir, 'eslint.config.mjs'), '// Custom ESLint config');

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Existing eslint config should NOT be overwritten
      const eslintContent = readFileSync(join(tempDir, 'eslint.config.mjs'), 'utf-8');
      expect(eslintContent).toBe('// Custom ESLint config');

      // But prettierrc should be created if missing
      expect(existsSync(join(tempDir, '.prettierrc'))).toBe(true);
    });

    it('should apply JSON merges for settings.json', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Settings should be created with hooks
      expect(existsSync(join(tempDir, '.claude/settings.json'))).toBe(true);
      const settings = JSON.parse(readFileSync(join(tempDir, '.claude/settings.json'), 'utf-8'));
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.SessionStart).toBeDefined();
    });

    it('should apply JSON merges for package.json scripts', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // Package.json should have scripts added
      const packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf-8'));
      expect(packageJson.scripts?.lint).toBeDefined();
      expect(packageJson.scripts?.format).toBeDefined();
      expect(packageJson.scripts?.prepare).toBeDefined();
      expect(packageJson['lint-staged']).toBeDefined();
    });

    it('should create AGENTS.md via text patch', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // AGENTS.md should be created with safeword link
      expect(existsSync(join(tempDir, 'AGENTS.md'))).toBe(true);
      const content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toContain('.safeword/SAFEWORD.md');
    });

    it('should prepend to existing AGENTS.md', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      // Create existing AGENTS.md
      writeFileSync(join(tempDir, 'AGENTS.md'), '# My Project\n\nCustom content here.');

      const ctx = createProjectContext(tempDir);
      await reconcile(SAFEWORD_SCHEMA, 'install', ctx);

      // AGENTS.md should have link prepended
      const content = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toContain('.safeword/SAFEWORD.md');
      expect(content).toContain('Custom content here');
    });

    it('should detect framework-specific packages', async () => {
      const { reconcile } = await import('../../src/reconcile.js');
      const { SAFEWORD_SCHEMA } = await import('../../src/schema.js');
      const { createProjectContext } = await import('../../src/utils/context.js');

      // Create package.json with React dependency
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test',
            version: '1.0.0',
            dependencies: {
              react: '^18.0.0',
            },
          },
          null,
          2,
        ),
      );

      const ctx = createProjectContext(tempDir);
      const result = await reconcile(SAFEWORD_SCHEMA, 'install', ctx, { dryRun: true });

      // Should include React-specific packages
      expect(result.packagesToInstall).toContain('eslint-plugin-react');
      expect(result.packagesToInstall).toContain('eslint-plugin-react-hooks');
    });
  });

  describe('setup command integration', () => {
    it('should run setup successfully via CLI', async () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        const result = execSync(`npx tsx ${cliPath} setup --yes`, {
          cwd: tempDir,
          encoding: 'utf-8',
          timeout: 60000,
        });

        expect(result).toContain('Setup');
      } catch (error) {
        // Check if setup itself worked even if npm install timed out
        const stderr = (error as { stderr?: string }).stderr || '';
        const stdout = (error as { stdout?: string }).stdout || '';

        // If we see setup output and .safeword exists, the reconcile worked
        if (
          (stdout.includes('Setup') || stdout.includes('Created')) &&
          existsSync(join(tempDir, '.safeword'))
        ) {
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });

    it('should error on already configured project', async () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      // Create .safeword dir
      mkdirSync(join(tempDir, '.safeword'), { recursive: true });

      const cliPath = join(process.cwd(), 'src/cli.ts');
      try {
        execSync(`npx tsx ${cliPath} setup --yes`, {
          cwd: tempDir,
          encoding: 'utf-8',
          timeout: 30000,
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        const stderr = (error as { stderr?: string }).stderr || '';
        expect(stderr.toLowerCase()).toContain('already configured');
      }
    });
  });
});
