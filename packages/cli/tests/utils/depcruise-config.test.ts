/**
 * Test Suite: DepCruise Config Generator
 *
 * Tests for generating dependency-cruiser configuration from detected architecture.
 * See: .safeword/planning/test-definitions/feature-architecture-audit.md
 */

import { describe, expect, it } from 'vitest';

// This import will fail until depcruise-config.ts is created (RED phase)
import { generateDepCruiseConfigFile } from '../../src/utils/depcruise-config.js';

describe('DepCruise Config Generator', () => {
  describe('generateDepCruiseConfigFile', () => {
    it('generates circular dependency rule', () => {
      // Test 1.1: Config always includes no-circular rule regardless of architecture
      const config = generateDepCruiseConfigFile({ elements: [], isMonorepo: false });

      // Should contain module.exports with forbidden array
      expect(config).toContain('module.exports');
      expect(config).toContain('forbidden');

      // Should contain no-circular rule
      expect(config).toContain("name: 'no-circular'");
      expect(config).toContain("severity: 'error'");
      expect(config).toContain('circular: true');
    });

    it('generates monorepo layer rules from workspaces', () => {
      // Test 1.2: Detects workspaces and generates hierarchy rules
      const config = generateDepCruiseConfigFile({
        elements: [],
        isMonorepo: true,
        workspaces: ['packages/*', 'apps/*', 'libs/*'],
      });

      // libs cannot import packages or apps
      expect(config).toContain("name: 'libs-cannot-import-packages-or-apps'");
      expect(config).toContain("from: { path: '^libs/' }");
      expect(config).toContain("to: { path: '^(packages|apps)/' }");

      // packages cannot import apps
      expect(config).toContain("name: 'packages-cannot-import-apps'");
      expect(config).toContain("from: { path: '^packages/' }");
      expect(config).toContain("to: { path: '^apps/' }");
    });
  });
});
