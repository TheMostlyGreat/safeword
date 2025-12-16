/**
 * Unit tests for project type detection (Tests 4.1-4.3)
 *
 * These are pure unit tests for the detectProjectType function.
 */

import { describe, expect, it } from 'vitest';

import type { PackageJson } from './project-detector';
import { detectProjectType } from './project-detector';

describe('detectProjectType', () => {
  describe('Test 4.1: Detects TypeScript project', () => {
    it('should detect typescript from devDependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          typescript: '^5.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.typescript).toBe(true);
    });

    it('should detect typescript from dependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          typescript: '^5.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.typescript).toBe(true);
    });

    it('should return false when typescript is not present', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {},
      };

      const result = detectProjectType(packageJson);
      expect(result.typescript).toBe(false);
    });
  });

  describe('Test 4.2: Detects React project', () => {
    it('should detect react from dependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.react).toBe(true);
    });

    it('should detect react from devDependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          react: '^18.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.react).toBe(true);
    });

    it('should return false when react is not present', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {},
      };

      const result = detectProjectType(packageJson);
      expect(result.react).toBe(false);
    });
  });

  describe('Test 4.3: Detects Next.js project', () => {
    it('should detect next.js from dependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.nextjs).toBe(true);
    });

    it('should imply react when next.js is present', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          next: '^14.0.0',
          // Note: react not explicitly listed
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.nextjs).toBe(true);
      expect(result.react).toBe(true); // Next.js implies React
    });
  });

  describe('Detects other frameworks', () => {
    it('should detect Astro project', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          astro: '^4.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.astro).toBe(true);
    });
  });

  describe('Detects Tailwind', () => {
    it('should detect tailwindcss from dependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          tailwindcss: '^3.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.tailwind).toBe(true);
    });

    it('should detect tailwindcss from devDependencies', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          tailwindcss: '^3.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.tailwind).toBe(true);
    });

    it('should detect @tailwindcss/vite (Tailwind v4)', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          '@tailwindcss/vite': '^4.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.tailwind).toBe(true);
    });

    it('should detect @tailwindcss/postcss (Tailwind v4)', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          '@tailwindcss/postcss': '^4.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.tailwind).toBe(true);
    });
  });

  describe('Detects publishable library', () => {
    it('should detect library with main field', () => {
      const packageJson: PackageJson = {
        name: 'my-lib',
        version: '1.0.0',
        main: './dist/index.js',
      };

      const result = detectProjectType(packageJson);
      expect(result.publishableLibrary).toBe(true);
    });

    it('should detect library with module field', () => {
      const packageJson: PackageJson = {
        name: 'my-lib',
        version: '1.0.0',
        module: './dist/index.mjs',
      };

      const result = detectProjectType(packageJson);
      expect(result.publishableLibrary).toBe(true);
    });

    it('should detect library with exports field', () => {
      const packageJson: PackageJson = {
        name: 'my-lib',
        version: '1.0.0',
        exports: {
          '.': './dist/index.js',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.publishableLibrary).toBe(true);
    });

    it('should NOT detect private packages as publishable', () => {
      const packageJson: PackageJson = {
        name: 'my-app',
        version: '1.0.0',
        private: true,
        main: './dist/index.js',
      };

      const result = detectProjectType(packageJson);
      expect(result.publishableLibrary).toBe(false);
    });

    it('should NOT detect apps without entry points as publishable', () => {
      const packageJson: PackageJson = {
        name: 'my-app',
        version: '1.0.0',
        dependencies: {
          next: '^14.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.publishableLibrary).toBe(false);
    });
  });

  describe('Detects existing linter', () => {
    it('should detect existing linter from lint script', () => {
      const packageJson = {
        name: 'test',
        version: '1.0.0',
        scripts: {
          lint: 'biome check .',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.existingLinter).toBe(true);
    });

    it('should return false when no lint script exists', () => {
      const packageJson = {
        name: 'test',
        version: '1.0.0',
        scripts: {
          build: 'tsc',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.existingLinter).toBe(false);
    });
  });

  describe('Detects existing formatter', () => {
    it('should detect existing formatter from format script', () => {
      const packageJson = {
        name: 'test',
        version: '1.0.0',
        scripts: {
          format: 'biome format .',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.existingFormatter).toBe(true);
    });

    it('should return false when no format script exists (without cwd)', () => {
      const packageJson = {
        name: 'test',
        version: '1.0.0',
        scripts: {
          build: 'tsc',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.existingFormatter).toBe(false);
    });
  });

  describe('Detects TanStack Query', () => {
    it('should detect @tanstack/react-query', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          '@tanstack/react-query': '^5.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.tanstackQuery).toBe(true);
    });

    it('should detect @tanstack/vue-query', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          '@tanstack/vue-query': '^5.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.tanstackQuery).toBe(true);
    });
  });

  describe('Handles edge cases', () => {
    it('should handle empty package.json', () => {
      const packageJson: PackageJson = {};

      const result = detectProjectType(packageJson);

      expect(result.typescript).toBe(false);
      expect(result.react).toBe(false);
      expect(result.nextjs).toBe(false);
      expect(result.astro).toBe(false);
      expect(result.tailwind).toBe(false);
      expect(result.publishableLibrary).toBe(false);
      expect(result.existingLinter).toBe(false);
      expect(result.existingFormatter).toBe(false);
      expect(result.tanstackQuery).toBe(false);
    });

    it('should handle complex project with multiple frameworks', () => {
      const packageJson: PackageJson = {
        name: 'complex-project',
        version: '1.0.0',
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          typescript: '^5.3.0',
          vitest: '^1.0.0',
        },
      };

      const result = detectProjectType(packageJson);

      expect(result.typescript).toBe(true);
      expect(result.react).toBe(true);
      expect(result.nextjs).toBe(true);
      expect(result.vitest).toBe(true);
      expect(result.astro).toBe(false);
    });
  });
});
