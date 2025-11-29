/**
 * Unit tests for project type detection (Tests 4.1-4.3)
 *
 * These are pure unit tests for the detectProjectType function.
 */

import { describe, it, expect } from 'vitest';
import { detectProjectType, PackageJson } from './project-detector';

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

    it('should detect Electron project', () => {
      const packageJson: PackageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          electron: '^28.0.0',
        },
      };

      const result = detectProjectType(packageJson);
      expect(result.electron).toBe(true);
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
      expect(result.electron).toBe(false);
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
          electron: '^28.0.0',
        },
      };

      const result = detectProjectType(packageJson);

      expect(result.typescript).toBe(true);
      expect(result.react).toBe(true);
      expect(result.nextjs).toBe(true);
      expect(result.electron).toBe(true);
      expect(result.astro).toBe(false);
    });
  });
});
