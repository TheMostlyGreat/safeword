/**
 * Test Suite: Architecture Boundaries Detection
 *
 * Characterization tests for boundaries.ts - captures current behavior
 * to enable safe refactoring.
 */

import { mkdirSync, rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { detectArchitecture, generateBoundariesConfig } from '../../src/utils/boundaries.js';

describe('boundaries.ts', () => {
  let temporaryDirectory: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(nodePath.join(tmpdir(), 'boundaries-test-'));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  // Helper to create directories
  function createDirectory(...paths: string[]): void {
    for (const p of paths) {
      mkdirSync(nodePath.join(temporaryDirectory, p), { recursive: true });
    }
  }

  describe('detectArchitecture()', () => {
    describe('empty project', () => {
      it('returns empty elements for empty project', () => {
        const result = detectArchitecture(temporaryDirectory);

        expect(result.elements).toEqual([]);
        expect(result.isMonorepo).toBe(false);
      });
    });

    describe('standard project structure', () => {
      it('detects src/utils directory', () => {
        createDirectory('src/utils');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.elements).toHaveLength(1);
        expect(result.elements[0]).toEqual({
          layer: 'utils',
          pattern: 'src/utils/**',
          location: 'src/utils',
        });
        expect(result.isMonorepo).toBe(false);
      });

      it('detects src/components directory', () => {
        createDirectory('src/components');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.elements).toHaveLength(1);
        expect(result.elements[0].layer).toBe('components');
        expect(result.elements[0].pattern).toBe('src/components/**');
      });

      it('detects multiple architecture layers', () => {
        createDirectory('src/types', 'src/utils', 'src/components', 'src/features');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.elements).toHaveLength(4);
        const layers = result.elements.map((element) => element.layer);
        expect(layers).toContain('types');
        expect(layers).toContain('utils');
        expect(layers).toContain('components');
        expect(layers).toContain('features');
      });

      it('detects root-level directories without src/', () => {
        createDirectory('utils', 'components');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.elements).toHaveLength(2);
        expect(result.elements.find((element) => element.layer === 'utils')?.pattern).toBe(
          'utils/**',
        );
        expect(result.elements.find((element) => element.layer === 'components')?.pattern).toBe(
          'components/**',
        );
      });

      it('detects alternative directory names', () => {
        createDirectory('src/helpers', 'src/ui', 'src/api');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.elements).toHaveLength(3);
        expect(result.elements.find((element) => element.layer === 'utils')?.location).toBe(
          'src/helpers',
        );
        expect(result.elements.find((element) => element.layer === 'components')?.location).toBe(
          'src/ui',
        );
        expect(result.elements.find((element) => element.layer === 'services')?.location).toBe(
          'src/api',
        );
      });

      it('prefers src/ over root level for same layer', () => {
        createDirectory('src/utils', 'utils');

        const result = detectArchitecture(temporaryDirectory);

        // Should only have one utils entry (src/utils scanned first)
        const utilitiesElements = result.elements.filter((element) => element.layer === 'utils');
        expect(utilitiesElements).toHaveLength(1);
        expect(utilitiesElements[0].pattern).toBe('src/utils/**');
      });
    });

    describe('monorepo detection', () => {
      it('detects packages/ as monorepo', () => {
        createDirectory('packages/core', 'packages/ui');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.isMonorepo).toBe(true);
      });

      it('detects apps/ as monorepo', () => {
        createDirectory('apps/web', 'apps/mobile');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.isMonorepo).toBe(true);
      });

      it('detects libs/ as monorepo', () => {
        createDirectory('libs/shared');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.isMonorepo).toBe(true);
      });

      it('scans inside monorepo packages', () => {
        createDirectory('packages/core/src/utils', 'packages/ui/src/components');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.isMonorepo).toBe(true);
        expect(result.elements).toHaveLength(2);

        const patterns = result.elements.map((element) => element.pattern);
        expect(patterns).toContain('packages/core/src/utils/**');
        expect(patterns).toContain('packages/ui/src/components/**');
      });

      it('ignores hidden directories in monorepo root', () => {
        createDirectory('packages/.hidden', 'packages/visible');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.isMonorepo).toBe(true);
        // .hidden should not be scanned
      });

      it('combines monorepo and root-level architecture', () => {
        createDirectory('packages/core/src/utils', 'src/shared');

        const result = detectArchitecture(temporaryDirectory);

        expect(result.isMonorepo).toBe(true);
        expect(result.elements).toHaveLength(2);
      });
    });

    describe('deduplication', () => {
      it('deduplicates elements with same pattern', () => {
        // This shouldn't normally happen, but test dedup logic
        createDirectory('src/utils');

        const result = detectArchitecture(temporaryDirectory);

        const utilitiesElements = result.elements.filter((element) => element.layer === 'utils');
        expect(utilitiesElements).toHaveLength(1);
      });
    });
  });

  describe('generateBoundariesConfig()', () => {
    describe('empty architecture', () => {
      it('generates valid config for empty architecture', () => {
        const arch = { elements: [], isMonorepo: false };

        const config = generateBoundariesConfig(arch);

        expect(config).toContain('eslint-plugin-boundaries');
        expect(config).toContain('No architecture directories detected');
        expect(config).toContain("'boundaries/no-unknown': 'off'");
      });
    });

    describe('single layer', () => {
      it('generates config with single element', () => {
        const arch = {
          elements: [
            {
              layer: 'utils' as const,
              pattern: 'src/utils/**',
              location: 'src/utils',
            },
          ],
          isMonorepo: false,
        };

        const config = generateBoundariesConfig(arch);

        expect(config).toContain("type: 'utils'");
        expect(config).toContain("pattern: 'src/utils/**'");
        expect(config).toContain('Detected: src/utils');
      });
    });

    describe('multiple layers with rules', () => {
      it('generates hierarchy rules for components importing utils', () => {
        const arch = {
          elements: [
            {
              layer: 'utils' as const,
              pattern: 'src/utils/**',
              location: 'src/utils',
            },
            {
              layer: 'components' as const,
              pattern: 'src/components/**',
              location: 'src/components',
            },
          ],
          isMonorepo: false,
        };

        const config = generateBoundariesConfig(arch);

        // components can import utils
        expect(config).toContain("from: ['components']");
        expect(config).toContain("'utils'");
      });

      it('does not generate rule for types layer (no imports allowed)', () => {
        const arch = {
          elements: [
            {
              layer: 'types' as const,
              pattern: 'src/types/**',
              location: 'src/types',
            },
            {
              layer: 'utils' as const,
              pattern: 'src/utils/**',
              location: 'src/utils',
            },
          ],
          isMonorepo: false,
        };

        const config = generateBoundariesConfig(arch);

        // types has no allowed imports, so no rule generated for it
        // but utils can import types
        expect(config).toContain("from: ['utils']");
        expect(config).toContain("allow: ['types']");
      });

      it('generates full hierarchy for complete architecture', () => {
        const arch = {
          elements: [
            {
              layer: 'types' as const,
              pattern: 'src/types/**',
              location: 'src/types',
            },
            {
              layer: 'utils' as const,
              pattern: 'src/utils/**',
              location: 'src/utils',
            },
            {
              layer: 'services' as const,
              pattern: 'src/services/**',
              location: 'src/services',
            },
            {
              layer: 'components' as const,
              pattern: 'src/components/**',
              location: 'src/components',
            },
            {
              layer: 'features' as const,
              pattern: 'src/features/**',
              location: 'src/features',
            },
          ],
          isMonorepo: false,
        };

        const config = generateBoundariesConfig(arch);

        // Verify all elements are present
        expect(config).toContain("type: 'types'");
        expect(config).toContain("type: 'utils'");
        expect(config).toContain("type: 'services'");
        expect(config).toContain("type: 'components'");
        expect(config).toContain("type: 'features'");

        // Verify rules are generated
        expect(config).toContain('boundaries/element-types');
        expect(config).toContain("default: 'disallow'");
      });
    });

    describe('monorepo indicator', () => {
      it('includes monorepo note in description', () => {
        const arch = {
          elements: [
            {
              layer: 'utils' as const,
              pattern: 'packages/core/utils/**',
              location: 'packages/core/utils',
            },
          ],
          isMonorepo: true,
        };

        const config = generateBoundariesConfig(arch);

        expect(config).toContain('(monorepo)');
      });
    });

    describe('config structure', () => {
      it('generates valid ESM export', () => {
        const arch = {
          elements: [
            {
              layer: 'utils' as const,
              pattern: 'src/utils/**',
              location: 'src/utils',
            },
          ],
          isMonorepo: false,
        };

        const config = generateBoundariesConfig(arch);

        expect(config).toContain('export default {');
        expect(config).toContain('plugins: { boundaries }');
        expect(config).toContain('settings:');
        expect(config).toContain('rules:');
      });
    });
  });
});
