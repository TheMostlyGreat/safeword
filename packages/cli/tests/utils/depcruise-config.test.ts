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
  });
});
